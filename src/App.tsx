import React from 'react';
import { History, LayoutDashboard, QrCode, ReceiptText, Settings, Store, Tags, UserCog } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import { matchPath, Redirect, useLocation } from './lib/router';
import { ToastProvider } from './components/toast';
import { Spinner } from './components/ui';
import { DashboardLayout, type NavItem } from './components/DashboardLayout';
import type { Role } from './shared/types';

import { LandingPage } from './pages/public/LandingPage';
import { CustomerUploadPage } from './pages/public/CustomerUploadPage';
import { TrackOrderPage } from './pages/public/TrackOrderPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ForcePasswordChange } from './pages/auth/ForcePasswordChange';
import { AccountPage } from './pages/auth/AccountPage';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminShops } from './pages/admin/AdminShops';
import { AdminShopDetail } from './pages/admin/AdminShopDetail';
import { AdminActivity } from './pages/admin/AdminActivity';

import { ShopProvider, useShop } from './pages/shop/ShopContext';
import { ShopDashboard } from './pages/shop/ShopDashboard';
import { ShopOrders } from './pages/shop/ShopOrders';
import { ShopOrderDetail } from './pages/shop/ShopOrderDetail';
import { ShopPricing } from './pages/shop/ShopPricing';
import { ShopQrCode } from './pages/shop/ShopQrCode';
import { ShopSettings } from './pages/shop/ShopSettings';

/** Route guard. Every service call also checks the signed-in user and role. */
function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { path } = useLocation();
  const loginPath = role === 'super_admin' ? '/admin/login' : '/shop/login';
  if (loading) return <Spinner label="Checking your session…" />;
  if (!user || user.role !== role) return <Redirect to={`${loginPath}?next=${encodeURIComponent(path)}`} />;
  if (user.mustChangePassword) return <ForcePasswordChange />;
  return <>{children}</>;
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/admin/shops', label: 'Shops', icon: Store },
  { to: '/admin/activity', label: 'Activity log', icon: History },
  { to: '/admin/account', label: 'Account', icon: UserCog },
];

function AdminArea({ path }: { path: string }) {
  let page: React.ReactNode;
  let m: Record<string, string> | null;
  if (path === '/admin') page = <AdminDashboard />;
  else if (path === '/admin/shops') page = <AdminShops />;
  else if ((m = matchPath('/admin/shops/:id', path))) page = <AdminShopDetail id={m.id} />;
  else if (path === '/admin/activity') page = <AdminActivity />;
  else if (path === '/admin/account') page = <AccountPage />;
  else page = <NotFoundPage embedded />;
  return (
    <DashboardLayout nav={adminNav} areaLabel="Super Admin" subtitle="Platform administration">
      {page}
    </DashboardLayout>
  );
}

function ShopArea({ path }: { path: string }) {
  const { shop, pendingCount } = useShop();
  const nav: NavItem[] = [
    { to: '/shop', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/shop/orders', label: 'Orders', icon: ReceiptText, badge: pendingCount },
    { to: '/shop/pricing', label: 'Prices', icon: Tags },
    { to: '/shop/qr', label: 'QR code', icon: QrCode },
    { to: '/shop/settings', label: 'Settings', icon: Settings },
  ];
  let page: React.ReactNode;
  let m: Record<string, string> | null;
  if (path === '/shop') page = <ShopDashboard />;
  else if (path === '/shop/orders') page = <ShopOrders />;
  else if ((m = matchPath('/shop/orders/:id', path))) page = <ShopOrderDetail id={m.id} />;
  else if (path === '/shop/pricing') page = <ShopPricing />;
  else if (path === '/shop/qr') page = <ShopQrCode />;
  else if (path === '/shop/settings') page = <ShopSettings />;
  else page = <NotFoundPage embedded />;
  return (
    <DashboardLayout nav={nav} areaLabel="Shop owner" subtitle={shop?.name ?? 'Loading…'}>
      {page}
    </DashboardLayout>
  );
}

function Routes() {
  const { path } = useLocation();
  let m: Record<string, string> | null;

  if (path === '/') return <LandingPage />;
  if ((m = matchPath('/s/:token', path))) return <CustomerUploadPage token={m.token} />;
  if (path === '/track') return <TrackOrderPage />;
  if ((m = matchPath('/track/:code', path))) return <TrackOrderPage code={m.code} />;
  if (path === '/admin/login') return <LoginPage portal="admin" />;
  if (path === '/shop/login') return <LoginPage portal="shop" />;

  if (path === '/admin' || path.startsWith('/admin/')) {
    return (
      <RequireRole role="super_admin">
        <AdminArea path={path} />
      </RequireRole>
    );
  }
  if (path === '/shop' || path.startsWith('/shop/')) {
    return (
      <RequireRole role="shop_owner">
        <ShopProvider>
          <ShopArea path={path} />
        </ShopProvider>
      </RequireRole>
    );
  }
  return <NotFoundPage />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </ToastProvider>
  );
}
