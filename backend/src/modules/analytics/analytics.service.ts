import { prisma } from "../../config/database";
import {
  SubscriptionStatus,
  InvoiceStatus,
  UserRole,
  BillingInterval
} from "@prisma/client";

export async function getAdminOverview(startDate?: Date, endDate?: Date) {
  const now = new Date();

  const [
    totalCustomers,
    activeSubscriptions,
    inactiveSubscriptions,
    totalProducts,
    allPayments,
    allInvoices,
    recentPayments,
    recentSubscriptions,
    plansWithSubs
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.subscription.count({
      where: {
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
      }
    }),
    prisma.subscription.count({
      where: {
        status: { in: [SubscriptionStatus.PAUSED, SubscriptionStatus.CANCELLED, SubscriptionStatus.CLOSED] }
      }
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.payment.aggregate({
      _sum: { amount: true }
    }),
    prisma.invoice.findMany({
      select: {
        id: true,
        total: true,
        amountPaid: true,
        status: true,
        dueDate: true
      }
    }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { paymentDate: "desc" },
      include: {
        customer: { select: { name: true, companyName: true } },
        invoice: { select: { number: true } }
      }
    }),
    prisma.subscription.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, companyName: true } },
        plan: { select: { name: true, price: true } }
      }
    }),
    prisma.plan.findMany({
      include: {
        subscriptions: {
          where: {
            status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
          }
        }
      }
    })
  ]);

  // Financial calculations
  const totalCollectedRevenue = Number(allPayments._sum.amount || 0);

  let totalInvoicedRevenue = 0;
  let totalOutstandingRevenue = 0;
  let pendingInvoicesCount = 0;
  let overdueInvoicesCount = 0;

  for (const inv of allInvoices) {
    const invTotal = Number(inv.total);
    const paid = Number(inv.amountPaid);
    const balance = Math.max(0, invTotal - paid);

    totalInvoicedRevenue += invTotal;
    totalOutstandingRevenue += balance;

    if (inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.VOID && inv.status !== InvoiceStatus.CANCELLED) {
      pendingInvoicesCount++;
      if (new Date(inv.dueDate) < now) {
        overdueInvoicesCount++;
      }
    }
  }

  // Calculate MRR & ARR from active subscriptions
  const activeSubs = await prisma.subscription.findMany({
    where: {
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
    },
    select: {
      billingAmount: true,
      billingInterval: true
    }
  });

  let mrr = 0;
  for (const sub of activeSubs) {
    const amount = Number(sub.billingAmount);
    switch (sub.billingInterval) {
      case BillingInterval.DAILY:
        mrr += amount * 30;
        break;
      case BillingInterval.WEEKLY:
        mrr += amount * 4.33;
        break;
      case BillingInterval.MONTHLY:
        mrr += amount;
        break;
      case BillingInterval.QUARTERLY:
        mrr += amount / 3;
        break;
      case BillingInterval.HALF_YEARLY:
        mrr += amount / 6;
        break;
      case BillingInterval.YEARLY:
        mrr += amount / 12;
        break;
      default:
        mrr += amount;
    }
  }

  const arr = mrr * 12;

  // Revenue by Plan
  const revenueByPlan = plansWithSubs.map((plan) => ({
    name: plan.name,
    activeSubscribers: plan.subscriptions.length,
    estimatedMonthlyRevenue:
      plan.subscriptions.length *
      (plan.billingInterval === BillingInterval.YEARLY
        ? Number(plan.price) / 12
        : Number(plan.price))
  }));

  return {
    metrics: {
      totalCustomers,
      activeSubscriptions,
      inactiveSubscriptions,
      totalProducts,
      totalCollectedRevenue: Number(totalCollectedRevenue.toFixed(2)),
      totalInvoicedRevenue: Number(totalInvoicedRevenue.toFixed(2)),
      totalOutstandingRevenue: Number(totalOutstandingRevenue.toFixed(2)),
      mrr: Number(mrr.toFixed(2)),
      arr: Number(arr.toFixed(2)),
      pendingInvoicesCount,
      overdueInvoicesCount,
      collectionRate:
        totalInvoicedRevenue > 0
          ? Number(((totalCollectedRevenue / totalInvoicedRevenue) * 100).toFixed(1))
          : 100
    },
    revenueByPlan,
    recentPayments,
    recentSubscriptions
  };
}

export async function getRevenueTrends() {
  // Aggregate last 6 months invoiced vs collected revenue
  const months: Array<{ name: string; invoiced: number; collected: number }> = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const monthLabel = d.toLocaleString("default", { month: "short", year: "2-digit" });

    const [invoicesAgg, paymentsAgg] = await Promise.all([
      prisma.invoice.aggregate({
        where: { invoiceDate: { gte: monthStart, lte: monthEnd } },
        _sum: { total: true }
      }),
      prisma.payment.aggregate({
        where: { paymentDate: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true }
      })
    ]);

    months.push({
      name: monthLabel,
      invoiced: Number(invoicesAgg._sum.total || 0),
      collected: Number(paymentsAgg._sum.amount || 0)
    });
  }

  return months;
}

