import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config';
import { db, nowIso } from './db';
import type { Role, SessionUser } from '../shared/types';

// ---------- Password hashing (scrypt, built into Node) ----------

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return crypto.timingSafeEqual(expected, actual);
}

// A real hash used to keep login timing similar when the username does not exist.
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'));
export const verifyAgainstDummy = (password: string) => verifyPassword(password, DUMMY_HASH);

export function passwordProblem(password: unknown): string | null {
  if (typeof password !== 'string') return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password must be at most 128 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain letters and numbers.';
  return null;
}

/** Readable temporary password, e.g. "Kite-7342-Moss". */
export function generateTempPassword(): string {
  const words = ['Amber', 'Cedar', 'Coral', 'Delta', 'Ember', 'Falcon', 'Harbor', 'Indigo', 'Juniper', 'Lotus', 'Maple', 'Nova', 'Orchid', 'Pine', 'Quartz', 'Raven', 'Sable', 'Tide', 'Willow', 'Zephyr'];
  const pick = () => words[crypto.randomInt(words.length)];
  return `${pick()}-${crypto.randomInt(1000, 10000)}-${pick()}`;
}

export const randomId = (prefix: string, bytes = 9) => `${prefix}_${crypto.randomBytes(bytes).toString('base64url')}`;

/** Unambiguous uppercase code, e.g. tracking codes. */
export function randomCode(length: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[crypto.randomInt(alphabet.length)];
  return out;
}

// ---------- Sessions ----------

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export function createSession(res: Response, userId: string) {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const expires = new Date(now + config.sessionTtlHours * 3600_000);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowIso());
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    sha256(token),
    userId,
    new Date(now).toISOString(),
    expires.toISOString(),
  );
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    path: '/',
    expires,
  });
}

export function destroySession(req: Request, res: Response) {
  const token = readCookie(req, config.cookieName);
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  res.clearCookie(config.cookieName, { path: '/' });
}

export function revokeUserSessions(userId: string, exceptReq?: Request) {
  const keep = exceptReq ? readCookie(exceptReq, config.cookieName) : undefined;
  if (keep) {
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(userId, sha256(keep));
  } else {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

interface UserRow {
  id: string;
  username: string;
  name: string;
  role: Role;
  shop_id: string | null;
  must_change_password: number;
  shop_status: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

/** Resolves the session cookie into req.user. Never trusts any client-provided role or shop id. */
export function loadSession(req: Request, _res: Response, next: NextFunction) {
  const token = readCookie(req, config.cookieName);
  if (token) {
    const row = db
      .prepare(
        `SELECT u.id, u.username, u.name, u.role, u.shop_id, u.must_change_password, s.status AS shop_status
           FROM sessions se
           JOIN users u ON u.id = se.user_id
           LEFT JOIN shops s ON s.id = u.shop_id
          WHERE se.token_hash = ? AND se.expires_at > ?`,
      )
      .get(sha256(token), nowIso()) as UserRow | undefined;
    // A deactivated shop's owner loses access immediately.
    if (row && !(row.role === 'shop_owner' && row.shop_status !== 'active')) {
      req.user = {
        id: row.id,
        username: row.username,
        name: row.name,
        role: row.role,
        shopId: row.shop_id,
        mustChangePassword: row.must_change_password === 1,
      };
    }
  }
  next();
}

/**
 * Cross-site request forgery guard: state-changing API calls must carry a custom header.
 * Browsers cannot send custom headers cross-origin without a CORS preflight, which this API never approves.
 */
export function requireCsrfHeader(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-requested-with') !== 'PrintFlow') {
    return res.status(403).json({ error: 'Missing request header.' });
  }
  next();
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Please sign in.' });
    if (req.user.role !== role) return res.status(403).json({ error: 'You do not have access to this area.' });
    if (req.user.mustChangePassword) {
      return res.status(403).json({ error: 'Please change your temporary password first.', code: 'PASSWORD_CHANGE_REQUIRED' });
    }
    if (role === 'shop_owner' && !req.user.shopId) return res.status(403).json({ error: 'No shop assigned.' });
    next();
  };
}

// ---------- Simple in-memory rate limiter ----------

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
}, 60_000).unref();

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (config.isProd) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
  }
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
}
