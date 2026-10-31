import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Badge } from "../../components/common/Badge";
import { CardSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import {
  CreditCard,
  Download,
  Calendar,
  Layers,
  ShieldCheck,
  AlertCircle,
  FileText
} from "lucide-react";

export const CustomerDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { success, error: toastError } = useToast();

  const fetchCustomerData = async () => {
    try {
      const res = await api.get("/analytics/customer");
      if (res.data?.success) setData(res.data.data);
    } catch (err: any) {
      console.error("Customer dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const handleCancelRequest = async (subId: string) => {
    if (!confirm("Are you sure you want to request cancellation for this subscription?")) return;
    try {
      await api.post(`/subscriptions/${subId}/cancel`, {
        note: "Requested by customer via dashboard"
      });
      success("Cancellation request submitted successfully");
      fetchCustomerData();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to cancel subscription");
    }
  };

  const handleDownloadPdf = async (invId: string, invNumber: string) => {
    try {
      const res = await api.get(`/invoices/${invId}/pdf`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toastError("Failed to download PDF invoice");
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const { subscriptions, invoices, payments, totalOutstanding, unpaidInvoicesCount } = data;
  const primarySub = subscriptions.find((s: any) => s.status === "ACTIVE" || s.status === "TRIAL") || subscriptions[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Customer Portal
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Manage your enterprise subscription, invoices and payment receipts
        </p>
      </div>

      {/* Primary Active Subscription Banner */}
      {primarySub ? (
        <div className="bg-gradient-to-r from-slate-900 via-navy-950 to-blue-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  Current Plan
                </span>
                <Badge status={primarySub.status} />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">
                {primarySub.plan?.name || "Enterprise Plan"}
              </h2>
              <div className="flex items-center gap-6 text-xs text-slate-300 font-medium mt-3">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Started: {new Date(primarySub.startDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Renewal:{" "}
                  {primarySub.nextBillingDate
                    ? new Date(primarySub.nextBillingDate).toLocaleDateString()
                    : "End of Term"}
                </span>
              </div>
            </div>

            <div className="text-left md:text-right flex flex-col items-start md:items-end">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                Billing Rate
              </div>
              <div className="text-3xl font-extrabold text-white">
                ${Number(primarySub.billingAmount).toFixed(2)}
                <span className="text-sm font-normal text-slate-400">
                  {" "}/ {primarySub.billingInterval.toLowerCase()}
                </span>
              </div>

              {primarySub.status === "ACTIVE" && (
                <button
                  onClick={() => handleCancelRequest(primarySub.id)}
                  className="mt-4 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-semibold border border-white/10 transition-colors"
                >
                  Request Cancellation
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Active Subscriptions"
          description="You do not have any active subscriptions. Explore available software plans."
          actionText="Browse Subscription Plans"
          onAction={() => (window.location.href = "/plans")}
        />
      )}

      {/* Outstanding Balance Alert if any */}
      {totalOutstanding > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-900">
                You have {unpaidInvoicesCount} open invoice(s)
              </div>
              <div className="text-xs text-amber-700">
                Total outstanding balance: <strong>${totalOutstanding.toFixed(2)}</strong>. Please settle to avoid disruption.
              </div>
            </div>
          </div>
          <Link
            to="/invoices"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex-shrink-0"
          >
            Review Invoices
          </Link>
        </div>
      )}

      {/* Invoices & Payment History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invoices */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Invoices & Statements
            </h3>
            <Link to="/invoices" className="text-xs font-bold text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Invoice #</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No invoices issued yet
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono font-bold text-blue-600">
                        {inv.number}
                      </td>
                      <td className="py-3 text-slate-600">
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        ${Number(inv.total).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <Badge status={inv.status} />
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDownloadPdf(inv.id, inv.number)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments History */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Payment Receipts
            </h3>
            <Link to="/payments" className="text-xs font-bold text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Invoice #</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No payments recorded yet
                    </td>
                  </tr>
                ) : (
                  payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 text-slate-600">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-mono text-blue-600 font-medium">
                        {p.invoice?.number}
                      </td>
                      <td className="py-3 text-slate-500 font-medium">
                        {p.method.replace("_", " ")}
                      </td>
                      <td className="py-3 text-right font-extrabold text-emerald-600">
                        ${Number(p.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};


export default CustomerDashboard;
