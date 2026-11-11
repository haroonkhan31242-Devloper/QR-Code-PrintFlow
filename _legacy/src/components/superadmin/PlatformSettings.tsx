import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Shield, Bell, Database, Save, RotateCcw } from 'lucide-react';

export const PlatformSettings: React.FC = () => {
  const { addToast } = useApp();

  const [settings, setSettings] = useState({
    platformName: 'PrintFlow Multi-Shop QR Platform',
    currency: 'PKR',
    supportEmail: 'support@printflow.io',
    platformCommissionPercent: '0%', // As specified: commercial pricing not yet finalized
    fileRetentionDays: '30',
    maxUploadSizeMB: '50',
    requireCustomerPhone: true,
    allowGuestCustomerUploads: true,
    enableAuditLogging: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Platform settings updated successfully');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Platform Configuration & Architecture
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure platform defaults, security parameters, and document storage policies
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* General */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-4 h-4 text-indigo-500" />
            <span>General Platform Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Base Billing Currency
              </label>
              <input
                type="text"
                disabled
                value="Pakistani Rupee (PKR - ₨)"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                System Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Max File Upload Limit
              </label>
              <input
                type="text"
                value={`${settings.maxUploadSizeMB} MB per batch`}
                onChange={(e) => setSettings({ ...settings, maxUploadSizeMB: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Security & Multi-Tenancy */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Security, Tenant Isolation & Privacy</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireCustomerPhone}
                onChange={(e) => setSettings({ ...settings, requireCustomerPhone: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Enforce Customer Phone Number for Order Collection
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Required by shop operators to verify recipient identity at the physical counter.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowGuestCustomerUploads}
                onChange={(e) => setSettings({ ...settings, allowGuestCustomerUploads: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Allow Frictionless Guest QR Scanning (No Mandatory Customer Account)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Per MVP specifications: customers can immediately upload and track without registration.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAuditLogging}
                onChange={(e) => setSettings({ ...settings, enableAuditLogging: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Comprehensive Audit Logging
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Record all credential resets, status toggles, QR revocations, and pricing adjustments.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
