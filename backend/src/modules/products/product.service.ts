import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
  ProductQueryParams
} from "./product.validation";

export class ProductError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ProductError";
    this.statusCode = statusCode;
  }
}

export async function createProduct(input: CreateProductInput) {
  const salesPriceDecimal = new Prisma.Decimal(input.salesPrice);
  const costPriceDecimal = new Prisma.Decimal(input.costPrice);

  if (input.variants && input.variants.length > 0) {
    // Check for duplicate variant name+value pairs within the payload
    const seen = new Set<string>();
    for (const v of input.variants) {
      const key = `${v.name.toLowerCase()}_${v.value.toLowerCase()}`;
      if (seen.has(key)) {
        throw new ProductError(
          `Duplicate variant "${v.name}: ${v.value}" specified in input`,
          409
        );
      }
      seen.add(key);
    }

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          type: input.type,
          description: input.description ?? null,
          salesPrice: salesPriceDecimal,
          costPrice: costPriceDecimal,
          notes: input.notes ?? null,
          isActive: input.isActive ?? true,
          variants: {
            create: input.variants!.map((v) => ({
              name: v.name,
              value: v.value,
              priceExtra: new Prisma.Decimal(v.priceExtra ?? 0),
              isActive: v.isActive ?? true
            }))
          }
        },
        include: {
          variants: true
        }
      });
      return product;
    });
  }

  return await prisma.product.create({
    data: {
      name: input.name,
      type: input.type,
      description: input.description ?? null,
      salesPrice: salesPriceDecimal,
      costPrice: costPriceDecimal,
      notes: input.notes ?? null,
      isActive: input.isActive ?? true
    },
    include: {
      variants: true
    }
  });
}

export async function getProducts(params: ProductQueryParams, isCustomer = false) {
  const { page, limit, search, type } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {};

  if (isCustomer) {
    where.isActive = true;
  } else if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  if (type) {
    where.type = { equals: type, mode: "insensitive" };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { type: { contains: search, mode: "insensitive" } }
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        variants: {
          where: isCustomer ? { isActive: true } : undefined,
          orderBy: { name: "asc" }
        }
      }
    })
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getProductById(id: string, isCustomer = false) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        where: isCustomer ? { isActive: true } : undefined,
        orderBy: { name: "asc" }
      }
    }
  });

  if (!product) {
    throw new ProductError("Product not found", 404);
  }

  if (isCustomer && !product.isActive) {
    throw new ProductError("Product not found", 404);
  }

  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new ProductError("Product not found", 404);
  }

  const updateData: Prisma.ProductUpdateInput = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.salesPrice !== undefined) {
    updateData.salesPrice = new Prisma.Decimal(input.salesPrice);
  }
  if (input.costPrice !== undefined) {
    updateData.costPrice = new Prisma.Decimal(input.costPrice);
  }

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      variants: {
        orderBy: { name: "asc" }
      }
    }
  });

  return updated;
}

export async function setProductStatus(id: string, isActive: boolean) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new ProductError("Product not found", 404);
  }

  return await prisma.product.update({
    where: { id },
    data: { isActive },
    include: {
      variants: true
    }
  });
}

// ==========================================
// VARIANT OPERATIONS
// ==========================================

export async function createVariant(productId: string, input: CreateVariantInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ProductError("Product not found", 404);
  }

  const existing = await prisma.productVariant.findUnique({
    where: {
      productId_name_value: {
        productId,
        name: input.name,
        value: input.value
      }
    }
  });

  if (existing) {
    throw new ProductError(
      `Variant with name "${input.name}" and value "${input.value}" already exists for this product`,
      409
    );
  }

  return await prisma.productVariant.create({
    data: {
      productId,
      name: input.name,
      value: input.value,
      priceExtra: new Prisma.Decimal(input.priceExtra ?? 0),
      isActive: input.isActive ?? true
    }
  });
}

export async function getVariants(productId: string, isCustomer = false) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || (isCustomer && !product.isActive)) {
    throw new ProductError("Product not found", 404);
  }

  return await prisma.productVariant.findMany({
    where: {
      productId,
      ...(isCustomer ? { isActive: true } : {})
    },
    orderBy: { name: "asc" }
  });
}

export async function updateVariant(
  productId: string,
  variantId: string,
  input: UpdateVariantInput
) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId }
  });

  if (!variant) {
    throw new ProductError("Variant not found for this product", 404);
  }

  const targetName = input.name ?? variant.name;
  const targetValue = input.value ?? variant.value;

  if (targetName !== variant.name || targetValue !== variant.value) {
    const duplicate = await prisma.productVariant.findUnique({
      where: {
        productId_name_value: {
          productId,
          name: targetName,
          value: targetValue
        }
      }
    });

    if (duplicate && duplicate.id !== variantId) {
      throw new ProductError(
        `Variant with name "${targetName}" and value "${targetValue}" already exists for this product`,
        409
      );
    }
  }

  const data: Prisma.ProductVariantUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.value !== undefined) data.value = input.value;
  if (input.priceExtra !== undefined) {
    data.priceExtra = new Prisma.Decimal(input.priceExtra);
  }
  if (input.isActive !== undefined) data.isActive = input.isActive;

  return await prisma.productVariant.update({
    where: { id: variantId },
    data
  });
}

export async function setVariantStatus(
  productId: string,
  variantId: string,
  isActive: boolean
) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId }
  });

  if (!variant) {
    throw new ProductError("Variant not found for this product", 404);
  }

  return await prisma.productVariant.update({
    where: { id: variantId },
    data: { isActive }
  });
}

export async function deleteVariant(productId: string, variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
    include: {
      planProducts: { select: { id: true }, take: 1 },
      quotationItems: { select: { id: true }, take: 1 },
      subscriptionItems: { select: { id: true }, take: 1 },
      invoiceItems: { select: { id: true }, take: 1 },
      discountProducts: { select: { id: true }, take: 1 }
    }
  });

  if (!variant) {
    throw new ProductError("Variant not found for this product", 404);
  }

  const hasReferences =
    variant.planProducts.length > 0 ||
    variant.quotationItems.length > 0 ||
    variant.subscriptionItems.length > 0 ||
    variant.invoiceItems.length > 0 ||
    variant.discountProducts.length > 0;

  if (hasReferences) {
    throw new ProductError(
      "Cannot delete variant because it is referenced in existing plans, quotations, subscriptions, invoices, or discounts. Deactivate it instead.",
      409
    );
  }

  await prisma.productVariant.delete({
    where: { id: variantId }
  });

  return { message: "Variant deleted successfully" };
}
