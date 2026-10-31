import { Response, NextFunction } from "express";
import * as usersService from "./users.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export async function list(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { users, meta } = await usersService.listUsers(req.query as any);
    sendSuccess(res, users, "Users retrieved successfully", 200, meta);
  } catch (error: any) {
    sendError(res, error.message || "Failed to list users", 500);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.getUserById(req.params.id);
    sendSuccess(res, user);
  } catch (error: any) {
    sendError(res, error.message || "User not found", 404);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.createUser(req.body, req.user?.userId);
    sendSuccess(res, user, "User created successfully", 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to create user", 400);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.updateUser(
      req.params.id,
      req.body,
      req.user?.userId
    );
    sendSuccess(res, user, "User updated successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update user", 400);
  }
}

export async function remove(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const result = await usersService.deleteUser(
      req.params.id,
      req.user?.userId
    );
    sendSuccess(res, result, "User deactivated successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to delete user", 400);
  }
}

