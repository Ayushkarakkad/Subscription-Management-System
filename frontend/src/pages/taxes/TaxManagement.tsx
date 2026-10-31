import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Tax } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { Percent, Plus, Edit2, CheckCircle2 } from "lucide-react";

export const TaxManagement: React.FC = () => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    rate: 18.0,
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    description: "",
    isActive: true
  });

  const { success, error: toastError } = useToast();

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/taxes");
      if (res.data?.success) setTaxes(res.data.data);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to load taxes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const openCreateModal = () => {
    setEditingTax(null);
    setFormData({
      name: "",
      rate: 18.0,
      type: "PERCENTAGE",
      description: "",
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Tax) => {
    setEditingTax(t);
    setFormData({
      name: t.name,
      rate: Number(t.rate),
      type: t.type,
      description: t.description || "",
      isActive: t.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTax) {
        await api.put(`/taxes/${editingTax.id}`, formData);
        success("Tax configuration updated");
      } else {
        await api.post("/taxes", formData);
        success("Tax created successfully");
      }
      setIsModalOpen(false);
      fetchTaxes();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to save tax");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Tax Management
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Regional tax rates, GST/VAT configurations and sales taxation rules
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tax Rate</span>
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : taxes.length === 0 ? (
        <EmptyState
          title="No Taxes Configured"
          description="Create your first regional tax rule."
          actionText="Add Tax Rate"
          onAction={openCreateModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Tax Name</th>
                <th className="py-3.5 px-4">Rate (%)</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxes.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-900">
                    {t.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-extrabold text-blue-600">
                    {Number(t.rate).toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {t.type}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium max-w-sm truncate">
                    {t.description || "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={t.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Tax"
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

      {/* Tax Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTax ? "Edit Tax Configuration" : "Add Tax Configuration"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tax Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Standard GST, State VAT"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rate (%) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.isActive ? "true" : "false"}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.value === "true" })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Save Tax
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaxManagement;
