import { z } from "zod";

export const createTaxSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tax name cannot be empty")
    .max(100, "Tax name cannot exceed 100 characters"),
  rate: z
    .union([z.number(), z.string()])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
      "Tax rate must be a valid percentage between 0 and 100"
    ),
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional().default(true)
});

export const updateTaxSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tax name cannot be empty")
    .max(100, "Tax name cannot exceed 100 characters")
    .optional(),
  rate: z
    .union([z.number(), z.string()])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
      "Tax rate must be a valid percentage between 0 and 100"
    )
    .optional(),
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional()
});

export const updateTaxStatusSchema = z.object({
  isActive: z.boolean()
});

export const taxQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().trim().optional(),
  isActive: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((val) => {
      if (typeof val === "boolean") return val;
      return val === "true";
    })
    .optional()
});

export type CreateTaxInput = z.infer<typeof createTaxSchema>;
export type UpdateTaxInput = z.infer<typeof updateTaxSchema>;
export type TaxQueryParams = z.infer<typeof taxQuerySchema>;
