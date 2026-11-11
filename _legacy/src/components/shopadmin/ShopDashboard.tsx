import React from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { StatusBadge } from '../common/StatusBadge';
import {
  ClipboardList,
  Printer,
  TrendingUp,
  CheckCircle2,
  Clock,
  QrCode,
  Coins,
  AlertCircle,
  ArrowUpRight,
  Eye,
  ShieldAlert,
  Layers,
} from 'lucide-react';

export const ShopDashboard: React.FC = () => {
  const { currentShop, setActiveView, setSelectedOrderIdForReview } = useApp();

  const shopId = currentShop?.id || 'SHOP-1001';
  // Strict multi-tenant isolation! Only query orders for this shop!
  const orders = storage.getOrders(shopId);
  const activeQr = storage.getActiveQRCode(shopId);

  const totalOrders = orders.length;
  const newOrders = orders.filter((o) => o.status === 'new').length;
  const pendingReview = orders.filter((o) => o.status === 'pending_review').length;
  const approvedOrders = orders.filter((o) => o.status === 'approved').length;
  const inProgressOrders = orders.filter((o) => ['printing_initiated', 'printing_in_progress'].includes(o.status)).length;
  const completedOrders = orders.filter((o) => ['printing_completed', 'completed_handover'].includes(o.status)).length;
  const rejectedOrders = orders.filter((o) => o.status === 'rejected').length;
  const failedOrders = orders.filter((o) => o.status === 'printing_failed').length;

  // Estimated Revenue
  const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || o.pricingSnapshot.estimatedTotal), 0);
  const verifiedRevenue = orders
    .filter((o) => o.paymentStatus === 'verified')
    .reduce((sum, o) => sum + (o.finalAmount || o.pricingSnapshot.estimatedTotal), 0);

  return (
    <div className="space-y-6">
      {/* Account Suspended Alert if applicable */}
      {currentShop?.status === 'suspended' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm">Shop Account is Suspended by Platform Admin</h4>
            <p className="mt-0.5 leading-relaxed">
              Your customer-facing QR portal is temporarily blocked. Please contact the platform
              administrator via the Support Tickets module to settle subscription dues.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-indigo-800/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-400/30">
              {currentShop?.id}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-300">{currentShop?.city}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {currentShop?.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
            Manage your counter queue, inspect customer uploads, verify print prices, and control active QR stands.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveView('qrcode')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span>Counter QR Suite</span>
          </button>
          <button
            onClick={() => setActiveView('orders')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ClipboardList className="w-4 h-4 text-indigo-400" />
            <span>View Queue ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">Total Orders</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalOrders}
          </div>
          <span className="text-[10px] text-slate-500">All submissions</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            New / Pending
          </span>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {newOrders + pendingReview}
          </div>
          <span className="text-[10px] text-slate-500">Requires review</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Approved</span>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {approvedOrders}
          </div>
          <span className="text-[10px] text-slate-500">Ready for spooler</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            Printing In Progress
          </span>
          <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {inProgressOrders}
          </div>
          <span className="text-[10px] text-slate-500">At physical printer</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Completed
          </span>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {completedOrders}
          </div>
          <span className="text-[10px] text-slate-500">Handed over</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">Estimated Sales</span>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            PKR {totalRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600">PKR {verifiedRevenue.toLocaleString()} paid</span>
        </div>
      </div>

      {/* Middle Section: Recent Incoming Orders */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Recent Customer Printing Requests
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live customer orders submitted via your shop QR code
            </p>
          </div>
          <button
            onClick={() => setActiveView('orders')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Full Orders Table</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Customer Reference</th>
                <th className="py-2.5 px-3">Files & Format</th>
                <th className="py-2.5 px-3">Copies</th>
                <th className="py-2.5 px-3">Estimated Price</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No orders received for this shop yet. Use "Simulate Customer Scan" in the QR Code Center to submit test prints!
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {order.id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {order.customerName}
                      </div>
                      <div className="text-[11px] text-slate-400">{order.customerPhone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {order.files.length} document(s)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.preferences.paperSize} • {order.preferences.colorMode.toUpperCase()} • {order.preferences.sides}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {order.preferences.copies}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      PKR {order.finalAmount || order.pricingSnapshot.estimatedTotal}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrderIdForReview(order.id);
                          setActiveView('orders');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-medium text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
