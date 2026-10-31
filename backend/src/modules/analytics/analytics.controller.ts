import { Response, NextFunction } from "express";
import * as analyticsService from "./analytics.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

export async function getOverview(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const data = await analyticsService.getAdminOverview();
    sendSuccess(res, data, "Overview analytics retrieved");
  } catch (error: any) {
    sendError(res, error.message || "Failed to get overview", 500);
  }
}

export async function getRevenueTrends(
  _req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const data = await analyticsService.getRevenueTrends();
    sendSuccess(res, data, "Revenue trends retrieved");
  } catch (error: any) {
    sendError(res, error.message || "Failed to get trends", 500);
  }
}

export async function getSubscriptionGrowth(
  _req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const data = await analyticsService.getSubscriptionGrowth();
    sendSuccess(res, data, "Subscription growth retrieved");
  } catch (error: any) {
    sendError(res, error.message || "Failed to get growth data", 500);
  }
}

export async function getStaffDashboard(
  _req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const data = await analyticsService.getStaffDashboard();
    sendSuccess(res, data, "Staff dashboard retrieved");
  } catch (error: any) {
    sendError(res, error.message || "Failed to get staff dashboard", 500);
  }
}

export async function getCustomerDashboard(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.customerId) {
      sendError(res, "No customer profile associated with this account", 400);
      return;
    }
    const data = await analyticsService.getCustomerDashboard(req.user.customerId);
    sendSuccess(res, data, "Customer dashboard retrieved");
  } catch (error: any) {
    sendError(res, error.message || "Failed to get customer dashboard", 500);
  }
}

export async function exportCsv(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const entity = (req.query.entity as any) || "invoices";
    const csvData = await analyticsService.exportCsv(entity);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${entity}-export-${Date.now()}.csv"`
    );
    res.send(csvData);
  } catch (error: any) {
    sendError(res, error.message || "Failed to export CSV", 500);
  }
}

