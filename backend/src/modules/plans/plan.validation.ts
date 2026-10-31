import { z } from "zod";
import { BillingInterval } from "@prisma/client";

const planProductItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  variantId: z.string().uuid("Invalid variant ID format").optional().nullable(),
  quantity: z
    .coerce
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .optional()
    .default(1),
  unitPrice: z
    .union([z.number(), z.string()])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Unit price must be a valid non-negative number"
    )
    .optional()
});

export const createPlanSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Plan name cannot be empty")
      .max(255, "Plan name cannot exceed 255 characters"),
    description: z.string().trim().max(1000).optional().nullable(),
    price: z
      .union([z.number(), z.string()])
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0,
        "Plan price must be a valid non-negative number"
      ),
    billingInterval: z.nativeEnum(BillingInterval),
    minimumQuantity: z
      .coerce
      .number()
      .int()
      .min(1, "Minimum quantity must be at least 1")
      .optional()
      .default(1),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid start date format"),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid end date format")
      .optional()
      .nullable(),
    autoClose: z.boolean().optional().default(false),
    allowEarlyClose: z.boolean().optional().default(true),
    allowPause: z.boolean().optional().default(true),
    allowRenewal: z.boolean().optional().default(true),
    isActive: z.boolean().optional().default(true),
    products: z.array(planProductItemSchema).optional()
  })
  .refine(
    (data) => {
      if (data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be greater than or equal to start date",
      path: ["endDate"]
    }
  );

export const updatePlanSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Plan name cannot be empty")
      .max(255, "Plan name cannot exceed 255 characters")
      .optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    price: z
      .union([z.number(), z.string()])
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0,
        "Plan price must be a valid non-negative number"
      )
      .optional(),
    billingInterval: z.nativeEnum(BillingInterval).optional(),
    minimumQuantity: z
      .coerce
      .number()
      .int()
      .min(1, "Minimum quantity must be at least 1")
      .optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid start date format")
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid end date format")
      .optional()
      .nullable(),
    autoClose: z.boolean().optional(),
    allowEarlyClose: z.boolean().optional(),
    allowPause: z.boolean().optional(),
    allowRenewal: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be greater than or equal to start date",
      path: ["endDate"]
    }
  );

export const updatePlanStatusSchema = z.object({
  isActive: z.boolean()
});

export const addPlanProductsSchema = z.union([
  planProductItemSchema,
  z.object({
    products: z.array(planProductItemSchema).min(1, "At least one product is required")
  }),
  z.array(planProductItemSchema).min(1, "At least one product is required")
]);

export const updatePlanProductSchema = z.object({
  quantity: z
    .coerce
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .optional(),
  unitPrice: z
    .union([z.number(), z.string()])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Unit price must be a valid non-negative number"
    )
    .optional()
});

export const planQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().trim().optional(),
  billingInterval: z.nativeEnum(BillingInterval).optional(),
  isActive: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((val) => {
      if (typeof val === "boolean") return val;
      return val === "true";
    })
    .optional()
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type PlanProductItemInput = z.infer<typeof planProductItemSchema>;
export type UpdatePlanProductInput = z.infer<typeof updatePlanProductSchema>;
export type PlanQueryParams = z.infer<typeof planQuerySchema>;
