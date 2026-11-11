import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

const root = process.cwd();
const isProd = process.env.NODE_ENV === 'production';

export const config = {
  isProd,
  port: Number(process.env.PORT) || 3000,
  rootDir: root,
  dataDir: path.resolve(root, process.env.DATA_DIR || 'data'),
  get uploadDir() {
    return path.join(this.dataDir, 'uploads');
  },
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS) || 12,
  cookieName: 'pf_session',
  superAdmin: {
    username: process.env.SUPER_ADMIN_USERNAME?.trim() || '',
    password: process.env.SUPER_ADMIN_PASSWORD || '',
  },
};
