import { Router } from 'express';
import fs from 'node:fs';
import { db, logActivity, nowIso, tx } from '../db';
import { getFinishing, getPriceRules, storedFilePath } from '../repo';
import { randomCode, randomId, rateLimit } from '../security';
import { discardUploads, inspectUpload, moveIntoShopFolder, uploadMiddleware, UploadRejected, type CheckedFile } from '../uploads';
import { HttpError, ValidationError, int, oneOf, phone, text } from '../validate';
import { estimatePrice } from '../../shared/pricing';
import { COLOR_MODES, PAPER_SIZES, type FinishingCode, type PublicShop, type PublicTracking } from '../../shared/types';
import multer from 'multer';

export const publicRouter = Router();

function shopByToken(token: string) {
  if (!/^[a-z0-9]{6,40}$/.test(token)) return null;
  return db.prepare('SELECT * FROM shops WHERE qr_token = ?').get(token) as any;
}

/** Customer page data. Only public, non-sensitive shop information is returned. */
publicRouter.get('/shops/:token', (req, res) => {
  const shop = shopByToken(req.params.token);
  if (!shop) throw new HttpError(404, 'This QR code is not valid. Please ask the shop for their current QR code.');
  const data: PublicShop = {
    name: shop.name,
    address: shop.address,
    city: shop.city,
    phone: shop.phone,
    operatingHours: shop.operating_hours,
    isOpen: shop.status === 'active',
    prices: getPriceRules(shop.id),
    finishing: getFinishing(shop.id).filter((f) => f.enabled),
  };
  res.json({ shop: data });
});

publicRouter.post('/shops/:token/orders', (req, res, next) => {
  const ip = req.ip || 'unknown';
  if (!rateLimit(`upload:${ip}`, 15, 10 * 60_000)) {
    return res.status(429).json({ error: 'Too many uploads from this device. Please wait a few minutes.' });
  }
  const shop = shopByToken(req.params.token);
  if (!shop) return res.status(404).json({ error: 'This QR code is not valid. Please ask the shop for their current QR code.' });
  if (shop.status !== 'active') return res.status(403).json({ error: 'This shop is not accepting online orders right now.' });

  uploadMiddleware(req, res, async (err: unknown) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (err) {
      discardUploads(files);
      if (err instanceof multer.MulterError) {
        const msg =
          err.code === 'LIMIT_FILE_SIZE' ? 'One of the files is larger than 25 MB.'
          : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'You can upload up to 10 files at once.'
          : 'The upload could not be processed.';
        return res.status(400).json({ error: msg });
      }
      return next(err);
    }
    try {
      if (files.length === 0) throw new ValidationError('Please add at least one document.');
      const checked: CheckedFile[] = [];
      for (const f of files) checked.push(await inspectUpload(f));

      const body = req.body;
      const customerName = text(body, 'customerName', { label: 'Your name', required: true, max: 80, min: 2 });
      const customerPhone = phone(body, 'customerPhone', 'Phone number', true);
      const notes = text(body, 'notes', { label: 'Notes', max: 500, multiline: true });
      const colorMode = oneOf(body, 'colorMode', COLOR_MODES, 'Color');
      const paperSize = oneOf(body, 'paperSize', PAPER_SIZES, 'Paper size');
      const sides = oneOf(body, 'sides', ['single', 'double'] as const, 'Sides');
      const copies = int(body, 'copies', { label: 'Copies', min: 1, max: 500 });
      const finishingOptions = getFinishing(shop.id).filter((f) => f.enabled);
      const finishing = oneOf(body, 'finishing', ['none', ...finishingOptions.map((f) => f.code)] as FinishingCode[], 'Finishing', 'none');

      const pageCount = checked.reduce((sum, f) => sum + f.pages, 0);
      const estimate = estimatePrice({ pageCount, copies, colorMode, paperSize, sides, finishing }, getPriceRules(shop.id), finishingOptions);
      if (!estimate.available) throw new ValidationError('This shop does not offer that paper size and color combination.');

      const orderId = randomId('ord');
      const trackingCode = randomCode(8);
      const now = nowIso();
      const stored: string[] = [];
      let orderNo = 0;
      try {
        tx(() => {
          orderNo = (db.prepare('UPDATE shops SET next_order_no = next_order_no + 1 WHERE id = ? RETURNING next_order_no - 1 AS n').get(shop.id) as any).n;
          db.prepare(
            `INSERT INTO orders (id, shop_id, order_no, tracking_code, customer_name, customer_phone, notes, color_mode, paper_size, sides, copies,
                                 finishing, page_count, estimated_total, status, payment_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?)`,
          ).run(orderId, shop.id, orderNo, trackingCode, customerName, customerPhone, notes, colorMode, paperSize, sides, copies, finishing, pageCount, estimate.total, now, now);
          const insFile = db.prepare(
            'INSERT INTO order_files (id, order_id, shop_id, original_name, stored_name, mime, size, pages, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          );
          for (const f of checked) {
            const storedName = moveIntoShopFolder(shop.id, f.tmpPath, f.ext);
            stored.push(storedName);
            insFile.run(randomId('fil'), orderId, shop.id, f.originalName, storedName, f.mime, f.size, f.pages, now);
          }
          db.prepare('INSERT INTO order_events (order_id, status, note, actor, created_at) VALUES (?, ?, ?, ?, ?)').run(
            orderId, 'pending', 'Order received via QR code', 'customer', now,
          );
        });
      } catch (dbErr) {
        for (const name of stored) fs.rm(storedFilePath(shop.id, name), { force: true }, () => {});
        throw dbErr;
      }
      logActivity('customer', 'New order received', `#${orderNo} · ${checked.length} file(s)`, shop.id);
      res.status(201).json({ trackingCode, orderNo, estimatedTotal: estimate.total, pageCount });
    } catch (e) {
      discardUploads(files);
      if (e instanceof UploadRejected) return res.status(400).json({ error: e.message });
      next(e);
    }
  });
});

publicRouter.get('/track/:code', (req, res) => {
  const ip = req.ip || 'unknown';
  if (!rateLimit(`track:${ip}`, 60, 10 * 60_000)) return res.status(429).json({ error: 'Too many lookups. Please wait a few minutes.' });
  const code = String(req.params.code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const o = db
    .prepare(
      `SELECT o.*, s.name AS shop_name, (SELECT COUNT(*) FROM order_files f WHERE f.order_id = o.id) AS file_count
         FROM orders o JOIN shops s ON s.id = o.shop_id WHERE o.tracking_code = ?`,
    )
    .get(code) as any;
  if (!o) throw new HttpError(404, 'No order found with that tracking code.');
  const events = db.prepare('SELECT status, created_at FROM order_events WHERE order_id = ? ORDER BY id').all(o.id) as any[];
  const data: PublicTracking = {
    trackingCode: o.tracking_code,
    orderNo: o.order_no,
    shopName: o.shop_name,
    status: o.status,
    estimatedTotal: o.estimated_total,
    finalAmount: o.final_amount,
    paymentStatus: o.payment_status,
    rejectionReason: o.rejection_reason,
    fileCount: o.file_count,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    events: events.map((e) => ({ status: e.status, createdAt: e.created_at })),
  };
  res.json({ order: data });
});
