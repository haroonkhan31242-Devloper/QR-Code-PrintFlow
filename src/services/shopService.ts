import {
  COLOR_MODES,
  FINISHING_CODES,
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  PAPER_SIZES,
  type FinishingOption,
  type Order,
  type OrderDetail,
  type OrderStatus,
  type PaperSize,
  type PriceRule,
  type Shop,
  type ShopStats,
} from '../shared/types';
import { newQrToken } from './crypto';
import { invalid, notFound, ServiceError } from './errors';
import { getFinishing, getPriceRules, last7Days, startOfMonthIso, startOfTodayIso, toOrder, toOrderDetail, toShop } from './mappers';
import { ensureSeeded } from './seed';
import { requireRole } from './session';
import { deleteFiles, getFile } from './storage/fileStore';
import { addOrderEvent, logActivity, nowIso, readDb, writeDb, type DbSchema } from './storage/localDb';
import { email, money, oneOf, phone, text } from './validate';

/**
 * Shop-owner operations. The shop id ALWAYS comes from the signed-in session, never from the caller,
 * so one shop can never read or change another shop's data.
 */

async function owner() {
  await ensureSeeded();
  const user = requireRole('shop_owner');
  return { shopId: user.shopId!, actor: user.username };
}

function findOrder(db: DbSchema, shopId: string, orderId: string) {
  const o = db.orders.find((x) => x.id === orderId && x.shopId === shopId);
  if (!o) throw notFound('Order not found.');
  return o;
}

function findShop(db: DbSchema, shopId: string) {
  const s = db.shops.find((x) => x.id === shopId);
  if (!s) throw notFound('Shop not found.');
  return s;
}

// ---------- Profile ----------

export async function getMyShop(): Promise<Shop> {
  const { shopId } = await owner();
  return toShop(findShop(readDb(), shopId));
}

export interface ShopProfileInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  operatingHours: string;
}

export async function updateMyShop(v: ShopProfileInput): Promise<Shop> {
  const { shopId, actor } = await owner();
  const fields = {
    name: text(v.name, 'name', { label: 'Shop name', required: true, max: 80, min: 2 }),
    phone: phone(v.phone, 'phone', 'Phone', true),
    email: email(v.email, 'email', false),
    address: text(v.address, 'address', { label: 'Address', max: 200 }),
    city: text(v.city, 'city', { label: 'City', max: 60 }),
    operatingHours: text(v.operatingHours, 'operatingHours', { label: 'Opening hours', max: 80 }),
  };
  return writeDb((db) => {
    const shop = findShop(db, shopId);
    Object.assign(shop, fields, { updatedAt: nowIso() });
    logActivity(db, actor, 'Updated shop profile', '', shopId);
    return toShop(shop);
  });
}

export async function getStats(): Promise<ShopStats> {
  const { shopId } = await owner();
  const orders = readDb().orders.filter((o) => o.shopId === shopId);
  const today = startOfTodayIso();
  const month = startOfMonthIso();
  return {
    ordersToday: orders.filter((o) => o.createdAt >= today).length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inProgress: orders.filter((o) => o.status === 'accepted' || o.status === 'printing').length,
    readyForPickup: orders.filter((o) => o.status === 'ready').length,
    completedThisMonth: orders.filter((o) => o.status === 'completed' && o.updatedAt >= month).length,
    revenueThisMonth: orders
      .filter((o) => o.paymentStatus === 'paid' && o.updatedAt >= month)
      .reduce((sum, o) => sum + (o.finalAmount ?? o.estimatedTotal), 0),
    last7Days: last7Days(orders),
  };
}

// ---------- Orders ----------

export type OrderFilter = OrderStatus | 'active' | 'all';

