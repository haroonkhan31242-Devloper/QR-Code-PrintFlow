/** Ids, codes and password hashing with the browser's Web Crypto API. */

const randomInt = (max: number) => {
  // Rejection sampling for an unbiased value in [0, max).
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
};

const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export function randomId(prefix: string, bytes = 9) {
  return `${prefix}_${base64url(crypto.getRandomValues(new Uint8Array(bytes)))}`;
}

/** Unambiguous uppercase code, e.g. tracking codes. */
export function randomCode(length: number) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

export const newQrToken = () => randomCode(10).toLowerCase();
export const newSessionToken = () => base64url(crypto.getRandomValues(new Uint8Array(32)));

/** Readable temporary password, e.g. "Cedar-7342-Moss". */
export function generateTempPassword() {
  const words = ['Amber', 'Cedar', 'Coral', 'Delta', 'Ember', 'Falcon', 'Harbor', 'Indigo', 'Juniper', 'Lotus', 'Maple', 'Nova', 'Orchid', 'Pine', 'Quartz', 'Raven', 'Sable', 'Tide', 'Willow', 'Zephyr'];
  const pick = () => words[randomInt(words.length)];
  return `${pick()}-${1000 + randomInt(9000)}-${pick()}`;
}

const ITERATIONS = 120_000;

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

/**
 * Passwords are never stored in plain text, even in this local demo.
 * Note: anything in the browser can be read by whoever uses that browser. Real security needs a backend (e.g. Supabase Auth).
 */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iter, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iter || !saltB64 || !hashB64) return false;
  const expected = fromB64(hashB64);
  const actual = await derive(password, fromB64(saltB64), Number(iter));
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export function passwordProblem(password: unknown): string | null {
  if (typeof password !== 'string' || !password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password must be at most 128 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain letters and numbers.';
  return null;
}
