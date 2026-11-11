import React from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { StatusBadge } from '../common/StatusBadge';
import {
  Store,
  Printer,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { shops, setActiveView, setSelectedShopIdForDetails, addToast } = useApp();

  const orders = storage.getOrders();
  const subscriptions = storage.getSubscriptionPlans();
  const auditLogs = storage.getAuditLogs();

  const totalShops = shops.length;
  const activeShops = shops.filter((s) => s.status === 'active').length;
  const suspendedShops = shops.filter((s) => s.status === 'suspended').length;
  const deactivatedShops = shops.filter((s) => s.status === 'deactivated').length;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => ['new', 'pending_review'].includes(o.status)).length;
  const completedOrders = orders.filter((o) => ['printing_completed', 'completed_handover'].includes(o.status)).length;

  const totalPlatformVolume = orders.reduce((sum, o) => sum + (o.finalAmount || o.pricingSnapshot.estimatedTotal), 0);
  const subscriptionMonthlyRunRate = shops.reduce((sum, s) => {
    const plan = subscriptions.find((p) => p.id === s.subscriptionPlanId);
    return sum + (plan?.price || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
                Multi-Tenant SaaS
              </span>
              <span className="text-xs text-slate-400">Platform Control Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Central Super Administration
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Oversee independent printing shops, regulate subscriptions, inspect cross-tenant order volume, and monitor platform health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveView('shops')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Shop</span>
            </button>
            <button
              onClick={() => setActiveView('reports')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>System Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Shops Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Registered Shops
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalShops}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {activeShops} active
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Suspended: {suspendedShops}</span>
            <span>Deactivated: {deactivatedShops}</span>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Platform Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalOrders}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {pendingOrders} in queue
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Completed: {completedOrders}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>94% fulfillment</span>
            </span>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Orders Volume
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              PKR {totalPlatformVolume.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Across all print shops</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">+18% this month</span>
          </div>
        </div>

        {/* SaaS Subscriptions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              SaaS MRR (Platform)
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              PKR {subscriptionMonthlyRunRate.toLocaleString()}
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">/mo</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{subscriptions.length} active plans</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Auto-renewing</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Recent Shops & Order Trends Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Registered Shops Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Active Printing Shops
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Independent retail print tenants operating on PrintFlow
              </p>
            </div>
            <button
              onClick={() => setActiveView('shops')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View All ({shops.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Shop Details</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Orders</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {shops.map((shop) => {
                  const shopOrders = orders.filter((o) => o.shopId === shop.id);
                  return (
                    <tr key={shop.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {shop.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                            {shop.id}
                          </span>
                          <span>•</span>
                          <span>{shop.ownerName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                        {shop.city}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={shop.status} size="sm" />
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {shopOrders.length}
                        </span>{' '}
                        <span className="text-slate-400">jobs</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedShopIdForDetails(shop.id);
                            setActiveView('shop_details');
                          }}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Platform Activity & Audit Stream */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Live Audit Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Platform-wide administrative activities
              </p>
            </div>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[340px] pr-1">
            {auditLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {log.details}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>By: {log.userName}</span>
                  {log.shopId && (
                    <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      {log.shopId}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
