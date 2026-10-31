import { prisma } from "../../config/database";
import { logAudit } from "../../utils/audit.utils";
import { UserRole } from "@prisma/client";

export async function listProducts(
  query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isActive?: boolean | string;
  },
  userRole?: UserRole
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = {};

  // Customers can only see active products
  if (userRole === UserRole.CUSTOMER) {
    where.isActive = true;
  } else if (query.isActive !== undefined) {
    where.isActive = String(query.isActive) === "true";
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { sku: { contains: query.search, mode: "insensitive" } }
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
          where: userRole === UserRole.CUSTOMER ? { isActive: true } : undefined
        }
      }
    })
  ]);

  return {
    products,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getProductById(id: string, userRole?: UserRole) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        where: userRole === UserRole.CUSTOMER ? { isActive: true } : undefined
      }
    }
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (userRole === UserRole.CUSTOMER && !product.isActive) {
    throw new Error("Product not found");
  }

  return product;
}

export async function createProduct(data: any, actorId?: string) {
  const { variants, ...productData } = data;

  const product = await prisma.product.create({
    data: {
      ...productData,
      variants: variants?.length
        ? {
            create: variants.map((v: any) => ({
              name: v.name,
              value: v.value,
              sku: v.sku || null,
              priceExtra: v.priceExtra || 0,
              isActive: v.isActive ?? true
            }))
          }
        : undefined
    },
    include: {
      variants: true
    }
  });

  await logAudit({
    userId: actorId,
    action: "PRODUCT_CREATED",
    entity: "Product",
    entityId: product.id,
    details: { name: product.name, salesPrice: product.salesPrice }
  });

  return product;
}

export async function updateProduct(id: string, data: any, actorId?: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Product not found");
  }

  const updated = await prisma.product.update({
    where: { id },
    data,
    include: { variants: true }
  });

  await logAudit({
    userId: actorId,
    action: "PRODUCT_UPDATED",
    entity: "Product",
    entityId: id
  });

  return updated;
}

export async function setProductStatus(
  id: string,
  isActive: boolean,
  actorId?: string
) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new Error("Product not found");
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive },
    include: { variants: true }
  });

  await logAudit({
    userId: actorId,
    action: isActive ? "PRODUCT_ACTIVATED" : "PRODUCT_DEACTIVATED",
    entity: "Product",
    entityId: id
  });

  return updated;
}

// ==========================================
// VARIANTS CRUD
// ==========================================

export async function listVariants(productId: string, userRole?: UserRole) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("Product not found");
  }

  return prisma.productVariant.findMany({
    where: {
      productId,
      ...(userRole === UserRole.CUSTOMER ? { isActive: true } : {})
    },
    orderBy: { name: "asc" }
  });
}

export async function createVariant(
  productId: string,
  data: any,
  actorId?: string
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("Product not found");
  }

  // Check unique name+value for this product
  const existing = await prisma.productVariant.findUnique({
    where: {
      productId_name_value: {
        productId,
        name: data.name,
        value: data.value
      }
    }
  });

  if (existing) {
    throw new Error("A variant with this name and value already exists for this product");
  }

  const variant = await prisma.productVariant.create({
    data: {
      productId,
      name: data.name,
      value: data.value,
      sku: data.sku || null,
      priceExtra: data.priceExtra || 0,
      isActive: data.isActive ?? true
    }
  });

  await logAudit({
    userId: actorId,
    action: "VARIANT_CREATED",
    entity: "ProductVariant",
    entityId: variant.id,
    details: { productId, name: variant.name, value: variant.value }
  });

  return variant;
}

export async function updateVariant(
  productId: string,
  variantId: string,
  data: any,
  actorId?: string
) {
  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, productId }
  });

  if (!existing) {
    throw new Error("Variant not found for this product");
  }

  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data
  });

  await logAudit({
    userId: actorId,
    action: "VARIANT_UPDATED",
    entity: "ProductVariant",
    entityId: variantId
  });

  return updated;
}

export async function setVariantStatus(
  productId: string,
  variantId: string,
  isActive: boolean,
  actorId?: string
) {
  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, productId }
  });

  if (!existing) {
    throw new Error("Variant not found for this product");
  }

  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data: { isActive }
  });

  await logAudit({
    userId: actorId,
    action: isActive ? "VARIANT_ACTIVATED" : "VARIANT_DEACTIVATED",
    entity: "ProductVariant",
    entityId: variantId
  });

  return updated;
}

export async function deleteVariant(
  productId: string,
  variantId: string,
  actorId?: string
) {
  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, productId }
  });

  if (!existing) {
    throw new Error("Variant not found for this product");
  }

  // Delete variant
  await prisma.productVariant.delete({
    where: { id: variantId }
  });

  await logAudit({
    userId: actorId,
    action: "VARIANT_DELETED",
    entity: "ProductVariant",
    entityId: variantId
  });

  return { success: true, message: "Variant deleted successfully" };
}

