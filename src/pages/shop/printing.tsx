import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Printer } from 'lucide-react';
import type { OrderDetail, OrderFile } from '../../shared/types';
import { ORDER_TRANSITIONS } from '../../shared/types';
import { shopService, ServiceError } from '../../services';
import { COLOR_LABEL, formatBytes, SIDES_LABEL } from '../../lib/format';
import { Alert, Button, Modal, Skeleton, cx } from '../../components/ui';
import { useToast } from '../../components/toast';

export const isPrintable = (f: OrderFile) => !f.purged && (f.mime === 'application/pdf' || f.mime === 'image/png' || f.mime === 'image/jpeg');

// ---------- Stored files ----------

/** Object URL for a stored file (loaded from browser storage), revoked when no longer used. */
export function useFileUrl(file: OrderFile | null) {
  // Remember which file the URL/error belongs to, so a new file never briefly shows the previous file's URL.
  const [state, setState] = useState<{ id: string; url: string | null; error: string | null } | null>(null);
  const id = file && !file.purged ? file.id : null;
  useEffect(() => {
    if (!id) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    shopService
      .getFileBlob(id)
      .then(({ blob }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ id, url: objectUrl, error: null });
      })
      .catch((err) => !cancelled && setState({ id, url: null, error: err instanceof ServiceError ? err.message : 'Could not open the file.' }));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  const current = state && state.id === id ? state : null;
  return { url: current?.url ?? null, error: current?.error ?? null };
}

/** Saves a stored file to the computer. */
export async function downloadFile(file: OrderFile) {
  const { blob, name } = await shopService.getFileBlob(file.id);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function DownloadButton({ file, className, children }: { file: OrderFile; className: string; children: React.ReactNode }) {
  const toast = useToast();
  return (
    <button
      type="button"
      className={className}
      aria-label={`Download ${file.originalName}`}
      onClick={() => downloadFile(file).catch((err) => toast('error', 'Could not download', err instanceof ServiceError ? err.message : undefined))}
    >
      {children}
    </button>
  );
}

export function FileThumb({ file }: { file: OrderFile }) {
  const { url } = useFileUrl(file);
  return url ? <img src={url} alt="" className="size-full object-cover" /> : <span className="size-full animate-pulse bg-cream-deep" />;
}

// ---------- Browser printing ----------

let printFrame: HTMLIFrameElement | null = null;
let printBlobUrl: string | null = null;

/** Builds the merged PDF in the browser and returns an object URL for it. */
async function makeBundle(orderId: string, fileIds: string[]): Promise<string> {
  const blob = await shopService.buildPrintBundle(orderId, fileIds);
  if (printBlobUrl) URL.revokeObjectURL(printBlobUrl);
  printBlobUrl = URL.createObjectURL(blob);
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
  const { url, error } = useFileUrl(f && (f.mime.startsWith('image/') || f.mime === 'application/pdf') ? f : null);
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
              <DownloadButton file={f} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:bg-cream">
                <Download className="size-4" aria-hidden /> Download
              </DownloadButton>
            )}
            <Button onClick={onClose}>Done</Button>
          </>
        )
      }
    >
      {f &&
        (f.purged ? (
          <p className="py-10 text-center text-sm text-muted">This file has been deleted.</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-danger">{error}</p>
        ) : f.mime.startsWith('image/') ? (
          url ? <img src={url} alt={`Preview of ${f.originalName}`} className="mx-auto max-h-[62dvh] rounded-lg border border-line object-contain" /> : <Skeleton className="h-[62dvh]" />
        ) : f.mime === 'application/pdf' ? (
          url ? <iframe key={f.id} src={url} title={`Preview of ${f.originalName}`} className="h-[62dvh] w-full rounded-lg border border-line bg-cream" /> : <Skeleton className="h-[62dvh]" />
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

export function PrintDialog({
  open,
  onClose,
  order,
  fileIds,
  onOrderUpdated,
}: {
  open: boolean;
  onClose: () => void;
  order: OrderDetail;
  fileIds: string[];
  onOrderUpdated: (o: OrderDetail) => void;
}) {
  const canMarkPrinting = ORDER_TRANSITIONS[order.status].includes('printing');
  const [markPrinting, setMarkPrinting] = useState(canMarkPrinting);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null); // PDF URL after the dialog opened
  const submitted = useRef(false);

  const files = order.files.filter((f) => fileIds.includes(f.id));
  const pages = files.reduce((s, f) => s + f.pages, 0);

  useEffect(() => {
    if (!open) return;
    submitted.current = false;
    setError(null);
    setOpened(null);
    setBusy(false);
    setMarkPrinting(ORDER_TRANSITIONS[order.status].includes('printing'));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const doPrint = async () => {
    if (busy || submitted.current) return; // prevent double submissions
    setError(null);
    setBusy(true);
    try {
      const url = await makeBundle(order.id, fileIds);
      await openPrintDialog(url);
      setOpened(url);
      submitted.current = true;
      onOrderUpdated(await shopService.logPrint(order.id, fileIds, markPrinting));
    } catch (err) {
      submitted.current = false;
      setError(err instanceof Error ? err.message : 'Printing failed.');
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
            <Button icon={<Printer className="size-4" />} loading={busy} disabled={!files.length} onClick={doPrint}>
              Open print dialog
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
          <Reminder order={order} />

          <ul className="max-h-40 divide-y divide-line overflow-y-auto rounded-xl border border-line" aria-label="Files to print">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                <span className="min-w-0 truncate font-medium text-ink">{f.originalName}</span>
                <span className="shrink-0 text-xs text-muted">{f.pages} pg</span>
              </li>
            ))}
          </ul>

          {canMarkPrinting && (
            <label className={cx('flex items-center gap-3 text-sm text-ink')}>
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
