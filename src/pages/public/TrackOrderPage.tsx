import React, { useState } from 'react';
import { Check, PackageCheck, RefreshCw, Search, XCircle } from 'lucide-react';
import { useApi, usePolling } from '../../lib/useApi';
import { navigate, useDocumentTitle } from '../../lib/router';
import { formatDateTime, formatMoney, STATUS_LABEL } from '../../lib/format';
import type { OrderStatus, PublicTracking } from '../../../shared/types';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Input, Skeleton, StatusBadge, cx } from '../../components/ui';
import { PublicShell } from './PublicShell';

const FLOW: OrderStatus[] = ['pending', 'accepted', 'printing', 'ready', 'completed'];

export function TrackOrderPage({ code }: { code?: string }) {
  useDocumentTitle(code ? `Order ${code}` : 'Track an order');
  const [input, setInput] = useState(code ?? '');

  return (
    <PublicShell>
      <div className="mx-auto max-w-xl space-y-5 px-4 py-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Track your order</h1>
          <p className="mt-1 text-[15px] text-muted">Enter the tracking code you received after uploading.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const c = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (c) navigate(`/track/${c}`);
          }}
        >
          <Input
            aria-label="Tracking code"
            placeholder="e.g. K7M2QP9X"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
            autoCapitalize="characters"
          />
          <Button type="submit" icon={<Search className="size-4" />}>
            Track
          </Button>
        </form>
        {code && <TrackingResult key={code} code={code} />}
      </div>
    </PublicShell>
  );
}

function TrackingResult({ code }: { code: string }) {
  const { data, error, loading, reload } = useApi<{ order: PublicTracking }>(`/api/public/track/${encodeURIComponent(code)}`);
  usePolling(() => reload(true), 30_000);
  const o = data?.order;

  if (loading) return <Skeleton className="h-80 w-full" />;
  if (error)
    return (
      <Card>
        {error.status === 404 ? (
          <EmptyState icon={<Search className="size-6" />} title="No order found" description="Check the code and try again. Codes are 8 letters and numbers." />
        ) : (
          <ErrorState message={error.message} onRetry={() => reload()} />
        )}
      </Card>
    );
  if (!o) return null;

  const reached = (s: OrderStatus) => o.events.find((e) => e.status === s);
  const currentIndex = FLOW.indexOf(o.status);

  return (
    <Card className="animate-in overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-cream/60 px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm text-muted">{o.shopName}</p>
          <p className="text-lg font-bold text-ink">
            Order #{o.orderNo} <span className="font-mono text-sm font-semibold text-muted">· {o.trackingCode}</span>
          </p>
        </div>
        <StatusBadge status={o.status} />
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {o.status === 'ready' && (
          <Alert tone="success" title="Ready for pickup">
            Your prints are ready. Show your tracking code at the counter.
          </Alert>
        )}
        {o.status === 'rejected' ? (
          <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-soft p-4">
            <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
            <div>
              <p className="font-semibold text-ink">The shop could not print this order</p>
              {o.rejectionReason && <p className="mt-0.5 text-sm text-ink-soft">Reason: {o.rejectionReason}</p>}
            </div>
          </div>
        ) : (
          <ol className="space-y-0">
            {FLOW.map((s, i) => {
              const done = i <= currentIndex;
              const ev = reached(s);
              return (
                <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < FLOW.length - 1 && (
                    <span className={cx('absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-0.5', i < currentIndex ? 'bg-gold-ink' : 'bg-line')} aria-hidden />
                  )}
                  <span
                    className={cx(
                      'relative flex size-7 shrink-0 items-center justify-center rounded-full border-2',
                      done ? 'border-gold-ink bg-gold text-ink' : 'border-line-strong bg-surface text-muted',
                    )}
                    aria-hidden
                  >
                    {done ? <Check className="size-4" /> : <span className="size-1.5 rounded-full bg-current" />}
                  </span>
                  <div className="pt-0.5">
                    <p className={cx('text-sm font-semibold', done ? 'text-ink' : 'text-muted')}>
                      {STATUS_LABEL[s]}
                      <span className="sr-only">{done ? ' (done)' : ' (not yet)'}</span>
                    </p>
                    {ev && <p className="text-xs text-muted">{formatDateTime(ev.createdAt)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <dl className="grid grid-cols-2 gap-4 rounded-xl border border-line p-4 text-sm">
          <div>
            <dt className="text-muted">{o.finalAmount !== null ? 'Amount' : 'Estimated'}</dt>
            <dd className="tabular font-bold text-ink">{formatMoney(o.finalAmount ?? o.estimatedTotal)}</dd>
          </div>
          <div>
            <dt className="text-muted">Payment</dt>
            <dd>{o.paymentStatus === 'paid' ? <Badge tone="success">Paid</Badge> : <Badge>Pay at counter</Badge>}</dd>
          </div>
          <div>
            <dt className="text-muted">Files</dt>
            <dd className="font-semibold text-ink">{o.fileCount}</dd>
          </div>
          <div>
            <dt className="text-muted">Sent</dt>
            <dd className="font-semibold text-ink">{formatDateTime(o.createdAt)}</dd>
          </div>
        </dl>

        <div className="flex items-center justify-between text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <PackageCheck className="size-4" aria-hidden /> Updates automatically
          </span>
          <button onClick={() => reload()} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold hover:bg-cream-deep hover:text-ink">
            <RefreshCw className="size-3.5" aria-hidden /> Refresh
          </button>
        </div>
      </div>
    </Card>
  );
}
