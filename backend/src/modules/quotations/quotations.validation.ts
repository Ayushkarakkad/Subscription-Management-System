import { z } from "zod";
import { QuotationStatus } from "@prisma/client";

export const quotationItemInputSchema = z.object({
  productId: z.string().uuid("Valid product ID required"),
  variantId: z.string().uuid().optional().nullable(),
  taxId: z.string().uuid().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0)
});

export const createQuotationSchema = z.object({
  customerId: z.string().uuid("Valid customer ID required"),
  planId: z.string().uuid().optional().nullable(),
  validUntil: z.string().or(z.date()).optional().nullable(),
  discountTotal: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(quotationItemInputSchema).min(1, "At least one item is required")
});

export const updateQuotationStatusSchema = z.object({
  status: z.nativeEnum(QuotationStatus)
});

