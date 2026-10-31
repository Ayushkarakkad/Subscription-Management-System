import { Response, NextFunction } from "express";
import * as taxesService from "./taxes.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export async function list(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { taxes, meta } = await taxesService.listTaxes(req.query as any);
    sendSuccess(res, taxes, "Taxes retrieved", 200, meta);
  } catch (error: any) {
    sendError(res, error.message || "Failed to list taxes", 500);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const tax = await taxesService.getTaxById(req.params.id);
    sendSuccess(res, tax);
  } catch (error: any) {
    sendError(res, error.message || "Tax not found", 404);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const tax = await taxesService.createTax(req.body, req.user?.userId);
    sendSuccess(res, tax, "Tax created successfully", 201);
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      sendError(res, error.message, 409);
      return;
    }
    sendError(res, error.message || "Failed to create tax", 400);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const tax = await taxesService.updateTax(
      req.params.id,
      req.body,
      req.user?.userId
    );
    sendSuccess(res, tax, "Tax updated successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update tax", 400);
  }
}

export async function setStatus(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const tax = await taxesService.setTaxStatus(
      req.params.id,
      req.body.isActive,
      req.user?.userId
    );
    sendSuccess(res, tax, "Tax status updated");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update tax status", 400);
  }
}

