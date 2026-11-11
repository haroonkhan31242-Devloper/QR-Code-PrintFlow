import type {
  ColorMode,
  FinishingCode,
  FinishingOption,
  OrderStatus,
  PaperSize,
  PaymentStatus,
  PriceRule,
  Role,
  Shop,
  Sides,
} from '../../shared/types';
import { ServiceError } from '../errors';

/**
 * Mock database kept in the browser's localStorage.
 *
 * Each "table" is an array of plain rows, shaped like the tables a real database (e.g. Supabase/Postgres)
 * would have. Only metadata lives here; uploaded file contents are kept in IndexedDB (see fileStore.ts),
 * because localStorage is limited to a few MB.
 *
 * To move to Supabase later, replace the service modules' calls to `readDb` / `writeDb` with Supabase queries.
 * The UI only talks to the services, never to this module.
 */

export interface ShopRow extends Shop {
  nextOrderNo: number;
}

export interface UserRow {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  role: Role;
  shopId: string | null;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
}

export interface SessionRow {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface PriceRuleRow extends PriceRule {
  shopId: string;
}

export interface FinishingRow extends FinishingOption {
  shopId: string;
}

export interface OrderRow {
  id: string;
  shopId: string;
  orderNo: number;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  colorMode: ColorMode;
  paperSize: PaperSize;
  sides: Sides;
  copies: number;
  finishing: FinishingCode;
  pageCount: number;
  estimatedTotal: number;
  finalAmount: number | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFileRow {
  id: string;
  orderId: string;
  shopId: string;
  originalName: string;
  mime: string;
  size: number;
  pages: number;
  createdAt: string;
  /** false once the shop deleted the file contents (the record is kept). */
  stored: boolean;
}

export interface OrderEventRow {
  id: number;
  orderId: string;
  status: OrderStatus;
  note: string | null;
  actor: string;
  createdAt: string;
}

export interface ActivityRow {
  id: number;
  shopId: string | null;
  actor: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface DbSchema {
  version: 1;
  shops: ShopRow[];
  users: UserRow[];
  sessions: SessionRow[];
  priceRules: PriceRuleRow[];
  finishing: FinishingRow[];
  orders: OrderRow[];
  orderFiles: OrderFileRow[];
  orderEvents: OrderEventRow[];
  activity: ActivityRow[];
  seq: { event: number; activity: number };
}

const DB_KEY = 'printflow:db';
const CHANGE_EVENT = 'printflow:db-change';

export const emptyDb = (): DbSchema => ({
  version: 1,
  shops: [],
  users: [],
  sessions: [],
  priceRules: [],
  finishing: [],
  orders: [],
  orderFiles: [],
  orderEvents: [],
  activity: [],
  seq: { event: 0, activity: 0 },
});

function load(): DbSchema | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(DB_KEY);
  } catch {
    throw new ServiceError(503, 'This browser blocks local storage. Allow site data for this page and reload.');
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DbSchema;
    return parsed && parsed.version === 1 ? { ...emptyDb(), ...parsed } : null;
  } catch {
    return null;
  }
}

function save(db: DbSchema) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    throw new ServiceError(507, 'Browser storage is full. Delete old orders’ files or clear the demo data.');
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const hasDb = () => load() !== null;

/** Returns a fresh copy of the whole database. Rows can be read freely; changes must go through writeDb. */
export function readDb(): DbSchema {
  return load() ?? emptyDb();
}

/**
 * Reads the latest data, lets `mutate` change it, then saves it in one step.
 * If `mutate` throws, nothing is saved (acts like a transaction).
 */
export function writeDb<T>(mutate: (db: DbSchema) => T): T {
  const db = readDb();
  const result = mutate(db);
  save(db);
  return result;
}

export function replaceDb(db: DbSchema) {
  save(db);
}

export function clearDb() {
  try {
    localStorage.removeItem(DB_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Calls `fn` whenever the data changes, in this tab or in another tab of the same browser. */
export function onDbChange(fn: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === DB_KEY) fn();
  };
  window.addEventListener(CHANGE_EVENT, fn);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, fn);
    window.removeEventListener('storage', onStorage);
  };
}

export const nowIso = () => new Date().toISOString();

export function logActivity(db: DbSchema, actor: string, action: string, details = '', shopId: string | null = null) {
  db.seq.activity += 1;
  db.activity.push({ id: db.seq.activity, shopId, actor, action, details, createdAt: nowIso() });
  // Keep the log bounded so localStorage does not fill up.
  if (db.activity.length > 1000) db.activity.splice(0, db.activity.length - 1000);
}

export function addOrderEvent(db: DbSchema, orderId: string, status: OrderStatus, note: string | null, actor: string, createdAt = nowIso()) {
  db.seq.event += 1;
  db.orderEvents.push({ id: db.seq.event, orderId, status, note, actor, createdAt });
}
