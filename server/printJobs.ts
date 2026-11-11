import crypto from 'node:crypto';
import { db, nowIso } from './db';
import type { PrintAgentStatus, PrintJob } from '../shared/types';

/** An agent counts as online if it checked in within this window. */
export const AGENT_ONLINE_MS = 30_000;
/** A job stuck in "printing" this long is marked failed (the agent probably closed). */
const STUCK_MS = 5 * 60_000;

export const hashAgentToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export function mapJob(r: any): PrintJob {
  return {
    id: r.id,
    orderId: r.order_id,
    fileCount: r.file_count,
    printer: r.printer,
    copies: r.copies,
    sides: r.sides,
    colorMode: r.color_mode,
    paperSize: r.paper_size,
    status: r.status,
    error: r.error,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function failStuckJobs(shopId: string) {
  const cutoff = new Date(Date.now() - STUCK_MS).toISOString();
  db.prepare(
    `UPDATE print_jobs SET status = 'failed', error = 'The print agent stopped responding.', updated_at = ?
      WHERE shop_id = ? AND status = 'printing' AND updated_at < ?`,
  ).run(nowIso(), shopId, cutoff);
}

export function agentStatus(shopId: string): PrintAgentStatus {
  const a = db.prepare('SELECT * FROM print_agents WHERE shop_id = ?').get(shopId) as any;
  if (!a) return { paired: false, online: false, name: '', printers: [], defaultPrinter: null, lastSeenAt: null };
  let printers: string[] = [];
  try {
    printers = JSON.parse(a.printers);
  } catch {
    printers = [];
  }
  const online = Boolean(a.last_seen_at && Date.now() - new Date(a.last_seen_at).getTime() < AGENT_ONLINE_MS);
  return { paired: true, online, name: a.name, printers, defaultPrinter: a.default_printer, lastSeenAt: a.last_seen_at };
}
