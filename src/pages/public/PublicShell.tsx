import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogIn, Search, ShieldCheck, Store } from 'lucide-react';
import { Link, useLocation } from '../../lib/router';
import { Logo } from '../../components/ui';

function SignInMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { path } = useLocation();

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items = [
    { to: '/shop/login', icon: Store, title: 'Shop owner', text: 'Orders, prices and QR code' },
    { to: '/admin/login', icon: ShieldCheck, title: 'Super Admin', text: 'Manage shops and accounts' },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-3.5 text-sm font-semibold text-white hover:bg-ink-soft"
      >
        <LogIn className="size-4" aria-hidden />
        Sign in
        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="animate-in absolute right-0 mt-2 w-72 rounded-2xl border border-line bg-surface p-2 shadow-pop">
          {items.map((i) => (
            <Link key={i.to} to={i.to} role="menuitem" className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-cream">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-ink" aria-hidden>
                <i.icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{i.title}</span>
                <span className="block text-xs text-muted">{i.text}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link to="/" aria-label="PrintFlow home">
            <Logo />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/track"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ink-soft hover:bg-cream-deep hover:text-ink"
              aria-label="Track an order"
            >
              <Search className="size-4 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">Track an order</span>
            </Link>
            <SignInMenu />
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <p>© {new Date().getFullYear()} PrintFlow</p>
          <nav className="flex gap-4" aria-label="Staff">
            <Link to="/shop/login" className="hover:text-ink">Shop sign in</Link>
            <Link to="/admin/login" className="hover:text-ink">Super Admin sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
