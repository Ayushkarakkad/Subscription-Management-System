import { prisma } from "../../config/database";
import { logAudit } from "../../utils/audit.utils";

export async function listCustomers(query: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { companyName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } }
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            subscriptions: true,
            invoices: true,
            quotations: true
          }
        }
      }
    })
  ]);

  return {
    customers,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, isActive: true }
      },
      subscriptions: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 10
      },
      quotations: {
        orderBy: { createdAt: "desc" },
        take: 10
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 10
      },
      payments: {
        orderBy: { paymentDate: "desc" },
        take: 10
      }
    }
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
}

export async function createCustomer(data: any, actorId?: string) {
  const normalizedEmail = data.email.toLowerCase().trim();

  // Prevent duplicate customer records by email
  const existing = await prisma.customer.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } }
  });

  if (existing) {
    throw new Error("A customer with this email already exists");
  }

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      companyName: data.companyName || null,
      email: normalizedEmail,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      postalCode: data.postalCode || null,
      taxNumber: data.taxNumber || null,
      status: data.status || "ACTIVE",
      notes: data.notes || null
    }
  });

  await logAudit({
    userId: actorId,
    action: "CUSTOMER_CREATED",
    entity: "Customer",
    entityId: customer.id,
    details: { name: customer.name, email: customer.email }
  });

  return customer;
}

export async function updateCustomer(id: string, data: any, actorId?: string) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Customer not found");
  }

  if (data.email) {
    const normalizedEmail = data.email.toLowerCase().trim();
    if (normalizedEmail !== existing.email?.toLowerCase()) {
      const emailTaken = await prisma.customer.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" },
          id: { not: id }
        }
      });
      if (emailTaken) {
        throw new Error("Another customer is already registered with this email");
      }
      data.email = normalizedEmail;
    }
  }

  const updated = await prisma.customer.update({
    where: { id },
    data
  });

  await logAudit({
    userId: actorId,
    action: "CUSTOMER_UPDATED",
    entity: "Customer",
    entityId: id
  });

  return updated;
}

