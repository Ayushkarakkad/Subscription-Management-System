import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "../../config/database";
import { logAudit } from "../../utils/audit.utils";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  companyName?: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function getJwtSecret(): string {
  return (
    process.env.JWT_SECRET ||
    "brightloop-super-secure-production-jwt-secret-key-32chars-min"
  );
}

export function generateToken(user: {
  id: string;
  email: string;
  role: UserRole;
  customerId?: string | null;
}): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as any;
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId || null
    },
    getJwtSecret(),
    { expiresIn }
  );
}

export async function register(input: RegisterInput, ip?: string) {
  const normalizedEmail = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: normalizedEmail,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
        isActive: true
      }
    });

    const customer = await tx.customer.create({
      data: {
        userId: user.id,
        name: input.name,
        email: normalizedEmail,
        companyName: input.companyName || null,
        phone: input.phone || null
      }
    });

    return { user, customer };
  });

  await logAudit({
    userId: result.user.id,
    action: "USER_REGISTERED",
    entity: "User",
    entityId: result.user.id,
    details: { email: normalizedEmail, role: result.user.role },
    ipAddress: ip
  });

  const token = generateToken({
    id: result.user.id,
    email: result.user.email,
    role: result.user.role,
    customerId: result.customer.id
  });

  return {
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      customerId: result.customer.id
    },
    token
  };
}

export async function login(input: LoginInput, ip?: string) {
  const normalizedEmail = input.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      customer: true
    }
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Your account has been deactivated. Please contact support.");
  }

  const passwordValid = await bcrypt.compare(input.password, user.password);
  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  await logAudit({
    userId: user.id,
    action: "USER_LOGIN",
    entity: "User",
    entityId: user.id,
    ipAddress: ip
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    customerId: user.customer?.id
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id || null,
      customer: user.customer || null
    },
    token
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          taxNumber: true
        }
      }
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user) {
    // Return friendly message even if user doesn't exist for security
    return {
      message:
        "If an account with this email exists, password reset instructions have been generated."
    };
  }

  // Generate temporary password reset instruction
  return {
    message: "Password reset instructions sent to your email address.",
    resetToken: Buffer.from(`${user.id}:${Date.now()}`).toString("base64")
  };
}

