import React from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';

export const ShopReports: React.FC = () => {
  const { currentShop, addToast } = useApp();
  const shopId = currentShop?.id || 'SHOP-1001';

  // Strict tenant isolation!
  const orders = storage.getOrders(shopId);

  const totalRev = orders.reduce((sum, o) => sum + (o.finalAmount || o.pricingSnapshot.estimatedTotal), 0);
  const completedOrders = orders.filter((o) => ['printing_completed', 'completed_handover'].includes(o.status));
  const rejectedOrders = orders.filter((o) => o.status === 'rejected');

  const bwOrders = orders.filter((o) => o.preferences.colorMode === 'bw').length;
  const colorOrders = orders.filter((o) => o.preferences.colorMode === 'color').length;

  const handleExportShopCSV = () => {
    const rows = [
      ['Order ID', 'Customer Name', 'Phone', 'Date', 'Status', 'Payment Status', 'Total (PKR)'],
      ...orders.map((o) => [
        o.id,
        o.customerName,
        o.customerPhone,
        new Date(o.submittedAt).toLocaleDateString(),
        o.status,
        o.paymentStatus,
        (o.finalAmount || o.pricingSnapshot.estimatedTotal).toString(),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${shopId}_orders_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Exported shop orders CSV');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sales & Order Processing Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily throughput, queue fulfillment rate, and format distribution for {currentShop?.name}
          </p>
        </div>

        <button
          onClick={handleExportShopCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Cumulative Turnover</span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            PKR {totalRev.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
            {orders.length} total customer submissions
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Fulfillment Success Rate</span>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {orders.length > 0
              ? Math.round((completedOrders.length / (orders.length - rejectedOrders.length || 1)) * 100)
              : 100}
            %
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            {completedOrders.length} collected jobs
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Format Breakdown</span>
          <div className="mt-1 text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>B&W: {bwOrders}</span>
            <span>•</span>
            <span className="text-purple-600 dark:text-purple-400">Colour: {colorOrders}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Paper size distribution
          </span>
        </div>
      </div>

      {/* Recent Audit Events */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
          Shop Operations Activity
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {storage.getAuditLogs(shopId).slice(0, 8).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">{log.action}</span>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-0.5">
                  {log.details}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
