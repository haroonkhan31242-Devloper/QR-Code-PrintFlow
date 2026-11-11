/**
 * Resets (or creates) the Super Admin account from SUPER_ADMIN_USERNAME / SUPER_ADMIN_PASSWORD in .env.
 * Use this if you are locked out.
 *
 *   npm run reset-admin
 *
 * The password is temporary: you will be asked to choose a new one at sign-in.
 */
import { config } from '../server/config';
import { db, logActivity, nowIso } from '../server/db';
import { hashPassword, passwordProblem, randomId, revokeUserSessions } from '../server/security';

const username = config.superAdmin.username.toLowerCase();
const password = config.superAdmin.password;

if (!username || !password) {
  console.error('Set SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD in .env first.');
  process.exit(1);
}
const problem = passwordProblem(password);
if (problem) {
  console.error(`SUPER_ADMIN_PASSWORD is not allowed: ${problem}`);
  process.exit(1);
}

const clash = db.prepare(`SELECT role FROM users WHERE username = ? AND role <> 'super_admin'`).get(username);
if (clash) {
  console.error(`"${username}" is already used by a shop owner. Choose another SUPER_ADMIN_USERNAME.`);
  process.exit(1);
}

const existing = db.prepare(`SELECT id FROM users WHERE role = 'super_admin' ORDER BY created_at LIMIT 1`).get() as { id: string } | undefined;
if (existing) {
  db.prepare('UPDATE users SET username = ?, password_hash = ?, must_change_password = 1, password_changed_at = ? WHERE id = ?').run(
    username,
    hashPassword(password),
    nowIso(),
    existing.id,
  );
  revokeUserSessions(existing.id);
} else {
  db.prepare(
    `INSERT INTO users (id, username, name, password_hash, role, shop_id, must_change_password, created_at)
     VALUES (?, ?, 'Super Admin', ?, 'super_admin', NULL, 1, ?)`,
  ).run(randomId('usr'), username, hashPassword(password), nowIso());
}
logActivity('system', 'Reset Super Admin password', 'via npm run reset-admin');
console.log(`Super Admin "${username}" now uses the password from .env.`);
console.log('Sign in at /admin/login. You will be asked to choose a new password.');
process.exit(0);
