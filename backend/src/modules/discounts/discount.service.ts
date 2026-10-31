import { Prisma, DiscountType, DiscountScope } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  CreateDiscountInput,
  UpdateDiscountInput,
  DiscountProductAssociationInput,
  DiscountQueryParams,
  ValidateDiscountInput
} from "./discount.validation";

export class DiscountError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "DiscountError";
    this.statusCode = statusCode;
  }
}

export async function createDiscount(input: CreateDiscountInput) {
  const valueDecimal = new Prisma.Decimal(input.value);
  const minPurchaseDecimal =
    input.minimumPurchase !== undefined && input.minimumPurchase !== null
      ? new Prisma.Decimal(input.minimumPurchase)
      : null;
  const startsAt = input.startsAt ? new Date(input.startsAt) : null;
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  const scope = input.scope ?? DiscountScope.BOTH;

  if (input.products && input.products.length > 0) {
    if (scope === DiscountScope.SUBSCRIPTION) {
      throw new DiscountError(
        "Cannot attach products to a discount with scope SUBSCRIPTION. Use PRODUCT or BOTH.",
        400
      );
    }

    const seen = new Set<string>();
    const productAssociations: { productId: string; variantId?: string | null }[] = [];

    for (const p of input.products) {
      const key = `${p.productId}_${p.variantId ?? "none"}`;
      if (seen.has(key)) {
        throw new DiscountError(
          "Duplicate product/variant specified in discount association list",
          409
        );
      }
      seen.add(key);

      const product = await prisma.product.findUnique({ where: { id: p.productId } });
      if (!product) {
        throw new DiscountError(`Product not found: ${p.productId}`, 404);
      }

      if (p.variantId) {
        const variant = await prisma.productVariant.findFirst({
          where: { id: p.variantId, productId: p.productId }
        });
        if (!variant) {
          throw new DiscountError(
            `Variant ${p.variantId} not found for product ${p.productId}`,
            404
          );
        }
      }

      productAssociations.push({
        productId: p.productId,
        variantId: p.variantId ?? null
      });
    }

    return await prisma.$transaction(async (tx) => {
      const discount = await tx.discount.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          type: input.type,
          scope,
          value: valueDecimal,
          minimumPurchase: minPurchaseDecimal,
          minimumQuantity: input.minimumQuantity ?? null,
          startsAt,
          endsAt,
          maxUses: input.maxUses ?? null,
          isActive: input.isActive ?? true,
          products: {
            create: productAssociations
          }
        },
        include: {
          products: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });
      return discount;
    });
  }

  return await prisma.discount.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      scope,
      value: valueDecimal,
      minimumPurchase: minPurchaseDecimal,
      minimumQuantity: input.minimumQuantity ?? null,
      startsAt,
      endsAt,
      maxUses: input.maxUses ?? null,
      isActive: input.isActive ?? true
    },
    include: {
      products: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });
}

export async function getDiscounts(
  params: DiscountQueryParams,
  isCustomer = false
) {
  const { page, limit, search, type, scope } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.DiscountWhereInput = {};
  const now = new Date();

  if (isCustomer) {
    where.isActive = true;
    where.OR = [
      { startsAt: null },
      { startsAt: { lte: now } }
    ];
    where.AND = [
      {
        OR: [
          { endsAt: null },
          { endsAt: { gte: now } }
        ]
      }
    ];
  } else {
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }
  }

  if (type) {
    where.type = type;
  }

  if (scope) {
    where.scope = scope;
  }

  if (search) {
    const searchFilter = [
      { name: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } }
    ];
    if (where.OR) {
      where.AND = [...(where.AND as object[] || []), { OR: searchFilter }];
    } else {
      where.OR = searchFilter;
    }
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
            product: {
              select: {
                id: true,
                name: true,
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
    discounts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getDiscountById(id: string, isCustomer = false) {
  const discount = await prisma.discount.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });

  if (!discount) {
    throw new DiscountError("Discount not found", 404);
  }

  if (isCustomer) {
    const now = new Date();
    if (!discount.isActive) {
      throw new DiscountError("Discount not found or inactive", 404);
    }
    if (discount.startsAt && discount.startsAt > now) {
      throw new DiscountError("Discount not yet active", 404);
    }
    if (discount.endsAt && discount.endsAt < now) {
      throw new DiscountError("Discount has expired", 404);
    }
    if (discount.maxUses !== null && discount.usageCount >= discount.maxUses) {
      throw new DiscountError("Discount usage limit reached", 404);
    }
  }

  return discount;
}

