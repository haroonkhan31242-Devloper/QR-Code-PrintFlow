/** Small input validation helpers. Throwing ValidationError produces a 400 response. */

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function text(
  body: any,
  field: string,
  opts: { label: string; required?: boolean; max?: number; min?: number; multiline?: boolean },
): string {
  const raw = body?.[field];
  if (raw === undefined || raw === null || raw === '') {
    if (opts.required) throw new ValidationError(`${opts.label} is required.`, field);
    return '';
  }
  if (typeof raw !== 'string') throw new ValidationError(`${opts.label} must be text.`, field);
  let value = raw.replace(CONTROL_CHARS, '');
  if (!opts.multiline) value = value.replace(/[\r\n\t]+/g, ' ');
  value = value.trim();
  if (opts.required && !value) throw new ValidationError(`${opts.label} is required.`, field);
  if (opts.min && value.length < opts.min) throw new ValidationError(`${opts.label} must be at least ${opts.min} characters.`, field);
  const max = opts.max ?? 200;
  if (value.length > max) throw new ValidationError(`${opts.label} must be at most ${max} characters.`, field);
  return value;
}

export function oneOf<T extends string>(body: any, field: string, allowed: readonly T[], label: string, fallback?: T): T {
  const raw = body?.[field];
  if ((raw === undefined || raw === '') && fallback !== undefined) return fallback;
  if (typeof raw !== 'string' || !allowed.includes(raw as T)) {
    throw new ValidationError(`${label} is not valid.`, field);
  }
  return raw as T;
}

export function int(body: any, field: string, opts: { label: string; min: number; max: number; fallback?: number }): number {
  const raw = body?.[field];
  if ((raw === undefined || raw === '') && opts.fallback !== undefined) return opts.fallback;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(n) || n < opts.min || n > opts.max) {
    throw new ValidationError(`${opts.label} must be a whole number between ${opts.min} and ${opts.max}.`, field);
  }
  return n;
}

export function money(raw: unknown, label: string): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw new ValidationError(`${label} must be a positive amount.`);
  return Math.round(n * 100) / 100;
}

export function username(body: any, field = 'username'): string {
  const value = text(body, field, { label: 'Username', required: true, max: 40, min: 3 }).toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(value)) {
    throw new ValidationError('Username may only use letters, numbers, dots, dashes and underscores.', field);
  }
  return value;
}

export function phone(body: any, field: string, label: string, required: boolean): string {
  const value = text(body, field, { label, required, max: 30 });
  if (value && !/^[+\d][\d\s()-]{5,}$/.test(value)) throw new ValidationError(`${label} is not a valid phone number.`, field);
  return value;
}

export function email(body: any, field: string, required: boolean): string {
  const value = text(body, field, { label: 'Email', required, max: 120 }).toLowerCase();
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new ValidationError('Email is not valid.', field);
  return value;
}
