import { Router } from 'express';
import { db, logActivity, nowIso, tx } from '../db';
import { deleteStoredFiles, getShop, last7Days, mapShop, seedShopDefaults, startOfTodayIso } from '../repo';
import { generateTempPassword, hashPassword, passwordProblem, randomCode, randomId, requireRole, revokeUserSessions } from '../security';
import { HttpError, ValidationError, email, oneOf, phone, text, username } from '../validate';
import type { ActivityEntry, AdminStats, ShopWithStats } from '../../shared/types';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';

export const adminRouter = Router();
adminRouter.use(requireRole('super_admin'));

const actor = (req: any) => req.user.username as string;

function readShopFields(body: any) {
  return {
    name: text(body, 'name', { label: 'Shop name', required: true, max: 80, min: 2 }),
    ownerName: text(body, 'ownerName', { label: 'Owner name', required: true, max: 80 }),
    phone: phone(body, 'phone', 'Phone', true),
    email: email(body, 'email', false),
    address: text(body, 'address', { label: 'Address', max: 200 }),
    city: text(body, 'city', { label: 'City', max: 60 }),
    operatingHours: text(body, 'operatingHours', { label: 'Opening hours', max: 80 }),
  };
}

export const newQrToken = () => randomCode(10).toLowerCase();

adminRouter.get('/stats', (_req, res) => {
  const one = (sql: string, ...p: any[]) => (db.prepare(sql).get(...p) as any).c as number;
  let storageBytes = 0;
  storageBytes = one('SELECT COALESCE(SUM(size),0) AS c FROM order_files WHERE stored_name IS NOT NULL');
  const stats: AdminStats = {
    shopsTotal: one('SELECT COUNT(*) AS c FROM shops'),
    shopsActive: one(`SELECT COUNT(*) AS c FROM shops WHERE status = 'active'`),
    ordersTotal: one('SELECT COUNT(*) AS c FROM orders'),
    ordersToday: one('SELECT COUNT(*) AS c FROM orders WHERE created_at >= ?', startOfTodayIso()),
    ordersPending: one(`SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'`),
    storageBytes,
    last7Days: last7Days(null),
    topShops: db
      .prepare(
        `SELECT s.id, s.name, COUNT(o.id) AS orders FROM shops s LEFT JOIN orders o ON o.shop_id = s.id
          GROUP BY s.id ORDER BY orders DESC, s.name LIMIT 5`,
      )
      .all() as any,
  };
  res.json(stats);
});

const SHOP_LIST_SQL = `
  SELECT s.*, u.username AS owner_username, u.last_login_at AS owner_last_login_at,
         (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id) AS order_count,
         (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id AND o.status = 'pending') AS pending_count,
         (SELECT MAX(created_at) FROM orders o WHERE o.shop_id = s.id) AS last_order_at
    FROM shops s LEFT JOIN users u ON u.shop_id = s.id AND u.role = 'shop_owner'`;

const mapShopWithStats = (r: any): ShopWithStats => ({
  ...mapShop(r),
  ownerUsername: r.owner_username,
  ownerLastLoginAt: r.owner_last_login_at,
  orderCount: r.order_count,
  pendingCount: r.pending_count,
  lastOrderAt: r.last_order_at,
});

adminRouter.get('/shops', (_req, res) => {
  const rows = db.prepare(`${SHOP_LIST_SQL} ORDER BY s.created_at DESC`).all();
  res.json({ shops: rows.map(mapShopWithStats) });
});

adminRouter.get('/shops/:id', (req, res) => {
  const row = db.prepare(`${SHOP_LIST_SQL} WHERE s.id = ?`).get(req.params.id);
  if (!row) throw new HttpError(404, 'Shop not found.');
  res.json({ shop: mapShopWithStats(row) });
});

