import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Customer } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/EmptyState";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Eye,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  Receipt
} from "lucide-react";

export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "USA",
    postalCode: "",
    taxNumber: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    notes: ""
  });

  const { success, error: toastError } = useToast();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/customers", { params });
      if (res.data?.success) setCustomers(res.data.data);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      companyName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "USA",
      postalCode: "",
      taxNumber: "",
      status: "ACTIVE",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name || "",
      companyName: c.companyName || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      country: c.country || "USA",
      postalCode: c.postalCode || "",
      taxNumber: c.taxNumber || "",
      status: c.status || "ACTIVE",
      notes: c.notes || ""
    });
    setIsModalOpen(true);
  };

  const viewCustomerDetails = async (c: Customer) => {
    try {
      const res = await api.get(`/customers/${c.id}`);
      if (res.data?.success) {
        setSelectedCustomer(res.data.data);
        setIsViewOpen(true);
      }
    } catch (err) {
      toastError("Failed to fetch customer details");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        success("Customer updated successfully");
      } else {
        await api.post("/customers", formData);
        success("Customer added successfully");
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to save customer");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Accounts
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Directory of corporate entities, contact profiles and commercial records
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, contact, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <TableSkeleton />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No Customers Found"
          description="Add your first customer account to get started."
          actionText="Add New Customer"
          onAction={openCreateModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Company & Contact</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Tax ID</th>
                  <th className="py-3.5 px-4">Records</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900">
                        {c.companyName || c.name}
                      </div>
                      {c.companyName && c.name && (
                        <div className="text-slate-400 font-medium">Attn: {c.name}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium">{c.email}</div>
                      {c.phone && <div className="text-slate-400">{c.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {c.taxNumber || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]">
                          {c._count?.subscriptions || 0} Subs
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                          {c._count?.invoices || 0} Invoices
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={c.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewCustomerDetails(c)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Edit Customer Record" : "Add New Customer Account"}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                placeholder="Enterprise Corp"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Contact Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Billing Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="billing@company.com"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Billing Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="100 Main St, Suite 400"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State / Region
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) =>
                  setFormData({ ...formData, postalCode: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tax Identification Number
              </label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) =>
                  setFormData({ ...formData, taxNumber: e.target.value })
                }
                placeholder="EIN, VAT or GST number"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "ACTIVE" | "INACTIVE"
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Internal Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Commercial terms, relationship details, special requirements..."
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
              {editingCustomer ? "Update Customer" : "Save Customer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer 360 View Drawer / Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={selectedCustomer.companyName || selectedCustomer.name}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">Contact Person</span>
                <span className="font-bold text-slate-900">{selectedCustomer.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Email</span>
                <span className="font-bold text-slate-900">{selectedCustomer.email}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Tax ID</span>
                <span className="font-bold text-slate-900">{selectedCustomer.taxNumber || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Address</span>
                <span className="font-bold text-slate-900">
                  {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.country}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Status</span>
                <Badge status={selectedCustomer.status} />
              </div>
            </div>

            {/* Subscriptions */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                Active & Past Subscriptions
              </h4>
              <div className="space-y-2">
                {selectedCustomer.subscriptions?.length === 0 ? (
                  <p className="text-xs text-slate-400">No subscriptions on record</p>
                ) : (
                  selectedCustomer.subscriptions?.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-blue-600 mr-2">{sub.number}</span>
                        <span className="font-bold text-slate-900">{sub.plan?.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-900">
                          ${Number(sub.billingAmount).toFixed(2)}
                        </span>
                        <Badge status={sub.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Invoices */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                Recent Invoices
              </h4>
              <div className="space-y-2">
                {selectedCustomer.invoices?.length === 0 ? (
                  <p className="text-xs text-slate-400">No invoices on record</p>
                ) : (
                  selectedCustomer.invoices?.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-blue-600 mr-2">{inv.number}</span>
                        <span className="text-slate-500">
                          {new Date(inv.invoiceDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-900">
                          ${Number(inv.total).toFixed(2)}
                        </span>
                        <Badge status={inv.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};


export default CustomerManagement;
