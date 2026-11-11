import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { PricingRule, AdditionalOption } from '../../types';
import {
  Coins,
  Save,
  Plus,
  History,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const PricingManagement: React.FC = () => {
  const { currentShop, addToast } = useApp();
  const shopId = currentShop?.id || 'SHOP-1001';

  const [pricingRules, setPricingRules] = useState<PricingRule[]>(() =>
    storage.getPricingRules(shopId)
  );
  const [additionalOptions, setAdditionalOptions] = useState<AdditionalOption[]>(() =>
    storage.getAdditionalOptions(shopId)
  );

  const handlePriceChange = (
    ruleId: string,
    field: 'pricePerPageSingle' | 'pricePerPageDouble',
    val: number
  ) => {
    setPricingRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, [field]: Number(val) } : r))
    );
  };

  const handleSaveAll = () => {
    pricingRules.forEach((rule) => {
      storage.savePricingRule(rule);
    });
    additionalOptions.forEach((opt) => {
      storage.saveAdditionalOption(opt);
    });
    addToast(
      'success',
      'Pricing Configuration Saved!',
      'New customer orders will reflect updated rates. Previously submitted orders remain unchanged.'
    );
  };

  const handleOptionPriceChange = (optId: string, price: number) => {
    setAdditionalOptions((prev) =>
      prev.map((o) => (o.id === optId ? { ...o, price: Number(price) } : o))
    );
  };

  const handleToggleOption = (optId: string) => {
    setAdditionalOptions((prev) =>
      prev.map((o) => (o.id === optId ? { ...o, enabled: !o.enabled } : o))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Shop Pricing & Rate Cards
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure dynamic per-page rates and post-print finishing charges in PKR (₨)
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Rate Cards</span>
        </button>
      </div>

      {/* Critical Multi-Tenant Pricing Rule Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 dark:text-white font-semibold block">
            Independent Tenant Pricing & Historical Snapshot Integrity
          </strong>
          <span className="leading-relaxed mt-0.5 block">
            Your rate card is isolated strictly to <strong>{currentShop?.name}</strong>. Updating your prices will never affect other shops on the platform. All previously submitted orders retain their original agreed price snapshots.
          </span>
        </div>
      </div>

      {/* Per-Page Base Pricing Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
          Per-Page Base Printing Rates
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Paper Format</th>
                <th className="py-2.5 px-3">Color Mode</th>
                <th className="py-2.5 px-3">Single-Sided Rate (PKR / page)</th>
                <th className="py-2.5 px-3">Double-Sided Rate (PKR / sheet)</th>
                <th className="py-2.5 px-3 text-right">Last Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {pricingRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {rule.paperSize}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        rule.colorMode === 'color'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {rule.colorMode === 'color' ? 'Full Colour' : 'Black & White'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 w-32">
                      <span className="font-mono text-slate-400 font-semibold">₨</span>
                      <input
                        type="number"
                        min="1"
                        value={rule.pricePerPageSingle}
                        onChange={(e) =>
                          handlePriceChange(rule.id, 'pricePerPageSingle', Number(e.target.value))
                        }
                        className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 w-32">
                      <span className="font-mono text-slate-400 font-semibold">₨</span>
                      <input
                        type="number"
                        min="1"
                        value={rule.pricePerPageDouble}
                        onChange={(e) =>
                          handlePriceChange(rule.id, 'pricePerPageDouble', Number(e.target.value))
                        }
                        className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-[11px] text-slate-400">
                    {new Date(rule.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Finishing Options Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
          Additional Finishing & Binding Surcharges
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {additionalOptions.map((opt) => (
            <div key={opt.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={opt.enabled}
                  onChange={() => handleToggleOption(opt.id)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{opt.name}</div>
                  <div className="text-[11px] text-slate-400 capitalize">Category: {opt.type.replace('_', ' ')}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-400">₨</span>
                <input
                  type="number"
                  min="0"
                  value={opt.price}
                  disabled={!opt.enabled}
                  onChange={(e) => handleOptionPriceChange(opt.id, Number(e.target.value))}
                  className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold disabled:opacity-50"
                />
                <span className="text-[11px] text-slate-400">fixed fee</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
