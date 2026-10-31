import { z } from "zod";
import { TaxType } from "@prisma/client";

export const createTaxSchema = z.object({
  name: z.string().min(2, "Tax name must be at least 2 characters"),
  rate: z.coerce
    .number()
    .min(0, "Tax rate must be non-negative")
    .max(100, "Tax rate cannot exceed 100%"),
  type: z.nativeEnum(TaxType).default(TaxType.PERCENTAGE),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const updateTaxSchema = z.object({
  name: z.string().min(2).optional(),
  rate: z.coerce.number().min(0).max(100).optional(),
  type: z.nativeEnum(TaxType).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

export const updateStatusSchema = z.object({
  isActive: z.boolean()
});

