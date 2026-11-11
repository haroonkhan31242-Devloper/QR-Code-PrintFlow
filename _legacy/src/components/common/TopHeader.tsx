import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Search,
  Menu,
  CheckCheck,
  Building2,
  ExternalLink,
  ShieldAlert,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';

interface TopHeaderProps {
  onToggleSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleSidebar }) => {
  const {
    currentUser,
    activeRole,
    currentShop,
    activeView,
    setActiveView,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    theme,
    toggleTheme,
    logoutShopOwner,
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);


  // Friendly title mapping
  const getPageTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return activeRole === 'super_admin' ? 'Platform Overview' : 'Shop Command Center';
      case 'shops':
        return 'Manage Printing Shops';
      case 'shop_admins':
        return 'Shop Administrators Management';
      case 'all_orders':
        return activeRole === 'super_admin' ? 'All Orders (Cross-Shop Monitor)' : 'Order History & Archive';
      case 'shop_details':
        return 'Shop Details Profile';
      case 'subscriptions':
        return 'SaaS Subscription Plans';
      case 'orders':
        return 'Incoming Printing Queue';
      case 'categories':
        return 'Shop Categories & Departments';
      case 'services':
        return 'Printing Services & Options';
      case 'pricing':
        return 'Pricing & Rate Cards';
      case 'qrcode':
        return 'Shop QR Code Management';
      case 'printers':
        return 'Connected Printers & Spoolers';
      case 'documents':
        return 'Document Repository & Archive';
      case 'profile':
        return 'Shop Profile & Information';
      case 'reports':
        return 'Analytics & Performance Reports';
      case 'settings':
        return 'Platform Settings';
      case 'support':
        return 'Help Desk & Support Tickets';
      case 'creative_studio':
        return 'Creative Print & Media Studio';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-10 z-30">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{getPageTitle()}</span>
            {activeRole === 'shop_admin' && currentShop && (
              <span className="hidden sm:inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal">
                {currentShop.city}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Shop Status banner if suspended */}
        {activeRole === 'shop_admin' && currentShop?.status === 'suspended' && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Account Suspended - QR Scan Disabled</span>
          </div>
        )}

        {/* Quick Customer Portal Link for Shop Admin */}
        {activeRole === 'shop_admin' && currentShop && (
          <button
            onClick={() => setActiveView('qrcode')}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 px-2.5 py-1.5 rounded-lg transition-colors"
            title="Open shop QR poster and download"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Counter QR</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Notifications
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {unreadCount} unread update{unreadCount === 1 ? '' : 's'}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    No notifications right now.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                        !n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-1.5">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile & Logout Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img
              src={
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {activeRole === 'super_admin' ? 'Super Admin' : currentShop?.name || 'Shop Admin'}
              </div>
            </div>
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-xs text-slate-700 dark:text-slate-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                {currentUser.username && (
                  <div className="text-[10px] text-indigo-500 font-mono mt-0.5">
                    @{currentUser.username}
                  </div>
                )}
              </div>

              {activeRole === 'shop_admin' && (
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <div><strong>Shop:</strong> {currentShop?.name}</div>
                  <div><strong>ID:</strong> <code className="font-mono">{currentShop?.id}</code></div>
                </div>
              )}

              <div className="p-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logoutShopOwner();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

