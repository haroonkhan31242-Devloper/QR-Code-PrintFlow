import type { SessionUser } from '../shared/types';
import { hashPassword, passwordProblem, verifyPassword } from './crypto';
import { invalid, ServiceError } from './errors';
import { ensureSeeded } from './seed';
import { createSession, currentUser, destroySession, requireUser, revokeUserSessions, toSessionUser } from './session';
import { logActivity, nowIso, readDb, writeDb } from './storage/localDb';
import { oneOf, text } from './validate';

const GENERIC_LOGIN_ERROR = 'Incorrect username or password.';

export async function getCurrentUser(): Promise<SessionUser | null> {
  await ensureSeeded();
  return currentUser();
}

export async function login(portal: 'admin' | 'shop', usernameInput: string, password: string): Promise<SessionUser> {
  await ensureSeeded();
  oneOf(portal, 'portal', ['admin', 'shop'] as const, 'Portal');
  const username = text(usernameInput, 'username', { label: 'Username', required: true, max: 60 }).toLowerCase();
  if (!password) throw invalid('Password is required.', 'password');

  const user = readDb().users.find((u) => u.username === username);
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw new ServiceError(401, GENERIC_LOGIN_ERROR);

  // Each role signs in through its own page. The password was correct, so it is safe to say which page to use.
  const expectedRole = portal === 'admin' ? 'super_admin' : 'shop_owner';
  if (user.role !== expectedRole) {
    throw new ServiceError(
      401,
      user.role === 'super_admin'
        ? 'This is a Super Admin account. Please sign in on the Super Admin page.'
        : 'This is a shop owner account. Please sign in on the Shop sign-in page.',
      undefined,
      user.role === 'super_admin' ? 'USE_ADMIN_LOGIN' : 'USE_SHOP_LOGIN',
    );
  }

  return writeDb((db) => {
    const row = db.users.find((u) => u.id === user.id)!;
    if (row.role === 'shop_owner' && db.shops.find((s) => s.id === row.shopId)?.status !== 'active') {
      throw new ServiceError(403, 'This shop is currently deactivated. Please contact the platform administrator.');
    }
    row.lastLoginAt = nowIso();
    createSession(db, row.id);
    logActivity(db, row.username, 'Signed in', row.role === 'super_admin' ? 'Super Admin portal' : 'Shop portal', row.shopId);
    return toSessionUser(row);
  });
}

export async function logout(): Promise<void> {
  writeDb((db) => destroySession(db));
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<SessionUser> {
  const me = requireUser();
  const problem = passwordProblem(newPassword);
  if (problem) throw invalid(problem, 'newPassword');
  const stored = readDb().users.find((u) => u.id === me.id);
  if (!stored) throw new ServiceError(401, 'Please sign in.');
  if (!(await verifyPassword(currentPassword ?? '', stored.passwordHash))) throw invalid('Current password is incorrect.', 'currentPassword');
  if (await verifyPassword(newPassword, stored.passwordHash)) throw invalid('New password must be different from the current one.', 'newPassword');
  const hash = await hashPassword(newPassword);

  return writeDb((db) => {
    const row = db.users.find((u) => u.id === me.id)!;
    row.passwordHash = hash;
    row.mustChangePassword = false;
    row.passwordChangedAt = nowIso();
    revokeUserSessions(db, row.id, true); // sign out other sessions
    logActivity(db, row.username, 'Changed password', '', row.shopId);
    return toSessionUser(row);
  });
}
