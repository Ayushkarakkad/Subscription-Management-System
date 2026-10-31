export type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  phone?: string | null;
  companyName?: string | null;
  address?: string | null;
  createdAt: string;
  customer?: Customer | null;
}

export interface Customer {
  id: string;
  userId?: string | null;
  name?: string | null;
  companyName?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxNumber?: string | null;
  status: "ACTIVE" | "INACTIVE";
  notes?: string | null;
  createdAt: string;
  _count?: {
    subscriptions: number;
    invoices: number;
    quotations: number;
  };
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  value: string;
  sku?: string | null;
  priceExtra: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  type: string;
  description?: string | null;
  sku?: string | null;
  salesPrice: number;
  costPrice: number;
  notes?: string | null;
  isActive: boolean;
  variants?: ProductVariant[];
  createdAt: string;
}

export type BillingInterval =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "YEARLY";

export interface PlanProduct {
  id: string;
  planId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  billingInterval: BillingInterval;
  trialPeriodDays: number;
  minimumQuantity: number;
  startDate: string;
  endDate?: string | null;
  autoClose: boolean;
  allowEarlyClose: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  isActive: boolean;
  planProducts?: PlanProduct[];
  _count?: {
    subscriptions: number;
  };
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  type: "PERCENTAGE" | "FIXED";
  description?: string | null;
  isActive: boolean;
}

export interface Discount {
  id: string;
  name: string;
  description?: string | null;
  type: "FIXED" | "PERCENTAGE";
  scope: "PRODUCT" | "SUBSCRIPTION" | "BOTH";
  value: number;
  minimumPurchase?: number | null;
  minimumQuantity?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUses?: number | null;
  usageCount: number;
  isActive: boolean;
}

export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CONVERTED";

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  variantId?: string | null;
  taxId?: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
  product?: Product;
  variant?: ProductVariant;
  tax?: Tax;
}

export interface Quotation {
  id: string;
  number: string;
  customerId: string;
  planId?: string | null;
  status: QuotationStatus;
  quotationDate: string;
  validUntil?: string | null;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  notes?: string | null;
  customer?: Customer;
  plan?: Plan;
  items?: QuotationItem[];
}

export type SubscriptionStatus =
  | "DRAFT"
  | "TRIAL"
  | "ACTIVE"
  | "PAUSED"
  | "PAST_DUE"
  | "CANCELLED"
  | "EXPIRED"
  | "CLOSED";

export interface Subscription {
  id: string;
  number: string;
  customerId: string;
  planId: string;
  quotationId?: string | null;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate?: string | null;
  nextBillingDate?: string | null;
  billingAmount: number;
  billingInterval: BillingInterval;
  trialEndDate?: string | null;
  paymentTerms?: string | null;
  customer?: Customer;
  plan?: Plan;
  items?: any[];
  history?: any[];
  invoices?: Invoice[];
}

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID"
  | "CANCELLED";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
  product?: Product;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  subscriptionId?: string | null;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  amountPaid: number;
  notes?: string | null;
  customer?: Customer;
  subscription?: Subscription;
  items?: InvoiceItem[];
}

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CARD"
  | "UPI"
  | "CHEQUE"
  | "OTHER";

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  method: PaymentMethod;
  amount: number;
  paymentDate: string;
  reference?: string | null;
  note?: string | null;
  status: string;
  customer?: Customer;
  invoice?: Invoice;
  recordedBy?: { id: string; name: string };
}

