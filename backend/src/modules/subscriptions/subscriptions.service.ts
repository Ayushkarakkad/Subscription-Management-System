import { prisma } from "../../config/database";
import { logAudit } from "../../utils/audit.utils";
import { calculateNextBillingDate } from "../../utils/date.utils";
import {
  SubscriptionStatus,
  InvoiceStatus,
  BillingInterval,
  UserRole,
  BillingAttemptStatus
} from "@prisma/client";

export async function generateSubscriptionNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.subscription.count();
  const seq = (count + 1).toString().padStart(4, "0");
  return `SUB-${year}-${seq}`;
}

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  const seq = (count + 1).toString().padStart(4, "0");
  return `INV-${year}-${seq}`;
}

export async function listSubscriptions(
  query: {
    page?: number;
    limit?: number;
    customerId?: string;
    planId?: string;
    status?: SubscriptionStatus;
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

  if (query.planId) {
    where.planId = query.planId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { number: { contains: query.search, mode: "insensitive" } },
      { customer: { name: { contains: query.search, mode: "insensitive" } } },
      { customer: { companyName: { contains: query.search, mode: "insensitive" } } },
      { plan: { name: { contains: query.search, mode: "insensitive" } } }
    ];
  }

  const [total, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, companyName: true, email: true } },
        plan: { select: { id: true, name: true, price: true, billingInterval: true } },
        _count: {
          select: { invoices: true }
        }
      }
    })
  ]);

  return {
    subscriptions,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getSubscriptionById(
  id: string,
  user?: { role: UserRole; customerId?: string | null }
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      customer: true,
      plan: {
        include: { planProducts: { include: { product: true } } }
      },
      items: {
        include: { product: true, variant: true, tax: true }
      },
      history: {
        include: { changedBy: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" }
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 20
      },
      discounts: {
        include: { discount: true }
      },
      billingAttempts: {
        orderBy: { attemptDate: "desc" },
        take: 10
      }
    }
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (
    user?.role === UserRole.CUSTOMER &&
    subscription.customerId !== user.customerId
  ) {
    throw new Error("Forbidden: You can only view your own subscriptions");
  }

  return subscription;
}

export async function createSubscription(data: any, actorId?: string) {
  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) {
    throw new Error("Customer not found");
  }

  const plan = await prisma.plan.findUnique({
    where: { id: data.planId },
    include: { planProducts: true }
  });
  if (!plan) {
    throw new Error("Plan not found");
  }

  const number = await generateSubscriptionNumber();
  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const billingInterval = data.billingInterval || plan.billingInterval;
  const nextBillingDate = calculateNextBillingDate(startDate, billingInterval);

  const trialEndDate =
    plan.trialPeriodDays > 0
      ? new Date(startDate.getTime() + plan.trialPeriodDays * 86400000)
      : null;

  const initialStatus =
    plan.trialPeriodDays > 0 ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE;

  // Prepare line items
  let lineItems = [];
  let billingAmount = Number(plan.price);

  if (data.items?.length) {
    lineItems = data.items.map((item: any) => ({
      productId: item.productId,
      variantId: item.variantId || null,
      taxId: item.taxId || null,
      quantity: item.quantity || 1,
      unitPrice: Number(item.unitPrice),
      taxRate: 0,
      lineTotal: Number(item.unitPrice) * Number(item.quantity || 1)
    }));
    billingAmount = lineItems.reduce((acc: number, item: any) => acc + item.lineTotal, 0);
  } else if (plan.planProducts.length) {
    lineItems = plan.planProducts.map((pp) => ({
      productId: pp.productId,
      variantId: pp.variantId || null,
      quantity: pp.quantity,
      unitPrice: pp.unitPrice,
      taxRate: 0,
      lineTotal: Number(pp.unitPrice) * pp.quantity
    }));
  }

  const subscription = await prisma.subscription.create({
    data: {
      number,
      customerId: data.customerId,
      planId: data.planId,
      status: initialStatus,
      startDate,
      nextBillingDate,
      billingAmount,
      billingInterval,
      trialEndDate,
      paymentTerms: data.paymentTerms || "Net 30",
      items: {
        create: lineItems
      },
      history: {
        create: {
          changedById: actorId || null,
          fromStatus: null,
          toStatus: initialStatus,
          note: "Direct subscription creation"
        }
      }
    },
    include: {
      customer: true,
      plan: true,
      items: true
    }
  });

  await logAudit({
    userId: actorId,
    action: "SUBSCRIPTION_CREATED",
    entity: "Subscription",
    entityId: subscription.id,
    details: { number: subscription.number, plan: plan.name, amount: subscription.billingAmount }
  });

  return subscription;
}

