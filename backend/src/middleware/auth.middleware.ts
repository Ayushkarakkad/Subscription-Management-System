import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  customerId?: string | null;
}

export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication token required"
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token format"
      });
      return;
    }

    const secret =
      process.env.JWT_SECRET ||
      "brightloop-super-secure-production-jwt-secret-key-32chars-min";

    const decoded = jwt.verify(token, secret) as JwtUserPayload;

    if (!decoded || !decoded.userId || !decoded.role) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token payload"
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Authentication token has expired. Please log in again."
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: "Invalid or unauthorized token"
    });
  }
}

