import { Response, NextFunction } from "express";
import * as customersService from "./customers.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

export async function list(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { customers, meta } = await customersService.listCustomers(
      req.query as any
    );
    sendSuccess(res, customers, "Customers retrieved", 200, meta);
  } catch (error: any) {
    sendError(res, error.message || "Failed to list customers", 500);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    // If customer role, only allow accessing their own customer ID
    if (
      req.user?.role === UserRole.CUSTOMER &&
      req.user.customerId !== req.params.id
    ) {
      sendError(res, "Forbidden: You can only view your own account", 403);
      return;
    }

    const customer = await customersService.getCustomerById(req.params.id);
    sendSuccess(res, customer);
  } catch (error: any) {
    sendError(res, error.message || "Customer not found", 404);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const customer = await customersService.createCustomer(
      req.body,
      req.user?.userId
    );
    sendSuccess(res, customer, "Customer created successfully", 201);
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      sendError(res, error.message, 409);
      return;
    }
    sendError(res, error.message || "Failed to create customer", 400);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    if (
      req.user?.role === UserRole.CUSTOMER &&
      req.user.customerId !== req.params.id
    ) {
      sendError(res, "Forbidden: You can only edit your own profile", 403);
      return;
    }

    const customer = await customersService.updateCustomer(
      req.params.id,
      req.body,
      req.user?.userId
    );
    sendSuccess(res, customer, "Customer updated successfully");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update customer", 400);
  }
}

