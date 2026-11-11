import React, { useEffect, useSyncExternalStore } from 'react';

/** Minimal path router using the History API. */

const subscribe = (cb: () => void) => {
  window.addEventListener('popstate', cb);
  window.addEventListener('pf:navigate', cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener('pf:navigate', cb);
  };
};

const getLocation = () => window.location.pathname + window.location.search;

export function useLocation() {
  const loc = useSyncExternalStore(subscribe, getLocation);
  const [path, search = ''] = loc.split('?');
  return { path: path.replace(/\/+$/, '') || '/', query: new URLSearchParams(search) };
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === getLocation()) return;
  if (opts.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.dispatchEvent(new Event('pf:navigate'));
  window.scrollTo({ top: 0 });
}

/** Matches "/shop/orders/:id" style patterns. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const s = path.split('/').filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

export function Link({ to, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    />
  );
}

export function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to, { replace: true }), [to]);
  return null;
}

let baseTitle = 'PrintFlow';
let titleBadge = 0;
const applyTitle = () => {
  document.title = (titleBadge ? `(${titleBadge}) ` : '') + baseTitle;
};

export function useDocumentTitle(title: string) {
  useEffect(() => {
    baseTitle = title ? `${title} · PrintFlow` : 'PrintFlow';
    applyTitle();
  }, [title]);
}

/** Shows a count such as "(3)" in front of the tab title (e.g. new orders). */
export function useTitleBadge(count: number) {
  useEffect(() => {
    titleBadge = count;
    applyTitle();
    return () => {
      titleBadge = 0;
      applyTitle();
    };
  }, [count]);
}
