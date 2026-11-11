/**
 * PrintFlow print agent — runs on the shop's PC and prints jobs sent from the Shop dashboard
 * straight to a local printer, without a print dialog.
 *
 * Setup (shop owner):
 *   1. Dashboard → Settings → Direct printing → "Connect a print agent" to get a token.
 *   2. On the PC connected to the printer, from this project folder run:
 *        npm run print-agent -- --server https://your-printflow-address --token pfa_xxx
 *      (or set PRINTFLOW_URL and PRINTFLOW_AGENT_TOKEN in .env and run `npm run print-agent`)
 *   3. Keep the window open while the shop is working.
 *
 * Windows prints through the bundled SumatraPDF (pdf-to-printer). macOS/Linux use the `lp` command.
 * Add --dry-run to save the PDFs to a folder instead of printing (for testing).
 */
import 'dotenv/config';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SERVER = (arg('server') || process.env.PRINTFLOW_URL || 'http://localhost:3000').replace(/\/+$/, '');
const TOKEN = arg('token') || process.env.PRINTFLOW_AGENT_TOKEN || '';
const DRY_RUN = process.argv.includes('--dry-run');
const DRY_DIR = arg('dry-run-dir') || path.join(os.tmpdir(), 'printflow-dry-run');
const NAME = arg('name') || os.hostname();
const POLL_MS = 3000;
const HEARTBEAT_MS = 10_000;

if (!TOKEN) {
  console.error('Missing token. Get one in the Shop dashboard (Settings → Direct printing) and pass --token pfa_...');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${TOKEN}`, 'X-Requested-With': 'PrintFlow' };

async function api<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(SERVER + url, {
    method,
    headers: body ? { ...headers, 'Content-Type': 'application/json' } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error((data as any).error || `HTTP ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

// ---------- Printers ----------

type Ptp = typeof import('pdf-to-printer');
/** pdf-to-printer is CommonJS; under dynamic import its functions sit on `default`. */
async function loadPtp(): Promise<Ptp> {
  const mod: any = await import('pdf-to-printer');
  return (mod.getPrinters ? mod : mod.default) as Ptp;
}

async function listPrinters(): Promise<{ names: string[]; defaultName: string | null }> {
  if (DRY_RUN) return { names: ['Dry run (save PDF)'], defaultName: 'Dry run (save PDF)' };
  if (process.platform === 'win32') {
    const ptp = await loadPtp();
    const printers = await ptp.getPrinters();
    const def = await ptp.getDefaultPrinter().catch(() => null);
    return { names: printers.map((p) => p.name), defaultName: def?.name ?? null };
  }
  const { stdout } = await run('lpstat', ['-a']).catch(() => ({ stdout: '' }));
  const names = stdout.split('\n').map((l) => l.split(' ')[0]).filter(Boolean);
  const { stdout: d } = await run('lpstat', ['-d']).catch(() => ({ stdout: '' }));
  const m = d.match(/:\s*(\S+)/);
  return { names, defaultName: m ? m[1] : null };
}

interface Job {
  id: string;
  printer: string;
  copies: number;
  sides: 'single' | 'double';
  colorMode: 'bw' | 'color';
  paperSize: string;
  fileCount: number;
}

async function printPdf(file: string, job: Job) {
  if (DRY_RUN) {
    fs.mkdirSync(DRY_DIR, { recursive: true });
    const dest = path.join(DRY_DIR, `${job.id}.pdf`);
    fs.copyFileSync(file, dest);
    console.log(`  [dry run] saved ${dest}`);
    return;
  }
  if (process.platform === 'win32') {
    const ptp = await loadPtp();
    await ptp.print(file, {
      printer: job.printer,
      copies: job.copies,
      side: job.sides === 'double' ? 'duplexlong' : 'simplex',
      monochrome: job.colorMode === 'bw',
      paperSize: job.paperSize,
      scale: 'fit',
    });
    return;
  }
  const args = ['-d', job.printer, '-n', String(job.copies), '-o', `sides=${job.sides === 'double' ? 'two-sided-long-edge' : 'one-sided'}`, '-o', `media=${job.paperSize}`];
  if (job.colorMode === 'bw') args.push('-o', 'print-color-mode=monochrome');
  await run('lp', [...args, file]);
}

// ---------- Main loop ----------

let lastHeartbeat = 0;
let printerNames: string[] = [];

async function heartbeat() {
  const { names, defaultName } = await listPrinters();
  printerNames = names;
  await api('POST', '/api/agent/heartbeat', { name: NAME, printers: names, defaultPrinter: defaultName });
  lastHeartbeat = Date.now();
}

async function processJob(job: Job) {
  const tmp = path.join(os.tmpdir(), `printflow-${job.id}.pdf`);
  console.log(`Job ${job.id}: ${job.fileCount} file(s) → ${job.printer}, ${job.copies}×, ${job.sides}, ${job.colorMode}`);
  try {
    if (!DRY_RUN && !printerNames.includes(job.printer)) throw new Error(`Printer "${job.printer}" is not installed on this PC.`);
    const res = await fetch(`${SERVER}/api/agent/jobs/${job.id}/document`, { headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // The server already marked the job failed with this reason.
      console.error(`  could not download: ${(data as any).error || res.status}`);
      return;
    }
    fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
    await printPdf(tmp, job);
    await api('POST', `/api/agent/jobs/${job.id}/complete`, { ok: true });
    console.log('  sent to the printer queue');
  } catch (err: any) {
    const message = String(err?.message || err).slice(0, 400);
    console.error(`  failed: ${message}`);
    await api('POST', `/api/agent/jobs/${job.id}/complete`, { ok: false, error: message }).catch(() => {});
  } finally {
    fs.rm(tmp, { force: true }, () => {});
  }
}

async function loop() {
  console.log(`PrintFlow print agent "${NAME}" → ${SERVER}${DRY_RUN ? ' (dry run)' : ''}`);
  for (;;) {
    try {
      if (Date.now() - lastHeartbeat > HEARTBEAT_MS) {
        await heartbeat();
        if (lastHeartbeat && printerNames.length === 0) console.warn('No printers found on this PC.');
      }
      const { job } = await api<{ job: Job | null }>('POST', '/api/agent/jobs/claim');
      if (job) {
        await processJob(job);
        continue; // check for the next job straight away
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        console.error(`Stopped: ${err.message}`);
        process.exit(1);
      }
      console.error(`Connection problem: ${err?.message || err}. Retrying…`);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

loop();
