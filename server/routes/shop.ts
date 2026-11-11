import { Router, type Request } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { buildPrintBundle, loadPrintableFiles, setPdfFrameHeaders } from '../print';
import { agentStatus, failStuckJobs, hashAgentToken, mapJob } from '../printJobs';
import { db, logActivity, nowIso, tx } from '../db';
import {
  deleteStoredFiles,
  getFinishing,
  getOrderForShop,
  getPriceRules,
  getShop,
  last7Days,
  listOrdersForShop,
  startOfMonthIso,
  startOfTodayIso,
  storedFilePath,
} from '../repo';
import { randomId, requireRole } from '../security';
import { HttpError, ValidationError, email, int, money, oneOf, phone, text } from '../validate';
import { newQrToken } from './admin';
import {
  COLOR_MODES,
  FINISHING_CODES,
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  PAPER_SIZES,
  type OrderStatus,
  type ShopStats,
} from '../../shared/types';

export const shopRouter = Router();
shopRouter.use(requireRole('shop_owner'));

/** The shop id ALWAYS comes from the authenticated session, never from the URL or body. */
const shopIdOf = (req: Request) => req.user!.shopId!;
const actor = (req: Request) => req.user!.username;

shopRouter.get('/me', (req, res) => {
  const shop = getShop(shopIdOf(req));
  if (!shop) throw new HttpError(404, 'Shop not found.');
  res.json({ shop });
});

shopRouter.put('/me', (req, res) => {
  const shopId = shopIdOf(req);
  const name = text(req.body, 'name', { label: 'Shop name', required: true, max: 80, min: 2 });
  const p = phone(req.body, 'phone', 'Phone', true);
  const e = email(req.body, 'email', false);
  const address = text(req.body, 'address', { label: 'Address', max: 200 });
  const city = text(req.body, 'city', { label: 'City', max: 60 });
  const hours = text(req.body, 'operatingHours', { label: 'Opening hours', max: 80 });
  db.prepare('UPDATE shops SET name = ?, phone = ?, email = ?, address = ?, city = ?, operating_hours = ?, updated_at = ? WHERE id = ?').run(
    name, p, e, address, city, hours, nowIso(), shopId,
  );
  logActivity(actor(req), 'Updated shop profile', '', shopId);
  res.json({ shop: getShop(shopId) });
});

shopRouter.get('/stats', (req, res) => {
  const shopId = shopIdOf(req);
  const one = (sql: string, ...p: any[]) => (db.prepare(sql).get(shopId, ...p) as any).c as number;
  const stats: ShopStats = {
    ordersToday: one('SELECT COUNT(*) AS c FROM orders WHERE shop_id = ? AND created_at >= ?', startOfTodayIso()),
    pending: one(`SELECT COUNT(*) AS c FROM orders WHERE shop_id = ? AND status = 'pending'`),
    inProgress: one(`SELECT COUNT(*) AS c FROM orders WHERE shop_id = ? AND status IN ('accepted','printing')`),
    readyForPickup: one(`SELECT COUNT(*) AS c FROM orders WHERE shop_id = ? AND status = 'ready'`),
    completedThisMonth: one(`SELECT COUNT(*) AS c FROM orders WHERE shop_id = ? AND status = 'completed' AND updated_at >= ?`, startOfMonthIso()),
    revenueThisMonth: one(
      `SELECT COALESCE(SUM(COALESCE(final_amount, estimated_total)),0) AS c FROM orders
        WHERE shop_id = ? AND payment_status = 'paid' AND updated_at >= ?`,
      startOfMonthIso(),
    ),
    last7Days: last7Days(shopId),
  };
  res.json(stats);
});

// ---------- Orders ----------

shopRouter.get('/orders', (req, res) => {
  const status = typeof req.query.status === 'string' && req.query.status !== 'all' ? req.query.status : undefined;
  if (status && status !== 'active' && !ORDER_STATUSES.includes(status as OrderStatus)) {
    throw new ValidationError('Unknown status filter.');
  }
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 60) : undefined;
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 25));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  res.json(listOrdersForShop(shopIdOf(req), { status, q, limit, offset }));
});

