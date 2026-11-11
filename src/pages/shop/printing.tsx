import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Loader2, Monitor, Printer, Unplug, XCircle } from 'lucide-react';
import type { OrderDetail, OrderFile, PrintAgentStatus, PrintJob } from '../../../shared/types';
import { ORDER_TRANSITIONS } from '../../../shared/types';
import { api, ApiError } from '../../lib/api';
import { COLOR_LABEL, formatBytes, formatDateTime, SIDES_LABEL } from '../../lib/format';
import { Alert, Badge, Button, Field, Input, Modal, Select, cx } from '../../components/ui';
import { useToast } from '../../components/toast';

export const isPrintable = (f: OrderFile) => !f.purged && (f.mime === 'application/pdf' || f.mime === 'image/png' || f.mime === 'image/jpeg');
export const fileUrl = (f: OrderFile, inline = false) => `/api/shop/files/${f.id}${inline ? '?inline=1' : ''}`;

// ---------- Browser printing ----------

let printFrame: HTMLIFrameElement | null = null;
let printBlobUrl: string | null = null;

/** Downloads the merged PDF and opens the system print dialog for it. */
async function fetchBundle(orderId: string, fileIds: string[]): Promise<string> {
  const res = await fetch(`/api/shop/orders/${orderId}/print-bundle?files=${fileIds.join(',')}`, { credentials: 'same-origin' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error || 'Could not prepare the files for printing.');
  }
  if (printBlobUrl) URL.revokeObjectURL(printBlobUrl);
  printBlobUrl = URL.createObjectURL(await res.blob());
  return printBlobUrl;
}

function openPrintDialog(blobUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    printFrame?.remove();
    const frame = document.createElement('iframe');
    frame.title = 'Print preview';
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
    frame.src = blobUrl;
    printFrame = frame;
    const timer = setTimeout(() => reject(new Error('The browser did not open the print dialog.')), 15_000);
    frame.onload = () => {
      // Give the PDF viewer a moment to render before printing.
      setTimeout(() => {
        clearTimeout(timer);
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
          resolve();
        } catch (e) {
          reject(e);
        }
      }, 400);
    };
    document.body.appendChild(frame);
  });
}

// ---------- File preview ----------

