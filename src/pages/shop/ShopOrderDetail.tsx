import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Download, Eye, FileImage, FileText, MessageCircle, Phone, Printer, Trash2, X } from 'lucide-react';
import { ORDER_TRANSITIONS, type OrderDetail, type OrderStatus, type PrintJob } from '../../../shared/types';
import { api, ApiError } from '../../lib/api';
import { useApi, usePolling } from '../../lib/useApi';
import { Link, navigate, useDocumentTitle, useLocation } from '../../lib/router';
import { FilePreviewModal, PrintDialog, PrintJobsList, fileUrl, isPrintable } from './printing';
import { COLOR_LABEL, FINISHING_LABEL, formatBytes, formatDateTime, formatMoney, SIDES_LABEL, STATUS_LABEL } from '../../lib/format';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, ErrorState, Field, Input, Skeleton, StatusBadge, Textarea, Toggle } from '../../components/ui';
import { ConfirmModal } from '../../components/shared';
import { useToast } from '../../components/toast';
import { useShop } from './ShopContext';

const ACTION: Partial<Record<OrderStatus, { label: string; icon: React.ReactNode }>> = {
  accepted: { label: 'Accept order', icon: <Check className="size-4" /> },
  printing: { label: 'Start printing', icon: <Printer className="size-4" /> },
  ready: { label: 'Mark ready for pickup', icon: <Check className="size-4" /> },
  completed: { label: 'Mark as collected', icon: <Check className="size-4" /> },
};

