import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Subscription, Plan } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import {
  RefreshCw,
  Search,
  Play,
  Pause,
  XCircle,
  Eye,
  Calendar,
  Zap,
  ArrowRight
} from "lucide-react";

export const SubscriptionManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [newPlanId, setNewPlanId] = useState("");
  const [runningBilling, setRunningBilling] = useState(false);

  const { role } = useAuth();
  const { success, error: toastError } = useToast();
  const canManage = role === "ADMIN" || role === "STAFF";

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [subRes, plRes] = await Promise.all([
        api.get("/subscriptions", { params }),
        api.get("/plans")
      ]);
      if (subRes.data?.success) setSubscriptions(subRes.data.data);
      if (plRes.data?.success) setPlans(plRes.data.data || []);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  const viewDetails = async (id: string) => {
    try {
      const res = await api.get(`/subscriptions/${id}`);
      if (res.data?.success) {
        setSelectedSub(res.data.data);
        setIsViewOpen(true);
      }
    } catch (err) {
      toastError("Failed to fetch subscription details");
    }
  };

  const handlePause = async (id: string) => {
    try {
      await api.post(`/subscriptions/${id}/pause`, { note: "Paused from dashboard" });
      success("Subscription paused");
      fetchSubscriptions();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to pause");
    }
  };

  const handleResume = async (id: string) => {
    try {
      await api.post(`/subscriptions/${id}/resume`, { note: "Resumed from dashboard" });
      success("Subscription resumed");
      fetchSubscriptions();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to resume");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this contract?")) return;
    try {
      await api.post(`/subscriptions/${id}/cancel`, { note: "Cancelled from dashboard" });
      success("Subscription cancelled");
      fetchSubscriptions();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to cancel");
    }
  };

  const handleRenew = async (id: string) => {
    try {
      await api.post(`/subscriptions/${id}/renew`, { note: "Renewed from dashboard" });
      success("Subscription renewed");
      fetchSubscriptions();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to renew");
    }
  };

  const handleChangePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !newPlanId) return;
    try {
      await api.post(`/subscriptions/${selectedSub.id}/change-plan`, {
        planId: newPlanId
      });
      success("Subscription plan updated");
      setIsChangePlanOpen(false);
      fetchSubscriptions();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to change plan");
    }
  };

  const handleRunBillingCycle = async () => {
    setRunningBilling(true);
    try {
      const res = await api.post("/subscriptions/run-billing-cycle");
      if (res.data?.success) {
        success(
          `Billing cycle completed! Generated ${res.data.data.invoicesGenerated} invoices.`
        );
        fetchSubscriptions();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || "Billing cycle failed");
    } finally {
      setRunningBilling(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Subscription Lifecycle
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Active recurring contracts, pause/resume controls and renewal automation
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleRunBillingCycle}
            disabled={runningBilling}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{runningBilling ? "Running Billing..." : "Run Recurring Billing Engine"}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchSubscriptions()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="TRIAL">Trial</option>
          <option value="PAUSED">Paused</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <TableSkeleton />
      ) : subscriptions.length === 0 ? (
        <EmptyState
          title="No Subscriptions Found"
          description="Subscriptions generated from accepted quotations or created by staff will appear here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Subscription #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Amount / Interval</th>
                  <th className="py-3.5 px-4">Next Billing Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-blue-600">
                      {s.number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {s.customer?.companyName || s.customer?.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {s.plan?.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900">
                        ${Number(s.billingAmount).toFixed(2)}
                      </span>
                      <span className="text-slate-400 font-medium ml-1">
                        / {s.billingInterval.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {s.nextBillingDate
                        ? new Date(s.nextBillingDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={s.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => viewDetails(s.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canManage && s.status === "ACTIVE" && (
                          <button
                            onClick={() => handlePause(s.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Pause"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}

                        {canManage && s.status === "PAUSED" && (
                          <button
                            onClick={() => handleResume(s.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Resume"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}

                        {canManage && s.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleCancel(s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscription Details Modal */}
      {selectedSub && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`Subscription ${selectedSub.number}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">Customer</span>
                <span className="font-bold text-slate-900">
                  {selectedSub.customer?.companyName || selectedSub.customer?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Current Plan</span>
                <span className="font-bold text-slate-900">{selectedSub.plan?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Status</span>
                <Badge status={selectedSub.status} />
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Start Date</span>
                <span className="font-bold text-slate-900">
                  {new Date(selectedSub.startDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Next Billing</span>
                <span className="font-bold text-slate-900">
                  {selectedSub.nextBillingDate
                    ? new Date(selectedSub.nextBillingDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Billing Rate</span>
                <span className="font-extrabold text-blue-600">
                  ${Number(selectedSub.billingAmount).toFixed(2)} / {selectedSub.billingInterval.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Lifecycle History Log */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                Contract History & Event Log
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedSub.history?.length === 0 ? (
                  <p className="text-xs text-slate-400">No events logged</p>
                ) : (
                  selectedSub.history?.map((h: any) => (
                    <div
                      key={h.id}
                      className="p-3 bg-white border border-slate-100 rounded-xl text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {h.note || `Transitioned to ${h.toStatus}`}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          By: {h.changedBy?.name || "System"} •{" "}
                          {new Date(h.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge status={h.toStatus} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {canManage && selectedSub.status !== "CANCELLED" && (
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleRenew(selectedSub.id)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Advance Renewal Date
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsViewOpen(false);
                    setNewPlanId(selectedSub.planId);
                    setIsChangePlanOpen(true);
                  }}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Change Plan Tier
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Change Plan Modal */}
      <Modal
        isOpen={isChangePlanOpen}
        onClose={() => setIsChangePlanOpen(false)}
        title="Upgrade or Change Subscription Plan"
      >
        <form onSubmit={handleChangePlanSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select New Plan *
            </label>
            <select
              required
              value={newPlanId}
              onChange={(e) => setNewPlanId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${Number(p.price).toFixed(2)} / {p.billingInterval.toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsChangePlanOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20"
            >
              Confirm Plan Change
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubscriptionManagement;
