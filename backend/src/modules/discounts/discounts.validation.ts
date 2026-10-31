import { z } from "zod";
import { DiscountType, DiscountScope } from "@prisma/client";

export const createDiscountSchema = z
  .object({
    name: z.string().min(2, "Discount name is required"),
    description: z.string().optional(),
    type: z.nativeEnum(DiscountType),
    scope: z.nativeEnum(DiscountScope).default(DiscountScope.BOTH),
    value: z.coerce.number().min(0.01, "Discount value must be greater than 0"),
    minimumPurchase: z.coerce.number().min(0).optional().nullable(),
    minimumQuantity: z.coerce.number().int().min(1).optional().nullable(),
    startsAt: z.string().or(z.date()).optional().nullable(),
    endsAt: z.string().or(z.date()).optional().nullable(),
    maxUses: z.coerce.number().int().min(1).optional().nullable(),
    isActive: z.boolean().default(true),
    productIds: z.array(z.string().uuid()).optional()
  })
  .refine(
    (data) => {
      if (data.type === DiscountType.PERCENTAGE && data.value > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["value"]
    }
  );

export const updateDiscountSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  type: z.nativeEnum(DiscountType).optional(),
  scope: z.nativeEnum(DiscountScope).optional(),
  value: z.coerce.number().min(0.01).optional(),
  minimumPurchase: z.coerce.number().min(0).optional().nullable(),
  minimumQuantity: z.coerce.number().int().min(1).optional().nullable(),
  startsAt: z.string().or(z.date()).optional().nullable(),
  endsAt: z.string().or(z.date()).optional().nullable(),
  maxUses: z.coerce.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional()
});

export const updateStatusSchema = z.object({
  isActive: z.boolean()
});

export const validateDiscountSchema = z.object({
  discountId: z.string().uuid().optional(),
  code: z.string().optional(),
  amount: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(1).default(1),
  productId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional()
});

export const addDiscountProductSchema = z.object({
  productId: z.string().uuid("Valid product ID required"),
  variantId: z.string().uuid().optional()
});

