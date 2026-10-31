import { z } from "zod";
import { BillingInterval } from "@prisma/client";

export const planProductInputSchema = z.object({
  productId: z.string().uuid("Valid product ID required"),
  variantId: z.string().uuid().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0).optional()
});

export const createPlanSchema = z
  .object({
    name: z.string().min(2, "Plan name must be at least 2 characters"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Plan price must be non-negative"),
    billingInterval: z.nativeEnum(BillingInterval).default(BillingInterval.MONTHLY),
    trialPeriodDays: z.coerce.number().int().min(0).default(0),
    minimumQuantity: z.coerce.number().int().min(1).default(1),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional().nullable(),
    autoClose: z.boolean().default(false),
    allowEarlyClose: z.boolean().default(true),
    allowPause: z.boolean().default(true),
    allowRenewal: z.boolean().default(true),
    isActive: z.boolean().default(true),
    products: z.array(planProductInputSchema).optional()
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"]
    }
  );

export const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  billingInterval: z.nativeEnum(BillingInterval).optional(),
  trialPeriodDays: z.coerce.number().int().min(0).optional(),
  minimumQuantity: z.coerce.number().int().min(1).optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional().nullable(),
  autoClose: z.boolean().optional(),
  allowEarlyClose: z.boolean().optional(),
  allowPause: z.boolean().optional(),
  allowRenewal: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const updateStatusSchema = z.object({
  isActive: z.boolean()
});

export const updatePlanProductSchema = z.object({
  quantity: z.coerce.number().int().min(1).optional(),
  unitPrice: z.coerce.number().min(0).optional()
});

