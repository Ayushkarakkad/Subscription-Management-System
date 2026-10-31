import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import {
  createProductSchema,
  updateProductSchema,
  updateStatusSchema,
  createVariantSchema,
  updateVariantSchema,
  productQuerySchema
} from "./product.validation";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  setProductStatus,
  createVariant,
  getVariants,
  updateVariant,
  setVariantStatus,
  deleteVariant,
  ProductError
} from "./product.service";

function handleError(error: unknown, res: Response, fallbackMessage: string) {
  if (error instanceof ProductError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  console.error(fallbackMessage, error);
  res.status(500).json({
    success: false,
    message: fallbackMessage
  });
}

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param ?? "";
}

export async function createProductHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const validation = createProductSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const product = await createProduct(validation.data);
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });
  } catch (error) {
    handleError(error, res, "Failed to create product");
  }
}

export async function getProductsHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const validation = productQuerySchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const isCustomer = req.user?.role === UserRole.CUSTOMER;
    const result = await getProducts(validation.data, isCustomer);

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    handleError(error, res, "Failed to retrieve products");
  }
}

export async function getProductByIdHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Product ID is required" });
      return;
    }

    const isCustomer = req.user?.role === UserRole.CUSTOMER;
    const product = await getProductById(id, isCustomer);

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product
    });
  } catch (error) {
    handleError(error, res, "Failed to retrieve product");
  }
}

export async function updateProductHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Product ID is required" });
      return;
    }

    const validation = updateProductSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product update data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await updateProduct(id, validation.data);
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updated
    });
  } catch (error) {
    handleError(error, res, "Failed to update product");
  }
}

export async function setProductStatusHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Product ID is required" });
      return;
    }

    const validation = updateStatusSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid status data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await setProductStatus(id, validation.data.isActive);
    res.status(200).json({
      success: true,
      message: `Product ${validation.data.isActive ? "activated" : "deactivated"} successfully`,
      data: updated
    });
  } catch (error) {
    handleError(error, res, "Failed to change product status");
  }
}

// ==========================================
// VARIANT CONTROLLERS
// ==========================================

export async function createVariantHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Product ID is required" });
      return;
    }

    const validation = createVariantSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid variant data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const variant = await createVariant(id, validation.data);
    res.status(201).json({
      success: true,
      message: "Product variant created successfully",
      data: variant
    });
  } catch (error) {
    handleError(error, res, "Failed to create variant");
  }
}

export async function getVariantsHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Product ID is required" });
      return;
    }

    const isCustomer = req.user?.role === UserRole.CUSTOMER;
    const variants = await getVariants(id, isCustomer);

    res.status(200).json({
      success: true,
      message: "Variants retrieved successfully",
      data: variants
    });
  } catch (error) {
    handleError(error, res, "Failed to retrieve variants");
  }
}

export async function updateVariantHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const variantId = getParam(req.params.variantId);
    if (!id || !variantId) {
      res.status(400).json({
        success: false,
        message: "Product ID and Variant ID are required"
      });
      return;
    }

    const validation = updateVariantSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid variant update data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await updateVariant(id, variantId, validation.data);
    res.status(200).json({
      success: true,
      message: "Product variant updated successfully",
      data: updated
    });
  } catch (error) {
    handleError(error, res, "Failed to update variant");
  }
}

export async function setVariantStatusHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const variantId = getParam(req.params.variantId);
    if (!id || !variantId) {
      res.status(400).json({
        success: false,
        message: "Product ID and Variant ID are required"
      });
      return;
    }

    const validation = updateStatusSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid status data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await setVariantStatus(id, variantId, validation.data.isActive);
    res.status(200).json({
      success: true,
      message: `Variant ${validation.data.isActive ? "activated" : "deactivated"} successfully`,
      data: updated
    });
  } catch (error) {
    handleError(error, res, "Failed to update variant status");
  }
}

export async function deleteVariantHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const variantId = getParam(req.params.variantId);
    if (!id || !variantId) {
      res.status(400).json({
        success: false,
        message: "Product ID and Variant ID are required"
      });
      return;
    }

    const result = await deleteVariant(id, variantId);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    handleError(error, res, "Failed to delete variant");
  }
}
