import { Response, NextFunction } from "express";
import * as paymentsService from "./payments.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export async function list(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { payments, meta } = await paymentsService.listPayments(
      req.query as any,
      req.user
    );
    sendSuccess(res, payments, "Payments retrieved", 200, meta);
  } catch (error: any) {
    sendError(res, error.message || "Failed to list payments", 500);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const payment = await paymentsService.getPaymentById(
      req.params.id,
      req.user
    );
    sendSuccess(res, payment);
  } catch (error: any) {
    sendError(res, error.message || "Payment not found", 404);
  }
}

export async function record(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const payment = await paymentsService.recordPayment(
      req.body,
      req.user?.userId
    );
    sendSuccess(res, payment, "Payment recorded successfully", 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to record payment", 400);
  }
}

