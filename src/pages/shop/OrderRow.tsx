import { ChevronRight, Paperclip, Printer } from 'lucide-react';
import type { Order } from '../../shared/types';
import { Link } from '../../lib/router';
import { COLOR_LABEL, formatMoney, timeAgo } from '../../lib/format';
import { StatusBadge } from '../../components/ui';

const PRINTABLE_STATUSES = ['pending', 'accepted', 'printing'];

export function OrderRow({ order: o }: { order: Order }) {
  return (
    <li className="flex items-center transition-colors hover:bg-cream/70">
      <Link to={`/shop/orders/${o.id}`} className="flex min-w-0 flex-1 items-center gap-4 py-4 pl-5 pr-2 sm:pl-6">
        <div className="tabular hidden w-16 shrink-0 text-sm font-bold text-ink-soft sm:block">#{o.orderNo}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate font-semibold text-ink">
              <span className="sm:hidden">#{o.orderNo} · </span>
              {o.customerName}
            </p>
            <StatusBadge status={o.status} />
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
            <Paperclip className="size-3.5" aria-hidden />
            {o.fileCount} file{o.fileCount === 1 ? '' : 's'} · {o.pageCount} pages · {o.copies}× {o.paperSize} {COLOR_LABEL[o.colorMode].toLowerCase()}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="tabular text-sm font-bold text-ink">{formatMoney(o.finalAmount ?? o.estimatedTotal)}</p>
          <p className="text-xs text-muted">{timeAgo(o.createdAt)}</p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
      </Link>
      <div className="w-14 shrink-0 pr-3 sm:pr-4">
        {PRINTABLE_STATUSES.includes(o.status) && (
          <Link
            to={`/shop/orders/${o.id}?print=1`}
            className="flex size-10 items-center justify-center rounded-xl border border-line-strong bg-surface text-ink hover:border-ink hover:bg-ink hover:text-white"
            aria-label={`Print order #${o.orderNo}`}
            title="Print"
          >
            <Printer className="size-4" />
          </Link>
        )}
      </div>
    </li>
  );
}
