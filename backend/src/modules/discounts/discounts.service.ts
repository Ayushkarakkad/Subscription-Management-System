import { prisma } from "../../config/database";
import { logAudit } from "../../utils/audit.utils";
import { DiscountType, DiscountScope } from "@prisma/client";

export async function listDiscounts(query: {
  page?: number;
  limit?: number;
  search?: string;
  type?: DiscountType;
  isActive?: boolean | string;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.type) {
    where.type = query.type;
  }

  if (query.isActive !== undefined) {
    where.isActive = String(query.isActive) === "true";
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } }
    ];
  }

  const [total, discounts] = await Promise.all([
    prisma.discount.count({ where }),
    prisma.discount.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        products: {
          include: {
            product: { select: { id: true, name: true, salesPrice: true } }
          }
        }
      }
    })
  ]);

  return {
    discounts,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getDiscountById(id: string) {
  const discount = await prisma.discount.findUnique({
    where: { id },
    include: {
      products: {
        include: { product: true, variant: true }
      }
    }
  });

  if (!discount) {
    throw new Error("Discount not found");
  }

  return discount;
}

export async function createDiscount(data: any, actorId?: string) {
  const { productIds, ...discountData } = data;

  const discount = await prisma.discount.create({
    data: {
      ...discountData,
      startsAt: discountData.startsAt ? new Date(discountData.startsAt) : null,
      endsAt: discountData.endsAt ? new Date(discountData.endsAt) : null,
      products: productIds?.length
        ? {
            create: productIds.map((pId: string) => ({
              productId: pId
            }))
          }
        : undefined
    },
    include: {
      products: { include: { product: true } }
    }
  });

  await logAudit({
    userId: actorId,
    action: "DISCOUNT_CREATED",
    entity: "Discount",
    entityId: discount.id,
    details: { name: discount.name, type: discount.type, value: discount.value }
  });

  return discount;
}

export async function updateDiscount(id: string, data: any, actorId?: string) {
  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Discount not found");
  }

  const updateData = { ...data };
  if (data.startsAt !== undefined) {
    updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
  }
  if (data.endsAt !== undefined) {
    updateData.endsAt = data.endsAt ? new Date(data.endsAt) : null;
  }

  const updated = await prisma.discount.update({
    where: { id },
    data: updateData,
    include: {
      products: { include: { product: true } }
    }
  });

  await logAudit({
    userId: actorId,
    action: "DISCOUNT_UPDATED",
    entity: "Discount",
    entityId: id
  });

  return updated;
}

export async function setDiscountStatus(
  id: string,
  isActive: boolean,
  actorId?: string
) {
  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Discount not found");
  }

  const updated = await prisma.discount.update({
    where: { id },
    data: { isActive }
  });

  await logAudit({
    userId: actorId,
    action: isActive ? "DISCOUNT_ACTIVATED" : "DISCOUNT_DEACTIVATED",
    entity: "Discount",
    entityId: id
  });

  return updated;
}

// Discount Products Association
export async function getDiscountProducts(discountId: string) {
  const discount = await prisma.discount.findUnique({ where: { id: discountId } });
  if (!discount) {
    throw new Error("Discount not found");
  }

  return prisma.discountProduct.findMany({
    where: { discountId },
    include: { product: true, variant: true }
  });
}

export async function addProductToDiscount(
  discountId: string,
  data: { productId: string; variantId?: string },
  actorId?: string
) {
  const discount = await prisma.discount.findUnique({ where: { id: discountId } });
  if (!discount) {
    throw new Error("Discount not found");
  }

  const existing = await prisma.discountProduct.findUnique({
    where: {
      discountId_productId: {
        discountId,
        productId: data.productId
      }
    }
  });

  if (existing) {
    throw new Error("This product is already associated with this discount");
  }

  const result = await prisma.discountProduct.create({
    data: {
      discountId,
      productId: data.productId,
      variantId: data.variantId || null
    },
    include: { product: true, variant: true }
  });

  await logAudit({
    userId: actorId,
    action: "DISCOUNT_PRODUCT_ADDED",
    entity: "DiscountProduct",
    entityId: result.id
  });

  return result;
}

