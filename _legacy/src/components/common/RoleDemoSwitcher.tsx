import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage, DEMO_USERS } from '../../services/storage';
import {
  ShieldCheck,
  Store,
  QrCode,
  Search,
  Sparkles,
  RotateCcw,
  Sun,
  Moon,
  ChevronDown,
  Layers,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';

export const RoleDemoSwitcher: React.FC = () => {
  const {
    currentUser,
    switchUser,
    activeRole,
    setActiveRole,
    activeView,
    setActiveView,
    theme,
    toggleTheme,
    currentShop,
    resetPlatformData,
    setCustomerShopToken,
  } = useApp();


  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Demo Trigger (Discreet bottom-right corner) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white shadow-xl hover:shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all text-xs font-semibold hover:scale-105 cursor-pointer group"
            title="Open Demo Role Switcher"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 group-hover:text-white">Role Switcher</span>
            <span className="text-[10px] bg-slate-800 text-indigo-400 px-1.5 py-0.5 rounded font-mono border border-slate-700">
              {activeRole === 'super_admin' ? 'Super Admin' : activeRole === 'shop_admin' ? currentShop?.id || 'Shop' : 'Customer'}
            </span>
          </button>
        ) : (
          <div className="w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-4 text-white text-xs space-y-3.5 animate-in fade-in slide-in-from-bottom-4 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-slate-100">Quick Role Switcher</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleTheme}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Active state preview */}
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Context:</div>
              <div className="font-semibold text-indigo-300 mt-0.5">
                {activeRole === 'super_admin'
                  ? 'Super Admin Platform Oversight'
                  : activeRole === 'shop_admin'
                  ? `${currentShop?.name} (${currentShop?.id})`
                  : 'Public / Customer Experience'}
              </div>
              <div className="text-[11px] text-slate-400">
                User: {currentUser.name} {currentUser.username ? `(@${currentUser.username})` : ''}
              </div>
            </div>

            {/* Super Admin Section */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Platform Administration
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    const su = DEMO_USERS.find((u) => u.role === 'super_admin');
                    if (su) switchUser(su);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                    activeRole === 'super_admin'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                  <span className="truncate">Super Admin</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView('super_admin_login');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                    activeView === 'super_admin_login'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Super Admin Login Portal"
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Admin Login</span>
                </button>
              </div>
            </div>

            {/* Shop Admin Accounts */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Printing Shop Accounts
              </div>
              <div className="space-y-1">
                {DEMO_USERS.filter((u) => u.role === 'shop_admin').map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  const shop = storage.getShopById(u.shopId || '');
                  const isSuspended = shop?.status === 'suspended' || shop?.status === 'deactivated';

                  return (
                    <button
                      key={u.id}
                      onClick={() => switchUser(u)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                        isCurrent
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate text-xs">{shop?.name || u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.shopId} {isSuspended ? '(Suspended)' : ''}</div>
                      </div>
                      {isCurrent && (
                        <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded font-mono">
                          ACTIVE
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  onClick={() => setActiveView('shop_login')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeView === 'shop_login'
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-slate-800/80 text-amber-300 hover:bg-slate-700'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Dedicated /shop/login Page</span>
                </button>
              </div>
            </div>

            {/* Public & Customer Section */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Customer & Public Flows
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setActiveRole('customer');
                    setActiveView('home');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                    activeRole === 'customer' && activeView === 'home'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Public Home
                </button>

                <button
                  onClick={() => {
                    setActiveRole('customer');
                    setCustomerShopToken('tok_apex_gulberg_92a');
                    setActiveView('customer_portal');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                    activeRole === 'customer' && activeView === 'customer_portal'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Scan Counter QR
                </button>
              </div>
            </div>

            {/* Reset Data Button */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 text-[11px] text-rose-400 hover:text-rose-300 py-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo Baseline</span>
              </button>
              <span className="text-[10px] text-slate-500 font-mono">v2.5</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Demo Data Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg">Reset Demonstration Data?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              This will restore all shops, orders, pricing rules, QR codes, and audit logs
              back to the pristine initial demonstration baseline. Any temporary test orders
              you created will be refreshed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetPlatformData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-xs transition-colors"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
