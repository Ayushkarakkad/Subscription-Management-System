import { z } from "zod";
import { UserRole } from "@prisma/client";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(UserRole).default(UserRole.CUSTOMER),
  isActive: z.boolean().default(true)
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional()
});

export const updateStatusSchema = z.object({
  isActive: z.boolean()
});

