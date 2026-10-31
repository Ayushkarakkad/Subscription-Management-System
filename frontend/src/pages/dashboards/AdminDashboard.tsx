import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { StatCard } from "../../components/common/StatCard";
import { Badge } from "../../components/common/Badge";
import { CardSkeleton } from "../../components/common/LoadingSkeleton";
import {
  Users,
  RefreshCw,
  DollarSign,
  TrendingUp,
  FileWarning,
  Package,
  Calendar,
  ArrowUpRight,
  Receipt
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [overviewRes, trendsRes, growthRes] = await Promise.all([
          api.get("/analytics/overview"),
          api.get("/analytics/revenue"),
          api.get("/analytics/subscriptions")
        ]);

        if (overviewRes.data?.success) setData(overviewRes.data.data);
        if (trendsRes.data?.success) setRevenueTrends(trendsRes.data.data || []);
        if (growthRes.data?.success) setGrowthData(growthRes.data.data || []);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const { metrics, revenueByPlan, recentPayments, recentSubscriptions } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Real-time financial performance and subscription analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/analytics"
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Full Reports
          </Link>
          <Link
            to="/subscriptions"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <span>Subscriptions</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Recurring (MRR)"
          value={`$${metrics.mrr.toLocaleString()}`}
          subtitle={`ARR: $${metrics.arr.toLocaleString()}`}
          icon={TrendingUp}
          color="blue"
          trend={{ value: "12.5%", isPositive: true }}
        />
        <StatCard
          title="Active Subscriptions"
          value={metrics.activeSubscriptions}
          subtitle={`${metrics.inactiveSubscriptions} inactive/paused`}
          icon={RefreshCw}
          color="emerald"
        />
        <StatCard
          title="Total Collected Revenue"
          value={`$${metrics.totalCollectedRevenue.toLocaleString()}`}
          subtitle={`Collection Rate: ${metrics.collectionRate}%`}
          icon={DollarSign}
          color="indigo"
        />
        <StatCard
          title="Outstanding / Overdue"
          value={`$${metrics.totalOutstandingRevenue.toLocaleString()}`}
          subtitle={`${metrics.overdueInvoicesCount} overdue invoices`}
          icon={FileWarning}
          color={metrics.overdueInvoicesCount > 0 ? "rose" : "amber"}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Customers
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {metrics.totalCustomers} Accounts
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Products
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {metrics.totalProducts} Services
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pending Invoices
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {metrics.pendingInvoicesCount} Invoices
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Revenue Trends */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Monthly Invoiced vs Collected
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Past 6 months cash flow and billing
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="invoiced" name="Invoiced" fill="#93C5FD" radius={[6, 6, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Growth Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Subscription Base Growth
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Active subscriptions trajectory vs cancellations
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area
                  type="monotone"
                  dataKey="active"
                  name="Active Base"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#activeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="cancelled"
                  name="Cancelled"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue by Subscription Plan */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 mb-4">
          Revenue Distribution by Subscription Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revenueByPlan.map((p: any, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {p.name}
              </div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                ${Number(p.estimatedMonthlyRevenue).toFixed(2)}{" "}
                <span className="text-xs font-semibold text-slate-400">/ mo</span>
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">
                {p.activeSubscribers} active subscribers
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tables: Recent Subscriptions & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Subscriptions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Recent Subscriptions
            </h3>
            <Link to="/subscriptions" className="text-xs font-bold text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentSubscriptions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-900">
                      {s.customer.companyName || s.customer.name}
                    </td>
                    <td className="py-3 text-slate-600">{s.plan.name}</td>
                    <td className="py-3 font-bold text-slate-900">
                      ${Number(s.billingAmount).toFixed(2)}
                    </td>
                    <td className="py-3">
                      <Badge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Recent Payments
            </h3>
            <Link to="/payments" className="text-xs font-bold text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentPayments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-900">
                      {p.customer.companyName || p.customer.name}
                    </td>
                    <td className="py-3 text-blue-600 font-mono font-medium">
                      {p.invoice?.number}
                    </td>
                    <td className="py-3 font-bold text-emerald-600">
                      +${Number(p.amount).toFixed(2)}
                    </td>
                    <td className="py-3 text-slate-500 font-medium">
                      {p.method.replace("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AdminDashboard;
