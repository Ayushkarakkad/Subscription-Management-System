import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Customer name is required"),
  companyName: z.string().optional(),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxNumber: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  notes: z.string().optional()
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxNumber: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  notes: z.string().optional()
});

