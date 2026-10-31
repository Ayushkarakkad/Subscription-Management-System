import { z } from "zod";
import { SubscriptionStatus, BillingInterval } from "@prisma/client";

export const subscriptionItemInputSchema = z.object({
  productId: z.string().uuid("Valid product ID required"),
  variantId: z.string().uuid().optional().nullable(),
  taxId: z.string().uuid().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0)
});

export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid("Valid customer ID required"),
  planId: z.string().uuid("Valid plan ID required"),
  startDate: z.string().or(z.date()).optional(),
  billingInterval: z.nativeEnum(BillingInterval).optional(),
  paymentTerms: z.string().optional(),
  items: z.array(subscriptionItemInputSchema).optional()
});

export const changePlanSchema = z.object({
  planId: z.string().uuid("Valid new plan ID required"),
  note: z.string().optional()
});

export const updateSubscriptionStatusSchema = z.object({
  status: z.nativeEnum(SubscriptionStatus),
  note: z.string().optional()
});

