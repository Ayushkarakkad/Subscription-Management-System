import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { StatCard } from "../../components/common/StatCard";
import { Badge } from "../../components/common/Badge";
import { CardSkeleton } from "../../components/common/LoadingSkeleton";
import {
  Users,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  Receipt,
  ArrowUpRight,
  Plus
} from "lucide-react";

export const StaffDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStaffData() {
      try {
        const res = await api.get("/analytics/staff");
        if (res.data?.success) setData(res.data.data);
      } catch (err) {
        console.error("Staff dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStaffData();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const {
    assignedCustomers,
    recentQuotations,
    pendingQuotationsCount,
    activeSubscriptionsCount,
    upcomingRenewals,
    outstandingInvoices
  } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Operational Desk
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Day-to-day customer accounts, proposals and renewal tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/quotations"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Quotation</span>
          </Link>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Subscriptions"
          value={activeSubscriptionsCount}
          subtitle="Currently operational"
          icon={RefreshCw}
          color="emerald"
        />
        <StatCard
          title="Pending Quotations"
          value={pendingQuotationsCount}
          subtitle="Awaiting client sign-off"
          icon={FileSpreadsheet}
          color="blue"
        />
        <StatCard
          title="Upcoming Renewals"
          value={upcomingRenewals.length}
          subtitle="Next 30 days"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Open Invoices"
          value={outstandingInvoices.length}
          subtitle="Awaiting collection"
          icon={Receipt}
          color="indigo"
        />
      </div>

      {/* Upcoming Renewals & Pending Quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Renewals */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Upcoming Renewals (Next 30 Days)
            </h3>
            <Link to="/subscriptions" className="text-xs font-bold text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Renewal Date</th>
                  <th className="pb-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {upcomingRenewals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No renewals due in the next 30 days
                    </td>
                  </tr>
                ) : (
                  upcomingRenewals.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-900">
                        {r.customer.companyName || r.customer.name}
                      </td>
                      <td className="py-3 text-slate-600">{r.plan.name}</td>
                      <td className="py-3 text-slate-700 font-medium">
                        {r.nextBillingDate
                          ? new Date(r.nextBillingDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        ${Number(r.billingAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Quotations */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Recent Quotations
            </h3>
            <Link to="/quotations" className="text-xs font-bold text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Proposal #</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentQuotations.map((q: any) => (
                  <tr key={q.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-bold text-blue-600">
                      {q.number}
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      {q.customer.companyName || q.customer.name}
                    </td>
                    <td className="py-3 font-extrabold text-slate-900">
                      ${Number(q.total).toFixed(2)}
                    </td>
                    <td className="py-3">
                      <Badge status={q.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Outstanding Invoices to Follow Up */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-slate-900">
            Outstanding Customer Invoices
          </h3>
          <Link to="/invoices" className="text-xs font-bold text-blue-600 hover:underline">
            Manage Invoices
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Invoice #</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Due Date</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Amount Due</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {outstandingInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No outstanding invoices! All accounts settled.
                  </td>
                </tr>
              ) : (
                outstandingInvoices.map((inv: any) => {
                  const balance = Math.max(0, Number(inv.total) - Number(inv.amountPaid));
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono font-bold text-blue-600">
                        {inv.number}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        {inv.customer.companyName || inv.customer.name}
                      </td>
                      <td className="py-3 text-slate-600 font-medium">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        ${Number(inv.total).toFixed(2)}
                      </td>
                      <td className="py-3 font-extrabold text-rose-600">
                        ${balance.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <Badge status={inv.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default StaffDashboard;
