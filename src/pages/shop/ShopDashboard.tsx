import { CheckCircle2, Clock, Printer, ReceiptText, Wallet } from 'lucide-react';
import type { Order, ShopStats } from '../../../shared/types';
import { useApi, usePolling } from '../../lib/useApi';
import { Link, useDocumentTitle } from '../../lib/router';
import { formatMoney } from '../../lib/format';
import { Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from '../../components/ui';
import { WeekBars } from '../../components/shared';
import { useShop } from './ShopContext';
import { OrderRow } from './OrderRow';

export function ShopDashboard() {
  useDocumentTitle('Dashboard');
  const { shop } = useShop();
  const stats = useApi<ShopStats>('/api/shop/stats');
  const queue = useApi<{ orders: Order[]; total: number }>('/api/shop/orders?status=active&limit=6');
  usePolling(() => {
    stats.reload(true);
    queue.reload(true);
  }, 20_000);

  const s = stats.data;
  return (
    <>
      <PageHeader
        title={`Hello${shop ? `, ${shop.ownerName.split(' ')[0]}` : ''}`}
        description="Here’s what’s happening at your counter today."
        actions={
          <Link to="/shop/qr" className="inline-flex h-11 items-center rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:bg-cream">
            Print QR code
          </Link>
        }
      />

      {stats.error ? (
        <Card>
          <ErrorState message={stats.error.message} onRetry={() => stats.reload()} />
        </Card>
      ) : !s ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="New orders" value={s.pending} hint={`${s.ordersToday} received today`} icon={<ReceiptText className="size-5" />} tone="orange" />
          <StatCard label="In progress" value={s.inProgress} hint="Accepted or printing" icon={<Printer className="size-5" />} />
          <StatCard label="Ready for pickup" value={s.readyForPickup} hint="Waiting for customers" icon={<CheckCircle2 className="size-5" />} tone="success" />
          <StatCard label="Paid this month" value={formatMoney(s.revenueThisMonth)} hint={`${s.completedThisMonth} orders completed`} icon={<Wallet className="size-5" />} tone="info" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title="Current queue"
            description="Orders that still need work"
            action={<Link to="/shop/orders" className="text-sm font-semibold text-gold-ink hover:underline">View all</Link>}
          />
          {queue.error ? (
            <ErrorState message={queue.error.message} onRetry={() => queue.reload()} />
          ) : queue.loading ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : !queue.data?.orders.length ? (
            <EmptyState
              icon={<Clock className="size-6" />}
              title="All caught up"
              description="New orders appear here as soon as customers upload them."
            />
          ) : (
            <ul className="divide-y divide-line">
              {queue.data.orders.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Orders this week" />
          <div className="p-5 sm:p-6">{s ? <WeekBars data={s.last7Days} label="Orders per day" /> : <Skeleton className="h-40" />}</div>
        </Card>
      </div>
    </>
  );
}
