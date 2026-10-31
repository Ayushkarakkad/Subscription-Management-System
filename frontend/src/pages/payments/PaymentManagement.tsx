import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle, 
  AlertCircle,
  FileText,
  User,
  DollarSign
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoice?: {
    invoiceNumber: string;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
  };
  customerId: string;
  customer?: {
    name: string;
    email: string;
  };
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'UPI' | 'OTHER';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
}

interface InvoiceOption {
  id: string;
  invoiceNumber: string;
  customer: { name: string };
  amountDue: number;
  status: string;
}

export const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<InvoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: '',
    notes: '',
  });

  const { showToast } = useToast();
  const { user } = useAuth();
  const canRecordPayment = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, invoicesRes] = await Promise.all([
        api.get('/payments'),
        canRecordPayment ? api.get('/invoices') : Promise.resolve({ data: { data: [] } })
      ]);

      setPayments(paymentsRes.data.data || []);
      
      if (invoicesRes.data.data) {
        // filter invoices that have an outstanding balance
        const openInvoices = invoicesRes.data.data.filter(
          (inv: any) => Number(inv.amountDue) > 0 && inv.status !== 'CANCELLED'
        );
        setUnpaidInvoices(openInvoices);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch payments data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvoiceSelect = (invoiceId: string) => {
    const inv = unpaidInvoices.find(i => i.id === invoiceId);
    setFormData(prev => ({
      ...prev,
      invoiceId,
      amount: inv ? String(inv.amountDue) : ''
    }));
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceId || !formData.amount) {
      showToast('Please select an invoice and enter amount', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/payments', {
        invoiceId: formData.invoiceId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
      });

      showToast('Payment recorded successfully', 'success');
      setIsModalOpen(false);
      setFormData({
        invoiceId: '',
        amount: '',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: '',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to record payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.customer?.name && p.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.invoice?.invoiceNumber && p.invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Reconciliation</h1>
          <p className="text-sm text-slate-500 mt-1">Audit, record manual customer payments, and track settlements.</p>
        </div>
        {canRecordPayment && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, customer, invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={6} />
          </div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            title="No payments recorded"
            description={searchTerm ? "No payments match your filter criteria." : "No payment records exist yet."}
            icon={CreditCard}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-4">Payment #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Invoice</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      {p.paymentNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{p.customer?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-400">{p.customer?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {p.invoice ? (
                        <div className="flex items-center gap-1.5 font-medium text-indigo-600">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{p.invoice.invoiceNumber}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Direct</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {p.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {p.referenceNumber || '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                      ${Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={p.status === 'SUCCESS' ? 'success' : p.status === 'PENDING' ? 'warning' : 'danger'}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Received Payment"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Outstanding Invoice *
            </label>
            <select
              required
              value={formData.invoiceId}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="">-- Choose an Invoice --</option>
              {unpaidInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - {inv.customer?.name} (Due: ${Number(inv.amountDue).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Amount Received ($) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Payment Method *
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
              <option value="CREDIT_CARD">Credit Card Terminal</option>
              <option value="UPI">UPI / Instant Pay</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              placeholder="e.g. TXN-998812739"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Internal Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              placeholder="Optional reconciliation notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default PaymentManagement;

