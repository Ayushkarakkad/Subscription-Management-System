
import { UserRole } from "@prisma/client";

// Information about the authenticated user
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// JWT token payload
export interface JwtPayload {
  userId: string;
  role: UserRole;
}

// Registration request
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// Login request
export interface LoginInput {
  email: string;
  password: string;
}

// Authentication response
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: AuthUser;
    token: string;
  };
}
