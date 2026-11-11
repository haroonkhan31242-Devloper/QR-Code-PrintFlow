import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { SubscriptionPlan } from '../../types';
import {
  CreditCard,
  Plus,
  Check,
  Building,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';

export const SubscriptionManagement: React.FC = () => {
  const { shops, reloadShops, addToast } = useApp();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => storage.getSubscriptionPlans());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assignShopModal, setAssignShopModal] = useState<string | null>(null);

  const [newPlan, setNewPlan] = useState({
    name: '',
    price: 5000,
    billingPeriod: 'monthly' as const,
    description: '',
    featuresText: 'High speed queue\nCustom QR code\nOrder notifications',
  });

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `PLAN-${Date.now().toString().slice(-4)}`;
    const features = newPlan.featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const plan: SubscriptionPlan = {
      id,
      name: newPlan.name,
      price: Number(newPlan.price),
      billingPeriod: newPlan.billingPeriod,
      description: newPlan.description,
      features,
      activeShopsCount: 0,
    };

    storage.saveSubscriptionPlan(plan);
    setPlans(storage.getSubscriptionPlans());
    setIsAddModalOpen(false);
    addToast('success', `Created subscription plan ${plan.name}`);
  };

  const handleAssignPlan = (shopId: string, planId: string) => {
    storage.updateShop(shopId, {
      subscriptionPlanId: planId,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    reloadShops();
    setAssignShopModal(null);
    addToast('success', 'Assigned subscription plan to shop');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Subscription Tier Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define SaaS billing tiers and manage print shop subscriptions
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Subscription Plan</span>
        </button>
      </div>

      {/* Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const subscribedShops = shops.filter((s) => s.subscriptionPlanId === plan.id);
          return (
            <div
              key={plan.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                    {subscribedShops.length} shop{subscribedShops.length === 1 ? '' : 's'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    PKR {plan.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">/{plan.billingPeriod}</span>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 mb-6">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Plan Features:
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="text-[11px] text-slate-400 mb-2">Active Tenants:</div>
                <div className="flex flex-wrap gap-1.5">
                  {subscribedShops.length === 0 ? (
                    <span className="text-slate-400 italic">No shops currently assigned</span>
                  ) : (
                    subscribedShops.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                      >
                        {s.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shop Subscriptions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
          Tenant Subscription Statuses
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Shop</th>
                <th className="py-2.5 px-3">Current Plan</th>
                <th className="py-2.5 px-3">Renewal Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Change Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {shops.map((shop) => {
                const plan = plans.find((p) => p.id === shop.subscriptionPlanId);
                return (
                  <tr key={shop.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {shop.name}
                      </div>
                      <div className="font-mono text-slate-400 text-[11px]">{shop.id}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-purple-600 dark:text-purple-400">
                      {plan?.name || 'Not Assigned'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {new Date(shop.subscriptionExpiresAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px]">
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setAssignShopModal(shop.id)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
                      >
                        Reassign
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Plan Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Create Subscription Plan
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Platinum Multi-Counter"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={newPlan.billingPeriod}
                    onChange={(e) => setNewPlan({ ...newPlan, billingPeriod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="Target audience or shop scale..."
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Features (one per line)
                </label>
                <textarea
                  rows={4}
                  value={newPlan.featuresText}
                  onChange={(e) => setNewPlan({ ...newPlan, featuresText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Plan Modal */}
      {assignShopModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              Assign Plan to {shops.find((s) => s.id === assignShopModal)?.name}
            </h3>

            <div className="space-y-2 mb-4">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleAssignPlan(assignShopModal, p.id)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 transition-colors text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-slate-500 dark:text-slate-400">
                      PKR {p.price}/mo
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setAssignShopModal(null)}
              className="w-full py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
