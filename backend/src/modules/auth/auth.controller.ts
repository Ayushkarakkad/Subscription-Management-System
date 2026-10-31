import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await authService.register(req.body, req.ip);
    sendSuccess(res, data, "Registration successful", 201);
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      sendError(res, error.message, 409);
      return;
    }
    sendError(res, error.message || "Registration failed", 400);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await authService.login(req.body, req.ip);
    sendSuccess(res, data, "Login successful");
  } catch (error: any) {
    sendError(res, error.message || "Login failed", 401);
  }
}

export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Not authenticated", 401);
      return;
    }
    const user = await authService.getMe(req.user.userId);
    sendSuccess(res, user);
  } catch (error: any) {
    sendError(res, error.message || "Failed to fetch profile", 404);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.forgotPassword(req.body.email);
    sendSuccess(res, result, result.message);
  } catch (error: any) {
    sendError(res, error.message || "Failed to process request", 400);
  }
}

export async function logout(
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  sendSuccess(res, null, "Logged out successfully");
}

