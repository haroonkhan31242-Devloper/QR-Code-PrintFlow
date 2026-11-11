import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Inbox, Loader2, X } from 'lucide-react';
import type { OrderStatus } from '../../shared/types';
import { STATUS_LABEL } from '../lib/format';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ---------- Button ----------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-gold text-ink hover:bg-[#e0bb5f] active:bg-[#d6b057] shadow-[inset_0_-1px_0_rgb(0_0_0/0.08)]',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-cream hover:border-[#c9c0ad]',
  ghost: 'text-ink-soft hover:bg-cream-deep hover:text-ink',
  danger: 'bg-danger text-white hover:bg-[#9b1e14]',
  dark: 'bg-ink text-white hover:bg-ink-soft',
};

const sizes = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors duration-150 disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx('inline-flex size-10 items-center justify-center rounded-xl text-ink-soft hover:bg-cream-deep hover:text-ink transition-colors', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------- Form fields ----------

const fieldBase =
  'w-full rounded-xl border bg-surface px-3.5 text-[15px] text-ink placeholder:text-[#8b9099] transition-colors focus:outline-none focus:ring-4 focus:ring-gold/30 focus:border-gold-ink disabled:bg-cream disabled:text-muted';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => React.ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, children, className }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...rest }, ref) => (
  <input ref={ref} className={cx(fieldBase, 'h-11', rest['aria-invalid'] ? 'border-danger' : 'border-line-strong', className)} {...rest} />
));

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cx(fieldBase, 'min-h-24 py-2.5', rest['aria-invalid'] ? 'border-danger' : 'border-line-strong', className)} {...rest} />
));

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(fieldBase, 'h-11 border-line-strong pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className="pr-12" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted hover:text-ink"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors', checked ? 'bg-gold-ink' : 'bg-line-strong')}
    >
      <span className={cx('inline-block size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  );
}

/** Segmented choice control (radio group). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'min-h-12 rounded-xl border px-3 py-2 text-left transition-colors',
              active ? 'border-gold-ink bg-gold-soft text-ink ring-2 ring-gold/40' : 'border-line-strong bg-surface text-ink-soft hover:bg-cream',
            )}
          >
            <span className="block text-sm font-semibold">{o.label}</span>
            {o.hint && <span className="block text-xs text-muted">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Layout pieces ----------

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-2xl border border-line bg-surface shadow-card', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]" style={{ textWrap: 'balance' }}>
          {title}
        </h1>
        {description && <p className="mt-1 max-w-2xl text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon, tone = 'gold', hint }: { label: string; value: React.ReactNode; icon: React.ReactNode; tone?: 'gold' | 'orange' | 'success' | 'info'; hint?: string }) {
  const tones = {
    gold: 'bg-gold-soft text-gold-ink',
    orange: 'bg-orange-soft text-orange-ink',
    success: 'bg-success-soft text-success',
    info: 'bg-info-soft text-info',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="tabular mt-2 text-[28px] font-extrabold leading-none tracking-tight text-ink">{value}</p>
          {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
        </div>
        <div className={cx('flex size-10 shrink-0 items-center justify-center rounded-xl', tones[tone])} aria-hidden>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ---------- Status ----------

const statusTone: Record<OrderStatus, string> = {
  pending: 'bg-orange-soft text-orange-ink border-orange/60',
  accepted: 'bg-info-soft text-info border-info/20',
  printing: 'bg-gold-soft text-gold-ink border-gold/70',
  ready: 'bg-success-soft text-success border-success/25',
  completed: 'bg-cream-deep text-ink-soft border-line-strong',
  rejected: 'bg-danger-soft text-danger border-danger/20',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusTone[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'success' | 'danger' | 'gold' | 'orange'; children: React.ReactNode }) {
  const tones = {
    neutral: 'bg-cream-deep text-ink-soft border-line-strong',
    success: 'bg-success-soft text-success border-success/25',
    danger: 'bg-danger-soft text-danger border-danger/20',
    gold: 'bg-gold-soft text-gold-ink border-gold/70',
    orange: 'bg-orange-soft text-orange-ink border-orange/60',
  };
  return <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', tones[tone])}>{children}</span>;
}

// ---------- States ----------

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-lg bg-cream-deep', className)} aria-hidden />;
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gold-soft text-gold-ink" aria-hidden>
        {icon ?? <Inbox className="size-6" />}
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center" role="alert">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger" aria-hidden>
        <AlertTriangle className="size-6" />
      </div>
      <h3 className="text-base font-bold text-ink">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Alert({ tone = 'info', title, children }: { tone?: 'info' | 'danger' | 'success' | 'warning'; title?: string; children: React.ReactNode }) {
  const tones = {
    info: 'bg-info-soft border-info/20 text-info',
    danger: 'bg-danger-soft border-danger/20 text-danger',
    success: 'bg-success-soft border-success/25 text-success',
    warning: 'bg-orange-soft border-orange/60 text-orange-ink',
  };
  return (
    <div className={cx('rounded-xl border px-4 py-3 text-sm', tones[tone])} role={tone === 'danger' ? 'alert' : 'status'}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={cx(title && 'mt-0.5', 'text-ink-soft')}>{children}</div>
    </div>
  );
}

// ---------- Modal ----------

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusable = () =>
      Array.from(node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter(
        (el) => !el.hasAttribute('disabled'),
      );
    (focusable().find((el) => el.tagName === 'INPUT') ?? focusable()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const els = focusable();
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          'animate-in relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-surface shadow-pop sm:rounded-2xl',
          size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-cream/60 px-5 py-4 sm:rounded-b-2xl sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Brand ----------

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-gold text-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.08)]" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM15 15h4v4h-4z" />
        </svg>
      </span>
      {!compact && <span className="text-lg font-extrabold tracking-tight text-ink">PrintFlow</span>}
    </span>
  );
}
