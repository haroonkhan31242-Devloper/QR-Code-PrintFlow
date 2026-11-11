import type { ActivityEntry, AdminStats, Shop, ShopWithStats } from '../shared/types';
import { generateTempPassword, hashPassword, newQrToken, passwordProblem, randomId } from './crypto';
import { invalid, notFound } from './errors';
import { last7Days, startOfTodayIso, toShop, toShopWithStats } from './mappers';
import { ensureSeeded, seedShopDefaults } from './seed';
import { requireRole, revokeUserSessions } from './session';
import { deleteFiles } from './storage/fileStore';
import { logActivity, nowIso, readDb, writeDb, type DbSchema } from './storage/localDb';
import { email, oneOf, phone, text, username } from './validate';

/** Super Admin operations. Every function checks the signed-in user is a Super Admin. */

export interface ShopInput {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  operatingHours: string;
}

export interface Credentials {
  username: string;
  temporaryPassword: string;
}

async function admin() {
  await ensureSeeded();
  return requireRole('super_admin');
}

function readShopFields(v: Partial<ShopInput>): ShopInput {
  return {
    name: text(v.name, 'name', { label: 'Shop name', required: true, max: 80, min: 2 }),
    ownerName: text(v.ownerName, 'ownerName', { label: 'Owner name', required: true, max: 80 }),
    phone: phone(v.phone, 'phone', 'Phone', true),
    email: email(v.email, 'email', false),
    address: text(v.address, 'address', { label: 'Address', max: 200 }),
    city: text(v.city, 'city', { label: 'City', max: 60 }),
    operatingHours: text(v.operatingHours, 'operatingHours', { label: 'Opening hours', max: 80 }),
  };
}

function findShop(db: DbSchema, id: string) {
  const shop = db.shops.find((s) => s.id === id);
  if (!shop) throw notFound('Shop not found.');
  return shop;
}

export async function getStats(): Promise<AdminStats> {
  await admin();
  const db = readDb();
  const today = startOfTodayIso();
  return {
    shopsTotal: db.shops.length,
    shopsActive: db.shops.filter((s) => s.status === 'active').length,
    ordersTotal: db.orders.length,
    ordersToday: db.orders.filter((o) => o.createdAt >= today).length,
    ordersPending: db.orders.filter((o) => o.status === 'pending').length,
    storageBytes: db.orderFiles.filter((f) => f.stored).reduce((sum, f) => sum + f.size, 0),
    last7Days: last7Days(db.orders),
    topShops: db.shops
      .map((s) => ({ id: s.id, name: s.name, orders: db.orders.filter((o) => o.shopId === s.id).length }))
      .sort((a, b) => b.orders - a.orders || a.name.localeCompare(b.name))
      .slice(0, 5),
  };
}

