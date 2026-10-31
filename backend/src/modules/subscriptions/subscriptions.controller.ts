import { Response, NextFunction } from "express";
import * as subscriptionsService from "./subscriptions.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export async function list(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { subscriptions, meta } =
      await subscriptionsService.listSubscriptions(req.query as any, req.user);
    sendSuccess(res, subscriptions, "Subscriptions retrieved", 200, meta);
  } catch (error: any) {
    sendError(res, error.message || "Failed to list subscriptions", 500);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const subscription = await subscriptionsService.getSubscriptionById(
      req.params.id,
      req.user
    );
    sendSuccess(res, subscription);
  } catch (error: any) {
    sendError(res, error.message || "Subscription not found", 404);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const subscription = await subscriptionsService.createSubscription(
      req.body,
      req.user?.userId
    );
    sendSuccess(res, subscription, "Subscription created successfully", 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to create subscription", 400);
  }
}

export async function pause(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const subscription = await subscriptionsService.pauseSubscription(
      req.params.id,
      req.body?.note,
      req.user?.userId
    );
    sendSuccess(res, subscription, "Subscription paused");
  } catch (error: any) {
    sendError(res, error.message || "Failed to pause subscription", 400);
  }
}

export async function resume(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const subscription = await subscriptionsService.resumeSubscription(
      req.params.id,
      req.body?.note,
      req.user?.userId
    );
    sendSuccess(res, subscription, "Subscription resumed");
  } catch (error: any) {
    sendError(res, error.message || "Failed to resume subscription", 400);
  }
}

export async function cancel(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const subscription = await subscriptionsService.cancelSubscription(
      req.params.id,
      req.body?.note,
      req.user?.userId,
      req.user?.role
    );
    sendSuccess(res, subscription, "Subscription cancelled");
  } catch (error: any) {
    sendError(res, error.message || "Failed to cancel subscription", 400);
  }
}

export async function renew(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const subscription = await subscriptionsService.renewSubscription(
      req.params.id,
      req.body?.note,
      req.user?.userId
    );
    sendSuccess(res, subscription, "Subscription renewed");
  } catch (error: any) {
    sendError(res, error.message || "Failed to renew subscription", 400);
  }
}

export async function changePlan(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const subscription = await subscriptionsService.changeSubscriptionPlan(
      req.params.id,
      req.body.planId,
      req.body?.note,
      req.user?.userId
    );
    sendSuccess(res, subscription, "Subscription plan updated successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to change subscription plan", 400);
  }
}

export async function runBilling(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const results = await subscriptionsService.runBillingCycle(req.user?.userId);
    sendSuccess(res, results, "Automated billing cycle completed");
  } catch (error: any) {
    sendError(res, error.message || "Billing cycle failed", 500);
  }
}

