import React from 'react';
import { OrderStatus, ShopStatus, QRStatus, PaymentStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus | ShopStatus | QRStatus | PaymentStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  let label = status;

  switch (s) {
    // Order Statuses
    case 'new':
      styles = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 animate-pulse';
      label = 'New Request';
      break;
    case 'pending_review':
      styles = 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/60';
      label = 'Pending Review';
      break;
    case 'approved':
      styles = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
      label = 'Approved';
      break;
    case 'printing_initiated':
      styles = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
      label = 'Print Initiated';
      break;
    case 'printing_in_progress':
      styles = 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      label = 'Printing In Progress';
      break;
    case 'printing_completed':
      styles = 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/60';
      label = 'Print Completed';
      break;
    case 'completed_handover':
      styles = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      label = 'Completed & Handed Over';
      break;
    case 'rejected':
      styles = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
      label = 'Rejected';
      break;
    case 'printing_failed':
      styles = 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800/60';
      label = 'Printing Failed';
      break;
    case 'cancelled':
      styles = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700';
      label = 'Cancelled';
      break;

    // Shop Statuses
    case 'active':
      styles = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      label = 'Active';
      break;
    case 'suspended':
      styles = 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800/60';
      label = 'Suspended';
      break;
    case 'deactivated':
      styles = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
      label = 'Deactivated';
      break;

    // QR Statuses
    case 'revoked':
      styles = 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800/60';
      label = 'Revoked';
      break;
    case 'replaced':
      styles = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700';
      label = 'Replaced';
      break;

    // Payment Statuses
    case 'verified':
      styles = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      label = 'Verified';
      break;
    case 'submitted':
      styles = 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/60';
      label = 'Slip Submitted';
      break;
    case 'pending':
      styles = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      label = 'Pending Cash';
      break;
    case 'failed':
      styles = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
      label = 'Failed';
      break;
    case 'refunded':
      styles = 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      label = 'Refunded';
      break;
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${padding} ${styles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {label}
    </span>
  );
};
