import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  CreditCard, 
  Download, 
  Calendar,
  FileSpreadsheet,
  PieChart as PieIcon,
  BarChart3,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/common/StatCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

export const AnalyticsReports: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/admin');
      setData(res.data.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCsv = async (entity: string) => {
    try {
      setExporting(entity);
      const response = await api.get(`/analytics/export?entity=${entity}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${entity}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`${entity.charAt(0).toUpperCase() + entity.slice(1)} export downloaded`, 'success');
    } catch (err: any) {
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Financial Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Generating revenue insights and reporting metrics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <LoadingSkeleton count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton count={3} />
          <LoadingSkeleton count={3} />
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const revenueTrends = data?.revenueTrends || [];
  const planDistribution = data?.planDistribution || [];
  const collectionRate = Number(kpis.collectionRate || 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Intelligence & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time SaaS billing metrics, MRR, ARR, and CSV ledger reporting.</p>
        </div>
        
        {/* CSV Export Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {['invoices', 'subscriptions', 'payments', 'customers'].map((item) => (
            <button
              key={item}
              onClick={() => handleExportCsv(item)}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{exporting === item ? 'Exporting...' : `Export ${item.charAt(0).toUpperCase() + item.slice(1)}`}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Recurring Revenue (MRR)"
          value={`$${Number(kpis.mrr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change="+12.4% vs last mo"
          isPositive={true}
          icon={TrendingUp}
        />
        <StatCard
          title="Annual Run Rate (ARR)"
          value={`$${Number(kpis.arr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change="+14.8% YoY"
          isPositive={true}
          icon={DollarSign}
        />
        <StatCard
          title="Active Subscriptions"
          value={kpis.activeSubscriptionsCount || 0}
          change="Live paying customers"
          isPositive={true}
          icon={Users}
        />
        <StatCard
          title="Invoice Collection Rate"
          value={`${collectionRate.toFixed(1)}%`}
          change={collectionRate > 90 ? 'Healthy cashflow' : 'Collection attention needed'}
          isPositive={collectionRate >= 80}
          icon={ShieldCheck}
        />
      </div>

      {/* Visual Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trajectory (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Revenue Growth & Billed Amount</h2>
              <p className="text-xs text-slate-400">Monthly invoice gross billing trends</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Trailing Period
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrends.length > 0 ? revenueTrends : [{ month: 'Current', billed: kpis.mrr, collected: kpis.mrr }]}>
                <defs>
                  <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" name="Billed Revenue" dataKey="billed" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#billedGrad)" />
                <Area type="monotone" name="Collected Revenue" dataKey="collected" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#collectedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Subscription Distribution (1 Col) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Plan Adoption Share</h2>
            <p className="text-xs text-slate-400 mb-4">Distribution by active subscription tier</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution.length > 0 ? planDistribution : [{ name: 'Default Tier', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {planDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val} Subs`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
            {planDistribution.slice(0, 4).map((p: any, idx: number) => (
              <div key={p.name || idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-600 font-medium">{p.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{p.value} subscribers</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Breakdown Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Financial Health Diagnostics</h2>
        <p className="text-xs text-slate-400 mb-6">Key SaaS metrics computed by automated recurring billing</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Outstanding Receivables</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ${Number(kpis.totalOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">Pending unpaid client invoices</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Lifetime Billings</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ${Number(kpis.totalBilled || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">Sum total across all generated invoices</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Realized Collections</span>
            <div className="text-2xl font-bold text-emerald-600 mt-2">
              ${Number(kpis.totalCollected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">Cleared funds reconciled in ledger</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsReports;

