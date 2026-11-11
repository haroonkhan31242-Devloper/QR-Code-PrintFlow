import React, { useState } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';
import { Alert, Button, Modal } from './ui';
import { useToast } from './toast';

/** Simple accessible 7-day bar chart (with a text alternative). */
export function WeekBars({ data, label }: { data: { date: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  const dayName = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
  return (
    <figure>
      <div className="flex h-40 items-end gap-2 sm:gap-3" role="img" aria-label={`${label}: ${data.map((d) => `${dayName(d.date)} ${d.count}`).join(', ')}`}>
        {data.map((d, i) => {
          const isToday = i === data.length - 1;
          return (
            <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="tabular text-xs font-semibold text-ink-soft">{d.count || ''}</span>
              <div
                className={isToday ? 'w-full rounded-t-lg bg-gold' : 'w-full rounded-t-lg bg-gold-soft border border-gold/60'}
                style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
              />
              <span className={isToday ? 'text-xs font-bold text-ink' : 'text-xs text-muted'}>{dayName(d.date)}</span>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        {total} order{total === 1 ? '' : 's'} in the last 7 days
      </figcaption>
    </figure>
  );
}

/** Shows freshly generated credentials exactly once. */
export function CredentialsModal({
  open,
  onClose,
  title,
  username,
  password,
  shopUrl,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  username: string;
  password: string;
  shopUrl?: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const text = `PrintFlow shop sign-in\nAddress: ${window.location.origin}/shop/login\nUsername: ${username}\nTemporary password: ${password}\n(You will be asked to choose a new password.)`;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Share these with the shop owner. The password is shown only once."
      footer={
        <>
          <Button
            variant="secondary"
            icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                toast('success', 'Copied to clipboard');
              } catch {
                toast('error', 'Could not copy', 'Select the text and copy it manually.');
              }
            }}
          >
            Copy details
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-gold/70 bg-gold-soft p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gold-ink">
            <KeyRound className="size-4" aria-hidden /> Shop owner sign-in
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-ink-soft">Sign-in page</dt>
              <dd className="font-mono font-semibold text-ink [overflow-wrap:anywhere]">{window.location.origin}/shop/login</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-ink-soft">Username</dt>
              <dd className="font-mono font-semibold text-ink">{username}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-ink-soft">Temporary password</dt>
              <dd className="font-mono text-base font-bold text-ink select-all">{password}</dd>
            </div>
          </dl>
        </div>
        {shopUrl && (
          <p className="text-sm text-muted">
            Customer upload link: <span className="font-mono text-ink [overflow-wrap:anywhere]">{shopUrl}</span>
          </p>
        )}
        <Alert tone="info">The owner must set a new password the first time they sign in.</Alert>
      </div>
    </Modal>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  danger,
  loading,
  children,
  confirmDisabled,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  confirmDisabled?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