export function ShopOrderDetail({ id }: { id: string }) {
  const toast = useToast();
  const { refreshCounts } = useShop();
  const { data, error, loading, reload, setData } = useApi<{ order: OrderDetail }>(`/api/shop/orders/${encodeURIComponent(id)}`);
  const o = data?.order;
  useDocumentTitle(o ? `Order #${o.orderNo}` : 'Order');

  const [busy, setBusy] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paid, setPaid] = useState(false);

  // Printing
  const { query } = useLocation();
  const [selected, setSelected] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const jobsApi = useApi<{ jobs: PrintJob[] }>(`/api/shop/orders/${encodeURIComponent(id)}/print-jobs`);
  const jobs = jobsApi.data?.jobs ?? [];
  const jobsActive = jobs.some((j) => j.status === 'queued' || j.status === 'printing');
  usePolling(() => jobsActive && jobsApi.reload(true), 2000);

  useEffect(() => {
    if (o) {
      setAmount(o.finalAmount !== null ? String(o.finalAmount) : '');
      setPaid(o.paymentStatus === 'paid');
    }
  }, [o?.id, o?.finalAmount, o?.paymentStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Select every printable file by default; open the print dialog when arriving with ?print=1.
  useEffect(() => {
    if (!o) return;
    setSelected(o.files.filter(isPrintable).map((f) => f.id));
    if (query.get('print') === '1') {
      navigate(`/shop/orders/${o.id}`, { replace: true });
      if (o.files.some(isPrintable)) setPrintOpen(true);
    }
  }, [o?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toast when a direct print job finishes.
  const prevJobs = React.useRef<Record<string, string>>({});
  useEffect(() => {
    for (const j of jobs) {
      const before = prevJobs.current[j.id];
      if (before && before !== j.status) {
        if (j.status === 'done') toast('success', 'Sent to printer', `${j.printer} accepted the job. If nothing comes out, check the printer.`);
        if (j.status === 'failed') toast('error', 'Printing failed', j.error ?? undefined);
      }
      prevJobs.current[j.id] = j.status;
    }
  }, [jobs]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error)
    return (
      <Card>
        {error.status === 404 ? (
          <EmptyState title="Order not found" action={<Link to="/shop/orders" className="text-sm font-semibold text-gold-ink hover:underline">Back to orders</Link>} />
        ) : (
          <ErrorState message={error.message} onRetry={() => reload()} />
        )}
      </Card>
    );
  if (loading || !o) return <Skeleton className="h-[32rem]" />;

  const apply = async (key: string, fn: () => Promise<{ order: OrderDetail }>, success: string) => {
    setBusy(key);
    try {
      const r = await fn();
      setData({ order: r.order });
      refreshCounts();
      toast('success', success);
      return true;
    } catch (err) {
      toast('error', 'Could not update order', err instanceof ApiError ? err.message : undefined);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const setStatus = (status: OrderStatus, extra: Record<string, string> = {}) =>
    apply(status, () => api.patch(`/api/shop/orders/${o.id}/status`, { status, ...extra }), `Order #${o.orderNo}: ${STATUS_LABEL[status]}`);

  const next = ORDER_TRANSITIONS[o.status].filter((s) => s !== 'rejected');
  const canReject = ORDER_TRANSITIONS[o.status].includes('rejected');
  const filesAvailable = o.files.some((f) => !f.purged);
  const phoneDigits = o.customerPhone.replace(/[^\d+]/g, '');
  const waNumber = phoneDigits.startsWith('0') ? `92${phoneDigits.slice(1)}` : phoneDigits.replace('+', '');
  const printableFiles = o.files.filter(isPrintable);

  const saveBilling = async () => {
    const value = amount.trim() === '' ? null : Number(amount);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      toast('error', 'Enter a valid amount');
      return;
    }
    await apply('billing', () => api.patch(`/api/shop/orders/${o.id}/billing`, { finalAmount: value, paymentStatus: paid ? 'paid' : 'unpaid' }), 'Payment details saved');
  };

  return (
    <>
      <Link to="/shop/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All orders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">Order #{o.orderNo}</h1>
            <StatusBadge status={o.status} />
          </div>
          <p className="mt-1 text-[15px] text-muted">
            Received {formatDateTime(o.createdAt)} · Tracking code <span className="font-mono font-semibold text-ink-soft">{o.trackingCode}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {printableFiles.length > 0 && (
            <Button
              variant="dark"
              icon={<Printer className="size-4" />}
              disabled={jobsActive}
              onClick={() => {
                if (!selected.length) setSelected(printableFiles.map((f) => f.id));
                setPrintOpen(true);
              }}
            >
              {jobsActive ? 'Printing…' : 'Print'}
            </Button>
          )}
          {canReject && (
            <Button variant="secondary" icon={<X className="size-4" />} onClick={() => setRejectOpen(true)} disabled={!!busy}>
              Reject
            </Button>
          )}
          {next.map((s) => (
            <Button key={s} icon={ACTION[s]?.icon} loading={busy === s} disabled={!!busy && busy !== s} onClick={() => setStatus(s)}>
              {ACTION[s]?.label ?? STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      </div>

      {o.status === 'rejected' && o.rejectionReason && (
        <div className="mb-6">
          <Alert tone="danger" title="Rejected">{o.rejectionReason}</Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Documents"
              description={`${o.files.length} file${o.files.length === 1 ? '' : 's'} · ${o.pageCount} pages in total`}
              action={
                filesAvailable && ['completed', 'rejected'].includes(o.status) ? (
                  <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft hover:text-danger" icon={<Trash2 className="size-4" />} onClick={() => setPurgeOpen(true)}>
                    Delete files
                  </Button>
                ) : undefined
              }
            />
            {printableFiles.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-cream/60 px-5 py-2.5 sm:px-6">
                <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
                  <input
                    type="checkbox"
                    className="size-4 accent-[#7a5c14]"
                    checked={selected.length === printableFiles.length}
                    ref={(el) => {
                      if (el) el.indeterminate = selected.length > 0 && selected.length < printableFiles.length;
                    }}
                    onChange={(e) => setSelected(e.target.checked ? printableFiles.map((f) => f.id) : [])}
                  />
                  {selected.length ? `${selected.length} of ${printableFiles.length} selected` : 'Select files to print'}
                </label>
                <Button size="sm" variant="dark" icon={<Printer className="size-4" />} disabled={!selected.length || jobsActive} onClick={() => setPrintOpen(true)}>
                  Print selected
                </Button>
              </div>
            )}
            <ul className="divide-y divide-line">
              {o.files.map((f, i) => {
                const isImage = f.mime.startsWith('image/');
                const printable = isPrintable(f);
                const checked = selected.includes(f.id);
                return (
                  <li key={f.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:px-6">
                    <input
                      type="checkbox"
                      className="size-4 shrink-0 accent-[#7a5c14] disabled:opacity-30"
                      aria-label={`Select ${f.originalName} for printing`}
                      checked={checked}
                      disabled={!printable}
                      onChange={(e) => setSelected((s) => (e.target.checked ? [...s, f.id] : s.filter((x) => x !== f.id)))}
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(i)}
                      className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-orange-soft text-orange-ink hover:border-gold-ink"
                      aria-label={`Preview ${f.originalName}`}
                    >
                      {isImage && !f.purged ? (
                        <img src={fileUrl(f, true)} alt="" loading="lazy" className="size-full object-cover" />
                      ) : isImage ? (
                        <FileImage className="size-5" />
                      ) : (
                        <FileText className="size-5" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink" title={f.originalName}>
                        {f.originalName}
                      </p>
                      <p className="text-xs text-muted">
                        {formatBytes(f.size)} · {f.pages} page{f.pages === 1 ? '' : 's'}
                        {!printable && !f.purged && <span className="text-orange-ink"> · print from Word</span>}
                      </p>
                    </div>
                    {f.purged ? (
                      <Badge>Deleted</Badge>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" icon={<Eye className="size-4" />} onClick={() => setPreviewIndex(i)}>
                          Preview
                        </Button>
                        <a href={fileUrl(f)} download className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:bg-cream" aria-label={`Download ${f.originalName}`}>
                          <Download className="size-4" aria-hidden /> <span className="hidden sm:inline">Download</span>
                        </a>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          {jobs.length > 0 && (
            <Card>
              <CardHeader title="Print jobs" description="Sent directly to the shop printer" />
              <PrintJobsList
                jobs={jobs}
                onCancel={async (jobId) => {
                  try {
                    await api.post(`/api/shop/print-jobs/${jobId}/cancel`);
                    jobsApi.reload(true);
                  } catch (err) {
                    toast('error', 'Could not cancel', err instanceof ApiError ? err.message : undefined);
                  }
                }}
              />
            </Card>
          )}

          <Card>
            <CardHeader title="Print instructions" />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 text-sm sm:grid-cols-3 sm:p-6">
              <Spec label="Paper" value={o.paperSize} />
              <Spec label="Colour" value={COLOR_LABEL[o.colorMode]} />
              <Spec label="Sides" value={SIDES_LABEL[o.sides]} />
              <Spec label="Copies" value={String(o.copies)} />
              <Spec label="Finishing" value={FINISHING_LABEL[o.finishing]} />
              <Spec label="Pages" value={String(o.pageCount)} />
            </dl>
            {o.notes && (
              <div className="border-t border-line px-5 py-4 sm:px-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Customer note</p>
                <p className="mt-1 whitespace-pre-wrap text-[15px] text-ink [overflow-wrap:anywhere]">{o.notes}</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Customer" />
            <div className="space-y-3 p-5 sm:p-6">
              <p className="text-lg font-bold text-ink">{o.customerName}</p>
              <div className="flex flex-wrap gap-2">
                <a href={`tel:${phoneDigits}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-3.5 text-sm font-semibold text-ink hover:bg-cream">
                  <Phone className="size-4" aria-hidden /> {o.customerPhone}
                </a>
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-3.5 text-sm font-semibold text-ink hover:bg-cream"
                >
                  <MessageCircle className="size-4" aria-hidden /> WhatsApp
                </a>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Payment" description={`Estimated ${formatMoney(o.estimatedTotal)} from your prices`} />
            <div className="space-y-4 p-5 sm:p-6">
              <Field label="Final amount (Rs)" hint="Leave empty to use the estimate.">
                {(p) => <Input {...p} type="number" inputMode="decimal" min={0} step="1" placeholder={String(o.estimatedTotal)} value={amount} onChange={(e) => setAmount(e.target.value)} className="tabular" />}
              </Field>
              <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <span className="text-sm font-semibold text-ink">Paid</span>
                <Toggle checked={paid} onChange={setPaid} label="Mark as paid" />
              </div>
              <Button variant="secondary" className="w-full" loading={busy === 'billing'} onClick={saveBilling}>
                Save payment
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="History" />
            <ol className="space-y-4 p-5 sm:p-6">
              {o.events.map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-gold-ink" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{STATUS_LABEL[e.status]}</p>
                    <p className="text-xs text-muted">
                      {formatDateTime(e.createdAt)} · {e.actor}
                    </p>
                    {e.note && <p className="mt-0.5 text-sm text-ink-soft [overflow-wrap:anywhere]">{e.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <FilePreviewModal files={o.files} index={previewIndex} onIndex={setPreviewIndex} onClose={() => setPreviewIndex(null)} />
      <PrintDialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        order={o}
        fileIds={selected}
        onOrderUpdated={(order) => {
          setData({ order });
          refreshCounts();
        }}
        onJobCreated={() => jobsApi.reload(true)}
      />

      <ConfirmModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject this order?"
        description="The customer sees the reason on their tracking page."
        confirmLabel="Reject order"
        danger
        loading={busy === 'rejected'}
        confirmDisabled={!reason.trim()}
        onConfirm={async () => {
          if (await setStatus('rejected', { reason: reason.trim() })) {
            setRejectOpen(false);
            setReason('');
          }
        }}
      >
        <Field label="Reason" required>
          {(p) => <Textarea {...p} value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="e.g. File is password protected" />}
        </Field>
      </ConfirmModal>

      <ConfirmModal
        open={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        title="Delete the customer’s files?"
        description="The files are removed from storage permanently. The order record and history are kept."
        confirmLabel="Delete files"
        danger
        loading={busy === 'purge'}
        onConfirm={async () => {
          if (await apply('purge', () => api.del(`/api/shop/orders/${o.id}/files`), 'Files deleted')) setPurgeOpen(false);
        }}
      />
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  );
}
