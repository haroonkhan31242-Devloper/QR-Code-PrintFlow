import type { ColorMode, FinishingCode, OrderStatus, PaperSize, Sides } from '../../shared/types';

const currency = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 });
export const formatMoney = (n: number | null | undefined) => `Rs ${currency.format(n ?? 0)}`;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return 'never';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return formatDate(iso);
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'New',
  accepted: 'Accepted',
  printing: 'Printing',
  ready: 'Ready for pickup',
  completed: 'Completed',
  rejected: 'Rejected',
};

export const COLOR_LABEL: Record<ColorMode, string> = { bw: 'Black & white', color: 'Colour' };
export const SIDES_LABEL: Record<Sides, string> = { single: 'Single-sided', double: 'Double-sided' };
export const PAPER_LABEL: Record<PaperSize, string> = { A4: 'A4', A3: 'A3', Legal: 'Legal' };
export const FINISHING_LABEL: Record<FinishingCode, string> = {
  none: 'None',
  staple: 'Staple',
  spiral_binding: 'Spiral binding',
  lamination: 'Lamination',
};