export async function pauseSubscription(id: string, note?: string, actorId?: string) {
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (subscription.status !== SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.TRIAL) {
    throw new Error(`Cannot pause a subscription that is currently ${subscription.status}`);
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: SubscriptionStatus.PAUSED,
      pausedAt: new Date(),
      history: {
        create: {
          changedById: actorId || null,
          fromStatus: subscription.status,
          toStatus: SubscriptionStatus.PAUSED,
          note: note || "Subscription paused"
        }
      }
    },
    include: { customer: true, plan: true }
  });

  await logAudit({
    userId: actorId,
    action: "SUBSCRIPTION_PAUSED",
    entity: "Subscription",
    entityId: id,
    details: { note }
  });

  return updated;
}

export async function resumeSubscription(id: string, note?: string, actorId?: string) {
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (subscription.status !== SubscriptionStatus.PAUSED) {
    throw new Error(`Cannot resume a subscription that is currently ${subscription.status}`);
  }

  // Recalculate next billing date from today if past due
  const now = new Date();
  let nextBillingDate = subscription.nextBillingDate;
  if (!nextBillingDate || nextBillingDate < now) {
    nextBillingDate = calculateNextBillingDate(now, subscription.billingInterval);
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      pausedAt: null,
      nextBillingDate,
      history: {
        create: {
          changedById: actorId || null,
          fromStatus: SubscriptionStatus.PAUSED,
          toStatus: SubscriptionStatus.ACTIVE,
          note: note || "Subscription resumed"
        }
      }
    },
    include: { customer: true, plan: true }
  });

  await logAudit({
    userId: actorId,
    action: "SUBSCRIPTION_RESUMED",
    entity: "Subscription",
    entityId: id,
    details: { note }
  });

  return updated;
}

export async function cancelSubscription(
  id: string,
  note?: string,
  actorId?: string,
  userRole?: UserRole
) {
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (
    subscription.status === SubscriptionStatus.CANCELLED ||
    subscription.status === SubscriptionStatus.CLOSED
  ) {
    throw new Error("Subscription is already cancelled or closed");
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: SubscriptionStatus.CANCELLED,
      closedAt: new Date(),
      history: {
        create: {
          changedById: actorId || null,
          fromStatus: subscription.status,
          toStatus: SubscriptionStatus.CANCELLED,
          note: note || (userRole === UserRole.CUSTOMER ? "Customer requested cancellation" : "Subscription cancelled by staff")
        }
      }
    },
    include: { customer: true, plan: true }
  });

  await logAudit({
    userId: actorId,
    action: "SUBSCRIPTION_CANCELLED",
    entity: "Subscription",
    entityId: id,
    details: { note }
  });

  return updated;
}

export async function renewSubscription(id: string, note?: string, actorId?: string) {
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const baseDate = subscription.nextBillingDate || new Date();
  const nextBillingDate = calculateNextBillingDate(baseDate, subscription.billingInterval);

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate,
      history: {
        create: {
          changedById: actorId || null,
          fromStatus: subscription.status,
          toStatus: SubscriptionStatus.ACTIVE,
          note: note || "Subscription manually renewed"
        }
      }
    },
    include: { customer: true, plan: true }
  });

  await logAudit({
    userId: actorId,
    action: "SUBSCRIPTION_RENEWED",
    entity: "Subscription",
    entityId: id,
    details: { nextBillingDate }
  });

  return updated;
}

export async function changeSubscriptionPlan(
  id: string,
  newPlanId: string,
  note?: string,
  actorId?: string
) {
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const newPlan = await prisma.plan.findUnique({
    where: { id: newPlanId },
    include: { planProducts: true }
  });
  if (!newPlan) {
    throw new Error("New plan not found");
  }

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Remove old line items
    await tx.subscriptionItem.deleteMany({
      where: { subscriptionId: id }
    });

    // 2. Add new plan products
    const lineItems = newPlan.planProducts.map((pp) => ({
      subscriptionId: id,
      productId: pp.productId,
      variantId: pp.variantId || null,
      quantity: pp.quantity,
      unitPrice: pp.unitPrice,
      taxRate: 0,
      lineTotal: Number(pp.unitPrice) * pp.quantity
    }));

    if (lineItems.length > 0) {
      await tx.subscriptionItem.createMany({
        data: lineItems
      });
    }

    // 3. Update subscription
    const sub = await tx.subscription.update({
      where: { id },
      data: {
        planId: newPlanId,
        billingAmount: newPlan.price,
        billingInterval: newPlan.billingInterval,
        history: {
          create: {
            changedById: actorId || null,
            fromStatus: subscription.status,
            toStatus: subscription.status,
            note: note || `Changed plan to ${newPlan.name}`
          }
        }
      },
      include: { plan: true, customer: true, items: true }
    });

    return sub;
  });

  await logAudit({
    userId: actorId,
    action: "SUBSCRIPTION_PLAN_CHANGED",
    entity: "Subscription",
    entityId: id,
    details: { oldPlanId: subscription.planId, newPlanId, newPlanName: newPlan.name }
  });

  return updated;
}