export async function updateDiscount(id: string, input: UpdateDiscountInput) {
  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) {
    throw new DiscountError("Discount not found", 404);
  }

  const effectiveStartsAt =
    input.startsAt !== undefined
      ? input.startsAt
        ? new Date(input.startsAt)
        : null
      : existing.startsAt;

  const effectiveEndsAt =
    input.endsAt !== undefined
      ? input.endsAt
        ? new Date(input.endsAt)
        : null
      : existing.endsAt;

  if (effectiveStartsAt && effectiveEndsAt && effectiveEndsAt < effectiveStartsAt) {
    throw new DiscountError("endsAt must be greater than or equal to startsAt", 400);
  }

  const effectiveType = input.type ?? existing.type;
  const effectiveValue =
    input.value !== undefined ? new Prisma.Decimal(input.value) : existing.value;

  if (effectiveType === DiscountType.PERCENTAGE && effectiveValue.greaterThan(100)) {
    throw new DiscountError("Percentage discount value cannot exceed 100%", 400);
  }

  const updateData: Prisma.DiscountUpdateInput = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.scope !== undefined) updateData.scope = input.scope;
  if (input.value !== undefined) updateData.value = effectiveValue;
  if (input.minimumPurchase !== undefined) {
    updateData.minimumPurchase =
      input.minimumPurchase !== null
        ? new Prisma.Decimal(input.minimumPurchase)
        : null;
  }
  if (input.minimumQuantity !== undefined) updateData.minimumQuantity = input.minimumQuantity;
  if (input.startsAt !== undefined) updateData.startsAt = effectiveStartsAt;
  if (input.endsAt !== undefined) updateData.endsAt = effectiveEndsAt;
  if (input.maxUses !== undefined) updateData.maxUses = input.maxUses;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  return await prisma.discount.update({
    where: { id },
    data: updateData,
    include: {
      products: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });
}

export async function setDiscountStatus(id: string, isActive: boolean) {
  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) {
    throw new DiscountError("Discount not found", 404);
  }

  return await prisma.discount.update({
    where: { id },
    data: { isActive },
    include: {
      products: true
    }
  });
}

// ==========================================
// PRODUCT ASSOCIATIONS
// ==========================================

export async function associateProductsWithDiscount(
  discountId: string,
  items: DiscountProductAssociationInput[]
) {
  const discount = await prisma.discount.findUnique({ where: { id: discountId } });
  if (!discount) {
    throw new DiscountError("Discount not found", 404);
  }

  if (discount.scope === DiscountScope.SUBSCRIPTION) {
    throw new DiscountError(
      "Cannot associate products with a SUBSCRIPTION-scoped discount. Change scope to PRODUCT or BOTH first.",
      400
    );
  }

  const createdItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) {
      throw new DiscountError(`Product not found: ${item.productId}`, 404);
    }

    if (item.variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: { id: item.variantId, productId: item.productId }
      });
      if (!variant) {
        throw new DiscountError(
          `Variant ${item.variantId} not found for product ${item.productId}`,
          404
        );
      }
    }

    const existing = await prisma.discountProduct.findFirst({
      where: {
        discountId,
        productId: item.productId,
        variantId: item.variantId ?? null
      }
    });

    if (existing) {
      throw new DiscountError(
        `Product ${product.name} (variant: ${item.variantId ?? "default"}) is already associated with this discount`,
        409
      );
    }

    const assoc = await prisma.discountProduct.create({
      data: {
        discountId,
        productId: item.productId,
        variantId: item.variantId ?? null
      },
      include: {
        product: true,
        variant: true
      }
    });

    createdItems.push(assoc);
  }

  return createdItems;
}

export async function getDiscountProducts(discountId: string) {
  const discount = await prisma.discount.findUnique({ where: { id: discountId } });
  if (!discount) {
    throw new DiscountError("Discount not found", 404);
  }

  return await prisma.discountProduct.findMany({
    where: { discountId },
    include: {
      product: true,
      variant: true
    }
  });
}

export async function removeProductFromDiscount(
  discountId: string,
  identifier: string,
  variantId?: string
) {
  const discount = await prisma.discount.findUnique({ where: { id: discountId } });
  if (!discount) {
    throw new DiscountError("Discount not found", 404);
  }

  let assoc = await prisma.discountProduct.findFirst({
    where: { id: identifier, discountId }
  });

  if (!assoc) {
    assoc = await prisma.discountProduct.findFirst({
      where: {
        discountId,
        productId: identifier,
        ...(variantId !== undefined ? { variantId: variantId ?? null } : {})
      }
    });
  }

  if (!assoc) {
    throw new DiscountError("Product association not found for this discount", 404);
  }

  await prisma.discountProduct.delete({
    where: { id: assoc.id }
  });

  return { message: "Product removed from discount successfully" };
}

