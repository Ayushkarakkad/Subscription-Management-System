import { z } from "zod";
import { DiscountType, DiscountScope } from "@prisma/client";

const discountProductAssociationSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  variantId: z.string().uuid("Invalid variant ID format").optional().nullable()
});

export const createDiscountSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Discount name cannot be empty")
      .max(255, "Discount name cannot exceed 255 characters"),
    description: z.string().trim().max(1000).optional().nullable(),
    type: z.nativeEnum(DiscountType),
    scope: z.nativeEnum(DiscountScope).optional().default(DiscountScope.BOTH),
    value: z
      .union([z.number(), z.string()])
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0,
        "Discount value must be a valid non-negative number"
      ),
    minimumPurchase: z
      .union([z.number(), z.string()])
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0,
        "Minimum purchase must be a valid non-negative number"
      )
      .optional()
      .nullable(),
    minimumQuantity: z
      .coerce
      .number()
      .int()
      .min(1, "Minimum quantity must be at least 1")
      .optional()
      .nullable(),
    startsAt: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid startsAt date format")
      .optional()
      .nullable(),
    endsAt: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid endsAt date format")
      .optional()
      .nullable(),
    maxUses: z
      .coerce
      .number()
      .int()
      .min(1, "maxUses must be at least 1")
      .optional()
      .nullable(),
    isActive: z.boolean().optional().default(true),
    products: z.array(discountProductAssociationSchema).optional()
  })
  .refine(
    (data) => {
      if (data.type === DiscountType.PERCENTAGE && Number(data.value) > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount value cannot exceed 100%",
      path: ["value"]
    }
  )
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) >= new Date(data.startsAt);
      }
      return true;
    },
    {
      message: "endsAt must be greater than or equal to startsAt",
      path: ["endsAt"]
    }
  );

export const updateDiscountSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Discount name cannot be empty")
      .max(255, "Discount name cannot exceed 255 characters")
      .optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    type: z.nativeEnum(DiscountType).optional(),
    scope: z.nativeEnum(DiscountScope).optional(),
    value: z
      .union([z.number(), z.string()])
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0,
        "Discount value must be a valid non-negative number"
      )
      .optional(),
    minimumPurchase: z
      .union([z.number(), z.string()])
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0,
        "Minimum purchase must be a valid non-negative number"
      )
      .optional()
      .nullable(),
    minimumQuantity: z
      .coerce
      .number()
      .int()
      .min(1, "Minimum quantity must be at least 1")
      .optional()
      .nullable(),
    startsAt: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid startsAt date format")
      .optional()
      .nullable(),
    endsAt: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid endsAt date format")
      .optional()
      .nullable(),
    maxUses: z
      .coerce
      .number()
      .int()
      .min(1, "maxUses must be at least 1")
      .optional()
      .nullable(),
    isActive: z.boolean().optional()
  })
  .refine(
    (data) => {
      if (data.type === DiscountType.PERCENTAGE && data.value !== undefined && Number(data.value) > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount value cannot exceed 100%",
      path: ["value"]
    }
  )
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) >= new Date(data.startsAt);
      }
      return true;
    },
    {
      message: "endsAt must be greater than or equal to startsAt",
      path: ["endsAt"]
    }
  );

export const updateDiscountStatusSchema = z.object({
  isActive: z.boolean()
});

export const associateDiscountProductsSchema = z.union([
  discountProductAssociationSchema,
  z.object({
    products: z.array(discountProductAssociationSchema).min(1, "At least one product is required")
  }),
  z.array(discountProductAssociationSchema).min(1, "At least one product is required")
]);

export const discountQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().trim().optional(),
  type: z.nativeEnum(DiscountType).optional(),
  scope: z.nativeEnum(DiscountScope).optional(),
  isActive: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((val) => {
      if (typeof val === "boolean") return val;
      return val === "true";
    })
    .optional()
});

export const validateDiscountSchema = z.object({
  discountId: z.string().uuid("Invalid discount ID"),
  amount: z
    .union([z.number(), z.string()])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Amount must be a valid non-negative number"
    ),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  scope: z.nativeEnum(DiscountScope).optional(),
  productId: z.string().uuid("Invalid product ID").optional(),
  variantId: z.string().uuid("Invalid variant ID").optional(),
  customerId: z.string().uuid("Invalid customer ID").optional()
});

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
export type DiscountProductAssociationInput = z.infer<typeof discountProductAssociationSchema>;
export type DiscountQueryParams = z.infer<typeof discountQuerySchema>;
export type ValidateDiscountInput = z.infer<typeof validateDiscountSchema>;
