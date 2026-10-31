import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  CreateTaxInput,
  UpdateTaxInput,
  TaxQueryParams
} from "./tax.validation";

export class TaxError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "TaxError";
    this.statusCode = statusCode;
  }
}

export async function createTax(input: CreateTaxInput) {
  const existing = await prisma.tax.findFirst({
    where: {
      name: { equals: input.name, mode: "insensitive" }
    }
  });

  if (existing) {
    throw new TaxError(`Tax with name "${input.name}" already exists`, 409);
  }

  const rateDecimal = new Prisma.Decimal(input.rate);

  return await prisma.tax.create({
    data: {
      name: input.name,
      rate: rateDecimal,
      description: input.description ?? null,
      isActive: input.isActive ?? true
    }
  });
}

export async function getTaxes(params: TaxQueryParams) {
  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.TaxWhereInput = {};

  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
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
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getTaxById(id: string) {
  const tax = await prisma.tax.findUnique({
    where: { id }
  });

  if (!tax) {
    throw new TaxError("Tax configuration not found", 404);
  }

  return tax;
}

export async function updateTax(id: string, input: UpdateTaxInput) {
  const existing = await prisma.tax.findUnique({ where: { id } });
  if (!existing) {
    throw new TaxError("Tax configuration not found", 404);
  }

  if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
    const duplicate = await prisma.tax.findFirst({
      where: {
        name: { equals: input.name, mode: "insensitive" }
      }
    });

    if (duplicate && duplicate.id !== id) {
      throw new TaxError(`Tax with name "${input.name}" already exists`, 409);
    }
  }

  const updateData: Prisma.TaxUpdateInput = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.rate !== undefined) updateData.rate = new Prisma.Decimal(input.rate);
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  return await prisma.tax.update({
    where: { id },
    data: updateData
  });
}

export async function setTaxStatus(id: string, isActive: boolean) {
  const existing = await prisma.tax.findUnique({ where: { id } });
  if (!existing) {
    throw new TaxError("Tax configuration not found", 404);
  }

  return await prisma.tax.update({
    where: { id },
    data: { isActive }
  });
}

// ==========================================
// BILLING / INVOICING INTEGRATION HELPER
// ==========================================

export async function calculateTax(
  taxId: string,
  taxableAmount: Prisma.Decimal | number | string
) {
  const tax = await prisma.tax.findUnique({ where: { id: taxId } });
  if (!tax) {
    throw new TaxError(`Tax not found: ${taxId}`, 404);
  }

  if (!tax.isActive) {
    throw new TaxError(`Tax "${tax.name}" is currently inactive`, 400);
  }

  const amountDecimal = new Prisma.Decimal(taxableAmount);
  if (amountDecimal.isNegative()) {
    throw new TaxError("Taxable amount cannot be negative", 400);
  }

  // Tax amount = amount * (rate / 100)
  const taxAmount = amountDecimal.times(tax.rate).dividedBy(100);

  return {
    taxId: tax.id,
    name: tax.name,
    rate: tax.rate,
    taxAmount: taxAmount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
  };
}
