import { prisma } from "../../config/database";
import { logAudit } from "../../utils/audit.utils";
import { calculateNextBillingDate } from "../../utils/date.utils";
import { generateInvoicePdf } from "../../utils/pdf.utils";
import {
  QuotationStatus,
  SubscriptionStatus,
  UserRole,
  BillingInterval
} from "@prisma/client";

export async function generateQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quotation.count();
  const seq = (count + 1).toString().padStart(4, "0");
  return `QT-${year}-${seq}`;
}

export async function listQuotations(
  query: {
    page?: number;
    limit?: number;
    customerId?: string;
    status?: QuotationStatus;
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

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { number: { contains: query.search, mode: "insensitive" } },
      { customer: { name: { contains: query.search, mode: "insensitive" } } },
      { customer: { companyName: { contains: query.search, mode: "insensitive" } } }
    ];
  }

  const [total, quotations] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, companyName: true, email: true } },
        plan: { select: { id: true, name: true, billingInterval: true } },
        createdBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
            variant: { select: { id: true, name: true, value: true } },
            tax: { select: { id: true, name: true, rate: true } }
          }
        }
      }
    })
  ]);

  return {
    quotations,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getQuotationById(
  id: string,
  user?: { role: UserRole; customerId?: string | null }
) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      plan: true,
      createdBy: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: true,
          variant: true,
          tax: true
        }
      },
      subscription: {
        select: { id: true, number: true, status: true }
      }
    }
  });

  if (!quotation) {
    throw new Error("Quotation not found");
  }

  if (
    user?.role === UserRole.CUSTOMER &&
    quotation.customerId !== user.customerId
  ) {
    throw new Error("Forbidden: You can only view your own quotations");
  }

  return quotation;
}

export async function createQuotation(data: any, actorId?: string) {
  const number = await generateQuotationNumber();

  // Validate customer
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId }
  });
  if (!customer) {
    throw new Error("Customer not found");
  }

  // Calculate items line total and taxes
  let subtotal = 0;
  let taxTotal = 0;

  const processedItems = [];

  for (const item of data.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    });
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }

    let taxRate = 0;
    if (item.taxId) {
      const tax = await prisma.tax.findUnique({ where: { id: item.taxId } });
      if (tax && tax.isActive) {
        taxRate = Number(tax.rate);
      }
    }

    const unitPrice = Number(item.unitPrice);
    const quantity = Number(item.quantity);
    const itemSubtotal = unitPrice * quantity;
    const itemTax = (itemSubtotal * taxRate) / 100;
    const lineTotal = itemSubtotal + itemTax;

    subtotal += itemSubtotal;
    taxTotal += itemTax;

    processedItems.push({
      productId: item.productId,
      variantId: item.variantId || null,
      taxId: item.taxId || null,
      quantity,
      unitPrice,
      taxRate,
      lineTotal
    });
  }

  const discountTotal = Number(data.discountTotal || 0);
  const total = Math.max(0, subtotal + taxTotal - discountTotal);

  const quotation = await prisma.quotation.create({
    data: {
      number,
      customerId: data.customerId,
      planId: data.planId || null,
      createdById: actorId || null,
      status: QuotationStatus.DRAFT,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      subtotal,
      taxTotal,
      discountTotal,
      total,
      notes: data.notes || null,
      items: {
        create: processedItems
      }
    },
    include: {
      items: {
        include: { product: true, variant: true, tax: true }
      },
      customer: true,
      plan: true
    }
  });

  await logAudit({
    userId: actorId,
    action: "QUOTATION_CREATED",
    entity: "Quotation",
    entityId: quotation.id,
    details: { number: quotation.number, total: quotation.total }
  });

  return quotation;
}

export async function updateQuotationStatus(
  id: string,
  status: QuotationStatus,
  actorId?: string
) {
  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Quotation not found");
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data: { status },
    include: { customer: true, items: true }
  });

  await logAudit({
    userId: actorId,
    action: "QUOTATION_STATUS_UPDATED",
    entity: "Quotation",
    entityId: id,
    details: { from: existing.status, to: status }
  });

  return updated;
}

