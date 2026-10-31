import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Receipt, 
  Globe, 
  Save, 
  HelpCircle,
  FileCheck2,
  Clock
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    companyName: 'Brightloop Software Solutions Inc.',
    companyEmail: 'billing@brightloop.io',
    companyPhone: '+1 (800) 555-0199',
    companyAddress: '100 Silicon Boulevard, Innovation District, CA 94016',
    taxNumber: 'US-EIN-987654321',
    currency: 'USD',
    invoicePrefix: 'INV-',
    quotationPrefix: 'QUO-',
    defaultDueDays: 15,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load system settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/settings', {
        ...settings,
        defaultDueDays: Number(settings.defaultDueDays)
      });
      showToast('System configuration saved successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">System & Organization Settings</h1>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <LoadingSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Organization Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure global organization details, billing numbering sequences, and tax identifiers.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Organization Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Corporate & Legal Entity Details</h2>
              <p className="text-xs text-slate-400">These details appear directly on generated PDF invoices and quotations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Company Legal Name *
              </label>
              <input
                type="text"
                required
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Billing / Invoicing Email *
              </label>
              <input
                type="email"
                required
                value={settings.companyEmail}
                onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Company Phone
              </label>
              <input
                type="text"
                value={settings.companyPhone}
                onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Tax Identification / GST / VAT Number
              </label>
              <input
                type="text"
                value={settings.taxNumber}
                onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                placeholder="e.g. US-EIN-12345678"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Registered Headquarter Address
            </label>
            <textarea
              rows={2}
              value={settings.companyAddress}
              onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Invoicing & Document Sequence Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Document Prefixes & Billing Rules</h2>
              <p className="text-xs text-slate-400">Control numbering format and payment grace periods</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Default Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                required
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Quotation Number Prefix
              </label>
              <input
                type="text"
                required
                value={settings.quotationPrefix}
                onChange={(e) => setSettings({ ...settings, quotationPrefix: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Default Payment Terms (Days)
              </label>
              <input
                type="number"
                min="0"
                max="90"
                required
                value={settings.defaultDueDays}
                onChange={(e) => setSettings({ ...settings, defaultDueDays: parseInt(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Settings...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default SystemSettings;

