import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name cannot be empty")
    .max(255, "Product name cannot exceed 255 characters"),
  type: z
    .string()
    .trim()
    .min(1, "Product type cannot be empty")
    .max(100, "Product type cannot exceed 100 characters"),
  description: z.string().trim().max(1000).optional().nullable(),
  salesPrice: z
    .union([z.number(), z.string()])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Sales price must be a valid non-negative number"
    ),
  costPrice: z
    .union([z.number(), z.string()])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Cost price must be a valid non-negative number"
    ),
  notes: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  variants: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Variant name is required"),
        value: z.string().trim().min(1, "Variant value is required"),
        priceExtra: z
          .union([z.number(), z.string()])
          .refine(
            (val) => !isNaN(Number(val)) && Number(val) >= 0,
            "Price extra must be a valid non-negative number"
          )
          .optional()
          .default(0),
        isActive: z.boolean().optional().default(true)
      })
    )
    .optional()
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name cannot be empty")
    .max(255, "Product name cannot exceed 255 characters")
    .optional(),
  type: z
    .string()
    .trim()
    .min(1, "Product type cannot be empty")
    .max(100, "Product type cannot exceed 100 characters")
    .optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  salesPrice: z
    .union([z.number(), z.string()])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Sales price must be a valid non-negative number"
    )
    .optional(),
  costPrice: z
    .union([z.number(), z.string()])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Cost price must be a valid non-negative number"
    )
    .optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().optional()
});

export const updateStatusSchema = z.object({
  isActive: z.boolean()
});

export const createVariantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Variant name cannot be empty")
    .max(100, "Variant name cannot exceed 100 characters"),
  value: z
    .string()
    .trim()
    .min(1, "Variant value cannot be empty")
    .max(100, "Variant value cannot exceed 100 characters"),
  priceExtra: z
    .union([z.number(), z.string()])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Price extra must be a valid non-negative number"
    )
    .optional()
    .default(0),
  isActive: z.boolean().optional().default(true)
});

export const updateVariantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Variant name cannot be empty")
    .max(100, "Variant name cannot exceed 100 characters")
    .optional(),
  value: z
    .string()
    .trim()
    .min(1, "Variant value cannot be empty")
    .max(100, "Variant value cannot exceed 100 characters")
    .optional(),
  priceExtra: z
    .union([z.number(), z.string()])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Price extra must be a valid non-negative number"
    )
    .optional(),
  isActive: z.boolean().optional()
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().trim().optional(),
  type: z.string().trim().optional(),
  isActive: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((val) => {
      if (typeof val === "boolean") return val;
      return val === "true";
    })
    .optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
