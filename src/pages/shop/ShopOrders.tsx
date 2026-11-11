import React, { useEffect, useState } from 'react';
import { ReceiptText, Search } from 'lucide-react';
import type { Order } from '../../../shared/types';
import { useApi, usePolling } from '../../lib/useApi';
import { navigate, useDocumentTitle, useLocation } from '../../lib/router';
import { Button, Card, EmptyState, ErrorState, Input, PageHeader, Skeleton, cx } from '../../components/ui';
import { OrderRow } from './OrderRow';
import { useShop } from './ShopContext';

const TABS = [
  { key: 'active', label: 'Open' },
  { key: 'pending', label: 'New' },
  { key: 'printing', label: 'Printing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];
const PAGE = 20;

export function ShopOrders() {
  useDocumentTitle('Orders');
  const { query } = useLocation();
  const { refreshCounts } = useShop();
  const status = TABS.some((t) => t.key === query.get('status')) ? query.get('status')! : 'active';
  const [search, setSearch] = useState(query.get('q') ?? '');
  const [q, setQ] = useState(search);
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setLimit(PAGE), [status, q]);

  const url = `/api/shop/orders?status=${status}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
  const { data, error, loading, reload } = useApi<{ orders: Order[]; total: number }>(url);
  usePolling(() => {
    reload(true);
    refreshCounts();
  }, 20_000);

  return (
    <>
      <PageHeader title="Orders" description="Everything customers have sent to your shop." />
      <Card>
        <div className="space-y-3 border-b border-line p-4 sm:px-6">
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Filter orders by status">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={status === t.key}
                ref={(el) => {
                  if (el && status === t.key) el.parentElement?.scrollTo({ left: el.offsetLeft - 16 });
                }}
                onClick={() => navigate(`/shop/orders?status=${t.key}`)}
                className={cx(
                  'min-h-10 shrink-0 rounded-xl px-3.5 text-sm font-semibold transition-colors',
                  status === t.key ? 'bg-ink text-white' : 'text-ink-soft hover:bg-cream-deep',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              type="search"
              aria-label="Search orders"
              placeholder="Search by name, phone, order number or tracking code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {error ? (
          <ErrorState message={error.message} onRetry={() => reload()} />
        ) : loading && !data ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : !data?.orders.length ? (
          <EmptyState
            icon={<ReceiptText className="size-6" />}
            title={q ? 'No matching orders' : 'No orders here'}
            description={q ? 'Try a different search.' : 'Orders appear here when customers upload through your QR code.'}
          />
        ) : (
          <>
            <ul className="divide-y divide-line">
              {data.orders.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm text-muted sm:px-6">
              <span>
                Showing {data.orders.length} of {data.total}
              </span>
              {data.orders.length < data.total && (
                <Button variant="secondary" size="sm" loading={loading} onClick={() => setLimit((l) => l + PAGE)}>
                  Load more
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </>
  );
}
