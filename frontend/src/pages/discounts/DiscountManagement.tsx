import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Discount } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { Tag, Plus, Edit2 } from "lucide-react";

export const DiscountManagement: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    scope: "BOTH" as "BOTH" | "PRODUCT" | "SUBSCRIPTION",
    value: 10.0,
    minimumPurchase: 0,
    maxUses: 100,
    isActive: true
  });

  const { success, error: toastError } = useToast();

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/discounts");
      if (res.data?.success) setDiscounts(res.data.data);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to load discounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const openCreateModal = () => {
    setEditingDiscount(null);
    setFormData({
      name: "",
      description: "",
      type: "PERCENTAGE",
      scope: "BOTH",
      value: 10.0,
      minimumPurchase: 0,
      maxUses: 100,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (d: Discount) => {
    setEditingDiscount(d);
    setFormData({
      name: d.name,
      description: d.description || "",
      type: d.type,
      scope: d.scope,
      value: Number(d.value),
      minimumPurchase: d.minimumPurchase ? Number(d.minimumPurchase) : 0,
      maxUses: d.maxUses || 100,
      isActive: d.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDiscount) {
        await api.put(`/discounts/${editingDiscount.id}`, formData);
        success("Discount updated successfully");
      } else {
        await api.post("/discounts", formData);
        success("Discount created successfully");
      }
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to save discount");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Discount & Promotion Management
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Configure coupons, percentage cuts, minimum purchase constraints and usage limits
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Discount</span>
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : discounts.length === 0 ? (
        <EmptyState
          title="No Discounts Found"
          description="Create promotional codes or flat discount credits for customers."
          actionText="Create Discount"
          onAction={openCreateModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Discount Name</th>
                <th className="py-3.5 px-4">Value</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Scope</th>
                <th className="py-3.5 px-4">Usage Count</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-900">
                    {d.name}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-blue-600">
                    {d.type === "PERCENTAGE" ? `${d.value}% Off` : `$${d.value} Flat`}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{d.type}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{d.scope}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {d.usageCount} / {d.maxUses || "∞"}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={d.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => openEditModal(d)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Discount"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Discount Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDiscount ? "Edit Discount" : "Create Promotional Discount"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Discount Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Early Bird 20%, Summer Credit $50"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Discount Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="PERCENTAGE">PERCENTAGE (%)</option>
                <option value="FIXED">FIXED AMOUNT ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Value *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={formData.type === "PERCENTAGE" ? 100 : undefined}
                required
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Purchase ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.minimumPurchase}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumPurchase: parseFloat(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Maximum Usage Limit
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxUses: parseInt(e.target.value) || 100
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Save Discount
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DiscountManagement;
