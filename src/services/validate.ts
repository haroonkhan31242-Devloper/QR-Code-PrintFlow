import { invalid } from './errors';

/** Input checks shared by the services (the UI also validates, but the services never trust it). */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function text(
  raw: unknown,
  field: string,
  opts: { label: string; required?: boolean; max?: number; min?: number; multiline?: boolean },
): string {
  if (raw === undefined || raw === null || raw === '') {
    if (opts.required) throw invalid(`${opts.label} is required.`, field);
    return '';
  }
  if (typeof raw !== 'string') throw invalid(`${opts.label} must be text.`, field);
  let value = raw.replace(CONTROL_CHARS, '');
  if (!opts.multiline) value = value.replace(/[\r\n\t]+/g, ' ');
  value = value.trim();
  if (opts.required && !value) throw invalid(`${opts.label} is required.`, field);
  if (opts.min && value.length < opts.min) throw invalid(`${opts.label} must be at least ${opts.min} characters.`, field);
  const max = opts.max ?? 200;
  if (value.length > max) throw invalid(`${opts.label} must be at most ${max} characters.`, field);
  return value;
}

export function oneOf<T extends string>(raw: unknown, field: string, allowed: readonly T[], label: string, fallback?: T): T {
  if ((raw === undefined || raw === '') && fallback !== undefined) return fallback;
  if (typeof raw !== 'string' || !allowed.includes(raw as T)) throw invalid(`${label} is not valid.`, field);
  return raw as T;
}

export function int(raw: unknown, field: string, opts: { label: string; min: number; max: number }): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(n) || n < opts.min || n > opts.max) {
    throw invalid(`${opts.label} must be a whole number between ${opts.min} and ${opts.max}.`, field);
  }
  return n;
}

export function money(raw: unknown, label: string, field?: string): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw invalid(`${label} must be a positive amount.`, field);
  return Math.round(n * 100) / 100;
}

export function username(raw: unknown, field = 'username'): string {
  const value = text(raw, field, { label: 'Username', required: true, max: 40, min: 3 }).toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(value)) throw invalid('Username may only use letters, numbers, dots, dashes and underscores.', field);
  return value;
}

export function phone(raw: unknown, field: string, label: string, required: boolean): string {
  const value = text(raw, field, { label, required, max: 30 });
  if (value && !/^[+\d][\d\s()-]{5,}$/.test(value)) throw invalid(`${label} is not a valid phone number.`, field);
  return value;
}

export function email(raw: unknown, field: string, required: boolean): string {
  const value = text(raw, field, { label: 'Email', required, max: 120 }).toLowerCase();
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw invalid('Email is not valid.', field);
  return value;
}
