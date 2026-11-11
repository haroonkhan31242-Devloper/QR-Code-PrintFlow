import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Copy, FileText, MapPin, Minus, Phone, Plus, RefreshCw, Store, Trash2, UploadCloud, X } from 'lucide-react';
import { publicService, ServiceError } from '../../services';
import { docxPageCount, pdfPageCount } from '../../services/fileInspect';
import { useQuery } from '../../lib/useQuery';
import { Link, useDocumentTitle } from '../../lib/router';
import { COLOR_LABEL, FINISHING_LABEL, formatBytes, formatMoney } from '../../lib/format';
import { estimatePrice } from '../../shared/pricing';
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
  PAPER_SIZES,
  type ColorMode,
  type FinishingCode,
  type PaperSize,
  type PublicShop,
  type Sides,
} from '../../shared/types';
import { Button, Logo, Modal, Spinner, cx } from '../../components/ui';
import { useToast } from '../../components/toast';

/**
 * Customer page opened by scanning a shop's QR code.
 * Everything fits in one non-scrolling screen (100dvh): files on one side, options and details on the other.
 */

interface PickedFile {
  key: string;
  file: File;
  pages: number;
  pagesKnown: boolean;
  previewUrl: string | null; // object URL for images and PDFs
}

const isImage = (f: File) => /\.(png|jpe?g)$/i.test(f.name);
const isPdf = (f: File) => /\.pdf$/i.test(f.name);
const extOf = (f: File) => f.name.split('.').pop()?.toUpperCase() ?? '';

async function inspectFile(file: File): Promise<{ pages: number; known: boolean }> {
  try {
    if (isPdf(file)) return { pages: await pdfPageCount(file), known: true };
    if (isImage(file)) return { pages: 1, known: true };
    if (/\.docx$/i.test(file.name)) {
      const pages = await docxPageCount(file);
      if (pages) return { pages, known: true };
    }
  } catch {
    /* fall through */
  }
  return { pages: 1, known: false }; // old .doc files: the shop confirms the page count
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="flex h-dvh flex-col overflow-hidden bg-cream">{children}</div>;
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <Screen>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 text-center shadow-card sm:p-8">{children}</div>
      </div>
    </Screen>
  );
}

export function CustomerUploadPage({ token }: { token: string }) {
  const { data, error, loading, reload } = useQuery<{ shop: PublicShop }>(`public-shop:${token}`, async () => ({ shop: await publicService.getShopByToken(token) }));
  const shop = data?.shop;
  useDocumentTitle(shop ? `Print at ${shop.name}` : 'Send files to print');

  if (loading) {
    return (
      <Screen>
        <div className="flex flex-1 items-center justify-center">
          <Spinner label="Opening shop…" />
        </div>
      </Screen>
    );
  }
  if (error || !shop) {
    const notFound = error?.status === 404;
    return (
      <CenteredCard>
        <div className={cx('mx-auto flex size-12 items-center justify-center rounded-2xl', notFound ? 'bg-gold-soft text-gold-ink' : 'bg-danger-soft text-danger')} aria-hidden>
          {notFound ? <Store className="size-6" /> : <AlertCircle className="size-6" />}
        </div>
        <h1 className="mt-4 text-xl font-bold text-ink">{notFound ? 'This QR code isn’t valid' : 'Couldn’t open the shop'}</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          {notFound ? 'It may have been replaced. Please ask the shop for their current QR code.' : error?.message}
        </p>
        {!notFound && (
          <Button variant="secondary" className="mt-5" onClick={() => reload()}>
            Try again
          </Button>
        )}
      </CenteredCard>
    );
  }
  return <UploadScreen token={token} shop={shop} />;
}