// ==========================================
// AUTOMATED RECURRING BILLING ENGINE
// ==========================================

export async function runBillingCycle(actorId?: string) {
  const now = new Date();

  // Find all ACTIVE subscriptions due for billing
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate: {
        lte: now
      }
    },
    include: {
      customer: true,
      plan: true,
      items: {
        include: { product: true, variant: true, tax: true }
      }
    }
  });

  const results = {
    totalEligible: dueSubscriptions.length,
    invoicesGenerated: 0,
    skipped: 0,
    failed: 0,
    details: [] as any[]
  };

  for (const sub of dueSubscriptions) {
    const periodStart = sub.nextBillingDate ? new Date(sub.nextBillingDate) : new Date();
    const periodEnd = calculateNextBillingDate(periodStart, sub.billingInterval);

    try {
      // 1. Idempotency Check: check if invoice already generated for this exact billing period
      const existingInvoice = await prisma.invoice.findUnique({
        where: {
          subscriptionId_periodStart_periodEnd: {
            subscriptionId: sub.id,
            periodStart,
            periodEnd
          }
        }
      });

      if (existingInvoice) {
        // Record skipped billing attempt
        await prisma.billingAttempt.create({
          data: {
            subscriptionId: sub.id,
            status: BillingAttemptStatus.SKIPPED,
            invoiceId: existingInvoice.id,
            errorMessage: "Invoice already exists for this billing period"
          }
        });

        // Advance next billing date if stuck
        const advancedDate = calculateNextBillingDate(sub.nextBillingDate || now, sub.billingInterval);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { nextBillingDate: advancedDate }
        });

        results.skipped++;
        results.details.push({
          subscriptionNumber: sub.number,
          status: "SKIPPED",
          reason: "Already billed"
        });
        continue;
      }

      // 2. Generate Invoice
      const invNumber = await generateInvoiceNumber();
      const dueDate = new Date(periodStart.getTime() + 15 * 86400000); // 15 days payment terms

      // Calculate totals
      let subtotal = 0;
      let taxTotal = 0;

      const invoiceItemsData = sub.items.map((item) => {
        const itemSubtotal = Number(item.unitPrice) * item.quantity;
        const taxRate = Number(item.taxRate || 0);
        const itemTax = (itemSubtotal * taxRate) / 100;
        const lineTotal = itemSubtotal + itemTax;

        subtotal += itemSubtotal;
        taxTotal += itemTax;

        return {
          productId: item.productId,
          variantId: item.variantId,
          taxId: item.taxId,
          description: `${item.product.name}${item.variant ? ` (${item.variant.name}: ${item.variant.value})` : ""}`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          lineTotal
        };
      });

      // If subscription has no items, bill the plan price
      if (invoiceItemsData.length === 0) {
        subtotal = Number(sub.billingAmount);
        taxTotal = 0;
      }

      const total = subtotal + taxTotal;

      const createdInvoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
          data: {
            number: invNumber,
            customerId: sub.customerId,
            subscriptionId: sub.id,
            status: InvoiceStatus.ISSUED, // Issued, not paid!
            invoiceDate: periodStart,
            dueDate,
            periodStart,
            periodEnd,
            currency: "USD",
            subtotal,
            taxTotal,
            discountTotal: 0,
            total,
            amountPaid: 0,
            notes: `Recurring subscription billing for period ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}`,
            items: {
              create: invoiceItemsData
            }
          }
        });

        // Advance subscription next billing date
        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            nextBillingDate: periodEnd
          }
        });

        // Record successful billing attempt
        await tx.billingAttempt.create({
          data: {
            subscriptionId: sub.id,
            status: BillingAttemptStatus.SUCCESS,
            invoiceId: inv.id,
            retryCount: 0
          }
        });

        return inv;
      });

      results.invoicesGenerated++;
      results.details.push({
        subscriptionNumber: sub.number,
        invoiceNumber: createdInvoice.number,
        total: Number(createdInvoice.total),
        status: "SUCCESS"
      });
    } catch (err: any) {
      console.error(`Billing error for subscription ${sub.number}:`, err);

      await prisma.billingAttempt.create({
        data: {
          subscriptionId: sub.id,
          status: BillingAttemptStatus.FAILED,
          errorMessage: err.message || "Failed to process recurring invoice",
          retryCount: 1
        }
      });

      results.failed++;
      results.details.push({
        subscriptionNumber: sub.number,
        status: "FAILED",
        error: err.message
      });
    }
  }

  await logAudit({
    userId: actorId,
    action: "BILLING_CYCLE_EXECUTED",
    entity: "RecurringBilling",
    details: {
      totalEligible: results.totalEligible,
      invoicesGenerated: results.invoicesGenerated,
      skipped: results.skipped,
      failed: results.failed
    }
  });

  return results;
}