adminRouter.post('/shops', (req, res) => {
  const fields = readShopFields(req.body);
  const ownerUsername = username(req.body, 'ownerUsername');
  let tempPassword: string = req.body?.ownerPassword || '';
  if (tempPassword) {
    const problem = passwordProblem(tempPassword);
    if (problem) throw new ValidationError(problem, 'ownerPassword');
  } else {
    tempPassword = generateTempPassword();
  }
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(ownerUsername)) {
    throw new ValidationError('That username is already taken.', 'ownerUsername');
  }

  const shopId = randomId('shp', 6);
  const now = nowIso();
  tx(() => {
    db.prepare(
      `INSERT INTO shops (id, name, owner_name, phone, email, address, city, operating_hours, status, qr_token, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    ).run(shopId, fields.name, fields.ownerName, fields.phone, fields.email, fields.address, fields.city, fields.operatingHours, newQrToken(), now, now);
    db.prepare(
      `INSERT INTO users (id, username, name, password_hash, role, shop_id, must_change_password, created_at)
       VALUES (?, ?, ?, ?, 'shop_owner', ?, 1, ?)`,
    ).run(randomId('usr'), ownerUsername, fields.ownerName, hashPassword(tempPassword), shopId, now);
    seedShopDefaults(shopId);
  });
  logActivity(actor(req), 'Created shop', `${fields.name} (owner login: ${ownerUsername})`, shopId);

  // The temporary password is returned exactly once and never stored in plain text.
  res.status(201).json({ shop: getShop(shopId), credentials: { username: ownerUsername, temporaryPassword: tempPassword } });
});

adminRouter.put('/shops/:id', (req, res) => {
  const shop = getShop(req.params.id);
  if (!shop) throw new HttpError(404, 'Shop not found.');
  const f = readShopFields(req.body);
  db.prepare(
    `UPDATE shops SET name = ?, owner_name = ?, phone = ?, email = ?, address = ?, city = ?, operating_hours = ?, updated_at = ? WHERE id = ?`,
  ).run(f.name, f.ownerName, f.phone, f.email, f.address, f.city, f.operatingHours, nowIso(), shop.id);
  db.prepare(`UPDATE users SET name = ? WHERE shop_id = ? AND role = 'shop_owner'`).run(f.ownerName, shop.id);
  logActivity(actor(req), 'Updated shop details', f.name, shop.id);
  res.json({ shop: getShop(shop.id) });
});

adminRouter.patch('/shops/:id/status', (req, res) => {
  const shop = getShop(req.params.id);
  if (!shop) throw new HttpError(404, 'Shop not found.');
  const status = oneOf(req.body, 'status', ['active', 'inactive'] as const, 'Status');
  db.prepare('UPDATE shops SET status = ?, updated_at = ? WHERE id = ?').run(status, nowIso(), shop.id);
  if (status === 'inactive') {
    const owner = db.prepare(`SELECT id FROM users WHERE shop_id = ? AND role = 'shop_owner'`).get(shop.id) as any;
    if (owner) revokeUserSessions(owner.id);
  }
  logActivity(actor(req), status === 'active' ? 'Activated shop' : 'Deactivated shop', shop.name, shop.id);
  res.json({ shop: getShop(shop.id) });
});

adminRouter.post('/shops/:id/reset-password', (req, res) => {
  const shop = getShop(req.params.id);
  if (!shop) throw new HttpError(404, 'Shop not found.');
  const owner = db.prepare(`SELECT id, username FROM users WHERE shop_id = ? AND role = 'shop_owner'`).get(shop.id) as any;
  if (!owner) throw new HttpError(404, 'This shop has no owner account.');
  const tempPassword = generateTempPassword();
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1, password_changed_at = ? WHERE id = ?').run(
    hashPassword(tempPassword),
    nowIso(),
    owner.id,
  );
  revokeUserSessions(owner.id);
  logActivity(actor(req), 'Reset shop owner password', `${shop.name} (${owner.username})`, shop.id);
  res.json({ credentials: { username: owner.username, temporaryPassword: tempPassword } });
});

adminRouter.delete('/shops/:id', (req, res) => {
  const shop = getShop(req.params.id);
  if (!shop) throw new HttpError(404, 'Shop not found.');
  if (req.body?.confirmName !== shop.name) {
    throw new ValidationError('Type the shop name exactly to confirm deletion.', 'confirmName');
  }
  const files = db.prepare('SELECT shop_id, stored_name FROM order_files WHERE shop_id = ?').all(shop.id) as any[];
  db.prepare('DELETE FROM shops WHERE id = ?').run(shop.id); // cascades to users, sessions, orders, files, prices
  deleteStoredFiles(files);
  fs.rmSync(path.join(config.uploadDir, shop.id), { recursive: true, force: true });
  logActivity(actor(req), 'Deleted shop', shop.name, null);
  res.json({ ok: true });
});

adminRouter.get('/activity', (req, res) => {
  const shopId = typeof req.query.shopId === 'string' ? req.query.shopId : null;
  const rows = (
    shopId
      ? db
          .prepare(`SELECT a.*, s.name AS shop_name FROM activity_log a LEFT JOIN shops s ON s.id = a.shop_id WHERE a.shop_id = ? ORDER BY a.id DESC LIMIT 100`)
          .all(shopId)
      : db.prepare(`SELECT a.*, s.name AS shop_name FROM activity_log a LEFT JOIN shops s ON s.id = a.shop_id ORDER BY a.id DESC LIMIT 200`).all()
  ) as any[];
  const entries: ActivityEntry[] = rows.map((r) => ({
    id: r.id,
    shopId: r.shop_id,
    shopName: r.shop_name,
    actor: r.actor,
    action: r.action,
    details: r.details,
    createdAt: r.created_at,
  }));
  res.json({ entries });
});
