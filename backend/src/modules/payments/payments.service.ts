import { prisma } from "../../config/database";
import { logAudit } from "../../utils/audit.utils";
import { PaymentMethod, PaymentStatus, InvoiceStatus, UserRole } from "@prisma/client";

export async function listPayments(
  query: {
    page?: number;
    limit?: number;
    customerId?: string;
    invoiceId?: string;
    method?: PaymentMethod;
    search?: string;
  },
  user?: { role: UserRole; customerId?: string | null }
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (user?.role === UserRole.CUSTOMER) {
    where.customerId = user.customerId || "none";
  } else if (query.customerId) {
    where.customerId = query.customerId;
  }

  if (query.invoiceId) {
    where.invoiceId = query.invoiceId;
  }

  if (query.method) {
    where.method = query.method;
  }

  if (query.search) {
    where.OR = [
      { reference: { contains: query.search, mode: "insensitive" } },
      { note: { contains: query.search, mode: "insensitive" } },
      { customer: { name: { contains: query.search, mode: "insensitive" } } },
      { customer: { companyName: { contains: query.search, mode: "insensitive" } } },
      { invoice: { number: { contains: query.search, mode: "insensitive" } } }
    ];
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paymentDate: "desc" },
      include: {
        customer: { select: { id: true, name: true, companyName: true, email: true } },
        invoice: { select: { id: true, number: true, total: true, status: true } },
        recordedBy: { select: { id: true, name: true } }
      }
    })
  ]);

  return {
    payments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getPaymentById(
  id: string,
  user?: { role: UserRole; customerId?: string | null }
) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      customer: true,
      invoice: {
        include: {
          items: { include: { product: true } }
        }
      },
      recordedBy: { select: { id: true, name: true, email: true } },
      allocations: true
    }
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  if (
    user?.role === UserRole.CUSTOMER &&
    payment.customerId !== user.customerId
  ) {
    throw new Error("Forbidden: You can only view your own payments");
  }

  return payment;
}

export async function recordPayment(data: any, actorId?: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId }
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status === InvoiceStatus.PAID) {
    throw new Error("This invoice is already fully paid");
  }

  if (invoice.status === InvoiceStatus.VOID || invoice.status === InvoiceStatus.CANCELLED) {
    throw new Error(`Cannot record payment on a ${invoice.status} invoice`);
  }

  const paymentAmount = Number(data.amount);
  const currentPaid = Number(invoice.amountPaid);
  const total = Number(invoice.total);
  const outstanding = Math.max(0, total - currentPaid);

  if (paymentAmount > outstanding + 0.01) {
    throw new Error(
      `Payment amount (${paymentAmount.toFixed(2)}) cannot exceed outstanding balance (${outstanding.toFixed(2)})`
    );
  }

  const newAmountPaid = currentPaid + paymentAmount;
  const newStatus =
    newAmountPaid >= total - 0.01 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create payment record
    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        recordedById: actorId || null,
        method: data.method || PaymentMethod.BANK_TRANSFER,
        amount: paymentAmount,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        reference: data.reference || null,
        note: data.note || null,
        status: PaymentStatus.COMPLETED,
        allocations: {
          create: {
            invoiceId: invoice.id,
            amount: paymentAmount
          }
        }
      },
      include: {
        customer: true,
        invoice: true
      }
    });

    // 2. Update invoice amountPaid and status
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus
      }
    });

    return payment;
  });

  await logAudit({
    userId: actorId,
    action: "PAYMENT_RECORDED",
    entity: "Payment",
    entityId: result.id,
    details: {
      invoiceNumber: invoice.number,
      amount: result.amount,
      method: result.method,
      resultingStatus: newStatus
    }
  });

  return result;
}