export async function getSubscriptionGrowth() {
  const months: Array<{ name: string; active: number; cancelled: number }> = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthLabel = d.toLocaleString("default", { month: "short", year: "2-digit" });

    const [activeCount, cancelledCount] = await Promise.all([
      prisma.subscription.count({
        where: {
          createdAt: { lte: monthEnd },
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
        }
      }),
      prisma.subscription.count({
        where: {
          createdAt: { lte: monthEnd },
          status: SubscriptionStatus.CANCELLED
        }
      })
    ]);

    months.push({
      name: monthLabel,
      active: activeCount,
      cancelled: cancelledCount
    });
  }

  return months;
}

export async function getStaffDashboard() {
  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 86400000);

  const [
    assignedCustomers,
    recentQuotations,
    pendingQuotations,
    activeSubscriptions,
    upcomingRenewals,
    outstandingInvoices
  ] = await Promise.all([
    prisma.customer.findMany({
      take: 10,
      orderBy: { createdAt: "desc" }
    }),
    prisma.quotation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true, plan: true }
    }),
    prisma.quotation.count({
      where: { status: { in: ["DRAFT", "SENT"] } }
    }),
    prisma.subscription.count({
      where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] } }
    }),
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: { gte: now, lte: next30Days }
      },
      take: 5,
      orderBy: { nextBillingDate: "asc" },
      include: { customer: true, plan: true }
    }),
    prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] }
      },
      take: 10,
      orderBy: { dueDate: "asc" },
      include: { customer: true }
    })
  ]);

  return {
    assignedCustomers,
    recentQuotations,
    pendingQuotationsCount: pendingQuotations,
    activeSubscriptionsCount: activeSubscriptions,
    upcomingRenewals,
    outstandingInvoices
  };
}

export async function getCustomerDashboard(customerId: string) {
  const [activeSubscriptions, invoices, payments] = await Promise.all([
    prisma.subscription.findMany({
      where: { customerId },
      include: { plan: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.invoice.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.payment.findMany({
      where: { customerId },
      orderBy: { paymentDate: "desc" },
      take: 10,
      include: { invoice: { select: { number: true } } }
    })
  ]);

  let totalOutstanding = 0;
  let unpaidInvoicesCount = 0;

  for (const inv of invoices) {
    if (inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.VOID && inv.status !== InvoiceStatus.CANCELLED) {
      totalOutstanding += Math.max(0, Number(inv.total) - Number(inv.amountPaid));
      unpaidInvoicesCount++;
    }
  }

  return {
    subscriptions: activeSubscriptions,
    invoices,
    payments,
    totalOutstanding: Number(totalOutstanding.toFixed(2)),
    unpaidInvoicesCount
  };
}

export async function exportCsv(entity: "invoices" | "subscriptions" | "customers" | "payments"): Promise<string> {
  if (entity === "invoices") {
    const records = await prisma.invoice.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" }
    });

    const headers = "Invoice Number,Customer,Company,Date,Due Date,Total,Amount Paid,Status\n";
    const rows = records.map((r) =>
      `"${r.number}","${r.customer.name || ""}","${r.customer.companyName || ""}","${r.invoiceDate.toISOString().split("T")[0]}","${r.dueDate.toISOString().split("T")[0]}",${r.total},${r.amountPaid},"${r.status}"`
    ).join("\n");

    return headers + rows;
  }

  if (entity === "subscriptions") {
    const records = await prisma.subscription.findMany({
      include: { customer: true, plan: true },
      orderBy: { createdAt: "desc" }
    });

    const headers = "Subscription Number,Customer,Plan,Interval,Amount,Status,Next Billing Date\n";
    const rows = records.map((r) =>
      `"${r.number}","${r.customer.name || ""}","${r.plan.name}","${r.billingInterval}",${r.billingAmount},"${r.status}","${r.nextBillingDate ? r.nextBillingDate.toISOString().split("T")[0] : ""}"`
    ).join("\n");

    return headers + rows;
  }

  if (entity === "customers") {
    const records = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" }
    });

    const headers = "Customer Name,Company,Email,Phone,City,Status,Created At\n";
    const rows = records.map((r) =>
      `"${r.name || ""}","${r.companyName || ""}","${r.email || ""}","${r.phone || ""}","${r.city || ""}","${r.status}","${r.createdAt.toISOString().split("T")[0]}"`
    ).join("\n");

    return headers + rows;
  }

  // Payments
  const records = await prisma.payment.findMany({
    include: { customer: true, invoice: true },
    orderBy: { paymentDate: "desc" }
  });

  const headers = "Payment ID,Customer,Invoice Number,Amount,Method,Date,Reference\n";
  const rows = records.map((r) =>
    `"${r.id}","${r.customer.name || ""}","${r.invoice.number}",${r.amount},"${r.method}","${r.paymentDate.toISOString().split("T")[0]}","${r.reference || ""}"`
  ).join("\n");

  return headers + rows;
}

