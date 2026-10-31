import { Prisma, BillingInterval } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  CreatePlanInput,
  UpdatePlanInput,
  PlanProductItemInput,
  UpdatePlanProductInput,
  PlanQueryParams
} from "./plan.validation";

export class PlanError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "PlanError";
    this.statusCode = statusCode;
  }
}

async function resolveProductUnitPrice(
  productId: string,
  variantId?: string | null,
  overridePrice?: number | string
): Promise<Prisma.Decimal> {
  if (overridePrice !== undefined && overridePrice !== null) {
    return new Prisma.Decimal(overridePrice);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: variantId ? { where: { id: variantId } } : false
    }
  });

  if (!product) {
    throw new PlanError(`Product not found: ${productId}`, 404);
  }

  let price = new Prisma.Decimal(product.salesPrice);
  if (variantId && product.variants && product.variants.length > 0) {
    price = price.plus(product.variants[0].priceExtra);
  }

  return price;
}

export async function createPlan(input: CreatePlanInput) {
  const priceDecimal = new Prisma.Decimal(input.price);
  const startDate = new Date(input.startDate);
  const endDate = input.endDate ? new Date(input.endDate) : null;

  if (input.products && input.products.length > 0) {
    // Validate products and check for duplicates within the input
    const seen = new Set<string>();
    const planProductsData: {
      productId: string;
      variantId?: string | null;
      quantity: number;
      unitPrice: Prisma.Decimal;
    }[] = [];

    for (const p of input.products) {
      const key = `${p.productId}_${p.variantId ?? "none"}`;
      if (seen.has(key)) {
        throw new PlanError(
          "Duplicate product/variant specified in plan products list",
          409
        );
      }
      seen.add(key);

      const product = await prisma.product.findUnique({
        where: { id: p.productId }
      });
      if (!product) {
        throw new PlanError(`Product not found: ${p.productId}`, 404);
      }

      if (p.variantId) {
        const variant = await prisma.productVariant.findFirst({
          where: { id: p.variantId, productId: p.productId }
        });
        if (!variant) {
          throw new PlanError(
            `Variant ${p.variantId} not found for product ${p.productId}`,
            404
          );
        }
      }

      const unitPrice = await resolveProductUnitPrice(
        p.productId,
        p.variantId,
        p.unitPrice
      );

      planProductsData.push({
        productId: p.productId,
        variantId: p.variantId ?? null,
        quantity: p.quantity ?? 1,
        unitPrice
      });
    }

    return await prisma.$transaction(async (tx) => {
      const plan = await tx.plan.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          price: priceDecimal,
          billingInterval: input.billingInterval,
          minimumQuantity: input.minimumQuantity ?? 1,
          startDate,
          endDate,
          autoClose: input.autoClose ?? false,
          allowEarlyClose: input.allowEarlyClose ?? true,
          allowPause: input.allowPause ?? true,
          allowRenewal: input.allowRenewal ?? true,
          isActive: input.isActive ?? true,
          planProducts: {
            create: planProductsData
          }
        },
        include: {
          planProducts: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });
      return plan;
    });
  }

  return await prisma.plan.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      price: priceDecimal,
      billingInterval: input.billingInterval,
      minimumQuantity: input.minimumQuantity ?? 1,
      startDate,
      endDate,
      autoClose: input.autoClose ?? false,
      allowEarlyClose: input.allowEarlyClose ?? true,
      allowPause: input.allowPause ?? true,
      allowRenewal: input.allowRenewal ?? true,
      isActive: input.isActive ?? true
    },
    include: {
      planProducts: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });
}

