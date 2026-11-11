import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleDemoSwitcher } from './components/common/RoleDemoSwitcher';
import { TopHeader } from './components/common/TopHeader';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';

// Super Admin Views
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { ShopManagement } from './components/superadmin/ShopManagement';
import { ShopDetailsView } from './components/superadmin/ShopDetailsView';
import { SubscriptionManagement } from './components/superadmin/SubscriptionManagement';
import { PlatformReports } from './components/superadmin/PlatformReports';
import { SupportTickets } from './components/superadmin/SupportTickets';
import { PlatformSettings } from './components/superadmin/PlatformSettings';
import { ShopAdministratorsView } from './components/superadmin/ShopAdministratorsView';
import { AllOrdersView } from './components/superadmin/AllOrdersView';

// Shop Admin Views
import { ShopDashboard } from './components/shopadmin/ShopDashboard';
import { ShopOrderManagement } from './components/shopadmin/ShopOrderManagement';
import { PrintingServicesManagement } from './components/shopadmin/PrintingServicesManagement';
import { PricingManagement } from './components/shopadmin/PricingManagement';
import { QRCodeManagement } from './components/shopadmin/QRCodeManagement';
import { PrinterConfiguration } from './components/shopadmin/PrinterConfiguration';
import { DocumentManagement } from './components/shopadmin/DocumentManagement';
import { ShopProfileManagement } from './components/shopadmin/ShopProfileManagement';
import { ShopReports } from './components/shopadmin/ShopReports';
import { ShopCategoriesManagement } from './components/shopadmin/ShopCategoriesManagement';

// Authentication Views
import { ShopLogin } from './components/auth/ShopLogin';
import { SuperAdminLogin } from './components/auth/SuperAdminLogin';

// Customer & Public Views
import { PublicHome } from './components/customer/PublicHome';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { OrderTracker } from './components/customer/OrderTracker';

// Creative AI Studio
import { CreativePrintStudio } from './components/creative/CreativePrintStudio';

import {
  QrCode,
  Search,
  Sparkles,
  Store,
  ShieldCheck,
  KeyRound,
  LogIn,
  Sun,
  Moon,
  Home,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeRole, activeView, setActiveView, setActiveRole, currentShop, theme, toggleTheme } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);

  // 0. Dedicated Super Admin Login View
  if (activeView === 'super_admin_login') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <RoleDemoSwitcher />
        <SuperAdminLogin />
      </div>
    );
  }

  // 1. Dedicated Shop Owner Login View (at /shop/login or activeView === 'shop_login')
  if (activeView === 'shop_login') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        <RoleDemoSwitcher />
        <ShopLogin />
      </div>
    );
  }

  // 2. Customer & Public Experience (Dedicated Portal Layout)
  if (activeRole === 'customer') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        <RoleDemoSwitcher />

        {/* Clean, Dedicated Public Top Navigation */}
        <header className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2.5 cursor-pointer font-extrabold text-base tracking-tight text-slate-900 dark:text-white"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span>PrintFlow</span>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Express</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 text-xs">
            <button
              onClick={() => setActiveView('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                activeView === 'home'
                  ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveView('customer_portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                activeView === 'customer_portal'
                  ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan & Upload</span>
            </button>

            <button
              onClick={() => setActiveView('track_order')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                activeView === 'track_order'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-amber-500" />
              <span>Track Order</span>
            </button>
          </nav>

          {/* Right Action Portal Dropdown */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Role Authentication Menu */}
            <div className="relative">
              <button
                onClick={() => setLoginMenuOpen(!loginMenuOpen)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-300 dark:text-white" />
                <span>Portal Login</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>

              {loginMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 z-50 text-xs"
                  onClick={() => setLoginMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Administrative Access
                  </div>

                  <button
                    onClick={() => setActiveView('shop_login')}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Shop Owner Login</div>
                      <div className="text-[11px] text-slate-500">Access shop queue & rates</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveView('super_admin_login')}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800/80"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Super Admin Portal</div>
                      <div className="text-[11px] text-slate-500">Platform-wide governance</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Customer Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeView === 'customer_portal' ? (
            <CustomerPortal />
          ) : activeView === 'track_order' ? (
            <OrderTracker />
          ) : activeView === 'creative_studio' ? (
            <CreativePrintStudio />
          ) : (
            <PublicHome />
          )}
        </main>
      </div>
    );
  }

  // 3. Administrative Layout (Super Admin or Shop Admin)
  const renderAdminView = () => {
    if (activeRole === 'super_admin') {
      switch (activeView) {
        case 'dashboard':
          return <SuperAdminDashboard />;
        case 'shops':
          return <ShopManagement />;
        case 'shop_admins':
          return <ShopAdministratorsView />;
        case 'all_orders':
          return <AllOrdersView />;
        case 'shop_details':
          return <ShopDetailsView />;
        case 'subscriptions':
          return <SubscriptionManagement />;
        case 'reports':
          return <PlatformReports />;
        case 'support':
          return <SupportTickets />;
        case 'settings':
          return <PlatformSettings />;
        case 'creative_studio':
          return <CreativePrintStudio />;
        default:
          return <SuperAdminDashboard />;
      }
    } else {
      // Shop Admin
      switch (activeView) {
        case 'dashboard':
          return <ShopDashboard />;
        case 'orders':
          return <ShopOrderManagement />;
        case 'all_orders':
          return <ShopOrderManagement />;
        case 'categories':
          return <ShopCategoriesManagement />;
        case 'services':
          return <PrintingServicesManagement />;
        case 'pricing':
          return <PricingManagement />;
        case 'qrcode':
          return <QRCodeManagement />;
        case 'printers':
          return <PrinterConfiguration />;
        case 'documents':
          return <DocumentManagement />;
        case 'profile':
          return <ShopProfileManagement />;
        case 'reports':
          return <ShopReports />;
        case 'support':
          return <SupportTickets />;
        case 'creative_studio':
          return <CreativePrintStudio />;
        default:
          return <ShopDashboard />;
      }
    }
  };

  const isShopSuspendedOrDeactivated =
    activeRole === 'shop_admin' && (currentShop?.status === 'suspended' || currentShop?.status === 'deactivated');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <RoleDemoSwitcher />

      <div className="flex-1 flex flex-col">
        <TopHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {isShopSuspendedOrDeactivated && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                <strong>Shop Notice:</strong> This shop account ({currentShop?.id}) is currently marked as{' '}
                <span className="font-mono uppercase font-bold">{currentShop?.status}</span> by Platform Super Admin. Walk-in QR uploads are blocked.
              </span>
            </div>
            <button
              onClick={() => setActiveView('support')}
              className="underline font-semibold hover:text-amber-900 dark:hover:text-white ml-3"
            >
              Contact Support Desk
            </button>
          </div>
        )}

        <div className="flex-1 flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
            {renderAdminView()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
      <ToastContainer />
    </AppProvider>
  );
}
