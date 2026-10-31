import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Invoice, Customer, Product, Tax } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import {
  Receipt,
  Plus,
  Search,
  Download,
  CreditCard,
  Trash2,
  Eye
} from "lucide-react";

export const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Invoice Create Form
  const [formData, setFormData] = useState({
    customerId: "",
    dueDate: "",
    currency: "USD",
    notes: "",
    items: [{ productId: "", quantity: 1, unitPrice: 0, taxId: "", description: "" }]
  });

  // Payment Record Form
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: "BANK_TRANSFER",
    reference: "",
    note: ""
  });

  const { role } = useAuth();
  const { success, error: toastError } = useToast();
  const canManage = role === "ADMIN" || role === "STAFF";

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [invRes, custRes, prodRes, taxRes] = await Promise.all([
        api.get("/invoices", { params }),
        canManage ? api.get("/customers") : Promise.resolve({ data: { data: [] } }),
        canManage ? api.get("/products") : Promise.resolve({ data: { data: [] } }),
        canManage ? api.get("/taxes") : Promise.resolve({ data: { data: [] } })
      ]);
      if (invRes.data?.success) setInvoices(invRes.data.data);
      if (custRes.data?.success) setCustomers(custRes.data.data || []);
      if (prodRes.data?.success) setProducts(prodRes.data.data || []);
      if (taxRes.data?.success) setTaxes(taxRes.data.data || []);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const openCreateModal = () => {
    setFormData({
      customerId: customers[0]?.id || "",
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      currency: "USD",
      notes: "Standard billing statement.",
      items: [
        {
          productId: products[0]?.id || "",
          quantity: 1,
          unitPrice: products[0]?.salesPrice || 49,
          taxId: taxes[0]?.id || "",
          description: products[0]?.name || ""
        }
      ]
    });
    setIsModalOpen(true);
  };

  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    const balance = Math.max(0, Number(inv.total) - Number(inv.amountPaid));
    setPaymentForm({
      amount: balance,
      method: "BANK_TRANSFER",
      reference: `PAY-${Date.now().toString().slice(-6)}`,
      note: "Invoice settlement"
    });
    setIsPaymentModalOpen(true);
  };

  const handleDownloadPdf = async (invId: string, invNum: string) => {
    try {
      const res = await api.get(`/invoices/${invId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toastError("Failed to download PDF invoice");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/invoices", formData);
      success("Invoice created successfully");
      setIsModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to create invoice");
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.post("/payments", {
        invoiceId: selectedInvoice.id,
        amount: paymentForm.amount,
        method: paymentForm.method,
        reference: paymentForm.reference,
        note: paymentForm.note
      });
      success("Payment recorded and reconciled successfully!");
      setIsPaymentModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Payment recording failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Invoice Management
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Tax invoices, recurring billing statements and collection tracking
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchInvoices()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ISSUED">Issued (Unpaid)</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No Invoices Found"
          description="Invoices generated through recurring billing cycles or created manually will appear here."
          actionText={canManage ? "Generate Invoice" : undefined}
          onAction={openCreateModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Invoice Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const balance = Math.max(0, Number(inv.total) - Number(inv.amountPaid));
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-blue-600">
                        {inv.number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {inv.customer?.companyName || inv.customer?.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ${Number(inv.total).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-600">
                        ${Number(inv.amountPaid).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={inv.status} />
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadPdf(inv.id, inv.number)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download PDF Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {canManage && balance > 0 && inv.status !== "VOID" && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                              title="Record payment"
                            >
                              <CreditCard className="w-3 h-3" /> Record Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Record Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`Record Payment for ${selectedInvoice.number}`}
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 font-bold block">Total Invoiced</span>
                <span className="font-black text-slate-900 text-sm">
                  ${Number(selectedInvoice.total).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Already Paid</span>
                <span className="font-bold text-emerald-600 text-sm">
                  ${Number(selectedInvoice.amountPaid).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Remaining Due</span>
                <span className="font-black text-rose-600 text-sm">
                  ${(Number(selectedInvoice.total) - Number(selectedInvoice.amountPaid)).toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={Number(selectedInvoice.total) - Number(selectedInvoice.amountPaid)}
                required
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentForm.method}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, method: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                >
                  <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI">UPI / Instant</option>
                  <option value="CHEQUE">Corporate Cheque</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, reference: e.target.value })
                  }
                  placeholder="e.g. WIRE-98124"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Reconcile & Record Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invoice Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Tax Invoice"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Client *
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
                    {c.companyName || c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Product / Service *
            </label>
            <select
              required
              value={formData.items[0]?.productId}
              onChange={(e) => {
                const p = products.find((pr) => pr.id === e.target.value);
                setFormData({
                  ...formData,
                  items: [
                    {
                      productId: e.target.value,
                      quantity: 1,
                      unitPrice: p ? p.salesPrice : 0,
                      taxId: taxes[0]?.id || "",
                      description: p?.name || ""
                    }
                  ]
                });
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${Number(p.salesPrice).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formData.items[0]?.quantity || 1}
                onChange={(e) => {
                  const itms = [...formData.items];
                  itms[0].quantity = parseInt(e.target.value) || 1;
                  setFormData({ ...formData, items: itms });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.items[0]?.unitPrice || 0}
                onChange={(e) => {
                  const itms = [...formData.items];
                  itms[0].unitPrice = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, items: itms });
                }}
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvoiceManagement;
