import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Quotation, Customer, Product, Plan, Tax } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Download,
  CheckCircle,
  RefreshCw,
  Eye,
  Trash2
} from "lucide-react";

export const QuotationManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);

  const [formData, setFormData] = useState({
    customerId: "",
    planId: "",
    discountTotal: 0,
    validUntil: "",
    notes: "",
    items: [
      { productId: "", quantity: 1, unitPrice: 0, taxId: "" }
    ]
  });

  const { role } = useAuth();
  const { success, error: toastError } = useToast();
  const canManage = role === "ADMIN" || role === "STAFF";

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [qRes, cRes, pRes, plRes, tRes] = await Promise.all([
        api.get("/quotations", { params }),
        canManage ? api.get("/customers") : Promise.resolve({ data: { data: [] } }),
        canManage ? api.get("/products") : Promise.resolve({ data: { data: [] } }),
        canManage ? api.get("/plans") : Promise.resolve({ data: { data: [] } }),
        canManage ? api.get("/taxes") : Promise.resolve({ data: { data: [] } })
      ]);
      if (qRes.data?.success) setQuotations(qRes.data.data);
      if (cRes.data?.success) setCustomers(cRes.data.data || []);
      if (pRes.data?.success) setProducts(pRes.data.data || []);
      if (plRes.data?.success) setPlans(plRes.data.data || []);
      if (tRes.data?.success) setTaxes(tRes.data.data || []);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const openCreateModal = () => {
    setFormData({
      customerId: customers[0]?.id || "",
      planId: plans[0]?.id || "",
      discountTotal: 0,
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      notes: "Proposal valid for 30 days.",
      items: [
        {
          productId: products[0]?.id || "",
          quantity: 1,
          unitPrice: products[0]?.salesPrice || 49,
          taxId: taxes[0]?.id || ""
        }
      ]
    });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: products[0]?.id || "",
          quantity: 1,
          unitPrice: products[0]?.salesPrice || 49,
          taxId: taxes[0]?.id || ""
        }
      ]
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...formData.items];
    (updated[index] as any)[field] = val;
    if (field === "productId") {
      const prod = products.find((p) => p.id === val);
      if (prod) updated[index].unitPrice = prod.salesPrice;
    }
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/quotations", formData);
      success("Quotation generated successfully");
      setIsModalOpen(false);
      fetchQuotations();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to create quotation");
    }
  };

  const handleConvert = async (qId: string) => {
    if (!confirm("Convert this approved quotation into an active subscription?")) return;
    try {
      await api.post(`/quotations/${qId}/convert`);
      success("Converted to subscription successfully!");
      fetchQuotations();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Conversion failed");
    }
  };

  const handleDownloadPdf = async (qId: string, qNum: string) => {
    try {
      const res = await api.get(`/quotations/${qId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `quotation-${qNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toastError("Failed to download PDF quotation");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quotation Management
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Commercial proposals, tax calculations and conversion to active contracts
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quotation</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quotations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchQuotations()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="CONVERTED">Converted</option>
        </select>
      </div>

      {/* Quotations Table */}
      {loading ? (
        <TableSkeleton />
      ) : quotations.length === 0 ? (
        <EmptyState
          title="No Quotations Found"
          description="Create client proposals and convert them to subscriptions."
          actionText={canManage ? "New Quotation" : undefined}
          onAction={openCreateModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Quotation #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Subtotal</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-blue-600">
                      {q.number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {q.customer?.companyName || q.customer?.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {q.plan?.name || "Custom items"}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      ${Number(q.subtotal).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      ${Number(q.total).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={q.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadPdf(q.id, q.number)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {canManage && q.status !== "CONVERTED" && (
                          <button
                            onClick={() => handleConvert(q.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                            title="Convert to Subscription"
                          >
                            <RefreshCw className="w-3 h-3" /> Convert
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

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Client Proposal / Quotation"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Client Account *
              </label>
              <select
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subscription Plan (Optional)
              </label>
              <select
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="">None / Custom Items Only</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${Number(p.price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Proposal Line Items</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add item
              </button>
            </div>

            {formData.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <select
                  required
                  value={item.productId}
                  onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${Number(p.salesPrice).toFixed(2)})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  required
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                  className="w-16 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  placeholder="Qty"
                />

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  placeholder="Price"
                />

                <select
                  value={item.taxId}
                  onChange={(e) => handleItemChange(idx, "taxId", e.target.value)}
                  className="w-28 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">No Tax</option>
                  {taxes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.rate}%)
                    </option>
                  ))}
                </select>

                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Discount Total ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.discountTotal}
                onChange={(e) => setFormData({ ...formData, discountTotal: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20"
            >
              Generate Quotation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuotationManagement;