export async function removeProductFromDiscount(
  discountId: string,
  productId: string,
  actorId?: string
) {
  const existing = await prisma.discountProduct.findUnique({
    where: {
      discountId_productId: {
        discountId,
        productId
      }
    }
  });

  if (!existing) {
    throw new Error("Product is not associated with this discount");
  }

  await prisma.discountProduct.delete({
    where: { id: existing.id }
  });

  await logAudit({
    userId: actorId,
    action: "DISCOUNT_PRODUCT_REMOVED",
    entity: "DiscountProduct",
    entityId: existing.id
  });

  return { success: true, message: "Product removed from discount" };
}

// Validation & Calculation
export async function validateAndCalculateDiscount(params: {
  discountId?: string;
  name?: string;
  amount: number;
  quantity?: number;
  productId?: string;
}) {
  const { discountId, name, amount, quantity = 1, productId } = params;

  let discount = null;
  if (discountId) {
    discount = await prisma.discount.findUnique({
      where: { id: discountId },
      include: { products: true }
    });
  } else if (name) {
    discount = await prisma.discount.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      include: { products: true }
    });
  }

  if (!discount) {
    return {
      eligible: false,
      reason: "Discount not found",
      discountAmount: 0,
      finalAmount: amount
    };
  }

  if (!discount.isActive) {
    return {
      eligible: false,
      reason: "This discount is currently inactive",
      discountAmount: 0,
      finalAmount: amount
    };
  }

  const now = new Date();
  if (discount.startsAt && now < discount.startsAt) {
    return {
      eligible: false,
      reason: "This discount has not started yet",
      discountAmount: 0,
      finalAmount: amount
    };
  }

  if (discount.endsAt && now > discount.endsAt) {
    return {
      eligible: false,
      reason: "This discount has expired",
      discountAmount: 0,
      finalAmount: amount
    };
  }

  if (discount.maxUses && discount.usageCount >= discount.maxUses) {
    return {
      eligible: false,
      reason: "Maximum usage limit reached for this discount",
      discountAmount: 0,
      finalAmount: amount
    };
  }

  if (discount.minimumPurchase && amount < Number(discount.minimumPurchase)) {
    return {
      eligible: false,
      reason: `Order minimum of ${Number(discount.minimumPurchase).toFixed(2)} not met`,
      discountAmount: 0,
      finalAmount: amount
    };
  }

  if (discount.minimumQuantity && quantity < discount.minimumQuantity) {
    return {
      eligible: false,
      reason: `Minimum item quantity of ${discount.minimumQuantity} required`,
      discountAmount: 0,
      finalAmount: amount
    };
  }

  // Product-specific check
  if (discount.products.length > 0 && productId) {
    const isApplicable = discount.products.some((p) => p.productId === productId);
    if (!isApplicable) {
      return {
        eligible: false,
        reason: "This discount does not apply to the selected product",
        discountAmount: 0,
        finalAmount: amount
      };
    }
  }

  let discountAmount = 0;
  if (discount.type === DiscountType.PERCENTAGE) {
    discountAmount = (amount * Number(discount.value)) / 100;
  } else {
    discountAmount = Number(discount.value);
  }

  // Prevent discounts from creating invalid negative totals
  discountAmount = Math.min(amount, Math.max(0, discountAmount));
  const finalAmount = Math.max(0, amount - discountAmount);

  return {
    eligible: true,
    discountId: discount.id,
    discountName: discount.name,
    discountType: discount.type,
    discountValue: Number(discount.value),
    discountAmount: Number(discountAmount.toFixed(2)),
    finalAmount: Number(finalAmount.toFixed(2))
  };
}

