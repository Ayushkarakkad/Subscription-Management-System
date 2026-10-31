import { Response, NextFunction } from "express";
import * as discountsService from "./discounts.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export async function list(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { discounts, meta } = await discountsService.listDiscounts(
      req.query as any
    );
    sendSuccess(res, discounts, "Discounts retrieved", 200, meta);
  } catch (error: any) {
    sendError(res, error.message || "Failed to list discounts", 500);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const discount = await discountsService.getDiscountById(req.params.id);
    sendSuccess(res, discount);
  } catch (error: any) {
    sendError(res, error.message || "Discount not found", 404);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const discount = await discountsService.createDiscount(
      req.body,
      req.user?.userId
    );
    sendSuccess(res, discount, "Discount created successfully", 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to create discount", 400);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const discount = await discountsService.updateDiscount(
      req.params.id,
      req.body,
      req.user?.userId
    );
    sendSuccess(res, discount, "Discount updated successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update discount", 400);
  }
}

export async function setStatus(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const discount = await discountsService.setDiscountStatus(
      req.params.id,
      req.body.isActive,
      req.user?.userId
    );
    sendSuccess(res, discount, "Discount status updated");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update discount status", 400);
  }
}

export async function getProducts(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const products = await discountsService.getDiscountProducts(req.params.id);
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message || "Failed to get discount products", 400);
  }
}

export async function addProduct(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const result = await discountsService.addProductToDiscount(
      req.params.id,
      req.body,
      req.user?.userId
    );
    sendSuccess(res, result, "Product added to discount", 201);
  } catch (error: any) {
    if (error.message?.includes("already associated")) {
      sendError(res, error.message, 409);
      return;
    }
    sendError(res, error.message || "Failed to add product to discount", 400);
  }
}

export async function removeProduct(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const result = await discountsService.removeProductFromDiscount(
      req.params.id,
      req.params.productId,
      req.user?.userId
    );
    sendSuccess(res, result, "Product removed from discount");
  } catch (error: any) {
    sendError(res, error.message || "Failed to remove product from discount", 400);
  }
}

export async function validate(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const result = await discountsService.validateAndCalculateDiscount(req.body);
    sendSuccess(res, result, "Discount evaluated");
  } catch (error: any) {
    sendError(res, error.message || "Failed to validate discount", 400);
  }
}

