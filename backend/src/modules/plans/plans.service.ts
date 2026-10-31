import { prisma } from "../../config/database";
import { logAudit } from "../../utils/audit.utils";
import { UserRole, BillingInterval } from "@prisma/client";

export async function listPlans(
  query: {
    page?: number;
    limit?: number;
    search?: string;
    billingInterval?: BillingInterval;
    isActive?: boolean | string;
  },
  userRole?: UserRole
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (userRole === UserRole.CUSTOMER) {
    where.isActive = true;
  } else if (query.isActive !== undefined) {
    where.isActive = String(query.isActive) === "true";
  }

  if (query.billingInterval) {
    where.billingInterval = query.billingInterval;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } }
    ];
  }

  const [total, plans] = await Promise.all([
    prisma.plan.count({ where }),
    prisma.plan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        planProducts: {
          include: {
            product: { select: { id: true, name: true, salesPrice: true } },
            variant: { select: { id: true, name: true, value: true, priceExtra: true } }
          }
        },
        _count: {
          select: { subscriptions: true }
        }
      }
    })
  ]);

  return {
    plans,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getPlanById(id: string, userRole?: UserRole) {
  const plan = await prisma.plan.findUnique({
    where: { id },
    include: {
      planProducts: {
        include: {
          product: true,
          variant: true
        }
      },
      _count: {
        select: { subscriptions: true }
      }
    }
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  if (userRole === UserRole.CUSTOMER && !plan.isActive) {
    throw new Error("Plan not found");
  }

  return plan;
}

export async function createPlan(data: any, actorId?: string) {
  const { products, ...planData } = data;

  const plan = await prisma.plan.create({
    data: {
      ...planData,
      startDate: planData.startDate ? new Date(planData.startDate) : new Date(),
      endDate: planData.endDate ? new Date(planData.endDate) : null,
      planProducts: products?.length
        ? {
            create: products.map((p: any) => ({
              productId: p.productId,
              variantId: p.variantId || null,
              quantity: p.quantity || 1,
              unitPrice: p.unitPrice || 0
            }))
          }
        : undefined
    },
    include: {
      planProducts: {
        include: { product: true, variant: true }
      }
    }
  });

  await logAudit({
    userId: actorId,
    action: "PLAN_CREATED",
    entity: "Plan",
    entityId: plan.id,
    details: { name: plan.name, price: plan.price, interval: plan.billingInterval }
  });

  return plan;
}

export async function updatePlan(id: string, data: any, actorId?: string) {
  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Plan not found");
  }

  const updateData = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  }

  const updated = await prisma.plan.update({
    where: { id },
    data: updateData,
    include: {
      planProducts: {
        include: { product: true, variant: true }
      }
    }
  });

  await logAudit({
    userId: actorId,
    action: "PLAN_UPDATED",
    entity: "Plan",
    entityId: id
  });

  return updated;
}

export async function setPlanStatus(
  id: string,
  isActive: boolean,
  actorId?: string
) {
  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Plan not found");
  }

  const updated = await prisma.plan.update({
    where: { id },
    data: { isActive }
  });

  await logAudit({
    userId: actorId,
    action: isActive ? "PLAN_ACTIVATED" : "PLAN_DEACTIVATED",
    entity: "Plan",
    entityId: id
  });

  return updated;
}

// Plan Product Associations
export async function getPlanProducts(planId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new Error("Plan not found");
  }

  return prisma.planProduct.findMany({
    where: { planId },
    include: {
      product: true,
      variant: true
    }
  });
}

export async function addProductToPlan(
  planId: string,
  data: { productId: string; variantId?: string; quantity?: number; unitPrice?: number },
  actorId?: string
) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new Error("Plan not found");
  }

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) {
    throw new Error("Product not found");
  }

  const existing = await prisma.planProduct.findUnique({
    where: {
      planId_productId: {
        planId,
        productId: data.productId
      }
    }
  });

  if (existing) {
    throw new Error("This product is already associated with this plan");
  }

  const planProduct = await prisma.planProduct.create({
    data: {
      planId,
      productId: data.productId,
      variantId: data.variantId || null,
      quantity: data.quantity || 1,
      unitPrice: data.unitPrice ?? product.salesPrice
    },
    include: { product: true, variant: true }
  });

  await logAudit({
    userId: actorId,
    action: "PLAN_PRODUCT_ADDED",
    entity: "PlanProduct",
    entityId: planProduct.id,
    details: { planId, productId: data.productId }
  });

  return planProduct;
}

export async function updatePlanProduct(
  planId: string,
  productId: string,
  data: { quantity?: number; unitPrice?: number },
  actorId?: string
) {
  const existing = await prisma.planProduct.findUnique({
    where: {
      planId_productId: {
        planId,
        productId
      }
    }
  });

  if (!existing) {
    throw new Error("Product not associated with this plan");
  }

  const updated = await prisma.planProduct.update({
    where: { id: existing.id },
    data,
    include: { product: true, variant: true }
  });

  await logAudit({
    userId: actorId,
    action: "PLAN_PRODUCT_UPDATED",
    entity: "PlanProduct",
    entityId: existing.id
  });

  return updated;
}

export async function removeProductFromPlan(
  planId: string,
  productId: string,
  actorId?: string
) {
  const existing = await prisma.planProduct.findUnique({
    where: {
      planId_productId: {
        planId,
        productId
      }
    }
  });

  if (!existing) {
    throw new Error("Product not associated with this plan");
  }

  await prisma.planProduct.delete({
    where: { id: existing.id }
  });

  await logAudit({
    userId: actorId,
    action: "PLAN_PRODUCT_REMOVED",
    entity: "PlanProduct",
    entityId: existing.id
  });

  return { success: true, message: "Product removed from plan" };
}

