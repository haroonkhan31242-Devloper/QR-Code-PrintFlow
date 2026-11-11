import type { Role, SessionUser } from '../shared/types';
import { newSessionToken } from './crypto';
import { ServiceError } from './errors';
import { nowIso, readDb, type DbSchema, type UserRow } from './storage/localDb';

/**
 * Sign-in sessions. The session token for this browser is kept in localStorage so a refresh keeps you signed in;
 * the session rows live in the mock database so signing out "other devices" (other tabs/sessions) works.
 */

const TOKEN_KEY = 'printflow:session';
const SESSION_HOURS = 12;

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export const toSessionUser = (u: UserRow): SessionUser => ({
  id: u.id,
  username: u.username,
  name: u.name,
  role: u.role,
  shopId: u.shopId,
  mustChangePassword: u.mustChangePassword,
});

/** Adds a session row to `db` and remembers its token in this browser. */
export function createSession(db: DbSchema, userId: string) {
  const token = newSessionToken();
  const now = Date.now();
  db.sessions = db.sessions.filter((s) => s.expiresAt > nowIso());
  db.sessions.push({ token, userId, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + SESSION_HOURS * 3600_000).toISOString() });
  setToken(token);
}

export function destroySession(db: DbSchema) {
  const token = getToken();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  setToken(null);
}

/** Signs a user out everywhere, except this browser's session when `keepCurrent` is set. */
export function revokeUserSessions(db: DbSchema, userId: string, keepCurrent = false) {
  const keep = keepCurrent ? getToken() : null;
  db.sessions = db.sessions.filter((s) => s.userId !== userId || s.token === keep);
}

/** The signed-in user of this browser, or null. A deactivated shop's owner loses access immediately. */
export function currentUser(db: DbSchema = readDb()): SessionUser | null {
  const token = getToken();
  if (!token) return null;
  const session = db.sessions.find((s) => s.token === token && s.expiresAt > nowIso());
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return null;
  if (user.role === 'shop_owner') {
    const shop = db.shops.find((s) => s.id === user.shopId);
    if (!shop || shop.status !== 'active') return null;
  }
  return toSessionUser(user);
}

export function requireUser(db: DbSchema = readDb()): SessionUser {
  const user = currentUser(db);
  if (!user) throw new ServiceError(401, 'Please sign in.');
  return user;
}

/** Checks the signed-in user's role. Shop ids always come from the session, never from the caller. */
export function requireRole(role: Role, db: DbSchema = readDb()): SessionUser {
  const user = requireUser(db);
  if (user.role !== role) throw new ServiceError(403, 'You do not have access to this area.');
  if (user.mustChangePassword) throw new ServiceError(403, 'Please change your temporary password first.', undefined, 'PASSWORD_CHANGE_REQUIRED');
  if (role === 'shop_owner' && !user.shopId) throw new ServiceError(403, 'No shop assigned.');
  return user;
}