export async function listOrders(opts: { status?: OrderFilter; q?: string; limit?: number; offset?: number } = {}): Promise<{ orders: Order[]; total: number }> {
  const { shopId } = await owner();
  const status = opts.status && opts.status !== 'all' ? opts.status : undefined;
  if (status && status !== 'active' && !ORDER_STATUSES.includes(status)) throw invalid('Unknown status filter.');
  const q = (opts.q ?? '').trim().slice(0, 60).toLowerCase();
  const limit = Math.min(500, Math.max(1, opts.limit ?? 25));
  const offset = Math.max(0, opts.offset ?? 0);
  const db = readDb();
  const active: OrderStatus[] = ['pending', 'accepted', 'printing', 'ready'];
  const rows = db.orders
    .filter((o) => o.shopId === shopId)
    .filter((o) => !status || (status === 'active' ? active.includes(o.status) : o.status === status))
    .filter(
      (o) =>
        !q ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.trackingCode.toLowerCase().includes(q) ||
        String(o.orderNo).includes(q),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { total: rows.length, orders: rows.slice(offset, offset + limit).map((o) => toOrder(db, o)) };
}

export async function getOrder(orderId: string): Promise<OrderDetail> {
  const { shopId } = await owner();
  const db = readDb();
  return toOrderDetail(db, findOrder(db, shopId, orderId));
}

export async function setOrderStatus(orderId: string, next: OrderStatus, extra: { reason?: string; note?: string } = {}): Promise<OrderDetail> {
  const { shopId, actor } = await owner();
  const status = oneOf(next, 'status', ORDER_STATUSES, 'Status');
  return writeDb((db) => {
    const o = findOrder(db, shopId, orderId);
    if (!ORDER_TRANSITIONS[o.status].includes(status)) throw invalid(`An order that is "${o.status}" cannot be moved to "${status}".`);
    const reason = status === 'rejected' ? text(extra.reason, 'reason', { label: 'Reason', required: true, max: 300 }) : null;
    const note = text(extra.note, 'note', { label: 'Note', max: 300 }) || reason;
    const now = nowIso();
    o.status = status;
    if (reason) o.rejectionReason = reason;
    o.updatedAt = now;
    addOrderEvent(db, o.id, status, note || null, actor, now);
    logActivity(db, actor, 'Order status changed', `#${o.orderNo} → ${status}`, shopId);
    return toOrderDetail(db, o);
  });
}

export async function setBilling(orderId: string, finalAmount: number | null, paymentStatus: 'paid' | 'unpaid'): Promise<OrderDetail> {
  const { shopId } = await owner();
  const amount = finalAmount === null ? null : money(finalAmount, 'Final amount', 'finalAmount');
  const pay = oneOf(paymentStatus, 'paymentStatus', ['unpaid', 'paid'] as const, 'Payment status');
  return writeDb((db) => {
    const o = findOrder(db, shopId, orderId);
    o.finalAmount = amount;
    o.paymentStatus = pay;
    o.updatedAt = nowIso();
    return toOrderDetail(db, o);
  });
}

/** Deletes the stored documents of an order (the order record and history are kept). */
export async function purgeOrderFiles(orderId: string): Promise<OrderDetail> {
  const { shopId, actor } = await owner();
  const { detail, ids } = writeDb((db) => {
    const o = findOrder(db, shopId, orderId);
    const files = db.orderFiles.filter((f) => f.orderId === o.id && f.shopId === shopId && f.stored);
    files.forEach((f) => (f.stored = false));
    logActivity(db, actor, 'Deleted order files', `#${o.orderNo}`, shopId);
    return { detail: toOrderDetail(db, o), ids: files.map((f) => f.id) };
  });
  await deleteFiles(ids);
  return detail;
}

/** The contents of one uploaded file, as a Blob with the right type. */
export async function getFileBlob(fileId: string): Promise<{ blob: Blob; name: string; mime: string }> {
  const { shopId } = await owner();
  const row = readDb().orderFiles.find((f) => f.id === fileId && f.shopId === shopId);
  if (!row) throw notFound('File not found.');
  if (!row.stored) throw new ServiceError(410, 'This file has been deleted.');
  const blob = await getFile(row.id);
  if (!blob) throw notFound('File is missing from this browser’s storage.');
  return { blob: blob.type === row.mime ? blob : new Blob([blob], { type: row.mime }), name: row.originalName, mime: row.mime };
}

// ---------- Pricing ----------

export async function getPricing(): Promise<{ prices: PriceRule[]; finishing: FinishingOption[] }> {
  const { shopId } = await owner();
  const db = readDb();
  return { prices: getPriceRules(db, shopId), finishing: getFinishing(db, shopId) };
}

export async function savePricing(input: { prices: PriceRule[]; finishing: { code: string; price: number; enabled: boolean }[] }) {
  const { shopId, actor } = await owner();
  const { prices, finishing } = input;
  if (!Array.isArray(prices) || !Array.isArray(finishing)) throw invalid('Prices and finishing options are required.');
  if (prices.length > PAPER_SIZES.length * COLOR_MODES.length || finishing.length > FINISHING_CODES.length) throw invalid('Too many price rows.');
  const cleanPrices = prices.map((p) => {
    const size = oneOf(p.paperSize, 'paperSize', PAPER_SIZES, 'Paper size');
    const mode = oneOf(p.colorMode, 'colorMode', COLOR_MODES, 'Color mode');
    return { paperSize: size, colorMode: mode, priceSingle: money(p.priceSingle, `${size} single-sided price`), priceDouble: money(p.priceDouble, `${size} double-sided price`) };
  });
  const cleanFinishing = finishing.map((f) => ({ code: oneOf(f.code, 'code', FINISHING_CODES, 'Finishing option'), price: money(f.price, 'Finishing price'), enabled: !!f.enabled }));
  return writeDb((db) => {
    db.priceRules = db.priceRules.filter((r) => r.shopId !== shopId).concat(cleanPrices.map((p) => ({ shopId, ...p })));
    for (const f of cleanFinishing) {
      const row = db.finishing.find((x) => x.shopId === shopId && x.code === f.code);
      if (row) Object.assign(row, { price: f.price, enabled: f.enabled });
    }
    logActivity(db, actor, 'Updated printing prices', '', shopId);
    return { prices: getPriceRules(db, shopId), finishing: getFinishing(db, shopId) };
  });
}

// ---------- QR code ----------

export async function regenerateQr(): Promise<Shop> {
  const { shopId, actor } = await owner();
  return writeDb((db) => {
    const shop = findShop(db, shopId);
    let token = newQrToken();
    while (db.shops.some((s) => s.qrToken === token)) token = newQrToken();
    shop.qrToken = token;
    shop.updatedAt = nowIso();
    logActivity(db, actor, 'Generated a new QR code', 'Previous QR code no longer works', shopId);
    return toShop(shop);
  });
}

// ---------- Printing (browser print dialog) ----------

const PRINTABLE_MIMES = ['application/pdf', 'image/png', 'image/jpeg'];

function printableFiles(db: DbSchema, shopId: string, orderId: string, fileIds: string[]) {
  if (!fileIds.length) throw invalid('Select at least one file to print.');
  const rows = db.orderFiles.filter((f) => f.orderId === orderId && f.shopId === shopId);
  return [...new Set(fileIds)].map((id) => {
    const f = rows.find((r) => r.id === id);
    if (!f) throw notFound('One of the selected files was not found in this order.');
    if (!f.stored) throw new ServiceError(410, `"${f.originalName}" has been deleted and can’t be printed.`);
    if (!PRINTABLE_MIMES.includes(f.mime)) throw new ServiceError(422, `"${f.originalName}" is a Word document. Download it and print it from Word.`);
    return f;
  });
}

const PAGE_SIZES: Record<PaperSize, [number, number]> = { A4: [595.28, 841.89], A3: [841.89, 1190.55], Legal: [612, 1008] };

/** Builds one PDF with the selected files of an order (images fitted to the paper size). Originals are not changed. */
export async function buildPrintBundle(orderId: string, fileIds: string[]): Promise<Blob> {
  const { shopId } = await owner();
  const db = readDb();
  const order = findOrder(db, shopId, orderId);
  const files = printableFiles(db, shopId, order.id, fileIds);
  const { PDFDocument } = await import('pdf-lib');
  const out = await PDFDocument.create();
  out.setTitle('PrintFlow print job');
  const [pw, ph] = PAGE_SIZES[order.paperSize] ?? PAGE_SIZES.A4;
  const margin = 18;

  for (const f of files) {
    const blob = await getFile(f.id);
    if (!blob) throw notFound(`"${f.originalName}" is missing from this browser’s storage.`);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (f.mime === 'application/pdf') {
      let src;
      try {
        src = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
      } catch (err) {
        throw new ServiceError(
          422,
          /encrypt/i.test(String((err as Error)?.message))
            ? `"${f.originalName}" is password protected. Download it and print it from a PDF reader.`
            : `"${f.originalName}" could not be read as a PDF. Download it and print it from a PDF reader.`,
        );
      }
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    } else {
      const img = f.mime === 'image/png' ? await out.embedPng(bytes) : await out.embedJpg(bytes);
      const landscape = img.width > img.height; // wide images go on landscape paper
      const [w, h] = landscape ? [ph, pw] : [pw, ph];
      const page = out.addPage([w, h]);
      const scale = Math.min((w - margin * 2) / img.width, (h - margin * 2) / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      page.drawImage(img, { x: (w - dw) / 2, y: (h - dh) / 2, width: dw, height: dh });
    }
  }
  const pdf = await out.save();
  return new Blob([pdf as BlobPart], { type: 'application/pdf' });
}

/** Records that files were sent to the printer, and optionally moves the order to "printing". */
export async function logPrint(orderId: string, fileIds: string[], markPrinting: boolean): Promise<OrderDetail> {
  const { shopId, actor } = await owner();
  return writeDb((db) => {
    const o = findOrder(db, shopId, orderId);
    const files = printableFiles(db, shopId, o.id, fileIds);
    const move = markPrinting && ORDER_TRANSITIONS[o.status].includes('printing');
    const now = nowIso();
    if (move) {
      o.status = 'printing';
      o.updatedAt = now;
    }
    addOrderEvent(db, o.id, o.status, `Sent ${files.length} file${files.length === 1 ? '' : 's'} to the printer (print dialog)`, actor, now);
    logActivity(db, actor, 'Printed order files', `#${o.orderNo} · ${files.length} file(s)`, shopId);
    return toOrderDetail(db, o);
  });
}
