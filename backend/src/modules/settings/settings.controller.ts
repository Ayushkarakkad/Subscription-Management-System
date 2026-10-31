import { Response, NextFunction } from "express";
import * as settingsService from "./settings.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export async function getProfile(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const profile = await settingsService.getProfile(req.user!.userId);
    sendSuccess(res, profile);
  } catch (error: any) {
    sendError(res, error.message || "Failed to get profile", 400);
  }
}

export async function updateProfile(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const profile = await settingsService.updateProfile(
      req.user!.userId,
      req.body
    );
    sendSuccess(res, profile, "Profile updated successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update profile", 400);
  }
}

export async function changePassword(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await settingsService.changePassword(
      req.user!.userId,
      currentPassword,
      newPassword
    );
    sendSuccess(res, result, "Password changed successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to change password", 400);
  }
}

export async function getSystemSettings(
  _req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const settings = await settingsService.getSystemSettings();
    sendSuccess(res, settings);
  } catch (error: any) {
    sendError(res, error.message || "Failed to get settings", 500);
  }
}

export async function updateSystemSettings(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const settings = await settingsService.updateSystemSettings(
      req.body,
      req.user?.userId
    );
    sendSuccess(res, settings, "System settings updated successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update settings", 400);
  }
}

