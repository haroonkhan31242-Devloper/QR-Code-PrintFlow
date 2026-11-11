import { History } from 'lucide-react';
import type { ActivityEntry } from '../../../shared/types';
import { useApi } from '../../lib/useApi';
import { Link, useDocumentTitle } from '../../lib/router';
import { formatDateTime } from '../../lib/format';
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/ui';

export function AdminActivity() {
  useDocumentTitle('Activity log');
  const { data, error, loading, reload } = useApi<{ entries: ActivityEntry[] }>('/api/admin/activity');

  return (
    <>
      <PageHeader title="Activity log" description="The latest 200 sign-ins, account changes and orders across the platform." />
      <Card>
        {error ? (
          <ErrorState message={error.message} onRetry={() => reload()} />
        ) : loading ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !data?.entries.length ? (
          <EmptyState icon={<History className="size-6" />} title="Nothing yet" description="Activity appears here as people use the platform." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream/70 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">When</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Who</th>
                  <th scope="col" className="px-4 py-3 font-semibold">What</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Shop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.entries.map((a) => (
                  <tr key={a.id} className="align-top">
                    <td className="whitespace-nowrap px-6 py-3 text-muted">{formatDateTime(a.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-ink-soft">{a.actor}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-ink">{a.action}</span>
                      {a.details && <p className="text-muted [overflow-wrap:anywhere]">{a.details}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {a.shopId && a.shopName ? (
                        <Link to={`/admin/shops/${a.shopId}`} className="font-medium text-gold-ink hover:underline">
                          {a.shopName}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
