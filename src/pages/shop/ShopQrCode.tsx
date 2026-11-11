import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, ExternalLink, Printer, RefreshCw } from 'lucide-react';
import { shopService, ServiceError } from '../../services';
import { useDocumentTitle } from '../../lib/router';
import { Alert, Button, Card, CardHeader, PageHeader, Skeleton } from '../../components/ui';
import { ConfirmModal } from '../../components/shared';
import { useToast } from '../../components/toast';
import { useShop } from './ShopContext';

export function ShopQrCode() {
  useDocumentTitle('QR code');
  const toast = useToast();
  const { shop, setShop } = useShop();
  const [img, setImg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const url = shop ? `${window.location.origin}/s/${shop.qrToken}` : '';

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#1f2328', light: '#ffffff' } })
      .then(setImg)
      .catch(() => setImg(null));
  }, [url]);

  if (!shop) return <Skeleton className="h-96" />;

  const download = () => {
    if (!img) return;
    const a = document.createElement('a');
    a.href = img;
    a.download = `${shop.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-qr.png`;
    a.click();
  };

  const regenerate = async () => {
    setBusy(true);
    try {
      setShop(await shopService.regenerateQr());
      toast('success', 'New QR code created', 'Print it and replace the old one at your counter.');
      setConfirm(false);
    } catch (err) {
      toast('error', 'Could not create a new QR code', err instanceof ServiceError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="no-print">
        <PageHeader title="QR code" description="Put this at your counter. Customers scan it to send you documents." />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Printable poster */}
        <Card className="print-poster overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-gold to-orange" aria-hidden />
          <div className="flex flex-col items-center px-6 py-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-ink">Scan to print</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{shop.name}</h2>
            <div className="mt-6 rounded-2xl border border-line bg-white p-3">
              {img ? <img src={img} alt={`QR code for ${shop.name}`} className="aspect-square h-auto w-64 max-w-full sm:w-72" /> : <Skeleton className="size-64 sm:size-72" />}
            </div>
            <ol className="mt-6 space-y-1 text-sm text-ink-soft">
              <li>1. Open your phone camera and scan</li>
              <li>2. Upload your PDF, Word or photos</li>
              <li>3. Collect your prints at the counter</li>
            </ol>
            <p className="mt-4 text-xs text-muted">No app or account needed</p>
          </div>
        </Card>

        <div className="no-print space-y-6">
          <Card>
            <CardHeader title="Use it" />
            <div className="space-y-4 p-5 sm:p-6">
              <div className="grid gap-2 sm:grid-cols-2">
                <Button icon={<Printer className="size-4" />} onClick={() => window.print()}>
                  Print poster
                </Button>
                <Button variant="secondary" icon={<Download className="size-4" />} onClick={download} disabled={!img}>
                  Download PNG
                </Button>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-ink">Upload link</p>
                <div className="flex gap-2">
                  <p className="min-w-0 flex-1 truncate rounded-xl border border-line bg-cream px-3 py-2.5 font-mono text-sm text-ink-soft" title={url}>
                    {url}
                  </p>
                  <Button
                    variant="secondary"
                    className="w-11 shrink-0 px-0"
                    aria-label="Copy link"
                    onClick={() => navigator.clipboard?.writeText(url).then(() => toast('success', 'Link copied'))}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-ink hover:underline">
                  Preview what customers see <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
              <p className="text-sm text-muted">You can also share the link on WhatsApp so customers can send files before they arrive.</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Replace QR code" description="Use this if your QR code was copied or misused." />
            <div className="space-y-4 p-5 sm:p-6">
              <Alert tone="warning">The current QR code and link stop working immediately. You will need to print the new one.</Alert>
              <Button variant="secondary" icon={<RefreshCw className="size-4" />} onClick={() => setConfirm(true)}>
                Create a new QR code
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={regenerate}
        loading={busy}
        danger
        title="Replace your QR code?"
        description="Customers scanning the old QR code will see a message to ask for the new one."
        confirmLabel="Create new QR code"
      />

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-poster, .print-poster * { visibility: visible; }
          .print-poster { position: fixed; inset: 0; border: none; box-shadow: none; border-radius: 0; }
          .print-poster img { width: 11cm; height: 11cm; }
        }
      `}</style>
    </>
  );
}
