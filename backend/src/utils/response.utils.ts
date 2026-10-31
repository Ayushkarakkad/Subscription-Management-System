import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200,
  meta?: ApiResponse["meta"]
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    meta
  });
}

export function sendError(
  res: Response,
  message = "An error occurred",
  statusCode = 500,
  errors?: any
): void {
  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
}

