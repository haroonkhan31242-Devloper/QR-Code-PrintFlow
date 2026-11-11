import { Router } from 'express';
import { db, logActivity, nowIso } from '../db';
import {
  createSession,
  destroySession,
  hashPassword,
  passwordProblem,
  rateLimit,
  resetRateLimit,
  revokeUserSessions,
  verifyAgainstDummy,
  verifyPassword,
} from '../security';
import { ValidationError, oneOf, text } from '../validate';

export const authRouter = Router();

const GENERIC_LOGIN_ERROR = 'Incorrect username or password.';

authRouter.post('/login', (req, res) => {
  const portal = oneOf(req.body, 'portal', ['admin', 'shop'] as const, 'Portal');
  const usernameInput = text(req.body, 'username', { label: 'Username', required: true, max: 60 }).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!password) throw new ValidationError('Password is required.', 'password');

  const ip = req.ip || 'unknown';
  const key = `login:${ip}:${usernameInput}`;
  if (!rateLimit(key, 8, 15 * 60_000) || !rateLimit(`login-ip:${ip}`, 40, 15 * 60_000)) {
    return res.status(429).json({ error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' });
  }

  const user = db
    .prepare(
      `SELECT u.*, s.status AS shop_status, s.name AS shop_name
         FROM users u LEFT JOIN shops s ON s.id = u.shop_id
        WHERE u.username = ?`,
    )
    .get(usernameInput) as any;

  const expectedRole = portal === 'admin' ? 'super_admin' : 'shop_owner';
  if (!user) {
    verifyAgainstDummy(password);
    return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
  }
  const passwordOk = verifyPassword(password, user.password_hash);
  if (!passwordOk) {
    return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
  }
  // Each role can only sign in through its own login page. The password was correct,
  // so it is safe to tell the person which page to use.
  if (user.role !== expectedRole) {
    return res.status(401).json({
      error:
        user.role === 'super_admin'
          ? 'This is a Super Admin account. Please sign in on the Super Admin page.'
          : 'This is a shop owner account. Please sign in on the Shop sign-in page.',
      code: user.role === 'super_admin' ? 'USE_ADMIN_LOGIN' : 'USE_SHOP_LOGIN',
    });
  }
  if (user.role === 'shop_owner' && user.shop_status !== 'active') {
    return res.status(403).json({ error: 'This shop is currently deactivated. Please contact the platform administrator.' });
  }

  resetRateLimit(key);
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(nowIso(), user.id);
  createSession(res, user.id);
  logActivity(user.username, 'Signed in', user.role === 'super_admin' ? 'Super Admin portal' : 'Shop portal', user.shop_id);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      shopId: user.shop_id,
      mustChangePassword: user.must_change_password === 1,
    },
  });
});

authRouter.post('/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  res.json({ user: req.user ?? null });
});

authRouter.post('/change-password', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Please sign in.' });
  const current = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const next = req.body?.newPassword;
  const problem = passwordProblem(next);
  if (problem) throw new ValidationError(problem, 'newPassword');
  if (!rateLimit(`pwchange:${req.user.id}`, 10, 15 * 60_000)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait and try again.' });
  }

  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id) as { password_hash: string };
  if (!verifyPassword(current, row.password_hash)) {
    throw new ValidationError('Current password is incorrect.', 'currentPassword');
  }
  if (verifyPassword(next, row.password_hash)) {
    throw new ValidationError('New password must be different from the current one.', 'newPassword');
  }
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, password_changed_at = ? WHERE id = ?').run(
    hashPassword(next),
    nowIso(),
    req.user.id,
  );
  revokeUserSessions(req.user.id, req); // sign out other devices
  logActivity(req.user.username, 'Changed password', '', req.user.shopId);
  res.json({ user: { ...req.user, mustChangePassword: false } });
});
