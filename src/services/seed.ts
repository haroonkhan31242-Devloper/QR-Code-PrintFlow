import type { FinishingOption, PriceRule } from '../shared/types';
import { hashPassword } from './crypto';
import { clearFiles } from './storage/fileStore';
import { emptyDb, hasDb, logActivity, nowIso, readDb, replaceDb, type DbSchema } from './storage/localDb';

/**
 * First-run demo data. Created automatically the first time the app opens in a browser,
 * and again after "Reset demo data".
 *
 * Demo sign-ins (test values for this local demo only, see README):
 *   Super Admin  /admin/login  username: superadmin  password: Admin1234
 *   Shop owner   /shop/login   username: demoshop    password: Shop1234
 * Customer upload page for the demo shop: /s/demoprint1
 */
export const DEMO_ACCOUNTS = {
  admin: { username: 'superadmin', password: 'Admin1234' },
  shop: { username: 'demoshop', password: 'Shop1234' },
  shopQrToken: 'demoprint1',
} as const;

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

export function seedShopDefaults(db: DbSchema, shopId: string) {
  for (const p of DEFAULT_PRICES) db.priceRules.push({ shopId, ...p });
  for (const f of DEFAULT_FINISHING) db.finishing.push({ shopId, ...f });
}

async function buildDemoDb(): Promise<DbSchema> {
  const db = emptyDb();
  const now = nowIso();
  db.users.push({
    id: 'usr_admin',
    username: DEMO_ACCOUNTS.admin.username,
    name: 'Super Admin',
    passwordHash: await hashPassword(DEMO_ACCOUNTS.admin.password),
    role: 'super_admin',
    shopId: null,
    mustChangePassword: false,
    createdAt: now,
    lastLoginAt: null,
    passwordChangedAt: null,
  });
  const shopId = 'shp_demo';
  db.shops.push({
    id: shopId,
    name: 'Demo Print Shop',
    ownerName: 'Demo Owner',
    phone: '0300 1234567',
    email: 'demo@printflow.local',
    address: 'Shop 4, Main Market',
    city: 'Lahore',
    operatingHours: 'Mon–Sat, 9am–9pm',
    status: 'active',
    qrToken: DEMO_ACCOUNTS.shopQrToken,
    nextOrderNo: 1001,
    createdAt: now,
    updatedAt: now,
  });
  db.users.push({
    id: 'usr_demoshop',
    username: DEMO_ACCOUNTS.shop.username,
    name: 'Demo Owner',
    passwordHash: await hashPassword(DEMO_ACCOUNTS.shop.password),
    role: 'shop_owner',
    shopId,
    mustChangePassword: false,
    createdAt: now,
    lastLoginAt: null,
    passwordChangedAt: null,
  });
  seedShopDefaults(db, shopId);
  logActivity(db, 'system', 'Created demo data', 'Super Admin and Demo Print Shop');
  return db;
}

let ready: Promise<void> | null = null;

/** Makes sure the mock database exists. Every service awaits this before reading data. */
export function ensureSeeded(): Promise<void> {
  const seeded = () => hasDb() && readDb().users.some((u) => u.role === 'super_admin');
  if (seeded()) return Promise.resolve();
  ready ??= buildDemoDb()
    .then((db) => {
      if (!seeded()) replaceDb(db); // another tab may have seeded meanwhile
    })
    .finally(() => {
      ready = null;
    });
  return ready;
}

/** Deletes every shop, order and file in this browser and recreates the demo data. */
export async function resetDemoData(): Promise<void> {
  await clearFiles();
  replaceDb(await buildDemoDb());
}
