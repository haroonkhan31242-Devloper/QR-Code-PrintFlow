import type { FinishingOption, Order, OrderDetail, PriceRule, Shop, ShopWithStats } from '../shared/types';
import { FINISHING_CODES, PAPER_SIZES, COLOR_MODES } from '../shared/types';
import type { DbSchema, OrderRow, ShopRow } from './storage/localDb';

/** Converts database rows into the shapes the UI uses (the same shapes a Supabase service would return). */

export const toShop = ({ nextOrderNo: _n, ...shop }: ShopRow): Shop => shop;

export function toOrder(db: DbSchema, o: OrderRow): Order {
  return { ...o, fileCount: db.orderFiles.filter((f) => f.orderId === o.id).length };
}

export function toOrderDetail(db: DbSchema, o: OrderRow): OrderDetail {
  const files = db.orderFiles
    .filter((f) => f.orderId === o.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((f) => ({ id: f.id, originalName: f.originalName, mime: f.mime, size: f.size, pages: f.pages, createdAt: f.createdAt, purged: !f.stored }));
  const events = db.orderEvents
    .filter((e) => e.orderId === o.id)
    .sort((a, b) => a.id - b.id)
    .map((e) => ({ status: e.status, note: e.note, actor: e.actor, createdAt: e.createdAt }));
  return { ...o, fileCount: files.length, files, events };
}

export function toShopWithStats(db: DbSchema, s: ShopRow): ShopWithStats {
  const owner = db.users.find((u) => u.shopId === s.id && u.role === 'shop_owner');
  const orders = db.orders.filter((o) => o.shopId === s.id);
  return {
    ...toShop(s),
    ownerUsername: owner?.username ?? null,
    ownerLastLoginAt: owner?.lastLoginAt ?? null,
    orderCount: orders.length,
    pendingCount: orders.filter((o) => o.status === 'pending').length,
    lastOrderAt: orders.reduce<string | null>((max, o) => (!max || o.createdAt > max ? o.createdAt : max), null),
  };
}

export function getPriceRules(db: DbSchema, shopId: string): PriceRule[] {
  return db.priceRules
    .filter((r) => r.shopId === shopId)
    .map(({ shopId: _s, ...r }) => r)
    .sort((a, b) => PAPER_SIZES.indexOf(a.paperSize) - PAPER_SIZES.indexOf(b.paperSize) || COLOR_MODES.indexOf(a.colorMode) - COLOR_MODES.indexOf(b.colorMode));
}

export function getFinishing(db: DbSchema, shopId: string): FinishingOption[] {
  return db.finishing
    .filter((f) => f.shopId === shopId)
    .map(({ shopId: _s, ...f }) => f)
    .sort((a, b) => FINISHING_CODES.indexOf(a.code) - FINISHING_CODES.indexOf(b.code));
}

const localDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Orders per day for the last 7 days (local time), oldest first. */
export function last7Days(orders: OrderRow[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  const days: { date: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ date: localDateKey(d), count: 0 });
  }
  for (const o of orders) {
    const day = days.find((d) => d.date === localDateKey(new Date(o.createdAt)));
    if (day) day.count += 1;
  }
  return days;
}

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
