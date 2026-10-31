import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid("Valid invoice ID required"),
  amount: z.coerce.number().min(0.01, "Payment amount must be greater than 0"),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
  paymentDate: z.string().or(z.date()).optional(),
  reference: z.string().optional(),
  note: z.string().optional()
});

