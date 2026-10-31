
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../../config/database";
import {
  RegisterInput,
  LoginInput,
  AuthResponse
} from "./auth.types";

// Validate JWT configuration
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }

  return secret;
}

// Generate JWT token
function generateToken(user: {
  id: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
}): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"];

  return jwt.sign(
    {
      userId: user.id,
      role: user.role
    },
    getJwtSecret(),
    { expiresIn }
  );
}

// ==========================================
// REGISTER CUSTOMER
// ==========================================

export async function registerUser(
  input: RegisterInput
): Promise<AuthResponse> {

  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  // Hash password before storing it
  const hashedPassword = await bcrypt.hash(input.password, 12);

  // Create user and customer profile together
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: "CUSTOMER",
      customer: {
        create: {}
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  const token = generateToken(user);

  return {
    success: true,
    message: "Registration successful",
    data: {
      user,
      token
    }
  };
}

// ==========================================
// LOGIN USER
// ==========================================

export async function loginUser(
  input: LoginInput
): Promise<AuthResponse> {

  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Your account is inactive");
  }

  // Compare entered password with stored hash
  const passwordMatches = await bcrypt.compare(
    input.password,
    user.password
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user);

  return {
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    }
  };
}
