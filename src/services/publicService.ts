import { estimatePrice } from '../shared/pricing';
import { COLOR_MODES, MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES, PAPER_SIZES, type ColorMode, type FinishingCode, type PaperSize, type PublicShop, type PublicTracking, type Sides } from '../shared/types';
import { randomCode, randomId } from './crypto';
import { invalid, notFound, ServiceError } from './errors';
import { inspectUpload, type CheckedFile } from './fileInspect';
import { getFinishing, getPriceRules } from './mappers';
import { ensureSeeded } from './seed';
import { deleteFiles, putFile } from './storage/fileStore';
import { addOrderEvent, logActivity, nowIso, readDb, writeDb, type DbSchema } from './storage/localDb';
import { int, oneOf, phone, text } from './validate';

/** Customer-facing operations (no sign-in needed). */

const INVALID_QR = 'This QR code is not valid. Please ask the shop for their current QR code.';

function shopByToken(db: DbSchema, token: string) {
  if (!/^[a-z0-9]{6,40}$/.test(token)) return null;
  return db.shops.find((s) => s.qrToken === token) ?? null;
}

export async function getShopByToken(token: string): Promise<PublicShop> {
  await ensureSeeded();
  const db = readDb();
  const shop = shopByToken(db, token);
  if (!shop) throw notFound(INVALID_QR);
  return {
    name: shop.name,
    address: shop.address,
    city: shop.city,
    phone: shop.phone,
    operatingHours: shop.operatingHours,
    isOpen: shop.status === 'active',
    prices: getPriceRules(db, shop.id),
    finishing: getFinishing(db, shop.id).filter((f) => f.enabled),
  };
}

export interface NewOrderInput {
  customerName: string;
  customerPhone: string;
  notes: string;
  colorMode: ColorMode;
  paperSize: PaperSize;
  sides: Sides;
  copies: number;
  finishing: FinishingCode;
}

export interface NewOrderResult {
  trackingCode: string;
  orderNo: number;
  estimatedTotal: number;
  pageCount: number;
}

/**
 * Creates an order with its files. File contents go to IndexedDB first, then the order record is saved.
 * `onProgress` receives 0..1 while files are stored.
 */
export async function createOrder(token: string, input: NewOrderInput, files: File[], onProgress?: (fraction: number) => void): Promise<NewOrderResult> {
  await ensureSeeded();
  const before = readDb();
  const shop = shopByToken(before, token);
  if (!shop) throw notFound(INVALID_QR);
  if (shop.status !== 'active') throw new ServiceError(403, 'This shop is not accepting online orders right now.');

  if (files.length === 0) throw invalid('Please add at least one document.');
  if (files.length > MAX_UPLOAD_FILES) throw invalid(`You can upload up to ${MAX_UPLOAD_FILES} files at once.`);
  if (files.some((f) => f.size > MAX_UPLOAD_BYTES)) throw invalid('One of the files is larger than 25 MB.');

  const customerName = text(input.customerName, 'customerName', { label: 'Your name', required: true, max: 80, min: 2 });
  const customerPhone = phone(input.customerPhone, 'customerPhone', 'Phone number', true);
  const notes = text(input.notes, 'notes', { label: 'Notes', max: 500, multiline: true });
  const colorMode = oneOf(input.colorMode, 'colorMode', COLOR_MODES, 'Color');
  const paperSize = oneOf(input.paperSize, 'paperSize', PAPER_SIZES, 'Paper size');
  const sides = oneOf(input.sides, 'sides', ['single', 'double'] as const, 'Sides');
  const copies = int(input.copies, 'copies', { label: 'Copies', min: 1, max: 500 });
  const finishingOptions = getFinishing(before, shop.id).filter((f) => f.enabled);
  const finishing = oneOf(input.finishing, 'finishing', ['none', ...finishingOptions.map((f) => f.code)] as FinishingCode[], 'Finishing', 'none');

  const checked: CheckedFile[] = [];
  for (const f of files) checked.push(await inspectUpload(f));
  const pageCount = checked.reduce((sum, f) => sum + f.pages, 0);
  const estimate = estimatePrice({ pageCount, copies, colorMode, paperSize, sides, finishing }, getPriceRules(before, shop.id), finishingOptions);
  if (!estimate.available) throw invalid('This shop does not offer that paper size and color combination.');

  // 1. Store the file contents.
  const fileIds = checked.map(() => randomId('fil'));
  const totalBytes = checked.reduce((s, f) => s + f.size, 0) || 1;
  let doneBytes = 0;
  onProgress?.(0);
  try {
    for (let i = 0; i < checked.length; i++) {
      await putFile(fileIds[i], checked[i].file);
      doneBytes += checked[i].size;
      onProgress?.(doneBytes / totalBytes);
    }
  } catch (err) {
    await deleteFiles(fileIds).catch(() => {});
    throw err;
  }

  // 2. Save the order record (rolls back the stored files if this fails).
  try {
    return writeDb((db) => {
      const row = db.shops.find((s) => s.id === shop.id);
      if (!row || row.status !== 'active') throw new ServiceError(403, 'This shop is not accepting online orders right now.');
      const orderNo = row.nextOrderNo;
      row.nextOrderNo += 1;
      let trackingCode = randomCode(8);
      while (db.orders.some((o) => o.trackingCode === trackingCode)) trackingCode = randomCode(8);
      const orderId = randomId('ord');
      const now = nowIso();
      db.orders.push({
        id: orderId,
        shopId: shop.id,
        orderNo,
        trackingCode,
        customerName,
        customerPhone,
        notes,
        colorMode,
        paperSize,
        sides,
        copies,
        finishing,
        pageCount,
        estimatedTotal: estimate.total,
        finalAmount: null,
        status: 'pending',
        paymentStatus: 'unpaid',
        rejectionReason: null,
        createdAt: now,
        updatedAt: now,
      });
      checked.forEach((f, i) =>
        db.orderFiles.push({ id: fileIds[i], orderId, shopId: shop.id, originalName: f.originalName, mime: f.mime, size: f.size, pages: f.pages, createdAt: now, stored: true }),
      );
      addOrderEvent(db, orderId, 'pending', 'Order received via QR code', 'customer', now);
      logActivity(db, 'customer', 'New order received', `#${orderNo} · ${checked.length} file(s)`, shop.id);
      return { trackingCode, orderNo, estimatedTotal: estimate.total, pageCount };
    });
  } catch (err) {
    await deleteFiles(fileIds).catch(() => {});
    throw err;
  }
}

export async function trackOrder(codeInput: string): Promise<PublicTracking> {
  await ensureSeeded();
  const code = String(codeInput).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const db = readDb();
  const o = db.orders.find((x) => x.trackingCode === code);
  if (!o) throw notFound('No order found with that tracking code.');
  return {
    trackingCode: o.trackingCode,
    orderNo: o.orderNo,
    shopName: db.shops.find((s) => s.id === o.shopId)?.name ?? '',
    status: o.status,
    estimatedTotal: o.estimatedTotal,
    finalAmount: o.finalAmount,
    paymentStatus: o.paymentStatus,
    rejectionReason: o.rejectionReason,
    fileCount: db.orderFiles.filter((f) => f.orderId === o.id).length,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    events: db.orderEvents
      .filter((e) => e.orderId === o.id)
      .sort((a, b) => a.id - b.id)
      .map((e) => ({ status: e.status, createdAt: e.createdAt })),
  };
}