function UploadScreen({ token, shop }: { token: string; shop: PublicShop }) {
  const toast = useToast();
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<PickedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const availableSizes = PAPER_SIZES.filter((s) => shop.prices.some((p) => p.paperSize === s));
  const [paperSize, setPaperSize] = useState<PaperSize>(availableSizes[0] ?? 'A4');
  const colorsForSize = shop.prices.filter((p) => p.paperSize === paperSize).map((p) => p.colorMode);
  const [colorMode, setColorMode] = useState<ColorMode>('bw');
  const [sides, setSides] = useState<Sides>('single');
  const [copies, setCopies] = useState(1);
  const [finishing, setFinishing] = useState<FinishingCode>('none');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState<{ trackingCode: string; orderNo: number; estimatedTotal: number } | null>(null);

  // Release object URLs when files are removed or the page closes.
  const filesRef = useRef(files);
  filesRef.current = files;
  useEffect(() => () => filesRef.current.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl)), []);

  const effectiveColor: ColorMode = colorsForSize.includes(colorMode) ? colorMode : colorsForSize[0] ?? 'bw';
  const pageCount = files.reduce((s, f) => s + f.pages, 0);
  const estimate = useMemo(
    () => estimatePrice({ pageCount, copies, colorMode: effectiveColor, paperSize, sides, finishing }, shop.prices, shop.finishing),
    [pageCount, copies, effectiveColor, paperSize, sides, finishing, shop],
  );
  const unknownPages = files.some((f) => !f.pagesKnown);
  const uploading = progress !== null;
  const previewFile = files.find((f) => f.key === previewKey) ?? null;

  async function toPicked(list: File[]): Promise<PickedFile[]> {
    const out: PickedFile[] = [];
    for (const file of list) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!(ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) {
        toast('error', `${file.name} can’t be sent`, 'Use PDF, Word, JPG or PNG files.');
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast('error', `${file.name} is too large`, `Each file must be under ${formatBytes(MAX_UPLOAD_BYTES)}.`);
        continue;
      }
      if (file.size === 0) {
        toast('error', `${file.name} is empty`);
        continue;
      }
      const { pages, known } = await inspectFile(file);
      out.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        pages,
        pagesKnown: known,
        previewUrl: isImage(file) || isPdf(file) ? URL.createObjectURL(file) : null,
      });
    }
    return out;
  }

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const picked = await toPicked(Array.from(list));
    setFiles((prev) => {
      const merged = [...prev, ...picked];
      if (merged.length > MAX_UPLOAD_FILES) {
        toast('error', `You can send up to ${MAX_UPLOAD_FILES} files at once`);
        merged.slice(MAX_UPLOAD_FILES).forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
      }
      return merged.slice(0, MAX_UPLOAD_FILES);
    });
    setErrors((e) => ({ ...e, files: '' }));
    if (addInput.current) addInput.current.value = '';
  };

  const removeFile = (key: string) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.key === key);
      if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
      return prev.filter((x) => x.key !== key);
    });
    if (previewKey === key) setPreviewKey(null);
  };

  const replaceFile = async (list: FileList | null) => {
    if (!list?.length || !previewKey) return;
    const [picked] = await toPicked([list[0]]);
    if (replaceInput.current) replaceInput.current.value = '';
    if (!picked) return;
    setFiles((prev) =>
      prev.map((f) => {
        if (f.key !== previewKey) return f;
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        return picked;
      }),
    );
    setPreviewKey(picked.key);
    toast('success', 'File replaced');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    const errs: Record<string, string> = {};
    if (!files.length) errs.files = 'Add at least one file.';
    if (name.trim().length < 2) errs.name = 'Enter your name.';
    if (!/^[+\d][\d\s()-]{5,}$/.test(phone.trim())) errs.phone = 'Enter a valid phone number.';
    setErrors(errs);
    setSubmitError(null);
    if (Object.keys(errs).length) {
      document.getElementById(errs.files ? 'pf-add-files' : errs.name ? 'pf-name' : 'pf-phone')?.focus();
      return;
    }

    setProgress(0);
    try {
      const r = await publicService.createOrder(
        token,
        { customerName: name.trim(), customerPhone: phone.trim(), notes: notes.trim(), colorMode: effectiveColor, paperSize, sides, copies, finishing },
        files.map((f) => f.file),
        setProgress,
      );
      setDone(r);
    } catch (err) {
      setSubmitError(err instanceof ServiceError ? err.message : 'Upload failed. Please try again.');
    } finally {
      setProgress(null);
    }
  };

  const startOver = () => {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setNotes('');
    setDone(null);
  };

  // ---------- Success ----------
  if (done) {
    return (
      <CenteredCard>
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft text-success" aria-hidden>
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink" role="status">
          Sent to {shop.name}
        </h1>
        <p className="mt-1 text-[15px] text-muted">Show this code at the counter when you collect your prints.</p>
        <div className="mt-5 rounded-2xl border border-gold/70 bg-gold-soft px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-ink">Tracking code</p>
          <p className="tabular mt-1 font-mono text-3xl font-extrabold tracking-[0.15em] text-ink">{done.trackingCode}</p>
          <p className="mt-1 text-sm text-ink-soft">
            Order #{done.orderNo} · Estimated {formatMoney(done.estimatedTotal)}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            icon={<Copy className="size-4" />}
            onClick={() => navigator.clipboard?.writeText(done.trackingCode).then(() => toast('success', 'Code copied'))}
          >
            Copy code
          </Button>
          <Link
            to={`/track/${done.trackingCode}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-ink hover:bg-[#e0bb5f]"
          >
            Track order
          </Link>
        </div>
        <button className="mt-4 text-sm font-semibold text-gold-ink hover:underline" onClick={startOver}>
          Send more files
        </button>
      </CenteredCard>
    );
  }

  // ---------- Upload ----------
  const label = 'mb-1 block text-xs font-semibold text-ink-soft';
  const control =
    'h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px] text-ink focus:border-gold-ink focus:outline-none focus:ring-4 focus:ring-gold/30 disabled:bg-cream';

  return (
    <Screen>
      {/* Header: shop identity only */}
      <header className="shrink-0 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo compact />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-tight text-ink">{shop.name}</p>
            <p className="flex items-center gap-3 truncate text-xs text-muted">
              {(shop.address || shop.city) && (
                <span className="inline-flex min-w-0 items-center gap-1 truncate">
                  <MapPin className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{[shop.address, shop.city].filter(Boolean).join(', ')}</span>
                </span>
              )}
              {shop.operatingHours && (
                <span className="hidden items-center gap-1 sm:inline-flex">
                  <Clock className="size-3" aria-hidden /> {shop.operatingHours}
                </span>
              )}
            </p>
          </div>
          {shop.phone && (
            <a href={`tel:${shop.phone}`} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-cream-deep" aria-label={`Call ${shop.name}`}>
              <Phone className="size-4" />
            </a>
          )}
        </div>
      </header>

      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-rows-[minmax(0,auto)_minmax(0,1fr)] gap-3 p-3 sm:gap-4 sm:p-5 lg:grid-cols-[1.15fr_1fr] lg:grid-rows-1">
          {/* Files */}
          <section className="flex max-h-[42dvh] min-h-0 flex-col rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5 lg:max-h-none" aria-labelledby="pf-files-title">
            <div className="flex items-baseline justify-between gap-3">
              <h1 id="pf-files-title" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
                Send files to print
              </h1>
              <span className="shrink-0 text-xs text-muted">
                {files.length}/{MAX_UPLOAD_FILES} files
              </span>
            </div>
            <p className="text-sm text-muted">PDF, Word, JPG or PNG · up to {formatBytes(MAX_UPLOAD_BYTES)} each</p>

            {!shop.isOpen && (
              <p className="mt-3 rounded-xl border border-orange/60 bg-orange-soft px-3 py-2 text-sm text-orange-ink" role="status">
                This shop isn’t accepting uploads right now. Please ask at the counter.
              </p>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (shop.isOpen && !uploading) addFiles(e.dataTransfer.files);
              }}
              className={cx(
                'mt-3 flex min-h-0 flex-col rounded-xl border-2 border-dashed transition-colors',
                files.length ? 'flex-1' : 'lg:flex-1',
                dragging ? 'border-gold-ink bg-gold-soft' : errors.files ? 'border-danger/60 bg-danger-soft/40' : 'border-line-strong bg-cream',
              )}
            >
              {files.length === 0 ? (
                <button
                  id="pf-add-files"
                  type="button"
                  onClick={() => addInput.current?.click()}
                  disabled={!shop.isOpen || uploading}
                  className="flex w-full flex-1 flex-col items-center justify-center gap-1 rounded-xl px-4 py-5 text-center disabled:opacity-50 sm:py-8"
                  aria-describedby={errors.files ? 'pf-files-error' : undefined}
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-gold text-ink" aria-hidden>
                    <UploadCloud className="size-5" />
                  </span>
                  <span className="mt-1.5 text-[15px] font-semibold text-ink">Tap to choose files</span>
                  <span className="hidden text-sm text-muted sm:block">or drag and drop them here</span>
                </button>
              ) : (
                <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-3 gap-2 overflow-y-auto p-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4" aria-label="Selected files">
                  {files.map((f) => (
                    <li key={f.key} className="relative">
                      <button
                        type="button"
                        onClick={() => setPreviewKey(f.key)}
                        className="group flex w-full flex-col overflow-hidden rounded-lg border border-line bg-surface text-left hover:border-gold-ink"
                        aria-label={`Preview ${f.file.name}`}
                      >
                        <span className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-cream-deep">
                          {isImage(f.file) && f.previewUrl ? (
                            <img src={f.previewUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="flex flex-col items-center text-orange-ink" aria-hidden>
                              <FileText className="size-6" />
                              <span className="mt-0.5 text-[10px] font-bold">{extOf(f.file)}</span>
                            </span>
                          )}
                        </span>
                        <span className="block truncate px-1.5 pt-1 text-xs font-semibold text-ink">{f.file.name}</span>
                        <span className="block px-1.5 pb-1 text-[11px] text-muted">{f.pagesKnown ? `${f.pages} pg` : 'Word'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(f.key)}
                        disabled={uploading}
                        className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-ink/75 text-white hover:bg-danger"
                        aria-label={`Remove ${f.file.name}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                  {files.length < MAX_UPLOAD_FILES && (
                    <li>
                      <button
                        id="pf-add-files"
                        type="button"
                        onClick={() => addInput.current?.click()}
                        disabled={!shop.isOpen || uploading}
                        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-strong bg-surface text-xs font-semibold text-ink-soft hover:border-gold-ink hover:text-ink"
                      >
                        <Plus className="size-5" aria-hidden />
                        Add more
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
            {errors.files && (
              <p id="pf-files-error" className="mt-1.5 text-sm text-danger" role="alert">
                {errors.files}
              </p>
            )}
            <input
              ref={addInput}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => addFiles(e.target.files)}
            />
            <input
              ref={replaceInput}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => replaceFile(e.target.files)}
            />
          </section>

          {/* Options and details */}
          <section className="min-h-0 overflow-y-auto rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5" aria-label="Print options and your details">
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <div>
                <label htmlFor="pf-color" className={label}>Colour</label>
                <select id="pf-color" className={control} value={effectiveColor} onChange={(e) => setColorMode(e.target.value as ColorMode)}>
                  {colorsForSize.map((c) => (
                    <option key={c} value={c}>{COLOR_LABEL[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pf-sides" className={label}>Sides</label>
                <select id="pf-sides" className={control} value={sides} onChange={(e) => setSides(e.target.value as Sides)}>
                  <option value="single">Single-sided</option>
                  <option value="double">Double-sided</option>
                </select>
              </div>
              <div>
                <label htmlFor="pf-paper" className={label}>Paper</label>
                <select id="pf-paper" className={control} value={paperSize} onChange={(e) => setPaperSize(e.target.value as PaperSize)}>
                  {availableSizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <span id="pf-copies-label" className={label}>Copies</span>
                <div className="flex h-11 items-center rounded-xl border border-line-strong" role="group" aria-labelledby="pf-copies-label">
                  <button type="button" className="flex h-full w-11 items-center justify-center text-ink-soft hover:bg-cream" aria-label="Fewer copies" onClick={() => setCopies((c) => Math.max(1, c - 1))}>
                    <Minus className="size-4" />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={500}
                    value={copies}
                    aria-label="Number of copies"
                    onChange={(e) => setCopies(Math.min(500, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
                    className="tabular h-full w-full min-w-0 border-x border-line bg-transparent text-center text-[15px] font-semibold text-ink focus:outline-none"
                  />
                  <button type="button" className="flex h-full w-11 items-center justify-center text-ink-soft hover:bg-cream" aria-label="More copies" onClick={() => setCopies((c) => Math.min(500, c + 1))}>
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
              {shop.finishing.length > 0 && (
                <div className="col-span-2">
                  <label htmlFor="pf-finishing" className={label}>Finishing</label>
                  <select id="pf-finishing" className={control} value={finishing} onChange={(e) => setFinishing(e.target.value as FinishingCode)}>
                    <option value="none">None</option>
                    {shop.finishing.map((f) => (
                      <option key={f.code} value={f.code}>
                        {FINISHING_LABEL[f.code]} (+{formatMoney(f.price)} per copy)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-2 mt-1 border-t border-line pt-3" />

              <div>
                <label htmlFor="pf-name" className={label}>
                  Your name <span className="text-danger" aria-hidden>*</span>
                </label>
                <input
                  id="pf-name"
                  className={cx(control, errors.name && 'border-danger')}
                  autoComplete="name"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? 'pf-name-error' : undefined}
                  required
                />
                {errors.name && <p id="pf-name-error" className="mt-1 text-xs text-danger">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="pf-phone" className={label}>
                  Phone <span className="text-danger" aria-hidden>*</span>
                </label>
                <input
                  id="pf-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="03XX XXXXXXX"
                  className={cx(control, errors.phone && 'border-danger')}
                  value={phone}
                  maxLength={30}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={errors.phone ? true : undefined}
                  aria-describedby={errors.phone ? 'pf-phone-error' : undefined}
                  required
                />
                {errors.phone && <p id="pf-phone-error" className="mt-1 text-xs text-danger">{errors.phone}</p>}
              </div>
              <div className="col-span-2">
                <label htmlFor="pf-notes" className={label}>Note for the shop (optional)</label>
                <input id="pf-notes" className={control} placeholder="e.g. pages 1–5 only" value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </section>
        </div>

        {/* Action bar */}
        <div className="shrink-0 border-t border-line bg-surface" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {uploading && (
            <div className="h-1 bg-cream-deep" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((progress ?? 0) * 100)}>
              <div className="h-full bg-gold-ink transition-[width]" style={{ width: `${(progress ?? 0) * 100}%` }} />
            </div>
          )}
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              {submitError ? (
                <p className="flex items-start gap-1.5 text-sm text-danger" role="alert">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="line-clamp-2">{submitError}</span>
                </p>
              ) : (
                <>
                  <p className="truncate text-xs text-muted">
                    {files.length ? `${pageCount} page${pageCount === 1 ? '' : 's'} × ${copies} · estimate` : 'Estimated price'}
                  </p>
                  <p className="tabular truncate text-xl font-extrabold leading-tight text-ink">
                    {formatMoney(estimate.total)}
                    {unknownPages && <span className="ml-1 text-xs font-semibold text-muted">+ Word pages</span>}
                  </p>
                </>
              )}
            </div>
            <Button type="submit" size="lg" loading={uploading} disabled={!shop.isOpen} className="min-w-36">
              {uploading ? `Sending ${Math.round((progress ?? 0) * 100)}%` : 'Send to shop'}
            </Button>
          </div>
        </div>
      </form>

      {/* File preview */}
      <Modal
        open={!!previewFile}
        onClose={() => setPreviewKey(null)}
        size="lg"
        title={previewFile?.file.name ?? ''}
        description={previewFile ? `${formatBytes(previewFile.file.size)} · ${previewFile.pagesKnown ? `${previewFile.pages} page${previewFile.pages === 1 ? '' : 's'}` : 'page count checked by the shop'}` : undefined}
        footer={
          previewFile && (
            <>
              <Button variant="ghost" className="mr-auto text-danger hover:bg-danger-soft hover:text-danger" icon={<Trash2 className="size-4" />} onClick={() => removeFile(previewFile.key)}>
                Remove
              </Button>
              <Button variant="secondary" icon={<RefreshCw className="size-4" />} onClick={() => replaceInput.current?.click()}>
                Replace
              </Button>
              <Button onClick={() => setPreviewKey(null)}>Done</Button>
            </>
          )
        }
      >
        {previewFile &&
          (isImage(previewFile.file) && previewFile.previewUrl ? (
            <img src={previewFile.previewUrl} alt={`Preview of ${previewFile.file.name}`} className="mx-auto max-h-[60dvh] rounded-lg border border-line object-contain" />
          ) : isPdf(previewFile.file) && previewFile.previewUrl ? (
            <iframe src={previewFile.previewUrl} title={`Preview of ${previewFile.file.name}`} className="h-[60dvh] w-full rounded-lg border border-line" />
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <FileText className="size-10 text-orange-ink" aria-hidden />
              <p className="mt-3 text-sm text-muted">Word documents can’t be previewed here. The shop will open it before printing.</p>
            </div>
          ))}
      </Modal>
    </Screen>
  );
}
