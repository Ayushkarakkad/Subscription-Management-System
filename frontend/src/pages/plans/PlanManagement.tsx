import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Plan, BillingInterval, Product } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Check,
  Calendar,
  Sparkles,
  ArrowRight
} from "lucide-react";

export const PlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [intervalFilter, setIntervalFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 99.0,
    billingInterval: "MONTHLY" as BillingInterval,
    trialPeriodDays: 14,
    minimumQuantity: 1,
    isActive: true,
    productId: ""
  });

  const { role } = useAuth();
  const { success, error: toastError } = useToast();
  const canManage = role === "ADMIN" || role === "STAFF";

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (intervalFilter) params.billingInterval = intervalFilter;
      const [plansRes, prodsRes] = await Promise.all([
        api.get("/plans", { params }),
        canManage ? api.get("/products") : Promise.resolve({ data: { data: [] } })
      ]);
      if (plansRes.data?.success) setPlans(plansRes.data.data);
      if (prodsRes.data?.success) setProducts(prodsRes.data.data || []);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [intervalFilter]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      price: 99.0,
      billingInterval: "MONTHLY",
      trialPeriodDays: 14,
      minimumQuantity: 1,
      isActive: true,
      productId: products[0]?.id || ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Plan) => {
    setEditingPlan(p);
    setFormData({
      name: p.name,
      description: p.description || "",
      price: p.price,
      billingInterval: p.billingInterval,
      trialPeriodDays: p.trialPeriodDays || 0,
      minimumQuantity: p.minimumQuantity || 1,
      isActive: p.isActive,
      productId: ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          billingInterval: formData.billingInterval,
          trialPeriodDays: formData.trialPeriodDays,
          minimumQuantity: formData.minimumQuantity,
          isActive: formData.isActive
        });
        success("Subscription plan updated");
      } else {
        const payload: any = {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          billingInterval: formData.billingInterval,
          trialPeriodDays: formData.trialPeriodDays,
          minimumQuantity: formData.minimumQuantity,
          isActive: formData.isActive
        };
        if (formData.productId) {
          payload.products = [
            { productId: formData.productId, quantity: 1, unitPrice: formData.price }
          ];
        }
        await api.post("/plans", payload);
        success("Subscription plan created");
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to save plan");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Subscription Plans
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Commercial tiers, recurring billing schedules, and included product packages
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <select
          value={intervalFilter}
          onChange={(e) => setIntervalFilter(e.target.value)}
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm focus:outline-none"
        >
          <option value="">All Billing Intervals</option>
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="HALF_YEARLY">Half-Yearly</option>
          <option value="YEARLY">Yearly</option>
        </select>
      </div>

      {/* Plan Cards Grid */}
      {loading ? (
        <TableSkeleton />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No Plans Configured"
          description="Create your first subscription plan to start billing subscribers."
          actionText={canManage ? "Create Plan" : undefined}
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => {
            const planProducts = p.planProducts || [];
            const isPopular = p.name.toLowerCase().includes("pro");

            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl p-7 border shadow-sm transition-all flex flex-col justify-between relative ${
                  isPopular
                    ? "border-blue-500 ring-2 ring-blue-500/20 shadow-blue-500/5"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 text-white font-extrabold text-[10px] tracking-wider uppercase rounded-full shadow-md shadow-blue-600/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {p.name}
                    </h3>
                    <Badge status={p.isActive ? "ACTIVE" : "INACTIVE"} />
                  </div>

                  <p className="text-xs text-slate-500 font-medium mb-6 min-h-[32px]">
                    {p.description || "Comprehensive SaaS enterprise subscription plan."}
                  </p>

                  {/* Pricing Display */}
                  <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">
                        ${Number(p.price).toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        / {p.billingInterval.toLowerCase()}
                      </span>
                    </div>
                    {p.trialPeriodDays > 0 && (
                      <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Includes {p.trialPeriodDays}-day free trial evaluation
                      </div>
                    )}
                  </div>

                  {/* Included Products */}
                  <div className="space-y-2.5 mb-6">
                    <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Included Platform Features
                    </div>
                    {planProducts.length === 0 ? (
                      <div className="text-xs text-slate-400">
                        All-access platform suite
                      </div>
                    ) : (
                      planProducts.map((pp) => (
                        <div
                          key={pp.id}
                          className="flex items-center gap-2 text-xs font-medium text-slate-700"
                        >
                          <div className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span>
                            {pp.product?.name || "Product"} ({pp.quantity}x)
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {canManage ? (
                    <>
                      <div className="text-xs text-slate-400 font-medium">
                        {p._count?.subscriptions || 0} active subscribers
                      </div>
                      <button
                        onClick={() => openEditModal(p)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => (window.location.href = `/quotations?planId=${p.id}`)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Request Quotation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Professional Suite"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recurring Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Billing Interval *
              </label>
              <select
                value={formData.billingInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingInterval: e.target.value as BillingInterval
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="HALF_YEARLY">Half-Yearly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trial Period (Days)
              </label>
              <input
                type="number"
                min="0"
                value={formData.trialPeriodDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trialPeriodDays: parseInt(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Plan Status
              </label>
              <select
                value={formData.isActive ? "true" : "false"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isActive: e.target.value === "true"
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="true">Active (Available)</option>
                <option value="false">Archived / Inactive</option>
              </select>
            </div>
          </div>

          {!editingPlan && products.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Product
              </label>
              <select
                value={formData.productId}
                onChange={(e) =>
                  setFormData({ ...formData, productId: e.target.value })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="">None / Standalone plan</option>
                {products.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name} (${Number(pr.salesPrice).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20"
            >
              Save Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


export default PlanManagement;