export async function listShops(): Promise<ShopWithStats[]> {
  await admin();
  const db = readDb();
  return db.shops.map((s) => toShopWithStats(db, s)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getShop(id: string): Promise<ShopWithStats> {
  await admin();
  const db = readDb();
  return toShopWithStats(db, findShop(db, id));
}

export async function createShop(input: ShopInput & { ownerUsername: string; ownerPassword?: string }): Promise<{ shop: Shop; credentials: Credentials }> {
  const me = await admin();
  const fields = readShopFields(input);
  const ownerUsername = username(input.ownerUsername, 'ownerUsername');
  let tempPassword = input.ownerPassword || '';
  if (tempPassword) {
    const problem = passwordProblem(tempPassword);
    if (problem) throw invalid(problem, 'ownerPassword');
  } else {
    tempPassword = generateTempPassword();
  }
  const passwordHash = await hashPassword(tempPassword);

  const shop = writeDb((db) => {
    if (db.users.some((u) => u.username === ownerUsername)) throw invalid('That username is already taken.', 'ownerUsername');
    const now = nowIso();
    const shopId = randomId('shp', 6);
    let qrToken = newQrToken();
    while (db.shops.some((s) => s.qrToken === qrToken)) qrToken = newQrToken();
    const row = { id: shopId, ...fields, status: 'active' as const, qrToken, nextOrderNo: 1001, createdAt: now, updatedAt: now };
    db.shops.push(row);
    db.users.push({
      id: randomId('usr'),
      username: ownerUsername,
      name: fields.ownerName,
      passwordHash,
      role: 'shop_owner',
      shopId,
      mustChangePassword: true,
      createdAt: now,
      lastLoginAt: null,
      passwordChangedAt: null,
    });
    seedShopDefaults(db, shopId);
    logActivity(db, me.username, 'Created shop', `${fields.name} (owner login: ${ownerUsername})`, shopId);
    return toShop(row);
  });
  // The temporary password is returned once; only its hash is stored.
  return { shop, credentials: { username: ownerUsername, temporaryPassword: tempPassword } };
}

export async function updateShop(id: string, input: ShopInput): Promise<ShopWithStats> {
  const me = await admin();
  const f = readShopFields(input);
  return writeDb((db) => {
    const shop = findShop(db, id);
    Object.assign(shop, f, { updatedAt: nowIso() });
    db.users.filter((u) => u.shopId === id && u.role === 'shop_owner').forEach((u) => (u.name = f.ownerName));
    logActivity(db, me.username, 'Updated shop details', f.name, id);
    return toShopWithStats(db, shop);
  });
}

export async function setShopStatus(id: string, status: 'active' | 'inactive'): Promise<ShopWithStats> {
  const me = await admin();
  const next = oneOf(status, 'status', ['active', 'inactive'] as const, 'Status');
  return writeDb((db) => {
    const shop = findShop(db, id);
    shop.status = next;
    shop.updatedAt = nowIso();
    if (next === 'inactive') db.users.filter((u) => u.shopId === id).forEach((u) => revokeUserSessions(db, u.id));
    logActivity(db, me.username, next === 'active' ? 'Activated shop' : 'Deactivated shop', shop.name, id);
    return toShopWithStats(db, shop);
  });
}

export async function resetOwnerPassword(id: string): Promise<Credentials> {
  const me = await admin();
  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);
  return writeDb((db) => {
    const shop = findShop(db, id);
    const owner = db.users.find((u) => u.shopId === id && u.role === 'shop_owner');
    if (!owner) throw notFound('This shop has no owner account.');
    owner.passwordHash = hash;
    owner.mustChangePassword = true;
    owner.passwordChangedAt = nowIso();
    revokeUserSessions(db, owner.id);
    logActivity(db, me.username, 'Reset shop owner password', `${shop.name} (${owner.username})`, id);
    return { username: owner.username, temporaryPassword: tempPassword };
  });
}

export async function deleteShop(id: string, confirmName: string): Promise<void> {
  const me = await admin();
  const fileIds = writeDb((db) => {
    const shop = findShop(db, id);
    if (confirmName !== shop.name) throw invalid('Type the shop name exactly to confirm deletion.', 'confirmName');
    const orderIds = new Set(db.orders.filter((o) => o.shopId === id).map((o) => o.id));
    const userIds = new Set(db.users.filter((u) => u.shopId === id).map((u) => u.id));
    const files = db.orderFiles.filter((f) => f.shopId === id).map((f) => f.id);
    db.shops = db.shops.filter((s) => s.id !== id);
    db.users = db.users.filter((u) => !userIds.has(u.id));
    db.sessions = db.sessions.filter((s) => !userIds.has(s.userId));
    db.priceRules = db.priceRules.filter((r) => r.shopId !== id);
    db.finishing = db.finishing.filter((f) => f.shopId !== id);
    db.orders = db.orders.filter((o) => o.shopId !== id);
    db.orderFiles = db.orderFiles.filter((f) => f.shopId !== id);
    db.orderEvents = db.orderEvents.filter((e) => !orderIds.has(e.orderId));
    db.activity.forEach((a) => {
      if (a.shopId === id) a.shopId = null;
    });
    logActivity(db, me.username, 'Deleted shop', shop.name, null);
    return files;
  });
  await deleteFiles(fileIds);
}

export async function listActivity(shopId?: string): Promise<ActivityEntry[]> {
  await admin();
  const db = readDb();
  const names = new Map(db.shops.map((s) => [s.id, s.name]));
  return db.activity
    .filter((a) => !shopId || a.shopId === shopId)
    .sort((a, b) => b.id - a.id)
    .slice(0, shopId ? 100 : 200)
    .map((a) => ({ ...a, shopName: a.shopId ? names.get(a.shopId) ?? null : null }));
}