shopRouter.get('/orders/:id', (req, res) => {
  const order = getOrderForShop(shopIdOf(req), req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  res.json({ order });
});

shopRouter.patch('/orders/:id/status', (req, res) => {
  const shopId = shopIdOf(req);
  const order = getOrderForShop(shopId, req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  const next = oneOf(req.body, 'status', ORDER_STATUSES, 'Status');
  if (!ORDER_TRANSITIONS[order.status].includes(next)) {
    throw new ValidationError(`An order that is "${order.status}" cannot be moved to "${next}".`);
  }
  const reason = next === 'rejected' ? text(req.body, 'reason', { label: 'Reason', required: true, max: 300 }) : null;
  const note = text(req.body, 'note', { label: 'Note', max: 300 }) || reason;
  const now = nowIso();
  tx(() => {
    db.prepare('UPDATE orders SET status = ?, rejection_reason = COALESCE(?, rejection_reason), updated_at = ? WHERE id = ? AND shop_id = ?').run(
      next, reason, now, order.id, shopId,
    );
    db.prepare('INSERT INTO order_events (order_id, status, note, actor, created_at) VALUES (?, ?, ?, ?, ?)').run(order.id, next, note || null, actor(req), now);
  });
  logActivity(actor(req), 'Order status changed', `#${order.orderNo} → ${next}`, shopId);
  res.json({ order: getOrderForShop(shopId, order.id) });
});

shopRouter.patch('/orders/:id/billing', (req, res) => {
  const shopId = shopIdOf(req);
  const order = getOrderForShop(shopId, req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  const finalAmount = req.body?.finalAmount === null || req.body?.finalAmount === '' || req.body?.finalAmount === undefined
    ? null
    : money(req.body.finalAmount, 'Final amount');
  const paymentStatus = oneOf(req.body, 'paymentStatus', ['unpaid', 'paid'] as const, 'Payment status');
  db.prepare('UPDATE orders SET final_amount = ?, payment_status = ?, updated_at = ? WHERE id = ? AND shop_id = ?').run(
    finalAmount, paymentStatus, nowIso(), order.id, shopId,
  );
  res.json({ order: getOrderForShop(shopId, order.id) });
});

/** Delete the stored documents of an order (keeps the order record). */
shopRouter.delete('/orders/:id/files', (req, res) => {
  const shopId = shopIdOf(req);
  const order = getOrderForShop(shopId, req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  const rows = db.prepare('SELECT shop_id, stored_name FROM order_files WHERE order_id = ? AND shop_id = ?').all(order.id, shopId) as any[];
  deleteStoredFiles(rows);
  db.prepare('UPDATE order_files SET stored_name = NULL WHERE order_id = ? AND shop_id = ?').run(order.id, shopId);
  logActivity(actor(req), 'Deleted order files', `#${order.orderNo}`, shopId);
  res.json({ order: getOrderForShop(shopId, order.id) });
});

shopRouter.get('/files/:fileId', (req, res) => {
  const shopId = shopIdOf(req);
  const file = db.prepare('SELECT * FROM order_files WHERE id = ? AND shop_id = ?').get(req.params.fileId, shopId) as any;
  if (!file) throw new HttpError(404, 'File not found.');
  if (!file.stored_name) throw new HttpError(410, 'This file has been deleted.');
  const full = storedFilePath(shopId, file.stored_name);
  if (!fs.existsSync(full)) throw new HttpError(404, 'File is missing from storage.');

  const inline = req.query.inline === '1' && (file.mime === 'application/pdf' || file.mime.startsWith('image/'));
  res.setHeader('Content-Type', file.mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Our own pages may frame files for preview. Chrome's PDF viewer refuses to run in a sandboxed
  // document, so only non-PDF files get the sandbox flag.
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader(
    'Content-Security-Policy',
    file.mime === 'application/pdf'
      ? "frame-ancestors 'self'"
      : "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox; frame-ancestors 'self'",
  );
  res.setHeader('Cache-Control', 'private, no-store');
  const safeName = file.original_name.replace(/["\\\r\n]/g, '_');
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${safeName.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,
  );
  fs.createReadStream(full).pipe(res);
});

// ---------- Pricing ----------

shopRouter.get('/pricing', (req, res) => {
  const shopId = shopIdOf(req);
  res.json({ prices: getPriceRules(shopId), finishing: getFinishing(shopId) });
});

shopRouter.put('/pricing', (req, res) => {
  const shopId = shopIdOf(req);
  const prices = Array.isArray(req.body?.prices) ? req.body.prices : null;
  const finishing = Array.isArray(req.body?.finishing) ? req.body.finishing : null;
  if (!prices || !finishing) throw new ValidationError('Prices and finishing options are required.');
  if (prices.length > PAPER_SIZES.length * COLOR_MODES.length || finishing.length > FINISHING_CODES.length) {
    throw new ValidationError('Too many price rows.');
  }
  tx(() => {
    db.prepare('DELETE FROM price_rules WHERE shop_id = ?').run(shopId);
    const ins = db.prepare('INSERT INTO price_rules (shop_id, paper_size, color_mode, price_single, price_double) VALUES (?, ?, ?, ?, ?)');
    for (const p of prices) {
      const size = oneOf(p, 'paperSize', PAPER_SIZES, 'Paper size');
      const mode = oneOf(p, 'colorMode', COLOR_MODES, 'Color mode');
      ins.run(shopId, size, mode, money(p.priceSingle, `${size} single-sided price`), money(p.priceDouble, `${size} double-sided price`));
    }
    const up = db.prepare('UPDATE finishing_options SET price = ?, enabled = ? WHERE shop_id = ? AND code = ?');
    for (const f of finishing) {
      const code = oneOf(f, 'code', FINISHING_CODES, 'Finishing option');
      up.run(money(f.price, 'Finishing price'), f.enabled ? 1 : 0, shopId, code);
    }
  });
  logActivity(actor(req), 'Updated printing prices', '', shopId);
  res.json({ prices: getPriceRules(shopId), finishing: getFinishing(shopId) });
});

// ---------- Printing ----------

const parseFileIds = (raw: unknown): string[] =>
  (Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [])
    .map((s) => String(s).trim())
    .filter((s) => /^fil_[\w-]{4,40}$/.test(s));

/**
 * One PDF with the selected files of an order, for printing from the browser's print dialog.
 * The original uploaded files are never modified.
 */
shopRouter.get('/orders/:id/print-bundle', async (req, res, next) => {
  try {
    const shopId = shopIdOf(req);
    const order = getOrderForShop(shopId, req.params.id);
    if (!order) throw new HttpError(404, 'Order not found.');
    const files = loadPrintableFiles(shopId, order.id, parseFileIds(req.query.files));
    const pdf = await buildPrintBundle(files, order.paperSize);
    setPdfFrameHeaders(res, `order-${order.orderNo}-print.pdf`);
    res.end(Buffer.from(pdf));
  } catch (err) {
    next(err);
  }
});

/** Records that files were sent to a printer from the browser, and optionally moves the order to "printing". */
shopRouter.post('/orders/:id/print-log', (req, res) => {
  const shopId = shopIdOf(req);
  const order = getOrderForShop(shopId, req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  const files = loadPrintableFiles(shopId, order.id, parseFileIds(req.body?.fileIds));
  const markPrinting = req.body?.markPrinting === true && ORDER_TRANSITIONS[order.status].includes('printing');
  const now = nowIso();
  const note = `Sent ${files.length} file${files.length === 1 ? '' : 's'} to the printer (print dialog)`;
  tx(() => {
    if (markPrinting) db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND shop_id = ?').run('printing', now, order.id, shopId);
    db.prepare('INSERT INTO order_events (order_id, status, note, actor, created_at) VALUES (?, ?, ?, ?, ?)').run(
      order.id, markPrinting ? 'printing' : order.status, note, actor(req), now,
    );
  });
  logActivity(actor(req), 'Printed order files', `#${order.orderNo} · ${files.length} file(s)`, shopId);
  res.json({ order: getOrderForShop(shopId, order.id) });
});

// Print agent pairing

shopRouter.get('/print-agent', (req, res) => {
  res.json({ agent: agentStatus(shopIdOf(req)) });
});

shopRouter.post('/print-agent/pair', (req, res) => {
  const shopId = shopIdOf(req);
  const token = `pfa_${crypto.randomBytes(24).toString('base64url')}`;
  db.prepare(
    `INSERT INTO print_agents (shop_id, token_hash, name, printers, created_at) VALUES (?, ?, '', '[]', ?)
     ON CONFLICT(shop_id) DO UPDATE SET token_hash = excluded.token_hash, name = '', printers = '[]', default_printer = NULL, last_seen_at = NULL, created_at = excluded.created_at`,
  ).run(shopId, hashAgentToken(token), nowIso());
  logActivity(actor(req), 'Paired a print agent', 'Any previous agent was disconnected', shopId);
  // Shown once; only the hash is stored.
  res.json({ token, agent: agentStatus(shopId) });
});

shopRouter.delete('/print-agent', (req, res) => {
  const shopId = shopIdOf(req);
  db.prepare('DELETE FROM print_agents WHERE shop_id = ?').run(shopId);
  db.prepare(`UPDATE print_jobs SET status = 'cancelled', error = 'Print agent was disconnected.', updated_at = ? WHERE shop_id = ? AND status = 'queued'`).run(nowIso(), shopId);
  logActivity(actor(req), 'Disconnected the print agent', '', shopId);
  res.json({ agent: agentStatus(shopId) });
});

// Print jobs (sent to the agent)

shopRouter.get('/orders/:id/print-jobs', (req, res) => {
  const shopId = shopIdOf(req);
  const order = getOrderForShop(shopId, req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  failStuckJobs(shopId);
  const rows = db.prepare('SELECT * FROM print_jobs WHERE shop_id = ? AND order_id = ? ORDER BY created_at DESC LIMIT 20').all(shopId, order.id);
  res.json({ jobs: rows.map(mapJob) });
});

shopRouter.post('/orders/:id/print-jobs', (req, res) => {
  const shopId = shopIdOf(req);
  const order = getOrderForShop(shopId, req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  const files = loadPrintableFiles(shopId, order.id, parseFileIds(req.body?.fileIds));

  const agent = agentStatus(shopId);
  if (!agent.paired) throw new HttpError(409, 'No print agent is connected. Set it up in Settings → Direct printing.');
  if (!agent.online) throw new HttpError(409, 'The print agent on your shop PC is offline. Start it and try again.');
  const printer = text(req.body, 'printer', { label: 'Printer', required: true, max: 200 });
  if (!agent.printers.includes(printer)) throw new ValidationError('That printer is not available on the shop PC.', 'printer');
  const copies = int(req.body, 'copies', { label: 'Copies', min: 1, max: 500 });
  const sides = oneOf(req.body, 'sides', ['single', 'double'] as const, 'Sides');
  const colorMode = oneOf(req.body, 'colorMode', COLOR_MODES, 'Colour');

  failStuckJobs(shopId);
  // Prevent accidental duplicate submissions for the same order.
  const active = db.prepare(`SELECT id FROM print_jobs WHERE shop_id = ? AND order_id = ? AND status IN ('queued','printing')`).get(shopId, order.id);
  if (active) throw new HttpError(409, 'This order is already being printed. Wait for it to finish or cancel it first.');

  const id = randomId('job');
  const now = nowIso();
  const markPrinting = req.body?.markPrinting === true && ORDER_TRANSITIONS[order.status].includes('printing');
  tx(() => {
    db.prepare(
      `INSERT INTO print_jobs (id, shop_id, order_id, file_ids, file_count, printer, copies, sides, color_mode, paper_size, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?)`,
    ).run(id, shopId, order.id, JSON.stringify(files.map((f) => f.id)), files.length, printer, copies, sides, colorMode, order.paperSize, actor(req), now, now);
    db.prepare('UPDATE print_agents SET default_printer = ? WHERE shop_id = ?').run(printer, shopId);
    if (markPrinting) db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND shop_id = ?').run('printing', now, order.id, shopId);
    db.prepare('INSERT INTO order_events (order_id, status, note, actor, created_at) VALUES (?, ?, ?, ?, ?)').run(
      order.id, markPrinting ? 'printing' : order.status, `Sent ${files.length} file${files.length === 1 ? '' : 's'} to ${printer} (${copies}×)`, actor(req), now,
    );
  });
  logActivity(actor(req), 'Sent print job', `#${order.orderNo} → ${printer}`, shopId);
  res.status(201).json({ job: mapJob(db.prepare('SELECT * FROM print_jobs WHERE id = ?').get(id)), order: getOrderForShop(shopId, order.id) });
});

shopRouter.post('/print-jobs/:jobId/cancel', (req, res) => {
  const shopId = shopIdOf(req);
  const r = db.prepare(`UPDATE print_jobs SET status = 'cancelled', updated_at = ? WHERE id = ? AND shop_id = ? AND status = 'queued'`).run(nowIso(), req.params.jobId, shopId);
  if (r.changes === 0) throw new HttpError(409, 'Only jobs that have not started printing can be cancelled.');
  res.json({ job: mapJob(db.prepare('SELECT * FROM print_jobs WHERE id = ?').get(req.params.jobId)) });
});

// ---------- QR code ----------

shopRouter.post('/qr/regenerate', (req, res) => {
  const shopId = shopIdOf(req);
  db.prepare('UPDATE shops SET qr_token = ?, updated_at = ? WHERE id = ?').run(newQrToken(), nowIso(), shopId);
  logActivity(actor(req), 'Generated a new QR code', 'Previous QR code no longer works', shopId);
  res.json({ shop: getShop(shopId) });
});
