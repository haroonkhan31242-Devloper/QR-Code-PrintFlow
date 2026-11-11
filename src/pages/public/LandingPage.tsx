import React, { useState } from 'react';
import { ArrowRight, FileUp, Printer, ScanLine, Search } from 'lucide-react';
import { Link, navigate, useDocumentTitle } from '../../lib/router';
import { Button, Card, Input } from '../../components/ui';
import { PublicShell } from './PublicShell';
import { QrScannerModal } from '../../components/QrScanner';

export function LandingPage() {
  useDocumentTitle('');
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);

  const steps = [
    { icon: ScanLine, title: 'Scan the QR code', text: 'Find the PrintFlow QR code at the print shop counter and scan it with your phone camera.' },
    { icon: FileUp, title: 'Upload your files', text: 'Choose PDFs, Word documents or photos, pick colour, paper size and copies. No account needed.' },
    { icon: Printer, title: 'Collect your prints', text: 'The shop gets your files instantly. Track progress with your code and pick up when ready.' },
  ];

  return (
    <PublicShell poweredBy>
      <section className="relative overflow-hidden">
        <div className="absolute -right-32 -top-40 size-[28rem] rounded-full bg-gold/35 blur-3xl" aria-hidden />
        <div className="absolute -left-40 top-40 size-[22rem] rounded-full bg-orange/25 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold/70 bg-surface px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-ink">
            QR printing for print shops
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl" style={{ textWrap: 'balance' }}>
            Send documents to the print shop from your phone.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Scan the shop’s QR code, upload your files and collect your prints. No app, no sign-up, no USB drives.
          </p>
          <Button size="lg" className="mt-8" icon={<ScanLine className="size-5" />} onClick={() => setScanning(true)}>
            Scan a shop QR code
          </Button>

          <Card className="mt-8 max-w-xl p-5 sm:p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const c = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (c) navigate(`/track/${c}`);
              }}
            >
              <label htmlFor="track-code" className="text-sm font-semibold text-ink">
                Already sent something? Track your order
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  id="track-code"
                  placeholder="Tracking code, e.g. K7M2QP9X"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoCapitalize="characters"
                  className="uppercase placeholder:normal-case"
                />
                <Button type="submit" icon={<Search className="size-4" />} className="sm:w-auto">
                  Track
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">How it works</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-line bg-cream p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-gold text-ink" aria-hidden>
                    <s.icon className="size-5" />
                  </span>
                  <span className="text-sm font-bold text-gold-ink">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-[15px] text-muted">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-orange/60 bg-orange-soft p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-lg font-bold text-ink">Own a print shop?</p>
              <p className="text-[15px] text-ink-soft">Sign in to see incoming files, update prices and print your QR code.</p>
            </div>
            <Link
              to="/shop/login"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-soft"
            >
              Shop sign in <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
      <QrScannerModal open={scanning} onClose={() => setScanning(false)} />
    </PublicShell>
  );
}
