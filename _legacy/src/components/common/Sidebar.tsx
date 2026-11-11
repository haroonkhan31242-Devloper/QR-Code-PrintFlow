import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  BarChart3,
  History,
  Bell,
  Settings,
  HelpCircle,
  Sparkles,
  Layers,
  Coins,
  QrCode,
  FileText,
  FolderOpen,
  Printer,
  CheckCircle2,
  UserCheck,
  X,
  Sliders,
  ShoppingBag,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeRole, activeView, setActiveView, currentShop, unreadCount, categories, shops } = useApp();

  const superAdminSections: NavSection[] = [
    {
      title: 'Platform Control',
      items: [
        { id: 'dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
        { id: 'shops', label: 'Manage Shops', icon: Store, badge: `${shops.length}` },
        { id: 'shop_admins', label: 'Shop Administrators', icon: Users },
        { id: 'all_orders', label: 'All Orders (Cross-Shop)', icon: ShoppingBag },
      ],
    },
    {
      title: 'Platform Management',
      items: [
        { id: 'subscriptions', label: 'Subscription Tiers', icon: CreditCard },
        { id: 'reports', label: 'Platform Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'System & Tools',
      items: [
        { id: 'settings', label: 'Platform Settings', icon: Settings },
        { id: 'support', label: 'Support Desk', icon: HelpCircle },
        { id: 'creative_studio', label: 'Creative AI Studio', icon: Sparkles, badge: 'AI' },
      ],
    },
  ];

  const shopCategoriesCount = categories.filter((c) => c.shopId === currentShop?.id).length;

  const shopAdminSections: NavSection[] = [
    {
      title: 'Command Center',
      items: [
        { id: 'dashboard', label: 'Shop Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Queue & Orders',
      items: [
        { id: 'orders', label: 'Incoming Print Queue', icon: FileText, badge: 'Live', highlight: true },
        { id: 'all_orders', label: 'All Orders & History', icon: History },
        { id: 'documents', label: 'Customer Files Archive', icon: FolderOpen },
      ],
    },
    {
      title: 'Hardware & Studio',
      items: [
        { id: 'printers', label: 'Print Flow & Hardware', icon: Printer },
        { id: 'creative_studio', label: 'Print Studio (AI Poster)', icon: Sparkles, badge: 'AI' },
        { id: 'qrcode', label: 'Counter QR & Posters', icon: QrCode },
      ],
    },
    {
      title: 'Shop Configuration',
      items: [
        { id: 'categories', label: 'Shop Categories', icon: Layers, badge: `${shopCategoriesCount}` },
        { id: 'services', label: 'Printing Services', icon: Sliders },
        { id: 'pricing', label: 'Pricing Rate Cards', icon: Coins },
        { id: 'profile', label: 'Shop Profile', icon: Store },
      ],
    },
    {
      title: 'Business & Help',
      items: [
        { id: 'reports', label: 'Sales & Analytics', icon: BarChart3 },
        { id: 'support', label: 'Support Desk', icon: HelpCircle },
      ],
    },
  ];

  const sections = activeRole === 'super_admin' ? superAdminSections : shopAdminSections;

  const handleSelect = (viewId: string) => {
    setActiveView(viewId);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-10 lg:top-26 h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-6.5rem)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>PrintFlow SaaS</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant Summary Card inside sidebar */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80">
          {activeRole === 'super_admin' ? (
            <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 p-3 rounded-xl">
              <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                Central Console
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                Super Admin Portal
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-tenant network oversight
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                  {currentShop?.id}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.2 rounded-full font-medium ${
                    currentShop?.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                  }`}
                >
                  {currentShop?.status?.toUpperCase()}
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                {currentShop?.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {currentShop?.ownerName} &bull; {currentShop?.city}
              </div>
            </div>
          )}
        </div>

        {/* Grouped Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {sec.title}
              </div>

              {sec.items.map((item) => {
                const Icon = item.icon;
                const isSelected = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : item.highlight
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/60'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isSelected
                            ? 'text-white'
                            : item.highlight
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono shrink-0 ml-1.5 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Status bar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Multi-Tenant Engine</span>
            </span>
            <span className="font-mono text-[10px]">v2.5</span>
          </div>
        </div>
      </aside>
    </>
  );
};