// ==========================================
// ELIGIBILITY AND CALCULATION LOGIC
// ==========================================

export async function validateAndCalculateDiscount(input: ValidateDiscountInput) {
  const discount = await prisma.discount.findUnique({
    where: { id: input.discountId },
    include: {
      products: true
    }
  });

  if (!discount) {
    throw new DiscountError("Discount not found", 404);
  }

  const now = new Date();

  // 1. Check active status
  if (!discount.isActive) {
    return {
      eligible: false,
      reason: "Discount is currently inactive",
      discountAmount: new Prisma.Decimal(0),
      finalAmount: new Prisma.Decimal(input.amount)
    };
  }

  // 2. Check validity dates
  if (discount.startsAt && discount.startsAt > now) {
    return {
      eligible: false,
      reason: `Discount is not active yet (starts at ${discount.startsAt.toISOString()})`,
      discountAmount: new Prisma.Decimal(0),
      finalAmount: new Prisma.Decimal(input.amount)
    };
  }

  if (discount.endsAt && discount.endsAt < now) {
    return {
      eligible: false,
      reason: `Discount has expired (ended at ${discount.endsAt.toISOString()})`,
      discountAmount: new Prisma.Decimal(0),
      finalAmount: new Prisma.Decimal(input.amount)
    };
  }

  // 3. Check global max uses
  if (discount.maxUses !== null && discount.usageCount >= discount.maxUses) {
    return {
      eligible: false,
      reason: "Discount maximum usage limit has been reached",
      discountAmount: new Prisma.Decimal(0),
      finalAmount: new Prisma.Decimal(input.amount)
    };
  }

  // 4. Check minimum purchase amount
  const amountDecimal = new Prisma.Decimal(input.amount);
  if (discount.minimumPurchase && amountDecimal.lessThan(discount.minimumPurchase)) {
    return {
      eligible: false,
      reason: `Minimum purchase of ${discount.minimumPurchase} required (current: ${amountDecimal})`,
      discountAmount: new Prisma.Decimal(0),
      finalAmount: amountDecimal
    };
  }

  // 5. Check minimum quantity
  const quantity = input.quantity ?? 1;
  if (discount.minimumQuantity && quantity < discount.minimumQuantity) {
    return {
      eligible: false,
      reason: `Minimum quantity of ${discount.minimumQuantity} required (current: ${quantity})`,
      discountAmount: new Prisma.Decimal(0),
      finalAmount: amountDecimal
    };
  }

  // 6. Check scope compatibility
  if (input.scope) {
    if (discount.scope !== DiscountScope.BOTH && discount.scope !== input.scope) {
      return {
        eligible: false,
        reason: `Discount scope is ${discount.scope}, but context requested ${input.scope}`,
        discountAmount: new Prisma.Decimal(0),
        finalAmount: amountDecimal
      };
    }
  }

  // 7. Check specific product restriction if configured
  if (discount.products.length > 0) {
    if (!input.productId) {
      return {
        eligible: false,
        reason: "This discount is restricted to specific products and product ID was not supplied",
        discountAmount: new Prisma.Decimal(0),
        finalAmount: amountDecimal
      };
    }

    const matches = discount.products.some(
      (p) =>
        p.productId === input.productId &&
        (!p.variantId || p.variantId === input.variantId)
    );

    if (!matches) {
      return {
        eligible: false,
        reason: "This discount cannot be applied to the specified product/variant",
        discountAmount: new Prisma.Decimal(0),
        finalAmount: amountDecimal
      };
    }
  }

  // 8. Calculate discount amount (never exceed original amount or result in negative price)
  let discountAmount = new Prisma.Decimal(0);

  if (discount.type === DiscountType.PERCENTAGE) {
    // Percentage discount
    discountAmount = amountDecimal.times(discount.value).dividedBy(100);
  } else {
    // Fixed amount discount
    discountAmount = discount.value;
  }

  // Cap discount at the total amount so price never drops below 0
  if (discountAmount.greaterThan(amountDecimal)) {
    discountAmount = amountDecimal;
  }

  const finalAmount = amountDecimal.minus(discountAmount);

  return {
    eligible: true,
    discountId: discount.id,
    discountName: discount.name,
    discountType: discount.type,
    discountValue: discount.value,
    discountAmount: discountAmount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
    finalAmount: finalAmount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
  };
}