export async function getPlans(params: PlanQueryParams, isCustomer = false) {
  const { page, limit, search, billingInterval } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.PlanWhereInput = {};

  if (isCustomer) {
    where.isActive = true;
  } else if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  if (billingInterval) {
    where.billingInterval = billingInterval;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
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
            product: {
              select: {
                id: true,
                name: true,
                type: true,
                salesPrice: true,
                isActive: true
              }
            },
            variant: {
              select: {
                id: true,
                name: true,
                value: true,
                priceExtra: true,
                isActive: true
              }
            }
          }
        }
      }
    })
  ]);

  return {
    plans,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getPlanById(id: string, isCustomer = false) {
  const plan = await prisma.plan.findUnique({
    where: { id },
    include: {
      planProducts: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });

  if (!plan) {
    throw new PlanError("Subscription plan not found", 404);
  }

  if (isCustomer && !plan.isActive) {
    throw new PlanError("Subscription plan not found", 404);
  }

  return plan;
}

export async function updatePlan(id: string, input: UpdatePlanInput) {
  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) {
    throw new PlanError("Subscription plan not found", 404);
  }

  const effectiveStart = input.startDate
    ? new Date(input.startDate)
    : existing.startDate;
  const effectiveEnd =
    input.endDate !== undefined
      ? input.endDate
        ? new Date(input.endDate)
        : null
      : existing.endDate;

  if (effectiveEnd && effectiveEnd < effectiveStart) {
    throw new PlanError("End date must be greater than or equal to start date", 400);
  }

  const updateData: Prisma.PlanUpdateInput = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.price !== undefined) updateData.price = new Prisma.Decimal(input.price);
  if (input.billingInterval !== undefined) updateData.billingInterval = input.billingInterval;
  if (input.minimumQuantity !== undefined) updateData.minimumQuantity = input.minimumQuantity;
  if (input.startDate !== undefined) updateData.startDate = effectiveStart;
  if (input.endDate !== undefined) updateData.endDate = effectiveEnd;
  if (input.autoClose !== undefined) updateData.autoClose = input.autoClose;
  if (input.allowEarlyClose !== undefined) updateData.allowEarlyClose = input.allowEarlyClose;
  if (input.allowPause !== undefined) updateData.allowPause = input.allowPause;
  if (input.allowRenewal !== undefined) updateData.allowRenewal = input.allowRenewal;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  return await prisma.plan.update({
    where: { id },
    data: updateData,
    include: {
      planProducts: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });
}

export async function setPlanStatus(id: string, isActive: boolean) {
  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) {
    throw new PlanError("Subscription plan not found", 404);
  }

  return await prisma.plan.update({
    where: { id },
    data: { isActive },
    include: {
      planProducts: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });
}

// ==========================================
// PLAN PRODUCT ASSOCIATIONS
// ==========================================

export async function addProductsToPlan(
  planId: string,
  items: PlanProductItemInput[]
) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new PlanError("Subscription plan not found", 404);
  }

  const createdItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    });
    if (!product) {
      throw new PlanError(`Product not found: ${item.productId}`, 404);
    }

    if (item.variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: { id: item.variantId, productId: item.productId }
      });
      if (!variant) {
        throw new PlanError(
          `Variant ${item.variantId} not found for product ${item.productId}`,
          404
        );
      }
    }

    // Check if this product/variant is already attached to this plan
    const existing = await prisma.planProduct.findFirst({
      where: {
        planId,
        productId: item.productId,
        variantId: item.variantId ?? null
      }
    });

    if (existing) {
      throw new PlanError(
        `Product ${product.name} (variant: ${item.variantId ?? "default"}) is already associated with this plan`,
        409
      );
    }

    const unitPrice = await resolveProductUnitPrice(
      item.productId,
      item.variantId,
      item.unitPrice
    );

    const planProduct = await prisma.planProduct.create({
      data: {
        planId,
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity ?? 1,
        unitPrice
      },
      include: {
        product: true,
        variant: true
      }
    });

    createdItems.push(planProduct);
  }

  return createdItems;
}

export async function getPlanProducts(planId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new PlanError("Subscription plan not found", 404);
  }

  return await prisma.planProduct.findMany({
    where: { planId },
    include: {
      product: true,
      variant: true
    }
  });
}

export async function updatePlanProduct(
  planId: string,
  identifier: string,
  input: UpdatePlanProductInput,
  variantId?: string
) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new PlanError("Subscription plan not found", 404);
  }

  // Find either by primary ID or by (planId, productId, optional variantId)
  let planProduct = await prisma.planProduct.findFirst({
    where: { id: identifier, planId }
  });

  if (!planProduct) {
    planProduct = await prisma.planProduct.findFirst({
      where: {
        planId,
        productId: identifier,
        ...(variantId !== undefined ? { variantId: variantId ?? null } : {})
      }
    });
  }

  if (!planProduct) {
    throw new PlanError("Product association not found in this plan", 404);
  }

  const updateData: Prisma.PlanProductUpdateInput = {};
  if (input.quantity !== undefined) updateData.quantity = input.quantity;
  if (input.unitPrice !== undefined) {
    updateData.unitPrice = new Prisma.Decimal(input.unitPrice);
  }

  return await prisma.planProduct.update({
    where: { id: planProduct.id },
    data: updateData,
    include: {
      product: true,
      variant: true
    }
  });
}

export async function removeProductFromPlan(
  planId: string,
  identifier: string,
  variantId?: string
) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new PlanError("Subscription plan not found", 404);
  }

  // Find either by primary ID or by (planId, productId, optional variantId)
  let planProduct = await prisma.planProduct.findFirst({
    where: { id: identifier, planId }
  });

  if (!planProduct) {
    planProduct = await prisma.planProduct.findFirst({
      where: {
        planId,
        productId: identifier,
        ...(variantId !== undefined ? { variantId: variantId ?? null } : {})
      }
    });
  }

  if (!planProduct) {
    throw new PlanError("Product association not found in this plan", 404);
  }

  await prisma.planProduct.delete({
    where: { id: planProduct.id }
  });

  return { message: "Product removed from plan successfully" };
}
