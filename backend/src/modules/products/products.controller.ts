import { Response, NextFunction } from "express";
import * as productsService from "./products.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export async function list(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { products, meta } = await productsService.listProducts(
      req.query as any,
      req.user?.role
    );
    sendSuccess(res, products, "Products retrieved", 200, meta);
  } catch (error: any) {
    sendError(res, error.message || "Failed to list products", 500);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const product = await productsService.getProductById(
      req.params.id,
      req.user?.role
    );
    sendSuccess(res, product);
  } catch (error: any) {
    sendError(res, error.message || "Product not found", 404);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const product = await productsService.createProduct(
      req.body,
      req.user?.userId
    );
    sendSuccess(res, product, "Product created successfully", 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to create product", 400);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const product = await productsService.updateProduct(
      req.params.id,
      req.body,
      req.user?.userId
    );
    sendSuccess(res, product, "Product updated successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update product", 400);
  }
}

export async function setStatus(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const product = await productsService.setProductStatus(
      req.params.id,
      req.body.isActive,
      req.user?.userId
    );
    sendSuccess(res, product, "Product status updated");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update product status", 400);
  }
}

// Variants
export async function listVariants(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const variants = await productsService.listVariants(
      req.params.id,
      req.user?.role
    );
    sendSuccess(res, variants, "Variants retrieved");
  } catch (error: any) {
    sendError(res, error.message || "Failed to list variants", 400);
  }
}

export async function createVariant(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const variant = await productsService.createVariant(
      req.params.id,
      req.body,
      req.user?.userId
    );
    sendSuccess(res, variant, "Variant created successfully", 201);
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      sendError(res, error.message, 409);
      return;
    }
    sendError(res, error.message || "Failed to create variant", 400);
  }
}

export async function updateVariant(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const variant = await productsService.updateVariant(
      req.params.id,
      req.params.variantId,
      req.body,
      req.user?.userId
    );
    sendSuccess(res, variant, "Variant updated successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update variant", 400);
  }
}

export async function setVariantStatus(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const variant = await productsService.setVariantStatus(
      req.params.id,
      req.params.variantId,
      req.body.isActive,
      req.user?.userId
    );
    sendSuccess(res, variant, "Variant status updated");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update variant status", 400);
  }
}

export async function deleteVariant(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const result = await productsService.deleteVariant(
      req.params.id,
      req.params.variantId,
      req.user?.userId
    );
    sendSuccess(res, result, "Variant deleted successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to delete variant", 400);
  }
}

