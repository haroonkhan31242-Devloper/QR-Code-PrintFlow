import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { config } from './config';
import { db, logActivity, nowIso } from './db';
import { generateTempPassword, hashPassword, loadSession, randomId, requireCsrfHeader, securityHeaders } from './security';
import { HttpError, ValidationError } from './validate';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { shopRouter } from './routes/shop';
import { publicRouter } from './routes/public';
import { agentRouter } from './routes/agent';

/**
 * Creates the first Super Admin account if none exists.
 * Credentials come from SUPER_ADMIN_USERNAME / SUPER_ADMIN_PASSWORD (see .env.example).
 * The account must change its password at first sign-in.
 */
function bootstrapSuperAdmin() {
  const existing = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'super_admin'`).get() as { c: number };
  if (existing.c > 0) return;

  let { username, password } = config.superAdmin;
  if (!username || !password) {
    if (config.isProd) {
      throw new Error('No Super Admin exists. Set SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD for the first start.');
    }
    username = username || 'superadmin';
    password = generateTempPassword();
    console.log('\n  No Super Admin found. Created a temporary development account:');
    console.log(`    username: ${username}`);
    console.log(`    password: ${password}`);
    console.log('  You will be asked to change this password at first sign-in.\n');
  }
  db.prepare(
    `INSERT INTO users (id, username, name, password_hash, role, shop_id, must_change_password, created_at)
     VALUES (?, ?, 'Super Admin', ?, 'super_admin', NULL, 1, ?)`,
  ).run(randomId('usr'), username.toLowerCase(), hashPassword(password), nowIso());
  logActivity('system', 'Created Super Admin account', username);
}

async function start() {
  bootstrapSuperAdmin();

  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);

  app.use(securityHeaders);
  app.use('/api', express.json({ limit: '100kb' }));
  app.use('/api', loadSession, requireCsrfHeader);

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/shop', shopRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/agent', agentRouter);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message, field: err.field });
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request body.' });
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
  });

  if (!config.isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.resolve(config.rootDir, 'dist');
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.listen(config.port, () => {
    console.log(`PrintFlow running on http://localhost:${config.port} (${config.isProd ? 'production' : 'development'})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
