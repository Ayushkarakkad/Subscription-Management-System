import { prisma } from "../../config/database";
import { AuthRequest } from "../../middleware/auth.middleware";
import { Request, Response } from "express";
import {
  registerSchema,
  loginSchema
} from "./auth.validation";
import {
  registerUser,
  loginUser
} from "./auth.service";

export async function register(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid registration details",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const result = await registerUser(validation.data);

    res.status(201).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed";

    if (message.includes("already exists")) {
      res.status(409).json({
        success: false,
        message
      });
      return;
    }

    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
}

export async function login(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid login details",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const result = await loginUser(validation.data);

    res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Login failed";

    if (message === "Invalid email or password") {
      res.status(401).json({
        success: false,
        message
      });
      return;
    }

    if (message === "Your account is inactive") {
      res.status(403).json({
        success: false,
        message
      });
      return;
    }

    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
}
export async function getProfile(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user || !user.isActive) {
      res.status(404).json({
        success: false,
        message: "User not found or inactive"
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error("Profile error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve profile"
    });
  }
}