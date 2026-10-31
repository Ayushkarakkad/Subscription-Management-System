
export interface DashboardSummary {
  totalCustomers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  pendingInvoices: number;
}

export interface Subscription {
  id: string;
  customerName: string;
  planName: string;
  amount: number;
  status: "ACTIVE" | "CANCELLED" | "PENDING" | "EXPIRED";
  nextBillingDate: string;
}
