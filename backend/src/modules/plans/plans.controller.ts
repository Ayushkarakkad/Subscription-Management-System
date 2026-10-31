import { Response, NextFunction } from "express";
import * as plansService from "./plans.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export async function list(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { plans, meta } = await plansService.listPlans(
      req.query as any,
      req.user?.role
    );
    sendSuccess(res, plans, "Plans retrieved", 200, meta);
  } catch (error: any) {
    sendError(res, error.message || "Failed to list plans", 500);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const plan = await plansService.getPlanById(req.params.id, req.user?.role);
    sendSuccess(res, plan);
  } catch (error: any) {
    sendError(res, error.message || "Plan not found", 404);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const plan = await plansService.createPlan(req.body, req.user?.userId);
    sendSuccess(res, plan, "Plan created successfully", 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to create plan", 400);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const plan = await plansService.updatePlan(
      req.params.id,
      req.body,
      req.user?.userId
    );
    sendSuccess(res, plan, "Plan updated successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update plan", 400);
  }
}

export async function setStatus(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const plan = await plansService.setPlanStatus(
      req.params.id,
      req.body.isActive,
      req.user?.userId
    );
    sendSuccess(res, plan, "Plan status updated");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update plan status", 400);
  }
}

// Plan products
export async function getProducts(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const products = await plansService.getPlanProducts(req.params.id);
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message || "Failed to get plan products", 400);
  }
}

export async function addProduct(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const result = await plansService.addProductToPlan(
      req.params.id,
      req.body,
      req.user?.userId
    );
    sendSuccess(res, result, "Product added to plan", 201);
  } catch (error: any) {
    if (error.message?.includes("already associated")) {
      sendError(res, error.message, 409);
      return;
    }
    sendError(res, error.message || "Failed to add product to plan", 400);
  }
}

export async function updateProduct(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const result = await plansService.updatePlanProduct(
      req.params.id,
      req.params.productId,
      req.body,
      req.user?.userId
    );
    sendSuccess(res, result, "Plan product updated");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update plan product", 400);
  }
}

export async function removeProduct(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const result = await plansService.removeProductFromPlan(
      req.params.id,
      req.params.productId,
      req.user?.userId
    );
    sendSuccess(res, result, "Product removed from plan");
  } catch (error: any) {
    sendError(res, error.message || "Failed to remove product from plan", 400);
  }
}

