import { prisma } from "../../config/database";
import { logAudit } from "../../utils/audit.utils";

export async function listTaxes(query: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | string;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.isActive !== undefined) {
    where.isActive = String(query.isActive) === "true";
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } }
    ];
  }

  const [total, taxes] = await Promise.all([
    prisma.tax.count({ where }),
    prisma.tax.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    })
  ]);

  return {
    taxes,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getTaxById(id: string) {
  const tax = await prisma.tax.findUnique({ where: { id } });
  if (!tax) {
    throw new Error("Tax configuration not found");
  }
  return tax;
}

export async function createTax(data: any, actorId?: string) {
  const existing = await prisma.tax.findFirst({
    where: { name: { equals: data.name, mode: "insensitive" } }
  });

  if (existing) {
    throw new Error("A tax with this name already exists");
  }

  const tax = await prisma.tax.create({
    data: {
      name: data.name,
      rate: data.rate,
      type: data.type || "PERCENTAGE",
      description: data.description || null,
      isActive: data.isActive ?? true
    }
  });

  await logAudit({
    userId: actorId,
    action: "TAX_CREATED",
    entity: "Tax",
    entityId: tax.id,
    details: { name: tax.name, rate: tax.rate }
  });

  return tax;
}

export async function updateTax(id: string, data: any, actorId?: string) {
  const existing = await prisma.tax.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Tax configuration not found");
  }

  if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
    const nameTaken = await prisma.tax.findFirst({
      where: {
        name: { equals: data.name, mode: "insensitive" },
        id: { not: id }
      }
    });
    if (nameTaken) {
      throw new Error("Another tax with this name already exists");
    }
  }

  const updated = await prisma.tax.update({
    where: { id },
    data
  });

  await logAudit({
    userId: actorId,
    action: "TAX_UPDATED",
    entity: "Tax",
    entityId: id
  });

  return updated;
}

export async function setTaxStatus(
  id: string,
  isActive: boolean,
  actorId?: string
) {
  const existing = await prisma.tax.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Tax configuration not found");
  }

  const updated = await prisma.tax.update({
    where: { id },
    data: { isActive }
  });

  await logAudit({
    userId: actorId,
    action: isActive ? "TAX_ACTIVATED" : "TAX_DEACTIVATED",
    entity: "Tax",
    entityId: id
  });

  return updated;
}

