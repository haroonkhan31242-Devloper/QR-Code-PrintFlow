import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cx } from './ui';

type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

const ToastContext = createContext<(type: ToastType, title: string, message?: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const push = useCallback((type: ToastType, title: string, message?: string) => {
    const id = nextId++;
    setToasts((t) => [...t.slice(-3), { id, type, title, message }]);
    setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              'animate-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-4 shadow-pop',
              t.type === 'error' ? 'border-danger/30' : 'border-line',
            )}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            ) : t.type === 'error' ? (
              <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
            ) : (
              <Info className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.message && <p className="mt-0.5 text-sm text-muted">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="-m-1 rounded-lg p-1 text-muted hover:bg-cream hover:text-ink" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
