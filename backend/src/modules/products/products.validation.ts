import { z } from "zod";

export const variantInputSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  value: z.string().min(1, "Variant value is required"),
  sku: z.string().optional(),
  priceExtra: z.coerce.number().min(0, "Price extra must be non-negative").default(0),
  isActive: z.boolean().default(true)
});

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  category: z.string().default("SOFTWARE"),
  type: z.string().default("SERVICE"),
  description: z.string().optional(),
  sku: z.string().optional(),
  salesPrice: z.coerce.number().min(0, "Sales price must be greater than or equal to 0"),
  costPrice: z.coerce.number().min(0, "Cost price must be greater than or equal to 0").default(0),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  variants: z.array(variantInputSchema).optional()
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  salesPrice: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional()
});

export const updateStatusSchema = z.object({
  isActive: z.boolean()
});

export const createVariantSchema = variantInputSchema;

export const updateVariantSchema = z.object({
  name: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  sku: z.string().optional(),
  priceExtra: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional()
});

