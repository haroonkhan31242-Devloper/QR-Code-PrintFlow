import React from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { StatusBadge } from '../common/StatusBadge';
import {
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  QrCode,
  Printer,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  Clock,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const ShopDetailsView: React.FC = () => {
  const { selectedShopIdForDetails, setSelectedShopIdForDetails, setActiveView, setCurrentShopId, addToast, reloadShops } = useApp();

  if (!selectedShopIdForDetails) {
    return (
      <div className="p-8 text-center text-slate-500">
        No shop selected.{' '}
        <button
          onClick={() => setActiveView('shops')}
          className="text-indigo-600 underline font-medium"
        >
          Return to shops list
        </button>
      </div>
    );
  }

  const shop = storage.getShopById(selectedShopIdForDetails);
  if (!shop) {
    return (
      <div className="p-8 text-center text-slate-500">
        Shop not found.{' '}
        <button
          onClick={() => setActiveView('shops')}
          className="text-indigo-600 underline font-medium"
        >
          Return to shops list
        </button>
      </div>
    );
  }

  const orders = storage.getOrders(shop.id);
  const services = storage.getServices(shop.id);
  const qrs = storage.getQRCodes(shop.id);
  const printers = storage.getPrinters(shop.id);
  const auditLogs = storage.getAuditLogs(shop.id);
  const subscriptions = storage.getSubscriptionPlans();
  const currentPlan = subscriptions.find((p) => p.id === shop.subscriptionPlanId);

  const completedOrders = orders.filter((o) => ['printing_completed', 'completed_handover'].includes(o.status));
  const pendingOrders = orders.filter((o) => ['new', 'pending_review', 'approved', 'printing_in_progress'].includes(o.status));
  const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || o.pricingSnapshot.estimatedTotal), 0);

  const handleToggleStatus = () => {
    const nextStatus = shop.status === 'active' ? 'suspended' : 'active';
    storage.setShopStatus(shop.id, nextStatus);
    reloadShops();
    addToast('info', `Shop status toggled to ${nextStatus.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Top back button & breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveView('shops')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Shops</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentShopId(shop.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Simulate Shop Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleStatus}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              shop.status === 'active'
                ? 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                : 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            {shop.status === 'active' ? 'Suspend Shop' : 'Reactivate Shop'}
          </button>
        </div>
      </div>

      {/* Main Shop Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shrink-0 border border-indigo-200 dark:border-indigo-800">
              <Store className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {shop.name}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  {shop.id}
                </span>
                <StatusBadge status={shop.status} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {shop.address}, {shop.city}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {shop.contactNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {shop.operatingHours}
                </span>
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Owner Name
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {shop.ownerName}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {shop.email}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Orders</span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            {orders.length}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400">
            {pendingOrders.length} currently open
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Completed Jobs</span>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {completedOrders.length}
          </div>
          <span className="text-[11px] text-slate-400">Successfully collected</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Gross Revenue</span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            PKR {totalRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Shop verified</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Subscription</span>
          <div className="mt-1 text-sm font-bold text-purple-600 dark:text-purple-400">
            {currentPlan?.name || 'Pro'}
          </div>
          <span className="text-[11px] text-slate-400">
            Expires: {new Date(shop.subscriptionExpiresAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Two columns: Left Services & QR codes; Right: Recent Orders & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: QR Code History & Services */}
        <div className="space-y-6">
          {/* QR History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  QR Code Lifecycle Records
                </h3>
              </div>
              <span className="text-xs text-slate-400">{qrs.length} issued</span>
            </div>

            <div className="space-y-2.5">
              {qrs.map((qr) => (
                <div
                  key={qr.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{qr.id}</span>
                      <StatusBadge status={qr.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Token: <code className="font-mono">{qr.token}</code> • {qr.scansCount} scans
                    </div>
                    {qr.revokedAt && (
                      <div className="text-[10px] text-rose-500 mt-0.5">
                        Revoked on {new Date(qr.revokedAt).toLocaleString()}
                        {qr.replacementRef ? ` (Replaced by ${qr.replacementRef})` : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configured Printing Services */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Enabled Printing Services ({services.length})
                </h3>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {services.map((srv) => (
                <div key={srv.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {srv.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {srv.paperSize} • {srv.colorMode.toUpperCase()} • {srv.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      PKR {srv.basePrice}
                    </span>
                    <span className="text-[10px] text-slate-400 block">base rate</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Orders & Shop Audits */}
        <div className="space-y-6">
          {/* Shop Orders */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Associated Orders ({orders.length})
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No orders recorded for this shop yet.
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="font-mono">{ord.id}</span>
                        <StatusBadge status={ord.status} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {ord.customerName} • {ord.files.length} doc(s) • {ord.preferences.colorMode.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">
                        PKR {ord.finalAmount || ord.pricingSnapshot.estimatedTotal}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(ord.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shop Activity Log */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Shop Activity Log
                </h3>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                    <span>{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {log.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
