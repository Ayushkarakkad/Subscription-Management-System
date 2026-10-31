import { prisma } from "../../config/database";
import { logAudit } from "../../utils/audit.utils";
import { generateInvoicePdf } from "../../utils/pdf.utils";
import { generateInvoiceNumber } from "../subscriptions/subscriptions.service";
import { InvoiceStatus, UserRole } from "@prisma/client";

export async function listInvoices(
  query: {
    page?: number;
    limit?: number;
    customerId?: string;
    subscriptionId?: string;
    status?: InvoiceStatus;
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

  if (query.subscriptionId) {
    where.subscriptionId = query.subscriptionId;
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

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, companyName: true, email: true } },
        subscription: { select: { id: true, number: true } },
        _count: {
          select: { payments: true }
        }
      }
    })
  ]);

  return {
    invoices,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getInvoiceById(
  id: string,
  user?: { role: UserRole; customerId?: string | null }
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      subscription: {
        include: { plan: true }
      },
      items: {
        include: { product: true, variant: true, tax: true }
      },
      payments: {
        orderBy: { paymentDate: "desc" },
        include: {
          recordedBy: { select: { id: true, name: true } }
        }
      }
    }
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (
    user?.role === UserRole.CUSTOMER &&
    invoice.customerId !== user.customerId
  ) {
    throw new Error("Forbidden: You can only view your own invoices");
  }

  return invoice;
}

export async function createInvoice(data: any, actorId?: string) {
  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) {
    throw new Error("Customer not found");
  }

  const number = await generateInvoiceNumber();

  let subtotal = 0;
  let taxTotal = 0;

  const invoiceItems = [];

  for (const item of data.items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
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
    const quantity = Number(item.quantity || 1);
    const itemSubtotal = unitPrice * quantity;
    const itemTax = (itemSubtotal * taxRate) / 100;
    const lineTotal = itemSubtotal + itemTax;

    subtotal += itemSubtotal;
    taxTotal += itemTax;

    invoiceItems.push({
      productId: item.productId,
      variantId: item.variantId || null,
      taxId: item.taxId || null,
      description: item.description || product.name,
      quantity,
      unitPrice,
      taxRate,
      lineTotal
    });
  }

  const discountTotal = Number(data.discountTotal || 0);
  const total = Math.max(0, subtotal + taxTotal - discountTotal);

  const invoice = await prisma.invoice.create({
    data: {
      number,
      customerId: data.customerId,
      subscriptionId: data.subscriptionId || null,
      status: InvoiceStatus.ISSUED,
      invoiceDate: new Date(),
      dueDate: new Date(data.dueDate),
      currency: data.currency || "USD",
      subtotal,
      taxTotal,
      discountTotal,
      total,
      amountPaid: 0,
      notes: data.notes || null,
      items: {
        create: invoiceItems
      }
    },
    include: {
      customer: true,
      items: { include: { product: true, variant: true, tax: true } }
    }
  });

  await logAudit({
    userId: actorId,
    action: "INVOICE_CREATED",
    entity: "Invoice",
    entityId: invoice.id,
    details: { number: invoice.number, total: invoice.total }
  });

  return invoice;
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  actorId?: string
) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Invoice not found");
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status }
  });

  await logAudit({
    userId: actorId,
    action: "INVOICE_STATUS_UPDATED",
    entity: "Invoice",
    entityId: id,
    details: { from: existing.status, to: status }
  });

  return updated;
}

export async function downloadInvoicePdf(
  id: string,
  user?: { role: UserRole; customerId?: string | null }
): Promise<Buffer> {
  const invoice = await getInvoiceById(id, user);

  return generateInvoicePdf({
    number: invoice.number,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    currency: invoice.currency,
    subtotal: Number(invoice.subtotal),
    taxTotal: Number(invoice.taxTotal),
    discountTotal: Number(invoice.discountTotal),
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    notes: invoice.notes,
    customer: invoice.customer,
    items: invoice.items.map((item) => ({
      description: item.description,
      productName: item.product.name,
      variantName: item.variant?.name ? `${item.variant.name}: ${item.variant.value}` : null,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate),
      lineTotal: Number(item.lineTotal)
    }))
  });
}

