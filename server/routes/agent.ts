import { Router, type NextFunction, type Request, type Response } from 'express';
import { db, nowIso } from '../db';
import { buildPrintBundle, loadPrintableFiles } from '../print';
import { failStuckJobs, hashAgentToken } from '../printJobs';
import { rateLimit } from '../security';
import { HttpError, text } from '../validate';
import type { PaperSize } from '../../shared/types';

/**
 * API used by the PrintFlow print agent running on a shop's PC (scripts/print-agent.ts).
 * Authenticated with the agent token from pairing (Authorization: Bearer pfa_...), never with a user session.
 * An agent can only see and print its own shop's jobs.
 */
export const agentRouter = Router();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      agentShopId?: string;
    }
  }
}

function requireAgent(req: Request, res: Response, next: NextFunction) {
  if (!rateLimit(`agent:${req.ip}`, 600, 10 * 60_000)) return res.status(429).json({ error: 'Too many requests.' });
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!/^pfa_[\w-]{20,80}$/.test(token)) return res.status(401).json({ error: 'Missing or invalid agent token.' });
  const row = db
    .prepare(`SELECT a.shop_id, s.status FROM print_agents a JOIN shops s ON s.id = a.shop_id WHERE a.token_hash = ?`)
    .get(hashAgentToken(token)) as { shop_id: string; status: string } | undefined;
  if (!row) return res.status(401).json({ error: 'This agent is not paired (it may have been replaced). Pair it again from Settings.' });
  if (row.status !== 'active') return res.status(403).json({ error: 'This shop is deactivated.' });
  req.agentShopId = row.shop_id;
  next();
}

agentRouter.use(requireAgent);

/** Agent checks in with its name and the printers installed on the PC. */
agentRouter.post('/heartbeat', (req, res) => {
  const name = text(req.body, 'name', { label: 'Name', max: 80 });
  const printers = Array.isArray(req.body?.printers)
    ? (req.body.printers as unknown[]).filter((p): p is string => typeof p === 'string' && p.length > 0 && p.length <= 200).slice(0, 50)
    : [];
  const defaultPrinter = typeof req.body?.defaultPrinter === 'string' && printers.includes(req.body.defaultPrinter) ? req.body.defaultPrinter : null;
  db.prepare(
    'UPDATE print_agents SET name = ?, printers = ?, last_seen_at = ?, default_printer = COALESCE(default_printer, ?) WHERE shop_id = ?',
  ).run(name, JSON.stringify(printers), nowIso(), defaultPrinter, req.agentShopId!);
  res.json({ ok: true });
});

/** Takes the oldest queued job for this shop and marks it as printing. */
agentRouter.post('/jobs/claim', (req, res) => {
  const shopId = req.agentShopId!;
  db.prepare('UPDATE print_agents SET last_seen_at = ? WHERE shop_id = ?').run(nowIso(), shopId);
  failStuckJobs(shopId);
  const job = db
    .prepare(
      `UPDATE print_jobs SET status = 'printing', updated_at = ?
        WHERE id = (SELECT id FROM print_jobs WHERE shop_id = ? AND status = 'queued' ORDER BY created_at LIMIT 1)
        RETURNING *`,
    )
    .get(nowIso(), shopId) as any;
  if (!job) return res.json({ job: null });
  res.json({
    job: {
      id: job.id,
      printer: job.printer,
      copies: job.copies,
      sides: job.sides,
      colorMode: job.color_mode,
      paperSize: job.paper_size,
      fileCount: job.file_count,
    },
  });
});

/** The PDF to print for a claimed job. */
agentRouter.get('/jobs/:id/document', async (req, res, next) => {
  try {
    const job = db.prepare(`SELECT * FROM print_jobs WHERE id = ? AND shop_id = ? AND status = 'printing'`).get(req.params.id, req.agentShopId!) as any;
    if (!job) throw new HttpError(404, 'Job not found or not claimed.');
    const files = loadPrintableFiles(job.shop_id, job.order_id, JSON.parse(job.file_ids));
    const pdf = await buildPrintBundle(files, job.paper_size as PaperSize);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store');
    res.end(Buffer.from(pdf));
  } catch (err) {
    // Mark the job failed so the owner sees why.
    const message = err instanceof HttpError ? err.message : 'Could not prepare the document.';
    db.prepare(`UPDATE print_jobs SET status = 'failed', error = ?, updated_at = ? WHERE id = ? AND shop_id = ? AND status = 'printing'`).run(
      message,
      nowIso(),
      req.params.id,
      req.agentShopId!,
    );
    next(err);
  }
});

/** Agent reports the result of a job. */
agentRouter.post('/jobs/:id/complete', (req, res) => {
  const ok = req.body?.ok === true;
  const error = ok ? null : text(req.body, 'error', { label: 'Error', max: 500 }) || 'Printing failed.';
  const r = db
    .prepare(`UPDATE print_jobs SET status = ?, error = ?, updated_at = ? WHERE id = ? AND shop_id = ? AND status = 'printing'`)
    .run(ok ? 'done' : 'failed', error, nowIso(), req.params.id, req.agentShopId!);
  if (r.changes === 0) throw new HttpError(404, 'Job not found or not in progress.');
  res.json({ ok: true });
});
