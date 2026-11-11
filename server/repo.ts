import fs from 'node:fs';
import path from 'node:path';
import { config } from './config';
import { db } from './db';
import type {
  FinishingOption,
  Order,
  OrderDetail,
  OrderEvent,
  OrderFile,
  PriceRule,
  Shop,
} from '../shared/types';

type Row = Record<string, any>;

export function mapShop(r: Row): Shop {
  return {
    id: r.id,
    name: r.name,
    ownerName: r.owner_name,
    phone: r.phone,
    email: r.email,
    address: r.address,
    city: r.city,
    operatingHours: r.operating_hours,
    status: r.status,
    qrToken: r.qr_token,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapOrder(r: Row): Order {
  return {
    id: r.id,
    shopId: r.shop_id,
    orderNo: r.order_no,
    trackingCode: r.tracking_code,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    notes: r.notes,
    colorMode: r.color_mode,
    paperSize: r.paper_size,
    sides: r.sides,
    copies: r.copies,
    finishing: r.finishing,
    pageCount: r.page_count,
    estimatedTotal: r.estimated_total,
    finalAmount: r.final_amount,
    status: r.status,
    paymentStatus: r.payment_status,
    rejectionReason: r.rejection_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    fileCount: r.file_count ?? 0,
  };
}

export function getShop(id: string): Shop | null {
  const row = db.prepare('SELECT * FROM shops WHERE id = ?').get(id) as Row | undefined;
  return row ? mapShop(row) : null;
}

export function getPriceRules(shopId: string): PriceRule[] {
  const rows = db
    .prepare('SELECT paper_size, color_mode, price_single, price_double FROM price_rules WHERE shop_id = ? ORDER BY paper_size, color_mode')
    .all(shopId) as Row[];
  return rows.map((r) => ({ paperSize: r.paper_size, colorMode: r.color_mode, priceSingle: r.price_single, priceDouble: r.price_double }));
}

export function getFinishing(shopId: string): FinishingOption[] {
  const rows = db.prepare('SELECT code, name, price, enabled FROM finishing_options WHERE shop_id = ? ORDER BY code').all(shopId) as Row[];
  return rows.map((r) => ({ code: r.code, name: r.name, price: r.price, enabled: r.enabled === 1 }));
}

export const DEFAULT_PRICES: PriceRule[] = [
  { paperSize: 'A4', colorMode: 'bw', priceSingle: 10, priceDouble: 15 },
  { paperSize: 'A4', colorMode: 'color', priceSingle: 30, priceDouble: 50 },
  { paperSize: 'A3', colorMode: 'bw', priceSingle: 25, priceDouble: 40 },
  { paperSize: 'A3', colorMode: 'color', priceSingle: 70, priceDouble: 120 },
  { paperSize: 'Legal', colorMode: 'bw', priceSingle: 12, priceDouble: 18 },
  { paperSize: 'Legal', colorMode: 'color', priceSingle: 35, priceDouble: 60 },
];

export const DEFAULT_FINISHING: FinishingOption[] = [
  { code: 'staple', name: 'Staple', price: 10, enabled: true },
  { code: 'spiral_binding', name: 'Spiral binding', price: 100, enabled: true },
  { code: 'lamination', name: 'Lamination', price: 60, enabled: true },
];

export function seedShopDefaults(shopId: string) {
  const p = db.prepare('INSERT INTO price_rules (shop_id, paper_size, color_mode, price_single, price_double) VALUES (?, ?, ?, ?, ?)');
  for (const r of DEFAULT_PRICES) p.run(shopId, r.paperSize, r.colorMode, r.priceSingle, r.priceDouble);
  const f = db.prepare('INSERT INTO finishing_options (shop_id, code, name, price, enabled) VALUES (?, ?, ?, ?, ?)');
  for (const o of DEFAULT_FINISHING) f.run(shopId, o.code, o.name, o.price, o.enabled ? 1 : 0);
}

const ORDER_SELECT = `SELECT o.*, (SELECT COUNT(*) FROM order_files f WHERE f.order_id = o.id) AS file_count FROM orders o`;

/** Every shop-owner lookup is scoped by the shop id from the session, never from the request. */
export function getOrderForShop(shopId: string, orderId: string): OrderDetail | null {
  const row = db.prepare(`${ORDER_SELECT} WHERE o.id = ? AND o.shop_id = ?`).get(orderId, shopId) as Row | undefined;
  if (!row) return null;
  const files = (db.prepare('SELECT * FROM order_files WHERE order_id = ? ORDER BY created_at').all(orderId) as Row[]).map(
    (f): OrderFile => ({
      id: f.id,
      originalName: f.original_name,
      mime: f.mime,
      size: f.size,
      pages: f.pages,
      createdAt: f.created_at,
      purged: !f.stored_name,
    }),
  );
  const events = (db.prepare('SELECT status, note, actor, created_at FROM order_events WHERE order_id = ? ORDER BY id').all(orderId) as Row[]).map(
    (e): OrderEvent => ({ status: e.status, note: e.note, actor: e.actor, createdAt: e.created_at }),
  );
  return { ...mapOrder(row), files, events };
}

export function listOrdersForShop(shopId: string, opts: { status?: string; q?: string; limit: number; offset: number }) {
  const where = ['o.shop_id = ?'];
  const params: (string | number)[] = [shopId];
  if (opts.status === 'active') {
    where.push(`o.status IN ('pending','accepted','printing','ready')`);
  } else if (opts.status) {
    where.push('o.status = ?');
    params.push(opts.status);
  }
  if (opts.q) {
    where.push(`(o.customer_name LIKE ? ESCAPE '\\' OR o.customer_phone LIKE ? ESCAPE '\\' OR o.tracking_code LIKE ? ESCAPE '\\' OR CAST(o.order_no AS TEXT) LIKE ? ESCAPE '\\')`);
    const like = `%${opts.q.replace(/[\\%_]/g, (c) => '\\' + c)}%`;
    params.push(like, like, like, like);
  }
  const whereSql = where.join(' AND ');
  const total = (db.prepare(`SELECT COUNT(*) AS c FROM orders o WHERE ${whereSql}`).get(...params) as Row).c as number;
  const rows = db
    .prepare(`${ORDER_SELECT} WHERE ${whereSql} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, opts.limit, opts.offset) as Row[];
  return { total, orders: rows.map(mapOrder) };
}

export function storedFilePath(shopId: string, storedName: string) {
  // storedName is generated by the server; still resolve and confine it to the shop folder.
  const dir = path.join(config.uploadDir, shopId);
  const full = path.resolve(dir, storedName);
  if (!full.startsWith(path.resolve(dir) + path.sep)) throw new Error('Invalid file path');
  return full;
}

export function deleteStoredFiles(rows: { shop_id: string; stored_name: string | null }[]) {
  for (const r of rows) {
    if (!r.stored_name) continue;
    try {
      fs.rmSync(storedFilePath(r.shop_id, r.stored_name), { force: true });
    } catch (err) {
      console.warn('Could not delete file', r.stored_name, err);
    }
  }
}

export function last7Days(shopId: string | null) {
  const days: { date: string; count: number }[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  const rows = (
    shopId
      ? db.prepare('SELECT created_at FROM orders WHERE shop_id = ? AND created_at >= ?').all(shopId, start.toISOString())
      : db.prepare('SELECT created_at FROM orders WHERE created_at >= ?').all(start.toISOString())
  ) as Row[];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ date: localDateKey(d), count: 0 });
  }
  for (const r of rows) {
    const key = localDateKey(new Date(r.created_at));
    const day = days.find((d) => d.date === key);
    if (day) day.count += 1;
  }
  return days;
}

const localDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function startOfMonthIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.toISOString();
}