export async function convertQuotationToSubscription(
  id: string,
  actorId?: string
) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: true,
      customer: true,
      plan: true,
      subscription: true
    }
  });

  if (!quotation) {
    throw new Error("Quotation not found");
  }

  if (quotation.subscription) {
    throw new Error("This quotation has already been converted into a subscription");
  }

  if (!quotation.planId) {
    throw new Error(
      "Quotation must have an associated subscription plan to be converted into a subscription"
    );
  }

  const plan = await prisma.plan.findUnique({ where: { id: quotation.planId } });
  if (!plan) {
    throw new Error("Associated plan not found");
  }

  // Generate unique subscription number e.g. SUB-2026-0001
  const year = new Date().getFullYear();
  const subCount = await prisma.subscription.count();
  const subNumber = `SUB-${year}-${(subCount + 1).toString().padStart(4, "0")}`;

  const startDate = new Date();
  const nextBillingDate = calculateNextBillingDate(
    startDate,
    plan.billingInterval
  );

  const trialEndDate =
    plan.trialPeriodDays > 0
      ? new Date(startDate.getTime() + plan.trialPeriodDays * 24 * 60 * 60 * 1000)
      : null;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create subscription
    const subscription = await tx.subscription.create({
      data: {
        number: subNumber,
        customerId: quotation.customerId,
        planId: quotation.planId!,
        quotationId: quotation.id,
        status:
          plan.trialPeriodDays > 0
            ? SubscriptionStatus.TRIAL
            : SubscriptionStatus.ACTIVE,
        startDate,
        nextBillingDate,
        billingAmount: quotation.total,
        billingInterval: plan.billingInterval,
        trialEndDate,
        paymentTerms: "Due upon receipt",
        // Copy line items cleanly from quotation without duplicates
        items: {
          create: quotation.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            taxId: item.taxId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            lineTotal: item.lineTotal
          }))
        },
        history: {
          create: {
            changedById: actorId || null,
            fromStatus: null,
            toStatus:
              plan.trialPeriodDays > 0
                ? SubscriptionStatus.TRIAL
                : SubscriptionStatus.ACTIVE,
            note: `Created from quotation ${quotation.number}`
          }
        }
      },
      include: {
        items: { include: { product: true, variant: true, tax: true } },
        plan: true,
        customer: true
      }
    });

    // 2. Mark quotation as CONVERTED
    await tx.quotation.update({
      where: { id: quotation.id },
      data: { status: QuotationStatus.CONVERTED }
    });

    return subscription;
  });

  await logAudit({
    userId: actorId,
    action: "QUOTATION_CONVERTED_TO_SUBSCRIPTION",
    entity: "Subscription",
    entityId: result.id,
    details: {
      quotationNumber: quotation.number,
      subscriptionNumber: result.number
    }
  });

  return result;
}

export async function generateQuotationPdf(
  id: string,
  user?: { role: UserRole; customerId?: string | null }
): Promise<Buffer> {
  const quotation = await getQuotationById(id, user);

  return generateInvoicePdf({
    number: quotation.number,
    invoiceDate: quotation.quotationDate,
    dueDate: quotation.validUntil || new Date(Date.now() + 30 * 86400000),
    status: `QUOTATION: ${quotation.status}`,
    currency: "USD",
    subtotal: Number(quotation.subtotal),
    taxTotal: Number(quotation.taxTotal),
    discountTotal: Number(quotation.discountTotal),
    total: Number(quotation.total),
    amountPaid: 0,
    notes:
      quotation.notes ||
      `This quotation is valid until ${
        quotation.validUntil
          ? new Date(quotation.validUntil).toLocaleDateString()
          : "30 days from issue"
      }. Thank you for choosing Brightloop Software.`,
    customer: quotation.customer,
    items: quotation.items.map((item) => ({
      description: item.product.name,
      productName: item.product.name,
      variantName: item.variant?.name ? `${item.variant.name}: ${item.variant.value}` : null,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate),
      lineTotal: Number(item.lineTotal)
    }))
  });
}

