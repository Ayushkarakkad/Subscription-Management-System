import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { prisma } from "../../config/database";
import { logAudit } from "../../utils/audit.utils";

export async function listUsers(query: {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.role) {
    where.role = query.role;
  }

  if (typeof query.isActive === "boolean") {
    where.isActive = query.isActive;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } }
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: { id: true, companyName: true, phone: true }
        }
      }
    })
  ]);

  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      customer: true
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function createUser(data: any, actorId?: string) {
  const normalizedEmail = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: data.role || UserRole.CUSTOMER,
      isActive: data.isActive ?? true,
      ...(data.role === UserRole.CUSTOMER && {
        customer: {
          create: {
            name: data.name,
            email: normalizedEmail
          }
        }
      })
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  await logAudit({
    userId: actorId,
    action: "USER_CREATED",
    entity: "User",
    entityId: user.id,
    details: { email: user.email, role: user.role }
  });

  return user;
}

export async function updateUser(id: string, data: any, actorId?: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("User not found");
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.role) updateData.role = data.role;
  if (typeof data.isActive === "boolean") updateData.isActive = data.isActive;

  if (data.email) {
    const normalizedEmail = data.email.toLowerCase().trim();
    if (normalizedEmail !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
      if (emailTaken) {
        throw new Error("Email is already taken by another account");
      }
      updateData.email = normalizedEmail;
    }
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });

  await logAudit({
    userId: actorId,
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    details: { changes: Object.keys(updateData) }
  });

  return updated;
}

export async function deleteUser(id: string, actorId?: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error("User not found");
  }

  // Deactivate rather than hard-deleting historical records
  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, isActive: true }
  });

  await logAudit({
    userId: actorId,
    action: "USER_DEACTIVATED",
    entity: "User",
    entityId: id
  });

  return updated;
}

