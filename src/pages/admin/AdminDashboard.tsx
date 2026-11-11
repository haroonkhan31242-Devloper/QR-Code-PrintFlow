import { Clock, HardDrive, ReceiptText, Store } from 'lucide-react';
import type { AdminStats } from '../../shared/types';
import { useQuery } from '../../lib/useQuery';
import { adminService } from '../../services';
import { Link, useDocumentTitle } from '../../lib/router';
import { formatBytes } from '../../lib/format';
import { Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from '../../components/ui';
import { WeekBars } from '../../components/shared';

export function AdminDashboard() {
  useDocumentTitle('Overview');
  const { data, error, loading, reload } = useQuery<AdminStats>('admin-stats', adminService.getStats);

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="All print shops on PrintFlow at a glance."
        actions={
          <Link to="/admin/shops?new=1" className="inline-flex h-11 items-center rounded-xl bg-gold px-4 text-sm font-semibold text-ink hover:bg-[#e0bb5f]">
            Add a shop
          </Link>
        }
      />
      {error ? (
        <Card>
          <ErrorState message={error.message} onRetry={() => reload()} />
        </Card>
      ) : loading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active shops" value={`${data.shopsActive}`} hint={`${data.shopsTotal} total`} icon={<Store className="size-5" />} />
            <StatCard label="Orders today" value={data.ordersToday} hint={`${data.ordersTotal} all time`} icon={<ReceiptText className="size-5" />} tone="orange" />
            <StatCard label="Waiting for shops" value={data.ordersPending} hint="New orders not yet accepted" icon={<Clock className="size-5" />} tone="info" />
            <StatCard label="Files stored" value={formatBytes(data.storageBytes)} hint="Customer documents on disk" icon={<HardDrive className="size-5" />} tone="success" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader title="Orders this week" description="Across all shops" />
              <div className="p-5 sm:p-6">
                <WeekBars data={data.last7Days} label="Orders per day" />
              </div>
            </Card>
            <Card>
              <CardHeader title="Busiest shops" description="By total orders" />
              {data.topShops.length === 0 ? (
                <EmptyState
                  icon={<Store className="size-6" />}
                  title="No shops yet"
                  description="Create the first shop to start receiving orders."
                  action={<Link to="/admin/shops?new=1" className="text-sm font-semibold text-gold-ink hover:underline">Add a shop</Link>}
                />
              ) : (
                <ul className="divide-y divide-line">
                  {data.topShops.map((s, i) => (
                    <li key={s.id}>
                      <Link to={`/admin/shops/${s.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-cream sm:px-6">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-cream-deep text-xs font-bold text-ink-soft">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{s.name}</span>
                        <span className="tabular text-sm text-muted">{s.orders} orders</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
