import React, { createContext, useContext } from 'react';
import type { Shop } from '../../../shared/types';
import { useApi, usePolling } from '../../lib/useApi';
import { useTitleBadge } from '../../lib/router';

interface ShopCtx {
  shop: Shop | null;
  setShop: (s: Shop) => void;
  pendingCount: number;
  refreshCounts: () => void;
}

const Ctx = createContext<ShopCtx>({ shop: null, setShop: () => {}, pendingCount: 0, refreshCounts: () => {} });
export const useShop = () => useContext(Ctx);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const me = useApi<{ shop: Shop }>('/api/shop/me');
  const counts = useApi<{ total: number }>('/api/shop/orders?status=pending&limit=1');
  usePolling(() => counts.reload(true), 20_000);

  const pendingCount = counts.data?.total ?? 0;
  useTitleBadge(pendingCount);

  return (
    <Ctx.Provider
      value={{
        shop: me.data?.shop ?? null,
        setShop: (shop) => me.setData({ shop }),
        pendingCount,
        refreshCounts: () => counts.reload(true),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
