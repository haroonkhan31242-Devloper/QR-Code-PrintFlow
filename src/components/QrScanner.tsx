import { useEffect, useRef, useState } from 'react';
import { Camera, ImageUp } from 'lucide-react';
import { navigate } from '../lib/router';
import { Alert, Button, Modal } from './ui';

/**
 * Scans a shop QR code in the browser: live camera (where the browser allows it) or a photo/screenshot of the code.
 * Decoding runs locally with jsQR; nothing is sent anywhere.
 */

type Decoder = (data: Uint8ClampedArray, width: number, height: number, opts?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' }) => { data: string } | null;
let decoderPromise: Promise<Decoder> | null = null;
const loadDecoder = () => (decoderPromise ??= import('jsqr').then((m) => m.default as unknown as Decoder));

function decodeCanvas(decode: Decoder, canvas: HTMLCanvasElement, source: CanvasImageSource, w: number, h: number) {
  const scale = Math.min(1, 1024 / Math.max(w, h));
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return decode(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}

/** Returns the in-app path for a PrintFlow QR link (e.g. "/s/abc123"), or null for any other content. */
function toAppPath(text: string): string | null {
  try {
    const url = new URL(text, window.location.origin);
    const m = url.pathname.match(/^\/s\/([a-z0-9]{6,40})\/?$/i);
    return m ? `/s/${m[1].toLowerCase()}` : null;
  } catch {
    return null;
  }
}

export function QrScannerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'on' | 'unavailable'>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = (text: string) => {
    const path = toAppPath(text);
    if (path) {
      onClose();
      navigate(path);
    } else {
      setResult(text);
    }
  };

  // Live camera scanning while the dialog is open.
  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      return;
    }
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    setCameraState('starting');
    Promise.all([navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }), loadDecoder()])
      .then(async ([s, decode]) => {
        stream = s;
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        const video = videoRef.current!;
        video.srcObject = s;
        await video.play().catch(() => {});
        setCameraState('on');
        let last = 0;
        const tick = (t: number) => {
          if (stopped) return;
          if (t - last > 200 && video.readyState >= 2 && video.videoWidth) {
            last = t;
            const text = decodeCanvas(decode, canvasRef.current, video, video.videoWidth, video.videoHeight);
            if (text) {
              stopped = true;
              handle(text);
              return;
            }
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      })
      .catch(() => !stopped && setCameraState('unavailable'));
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
      setCameraState('idle');
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const scanImage = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const [decode, bitmap] = await Promise.all([loadDecoder(), createImageBitmap(file)]);
      const text = decodeCanvas(decode, canvasRef.current, bitmap, bitmap.width, bitmap.height);
      bitmap.close();
      if (text) handle(text);
      else setError('No QR code found in that image. Try a sharper, closer photo.');
    } catch {
      setError('That file could not be read as an image.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Scan a shop QR code"
      description="Point your camera at the QR code at the print shop counter, or choose a photo of it."
      footer={
        <>
          <Button variant="secondary" icon={<ImageUp className="size-4" />} onClick={() => fileRef.current?.click()}>
            Choose a photo
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => scanImage(e.target.files?.[0])} />
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        {result && (
          <Alert tone="warning" title="This isn’t a PrintFlow shop code">
            <span className="break-all">{result}</span>
          </Alert>
        )}
        {cameraState === 'unavailable' ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-cream px-4 py-10 text-center">
            <Camera className="size-8 text-muted" aria-hidden />
            <p className="mt-3 max-w-xs text-sm text-muted">The camera isn’t available here (no camera, or permission was denied). Choose a photo of the QR code instead.</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-line bg-ink">
            <video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" aria-label="Camera preview" />
            <div className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-gold" aria-hidden />
            {cameraState !== 'on' && <p className="absolute inset-x-0 bottom-4 text-center text-sm text-white/80">Starting camera…</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
