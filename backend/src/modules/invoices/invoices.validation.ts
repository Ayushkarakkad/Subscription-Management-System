import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";

export const invoiceItemInputSchema = z.object({
  productId: z.string().uuid("Valid product ID required"),
  variantId: z.string().uuid().optional().nullable(),
  taxId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0)
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid("Valid customer ID required"),
  subscriptionId: z.string().uuid().optional().nullable(),
  dueDate: z.string().or(z.date()),
  currency: z.string().default("USD"),
  discountTotal: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemInputSchema).min(1, "At least one item required")
});

export const updateInvoiceStatusSchema = z.object({
  status: z.nativeEnum(InvoiceStatus)
});

