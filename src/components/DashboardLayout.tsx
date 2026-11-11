import React, { useEffect, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { Link, navigate, useLocation } from '../lib/router';
import { useAuth } from '../lib/auth';
import { Logo, cx } from './ui';

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  exact?: boolean;
}

export function DashboardLayout({
  nav,
  areaLabel,
  subtitle,
  children,
}: {
  nav: NavItem[];
  areaLabel: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { path } = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);

  const isActive = (item: NavItem) => (item.exact ? path === item.to : path === item.to || path.startsWith(item.to + '/'));
  const loginPath = user?.role === 'super_admin' ? '/admin/login' : '/shop/login';

  const handleLogout = async () => {
    await logout();
    navigate(loginPath, { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link to={nav[0].to} aria-label="Go to dashboard">
          <Logo />
        </Link>
        <button className="rounded-lg p-2 text-muted hover:bg-cream-deep lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <div className="mx-4 mb-4 rounded-xl border border-line bg-cream px-3.5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gold-ink">{areaLabel}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-ink" title={subtitle}>
          {subtitle}
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Main">
        {nav.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors',
                active ? 'bg-gold-soft font-semibold text-ink' : 'text-ink-soft hover:bg-cream-deep hover:text-ink',
              )}
            >
              <Icon className={cx('size-5', active ? 'text-gold-ink' : 'text-muted')} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="tabular rounded-full bg-orange px-2 py-0.5 text-xs font-bold text-ink" aria-label={`${item.badge} new`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-soft text-sm font-bold text-orange-ink" aria-hidden>
            {(user?.name || '?').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-xs text-muted">@{user?.username}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-ink-soft transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <LogOut className="size-5" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-cream">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-pop">
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 border-r border-line bg-surface lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
          <aside className="animate-in absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-pop">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-68">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
          <button className="rounded-xl p-2.5 text-ink hover:bg-cream-deep" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Logo />
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
