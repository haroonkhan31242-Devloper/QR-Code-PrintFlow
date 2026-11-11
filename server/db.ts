import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config';

fs.mkdirSync(config.dataDir, { recursive: true });
fs.mkdirSync(config.uploadDir, { recursive: true });

export const db = new DatabaseSync(path.join(config.dataDir, 'printflow.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS shops (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    owner_name       TEXT NOT NULL DEFAULT '',
    phone            TEXT NOT NULL DEFAULT '',
    email            TEXT NOT NULL DEFAULT '',
    address          TEXT NOT NULL DEFAULT '',
    city             TEXT NOT NULL DEFAULT '',
    operating_hours  TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    qr_token         TEXT NOT NULL UNIQUE,
    next_order_no    INTEGER NOT NULL DEFAULT 1001,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id                    TEXT PRIMARY KEY,
    username              TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name                  TEXT NOT NULL,
    password_hash         TEXT NOT NULL,
    role                  TEXT NOT NULL CHECK (role IN ('super_admin','shop_owner')),
    shop_id               TEXT REFERENCES shops(id) ON DELETE CASCADE,
    must_change_password  INTEGER NOT NULL DEFAULT 1,
    created_at            TEXT NOT NULL,
    last_login_at         TEXT,
    password_changed_at   TEXT,
    CHECK ((role = 'super_admin' AND shop_id IS NULL) OR (role = 'shop_owner' AND shop_id IS NOT NULL))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_one_owner_per_shop ON users(shop_id) WHERE role = 'shop_owner';

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash  TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS price_rules (
    shop_id      TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    paper_size   TEXT NOT NULL CHECK (paper_size IN ('A4','A3','Legal')),
    color_mode   TEXT NOT NULL CHECK (color_mode IN ('bw','color')),
    price_single REAL NOT NULL CHECK (price_single >= 0),
    price_double REAL NOT NULL CHECK (price_double >= 0),
    PRIMARY KEY (shop_id, paper_size, color_mode)
  );

  CREATE TABLE IF NOT EXISTS finishing_options (
    shop_id  TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    code     TEXT NOT NULL CHECK (code IN ('staple','spiral_binding','lamination')),
    name     TEXT NOT NULL,
    price    REAL NOT NULL CHECK (price >= 0),
    enabled  INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (shop_id, code)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id                TEXT PRIMARY KEY,
    shop_id           TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    order_no          INTEGER NOT NULL,
    tracking_code     TEXT NOT NULL UNIQUE,
    customer_name     TEXT NOT NULL,
    customer_phone    TEXT NOT NULL,
    notes             TEXT NOT NULL DEFAULT '',
    color_mode        TEXT NOT NULL,
    paper_size        TEXT NOT NULL,
    sides             TEXT NOT NULL,
    copies            INTEGER NOT NULL,
    finishing         TEXT NOT NULL DEFAULT 'none',
    page_count        INTEGER NOT NULL,
    estimated_total   REAL NOT NULL,
    final_amount      REAL,
    status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','accepted','printing','ready','completed','rejected')),
    payment_status    TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid')),
    rejection_reason  TEXT,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL,
    UNIQUE (shop_id, order_no)
  );
  CREATE INDEX IF NOT EXISTS idx_orders_shop_created ON orders(shop_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS order_files (
    id             TEXT PRIMARY KEY,
    order_id       TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shop_id        TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    original_name  TEXT NOT NULL,
    stored_name    TEXT,
    mime           TEXT NOT NULL,
    size           INTEGER NOT NULL,
    pages          INTEGER NOT NULL,
    created_at     TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_files_order ON order_files(order_id);

  CREATE TABLE IF NOT EXISTS order_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status      TEXT NOT NULL,
    note        TEXT,
    actor       TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_events_order ON order_events(order_id);

  -- Print agent: a small program on the shop's PC that prints jobs on its local printers.
  CREATE TABLE IF NOT EXISTS print_agents (
    shop_id       TEXT PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
    token_hash    TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL DEFAULT '',
    printers      TEXT NOT NULL DEFAULT '[]',
    default_printer TEXT,
    last_seen_at  TEXT,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS print_jobs (
    id          TEXT PRIMARY KEY,
    shop_id     TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    file_ids    TEXT NOT NULL,
    file_count  INTEGER NOT NULL,
    printer     TEXT NOT NULL,
    copies      INTEGER NOT NULL,
    sides       TEXT NOT NULL CHECK (sides IN ('single','double')),
    color_mode  TEXT NOT NULL CHECK (color_mode IN ('bw','color')),
    paper_size  TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','printing','done','failed','cancelled')),
    error       TEXT,
    created_by  TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_print_jobs_shop_status ON print_jobs(shop_id, status, created_at);
  CREATE INDEX IF NOT EXISTS idx_print_jobs_order ON print_jobs(order_id);

  CREATE TABLE IF NOT EXISTS activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id     TEXT REFERENCES shops(id) ON DELETE SET NULL,
    actor       TEXT NOT NULL,
    action      TEXT NOT NULL,
    details     TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
`);

export const nowIso = () => new Date().toISOString();

/** Runs fn inside a transaction. node:sqlite has no helper, so do it manually. */
export function tx<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function logActivity(actor: string, action: string, details = '', shopId: string | null = null) {
  db.prepare('INSERT INTO activity_log (shop_id, actor, action, details, created_at) VALUES (?, ?, ?, ?, ?)').run(
    shopId,
    actor,
    action,
    details,
    nowIso(),
  );
}
