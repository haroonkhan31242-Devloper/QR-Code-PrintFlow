import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  QrCode,
  UploadCloud,
  Printer,
  Search,
  Store,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  Clock,
  MapPin,
  Lock,
  ChevronRight,
  Sliders,
  FileText,
} from 'lucide-react';

export const PublicHome: React.FC = () => {
  const { setActiveView, setCustomerShopToken, shops, setActiveRole } = useApp();

  const activeShops = shops.filter((s) => s.status === 'active');

  const handleLaunchCustomerScan = (token: string) => {
    setCustomerShopToken(token);
    setActiveRole('customer');
    setActiveView('customer_portal');
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation QR Print Cloud</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Seamless Walk-in Printing for Modern Shops
          </h1>

          <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Eliminate USB flash drives, bluetooth pairing, and compressed WhatsApp files. Customers scan your counter QR code, upload documents directly, select paper and finishing specs, and track printing progress live.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => {
                setCustomerShopToken(activeShops[0]?.activeQrToken || 'tok_apex_gulberg_92a');
                setActiveRole('customer');
                setActiveView('customer_portal');
              }}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Counter QR & Print</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveView('track_order')}
              className="px-5 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>Track Existing Order</span>
            </button>

            <button
              onClick={() => setActiveView('shop_login')}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Shop Owner Login</span>
            </button>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <div className="text-2xl font-black text-white">0s</div>
              <div className="text-xs text-slate-400 mt-0.5">App install required</div>
            </div>
            <div>
              <div className="text-2xl font-black text-indigo-400">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Original PDF fidelity</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">PKR</div>
              <div className="text-xs text-slate-400 mt-0.5">Automated rate cards</div>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-400">Live</div>
              <div className="text-xs text-slate-400 mt-0.5">Queue telemetry</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step How It Works Workflow */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            How The Core Workflow Works
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            From QR Scan to Finished Print in Seconds
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Engineered specifically for walk-in retail printing shops, university campus copy centers, and commercial digital presses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm mb-4 border border-indigo-100 dark:border-indigo-900">
              1
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              Customer Scans QR Code
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Customer points phone camera at the shop's printed counter poster or counter display stand.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm mb-4 border border-indigo-100 dark:border-indigo-900">
              2
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              Select Category & Upload
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Uploads PDFs, DOCX, or photos directly. System auto-calculates pages and displays real-time PKR estimate.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm mb-4 border border-indigo-100 dark:border-indigo-900">
              3
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              Shop Reviews & Prints
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The shop owner receives files in their live queue dashboard, verifies specs, and sends to spooler.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm mb-4 border border-indigo-100 dark:border-indigo-900">
              4
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              Track & Handover
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Customers follow status live via Order ID (#ORD-XXXX) and pick up completed prints at counter.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration Shops Showcase */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Demonstration Network
            </h2>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              Select a Shop Counter to Test Customer Flow
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {activeShops.length} verified printing shops active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {shops.map((s) => {
            const isSuspended = s.status === 'suspended' || s.status === 'deactivated';

            return (
              <div
                key={s.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  isSuspended
                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-100 dark:border-indigo-900">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {s.name}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          {s.id} &bull; {s.city}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        s.status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {s.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </p>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-4">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{s.operatingHours}</span>
                  </div>

                  {s.adminUsername && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] mb-4">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Admin Handle:</span>
                      <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                        @{s.adminUsername}
                      </code>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleLaunchCustomerScan(s.activeQrToken)}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan Shop Counter</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Role Portals Callout */}
      <section className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-900">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Shop Owners & Operators
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Access your isolated incoming order queue, preview customer documents, configure printing rate cards, monitor printer hardware, and launch Creative AI Posters.
              </p>
            </div>
            <div className="mt-5">
              <button
                onClick={() => setActiveView('shop_login')}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Shop Owner Login Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-200 dark:border-indigo-900">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Platform Super Administration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Manage the entire multi-tenant printing network, provision new shops, manage shop administrators, monitor platform-wide orders, regulate subscription tiers, and audit platform activity.
              </p>
            </div>
            <div className="mt-5">
              <button
                onClick={() => setActiveView('super_admin_login')}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Super Admin Authentication</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