export function FilePreviewModal({ files, index, onIndex, onClose }: { files: OrderFile[]; index: number | null; onIndex: (i: number) => void; onClose: () => void }) {
  const f = index !== null ? files[index] : null;
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && index < files.length - 1) onIndex(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, files.length, onIndex]);

  return (
    <Modal
      open={!!f}
      onClose={onClose}
      size="lg"
      title={f?.originalName ?? ''}
      description={f ? `File ${index! + 1} of ${files.length} · ${formatBytes(f.size)} · ${f.pages} page${f.pages === 1 ? '' : 's'}` : undefined}
      footer={
        f && (
          <>
            <div className="mr-auto flex gap-2">
              <Button variant="secondary" className="w-11 px-0" aria-label="Previous file" disabled={index === 0} onClick={() => onIndex(index! - 1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="secondary" className="w-11 px-0" aria-label="Next file" disabled={index === files.length - 1} onClick={() => onIndex(index! + 1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            {!f.purged && (
              <a href={fileUrl(f)} download className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:bg-cream">
                <Download className="size-4" aria-hidden /> Download
              </a>
            )}
            <Button onClick={onClose}>Done</Button>
          </>
        )
      }
    >
      {f &&
        (f.purged ? (
          <p className="py-10 text-center text-sm text-muted">This file has been deleted.</p>
        ) : f.mime.startsWith('image/') ? (
          <img src={fileUrl(f, true)} alt={`Preview of ${f.originalName}`} className="mx-auto max-h-[62dvh] rounded-lg border border-line object-contain" />
        ) : f.mime === 'application/pdf' ? (
          <iframe key={f.id} src={fileUrl(f, true)} title={`Preview of ${f.originalName}`} className="h-[62dvh] w-full rounded-lg border border-line bg-cream" />
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <FileText className="size-10 text-orange-ink" aria-hidden />
            <p className="mt-3 max-w-sm text-sm text-muted">Word documents can’t be previewed or printed from the browser. Download the file and print it from Microsoft Word.</p>
          </div>
        ))}
    </Modal>
  );
}

// ---------- Print dialog ----------

type Method = 'browser' | 'agent';

export function PrintDialog({
  open,
  onClose,
  order,
  fileIds,
  onOrderUpdated,
  onJobCreated,
}: {
  open: boolean;
  onClose: () => void;
  order: OrderDetail;
  fileIds: string[];
  onOrderUpdated: (o: OrderDetail) => void;
  onJobCreated: () => void;
}) {
  const toast = useToast();
  const [agent, setAgent] = useState<PrintAgentStatus | null>(null);
  const [method, setMethod] = useState<Method>('browser');
  const [printer, setPrinter] = useState('');
  const [copies, setCopies] = useState(String(order.copies));
  const [sides, setSides] = useState(order.sides);
  const [colorMode, setColorMode] = useState(order.colorMode);
  const canMarkPrinting = ORDER_TRANSITIONS[order.status].includes('printing');
  const [markPrinting, setMarkPrinting] = useState(canMarkPrinting);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null); // blob URL after the dialog opened
  const submitted = useRef(false);

  const files = order.files.filter((f) => fileIds.includes(f.id));
  const pages = files.reduce((s, f) => s + f.pages, 0);

  useEffect(() => {
    if (!open) return;
    submitted.current = false;
    setError(null);
    setOpened(null);
    setBusy(false);
    setCopies(String(order.copies));
    setSides(order.sides);
    setColorMode(order.colorMode);
    setMarkPrinting(ORDER_TRANSITIONS[order.status].includes('printing'));
    api
      .get<{ agent: PrintAgentStatus }>('/api/shop/print-agent')
      .then((r) => {
        setAgent(r.agent);
        if (r.agent.online && r.agent.printers.length) {
          setMethod('agent');
          setPrinter(r.agent.defaultPrinter && r.agent.printers.includes(r.agent.defaultPrinter) ? r.agent.defaultPrinter : r.agent.printers[0]);
        } else {
          setMethod('browser');
        }
      })
      .catch(() => setAgent(null));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const agentReady = !!agent?.online && agent.printers.length > 0;

  const doPrint = async () => {
    if (busy || submitted.current) return; // prevent double submissions
    setError(null);
    setBusy(true);
    try {
      if (method === 'agent') {
        const n = Number(copies);
        if (!Number.isInteger(n) || n < 1 || n > 500) throw new ApiError(400, 'Copies must be a whole number from 1 to 500.');
        submitted.current = true;
        const r = await api.post<{ job: PrintJob; order: OrderDetail }>(`/api/shop/orders/${order.id}/print-jobs`, {
          fileIds,
          printer,
          copies: n,
          sides,
          colorMode,
          markPrinting,
        });
        onOrderUpdated(r.order);
        onJobCreated();
        toast('success', 'Sent to printer', `${files.length} file${files.length === 1 ? '' : 's'} → ${printer}`);
        onClose();
      } else {
        const url = await fetchBundle(order.id, fileIds);
        await openPrintDialog(url);
        setOpened(url);
        submitted.current = true;
        const r = await api.post<{ order: OrderDetail }>(`/api/shop/orders/${order.id}/print-log`, { fileIds, markPrinting });
        onOrderUpdated(r.order);
      }
    } catch (err) {
      submitted.current = false;
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Printing failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Print order #${order.orderNo}`}
      description={`${files.length} file${files.length === 1 ? '' : 's'} · ${pages} page${pages === 1 ? '' : 's'} · originals are not changed`}
      footer={
        opened ? (
          <>
            <a href={opened} target="_blank" rel="noreferrer" className="mr-auto inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink-soft hover:bg-cream-deep">
              <ExternalLink className="size-4" aria-hidden /> Open PDF instead
            </a>
            <Button onClick={onClose}>Done</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button icon={<Printer className="size-4" />} loading={busy} disabled={!files.length || (method === 'agent' && (!agentReady || !printer))} onClick={doPrint}>
              {method === 'agent' ? 'Print now' : 'Open print dialog'}
            </Button>
          </>
        )
      }
    >
      {opened ? (
        <div className="space-y-4">
          <Alert tone="success" title="Print dialog opened">
            Choose the printer and settings in the dialog and press Print. If nothing appeared, use “Open PDF instead” and print from there.
          </Alert>
          <Reminder order={order} />
        </div>
      ) : (
        <div className="space-y-5">
          {error && <Alert tone="danger">{error}</Alert>}

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink">How to print</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <MethodOption
                checked={method === 'agent'}
                onSelect={() => agentReady && setMethod('agent')}
                disabled={!agentReady}
                icon={<Printer className="size-5" />}
                title="Direct to printer"
                text={
                  agentReady
                    ? `Prints straight away on ${agent!.name || 'the shop PC'}.`
                    : agent?.paired
                      ? 'Print agent is offline. Start it on the shop PC.'
                      : 'Set up the print agent in Settings to print without a dialog.'
                }
              />
              <MethodOption
                checked={method === 'browser'}
                onSelect={() => setMethod('browser')}
                icon={<Monitor className="size-5" />}
                title="Print dialog"
                text="Opens this computer’s print dialog. Pick the printer and settings there."
              />
            </div>
          </fieldset>

          {method === 'agent' && agentReady ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Printer" className="sm:col-span-2">
                {(p) => (
                  <Select {...p} value={printer} onChange={(e) => setPrinter(e.target.value)}>
                    {agent!.printers.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Copies" hint={`Customer asked for ${order.copies}`}>
                {(p) => <Input {...p} type="number" inputMode="numeric" min={1} max={500} value={copies} onChange={(e) => setCopies(e.target.value)} className="tabular" />}
              </Field>
              <Field label="Sides" hint="Double-sided needs a duplex printer">
                {(p) => (
                  <Select {...p} value={sides} onChange={(e) => setSides(e.target.value as typeof sides)}>
                    <option value="single">Single-sided</option>
                    <option value="double">Double-sided</option>
                  </Select>
                )}
              </Field>
              <Field label="Colour">
                {(p) => (
                  <Select {...p} value={colorMode} onChange={(e) => setColorMode(e.target.value as typeof colorMode)}>
                    <option value="bw">Black &amp; white</option>
                    <option value="color">Colour</option>
                  </Select>
                )}
              </Field>
              <Field label="Paper">
                {(p) => <Input {...p} value={order.paperSize} readOnly className="bg-cream" />}
              </Field>
            </div>
          ) : (
            <Reminder order={order} />
          )}

          <ul className="max-h-40 divide-y divide-line overflow-y-auto rounded-xl border border-line" aria-label="Files to print">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                <span className="min-w-0 truncate font-medium text-ink">{f.originalName}</span>
                <span className="shrink-0 text-xs text-muted">{f.pages} pg</span>
              </li>
            ))}
          </ul>

          {canMarkPrinting && (
            <label className="flex items-center gap-3 text-sm text-ink">
              <input type="checkbox" checked={markPrinting} onChange={(e) => setMarkPrinting(e.target.checked)} className="size-4 accent-[#7a5c14]" />
              Mark the order as “Printing”
            </label>
          )}
        </div>
      )}
    </Modal>
  );
}

function Reminder({ order }: { order: OrderDetail }) {
  return (
    <div className="rounded-xl border border-gold/70 bg-gold-soft px-4 py-3 text-sm">
      <p className="font-semibold text-ink">Customer asked for</p>
      <p className="mt-0.5 text-ink-soft">
        {order.copies} cop{order.copies === 1 ? 'y' : 'ies'} · {order.paperSize} · {COLOR_LABEL[order.colorMode]} · {SIDES_LABEL[order.sides]}
      </p>
      <p className="mt-1 text-xs text-ink-soft">Set these in the print dialog.</p>
    </div>
  );
}

function MethodOption({ checked, onSelect, disabled, icon, title, text }: { checked: boolean; onSelect: () => void; disabled?: boolean; icon: React.ReactNode; title: string; text: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      onClick={onSelect}
      className={cx(
        'flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors',
        checked ? 'border-gold-ink bg-gold-soft ring-2 ring-gold/40' : 'border-line-strong bg-surface hover:bg-cream',
        disabled && 'cursor-not-allowed opacity-60 hover:bg-surface',
      )}
    >
      <span className={cx('mt-0.5', checked ? 'text-gold-ink' : 'text-muted')} aria-hidden>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-muted">{text}</span>
      </span>
    </button>
  );
}

// ---------- Job list ----------

const JOB_LABEL: Record<PrintJob['status'], string> = {
  queued: 'Waiting for printer',
  printing: 'Printing',
  done: 'Sent to printer',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export function PrintJobsList({ jobs, onCancel }: { jobs: PrintJob[]; onCancel: (id: string) => void }) {
  if (!jobs.length) return null;
  return (
    <ul className="divide-y divide-line">
      {jobs.map((j) => (
        <li key={j.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm sm:px-6" aria-live="polite">
          <span aria-hidden>
            {j.status === 'done' ? (
              <CheckCircle2 className="size-5 text-success" />
            ) : j.status === 'failed' || j.status === 'cancelled' ? (
              <XCircle className="size-5 text-danger" />
            ) : (
              <Loader2 className="size-5 animate-spin text-gold-ink" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">
              {JOB_LABEL[j.status]} <span className="font-normal text-muted">· {j.printer}</span>
            </p>
            <p className="text-xs text-muted">
              {j.fileCount} file{j.fileCount === 1 ? '' : 's'} · {j.copies}× · {SIDES_LABEL[j.sides]} · {formatDateTime(j.createdAt)}
            </p>
            {j.error && <p className="mt-0.5 text-xs text-danger">{j.error}</p>}
          </div>
          {j.status === 'queued' && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(j.id)}>
              Cancel
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

// ---------- Settings: direct printing ----------

export function DirectPrintingCard() {
  const toast = useToast();
  const [agent, setAgent] = useState<PrintAgentStatus | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmUnpair, setConfirmUnpair] = useState(false);

  const load = () => api.get<{ agent: PrintAgentStatus }>('/api/shop/print-agent').then((r) => setAgent(r.agent)).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, []);

  const pair = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ token: string; agent: PrintAgentStatus }>('/api/shop/print-agent/pair');
      setToken(r.token);
      setAgent(r.agent);
    } catch (err) {
      toast('error', 'Could not create a token', err instanceof ApiError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const unpair = async () => {
    setBusy(true);
    try {
      const r = await api.del<{ agent: PrintAgentStatus }>('/api/shop/print-agent');
      setAgent(r.agent);
      setToken(null);
      setConfirmUnpair(false);
      toast('success', 'Print agent disconnected');
    } finally {
      setBusy(false);
    }
  };

  const command = token ? `npm run print-agent -- --server ${window.location.origin} --token ${token}` : '';

  return (
    <div className="space-y-4 p-5 sm:p-6">
      <p className="text-sm text-muted">
        Browsers can’t send files to a printer on their own. To print with one click and no dialog, run the PrintFlow print agent on the PC connected to your printer.
      </p>
      {agent && agent.paired ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3">
          {agent.online ? <Badge tone="success">Online</Badge> : <Badge tone="danger">Offline</Badge>}
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-ink">{agent.name || 'Waiting for the agent to connect…'}</p>
            <p className="text-xs text-muted">
              {agent.printers.length ? `${agent.printers.length} printer${agent.printers.length === 1 ? '' : 's'}: ${agent.printers.join(', ')}` : 'No printers reported yet'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm font-semibold text-ink">No print agent connected.</p>
      )}

      {token && (
        <div className="space-y-2 rounded-xl border border-gold/70 bg-gold-soft p-4 text-sm">
          <p className="font-semibold text-ink">Run this on the shop PC (in the PrintFlow folder):</p>
          <p className="select-all break-all rounded-lg bg-surface px-3 py-2 font-mono text-xs text-ink">{command}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(command).then(() => toast('success', 'Command copied'))}>
              Copy command
            </Button>
          </div>
          <p className="text-xs text-ink-soft">This token is shown only once. Keep the agent window open while the shop is working.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant={agent?.paired ? 'secondary' : 'primary'} icon={<Printer className="size-4" />} loading={busy} onClick={pair}>
          {agent?.paired ? 'Create a new token' : 'Connect a print agent'}
        </Button>
        {agent?.paired &&
          (confirmUnpair ? (
            <Button variant="danger" icon={<Unplug className="size-4" />} loading={busy} onClick={unpair}>
              Confirm disconnect
            </Button>
          ) : (
            <Button variant="ghost" icon={<Unplug className="size-4" />} onClick={() => setConfirmUnpair(true)}>
              Disconnect
            </Button>
          ))}
      </div>
    </div>
  );
}
