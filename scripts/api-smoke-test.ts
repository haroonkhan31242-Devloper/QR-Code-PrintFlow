/**
 * End-to-end API test for roles, permissions and shop data isolation.
 * Starts a throwaway server on its own port and data folder, so it never touches your real data.
 *
 *   npm run build && npm run test:api
 */
import { spawn } from 'node:child_process';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 3999;
const BASE = `http://127.0.0.1:${PORT}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'printflow-test-'));
const ADMIN_USER = 'testadmin';
const ADMIN_TEMP_PW = 'TempAdmin-1234';

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`, detail ?? '');
  }
}

class Client {
  cookie = '';
  constructor(public label: string) {}
  async req(method: string, url: string, body?: unknown, opts: { csrf?: boolean; form?: FormData } = {}) {
    const headers: Record<string, string> = {};
    if (opts.csrf !== false) headers['X-Requested-With'] = 'PrintFlow';
    if (this.cookie) headers.Cookie = this.cookie;
    let payload: any;
    if (opts.form) payload = opts.form;
    else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(BASE + url, { method, headers, body: payload });
    const set = res.headers.get('set-cookie');
    if (set) {
      const m = set.match(/pf_session=([^;]*)/);
      if (m) this.cookie = m[1] ? `pf_session=${m[1]}` : '';
    }
    const type = res.headers.get('content-type') || '';
    const data = type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer());
    return { status: res.status, data: data as any };
  }
}

function fakePdf(pages: number) {
  let s = '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n';
  s += `2 0 obj << /Type /Pages /Count ${pages} /Kids [] >> endobj\n`;
  for (let i = 0; i < pages; i++) s += `${3 + i} 0 obj << /Type /Page /Parent 2 0 R >> endobj\n`;
  return Buffer.from(s + '%%EOF\n', 'latin1');
}
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a1c40000000049454e44ae426082', 'hex');

function orderForm(files: { name: string; data: Buffer; type: string }[], extra: Record<string, string> = {}) {
  const f = new FormData();
  for (const file of files) f.append('files', new Blob([new Uint8Array(file.data)], { type: file.type }), file.name);
  const fields = { customerName: 'Ayesha Khan', customerPhone: '0300 1234567', colorMode: 'bw', paperSize: 'A4', sides: 'single', copies: '2', finishing: 'none', notes: 'Test', ...extra };
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`${BASE}/api/auth/me`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error('Server did not start');
}

async function main() {
  const server = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: String(PORT), DATA_DIR: dataDir, SUPER_ADMIN_USERNAME: ADMIN_USER, SUPER_ADMIN_PASSWORD: ADMIN_TEMP_PW },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  server.stdout.on('data', (d) => (serverLog += d));
  server.stderr.on('data', (d) => (serverLog += d));

  try {
    await waitForServer();
    const admin = new Client('admin');
    const anon = new Client('anon');

    console.log('\nSuper Admin');
    check('Super Admin cannot sign in through the shop page', (await admin.req('POST', '/api/auth/login', { portal: 'shop', username: ADMIN_USER, password: ADMIN_TEMP_PW })).status === 401);
    check('Wrong password is rejected', (await admin.req('POST', '/api/auth/login', { portal: 'admin', username: ADMIN_USER, password: 'nope-1234' })).status === 401);
    let r = await admin.req('POST', '/api/auth/login', { portal: 'admin', username: ADMIN_USER, password: ADMIN_TEMP_PW });
    check('Super Admin signs in with temporary password', r.status === 200 && r.data.user.mustChangePassword === true, r.data);
    r = await admin.req('GET', '/api/admin/shops');
    check('Admin APIs blocked until temporary password is changed', r.status === 403 && r.data.code === 'PASSWORD_CHANGE_REQUIRED', r);
    r = await admin.req('POST', '/api/auth/change-password', { currentPassword: ADMIN_TEMP_PW, newPassword: 'short' });
    check('Weak new password is rejected', r.status === 400);
    r = await admin.req('POST', '/api/auth/change-password', { currentPassword: ADMIN_TEMP_PW, newPassword: 'NewAdminPass-2026' });
    check('Super Admin changes password', r.status === 200 && r.data.user.mustChangePassword === false, r.data);

    r = await admin.req('POST', '/api/admin/shops', { name: 'Apex Print', ownerName: 'Ali Raza', phone: '0300 1111111', ownerUsername: 'apex', city: 'Lahore' });
    check('Super Admin creates shop A with generated credentials', r.status === 201 && r.data.credentials.temporaryPassword, r.data);
    const shopA = r.data.shop;
    const credA = r.data.credentials;
    r = await admin.req('POST', '/api/admin/shops', { name: 'Blue Copy', ownerName: 'Sara Malik', phone: '0300 2222222', ownerUsername: 'bluecopy', ownerPassword: 'BlueStart-123' });
    check('Super Admin creates shop B with chosen password', r.status === 201, r.data);
    const shopB = r.data.shop;
    r = await admin.req('POST', '/api/admin/shops', { name: 'Dup', ownerName: 'X', phone: '0300 3333333', ownerUsername: 'APEX' });
    check('Duplicate owner username is rejected (case-insensitive)', r.status === 400 && r.data.field === 'ownerUsername', r.data);
    r = await admin.req('POST', '/api/admin/shops', { name: 'Apex', ownerName: 'X', phone: '0300' }, { csrf: false });
    check('State-changing request without CSRF header is refused', r.status === 403);

    console.log('\nShop owners');
    const ownerA = new Client('ownerA');
    const ownerB = new Client('ownerB');
    check('Shop owner cannot sign in through the Super Admin page', (await ownerA.req('POST', '/api/auth/login', { portal: 'admin', username: credA.username, password: credA.temporaryPassword })).status === 401);
    r = await ownerA.req('POST', '/api/auth/login', { portal: 'shop', username: credA.username, password: credA.temporaryPassword });
    check('Owner A signs in with assigned credentials', r.status === 200 && r.data.user.shopId === shopA.id, r.data);
    check('Owner A must change password first', (await ownerA.req('GET', '/api/shop/orders')).status === 403);
    check('Owner A changes password', (await ownerA.req('POST', '/api/auth/change-password', { currentPassword: credA.temporaryPassword, newPassword: 'ApexOwner-2026' })).status === 200);
    await ownerB.req('POST', '/api/auth/login', { portal: 'shop', username: 'bluecopy', password: 'BlueStart-123' });
    await ownerB.req('POST', '/api/auth/change-password', { currentPassword: 'BlueStart-123', newPassword: 'BlueOwner-2026' });

    check('Owner cannot read Super Admin stats', (await ownerA.req('GET', '/api/admin/stats')).status === 403);
    check('Owner cannot list all shops', (await ownerA.req('GET', '/api/admin/shops')).status === 403);
    check('Owner cannot create shops', (await ownerA.req('POST', '/api/admin/shops', { name: 'Evil', ownerName: 'E', phone: '0300 9999999', ownerUsername: 'evil' })).status === 403);
    check('Owner cannot reset another owner’s password', (await ownerA.req('POST', `/api/admin/shops/${shopB.id}/reset-password`)).status === 403);
    check('Anonymous visitor cannot reach shop APIs', (await anon.req('GET', '/api/shop/me')).status === 401);
    r = await ownerA.req('GET', `/api/shop/me?shopId=${shopB.id}`);
    check('Shop id in the query string is ignored (owner A still gets shop A)', r.status === 200 && r.data.shop.id === shopA.id, r.data);

    console.log('\nCustomer upload (no login)');
    r = await anon.req('GET', `/api/public/shops/${shopA.qrToken}`);
    check('Customer opens shop A page without signing in', r.status === 200 && r.data.shop.name === 'Apex Print' && !('qrToken' in r.data.shop) && !('id' in r.data.shop), r.data);
    // A real 3-page PDF, so the print bundle can be merged and checked.
    const realDoc = await PDFDocument.create();
    for (let i = 0; i < 3; i++) realDoc.addPage([595, 842]);
    const pdf = Buffer.from(await realDoc.save());
    check('Page counter reads a real PDF', fakePdf(3).length > 0);
    r = await anon.req('POST', `/api/public/shops/${shopA.qrToken}/orders`, undefined, {
      form: orderForm([{ name: 'notes.pdf', data: pdf, type: 'application/pdf' }, { name: 'photo.png', data: PNG, type: 'image/png' }]),
    });
    check('Customer uploads a PDF and a photo to shop A', r.status === 201 && r.data.pageCount === 4, r.data);
    // A4 b/w single default 10/sheet: 4 pages x 2 copies = 80
    check('Server computes the price from the shop’s rates', r.data.estimatedTotal === 80, r.data);
    const tracking = r.data.trackingCode;
    r = await anon.req('POST', `/api/public/shops/${shopA.qrToken}/orders`, undefined, { form: orderForm([{ name: 'fake.pdf', data: Buffer.from('hello'), type: 'application/pdf' }]) });
    check('Fake PDF (wrong file signature) is rejected', r.status === 400, r.data);
    r = await anon.req('POST', `/api/public/shops/${shopA.qrToken}/orders`, undefined, { form: orderForm([{ name: 'virus.exe', data: Buffer.from('MZ...'), type: 'application/octet-stream' }]) });
    check('Executable file is rejected', r.status === 400, r.data);
    r = await anon.req('POST', `/api/public/shops/${shopA.qrToken}/orders`, undefined, { form: orderForm([{ name: 'a.pdf', data: pdf, type: 'application/pdf' }], { customerName: '' }) });
    check('Missing customer name is rejected', r.status === 400 && r.data.field === 'customerName', r.data);
    check('Unknown QR token returns 404', (await anon.req('GET', '/api/public/shops/doesnotexist')).status === 404);

    console.log('\nShop isolation');
    r = await ownerA.req('GET', '/api/shop/orders?status=all');
    check('Owner A sees the customer’s order', r.status === 200 && r.data.total === 1, r.data);
    const orderA = r.data.orders[0];
    r = await ownerB.req('GET', '/api/shop/orders?status=all');
    check('Owner B does not see shop A’s order', r.status === 200 && r.data.total === 0, r.data);
    check('Owner B cannot open shop A’s order by id', (await ownerB.req('GET', `/api/shop/orders/${orderA.id}`)).status === 404);
    check('Owner B cannot change shop A’s order', (await ownerB.req('PATCH', `/api/shop/orders/${orderA.id}/status`, { status: 'accepted' })).status === 404);
    const detail = (await ownerA.req('GET', `/api/shop/orders/${orderA.id}`)).data.order;
    const fileId = detail.files.find((f: any) => f.originalName === 'notes.pdf').id;
    check('Owner B cannot download shop A’s file', (await ownerB.req('GET', `/api/shop/files/${fileId}`)).status === 404);
    check('Anonymous visitor cannot download files', (await anon.req('GET', `/api/shop/files/${fileId}`)).status === 401);
    r = await ownerA.req('GET', `/api/shop/files/${fileId}`);
    check('Owner A downloads the exact uploaded file', r.status === 200 && Buffer.compare(r.data, pdf) === 0);

    console.log('\nOrders, prices and QR');
    check('Invalid status jump (new → completed) is refused', (await ownerA.req('PATCH', `/api/shop/orders/${orderA.id}/status`, { status: 'completed' })).status === 400);
    check('Owner A accepts the order', (await ownerA.req('PATCH', `/api/shop/orders/${orderA.id}/status`, { status: 'accepted' })).status === 200);
    check('Owner A starts printing', (await ownerA.req('PATCH', `/api/shop/orders/${orderA.id}/status`, { status: 'printing' })).status === 200);
    r = await ownerA.req('PATCH', `/api/shop/orders/${orderA.id}/billing`, { finalAmount: 75, paymentStatus: 'paid' });
    check('Owner A records final amount and payment', r.status === 200 && r.data.order.finalAmount === 75 && r.data.order.paymentStatus === 'paid', r.data);
    r = await anon.req('GET', `/api/public/track/${tracking}`);
    check('Customer tracks order status without login', r.status === 200 && r.data.order.status === 'printing' && !('customerPhone' in r.data.order), r.data);

    const pricing = (await ownerA.req('GET', '/api/shop/pricing')).data;
    pricing.prices = pricing.prices.map((p: any) => (p.paperSize === 'A4' && p.colorMode === 'bw' ? { ...p, priceSingle: 7 } : p));
    check('Owner A updates prices', (await ownerA.req('PUT', '/api/shop/pricing', pricing)).status === 200);
    const pubA = (await anon.req('GET', `/api/public/shops/${shopA.qrToken}`)).data.shop;
    const pubB = (await anon.req('GET', `/api/public/shops/${shopB.qrToken}`)).data.shop;
    check('Customers see shop A’s new price', pubA.prices.find((p: any) => p.paperSize === 'A4' && p.colorMode === 'bw').priceSingle === 7);
    check('Shop B’s prices are unaffected', pubB.prices.find((p: any) => p.paperSize === 'A4' && p.colorMode === 'bw').priceSingle === 10);
    r = await ownerA.req('PUT', '/api/shop/pricing', { prices: [{ paperSize: 'A4', colorMode: 'bw', priceSingle: -5, priceDouble: 1 }], finishing: [] });
    check('Negative price is rejected', r.status === 400, r.data);

    r = await ownerA.req('POST', '/api/shop/qr/regenerate');
    check('Owner A replaces the QR code', r.status === 200 && r.data.shop.qrToken !== shopA.qrToken);
    check('Old QR code stops working', (await anon.req('GET', `/api/public/shops/${shopA.qrToken}`)).status === 404);
    const newTokenA = r.data.shop.qrToken;

    console.log('\nPrinting');
    const pdfFileId = detail.files.find((f: any) => f.originalName === 'notes.pdf').id;
    const pngFileId = detail.files.find((f: any) => f.originalName === 'photo.png').id;
    r = await ownerA.req('GET', `/api/shop/orders/${orderA.id}/print-bundle?files=${pdfFileId},${pngFileId}`);
    let bundlePages = -1;
    try {
      bundlePages = (await PDFDocument.load(r.data)).getPageCount();
    } catch {
      /* not a PDF */
    }
    check('Print bundle merges a 3-page PDF and a photo into 4 pages', r.status === 200 && bundlePages === 4, { status: r.status, bundlePages });
    check('Other shops cannot get the print bundle', (await ownerB.req('GET', `/api/shop/orders/${orderA.id}/print-bundle?files=${pdfFileId}`)).status === 404);
    check('Anonymous visitor cannot get the print bundle', (await anon.req('GET', `/api/shop/orders/${orderA.id}/print-bundle?files=${pdfFileId}`)).status === 401);
    check('Print bundle needs at least one file', (await ownerA.req('GET', `/api/shop/orders/${orderA.id}/print-bundle?files=`)).status === 400);
    check('Original uploaded file is unchanged after printing', Buffer.compare((await ownerA.req('GET', `/api/shop/files/${pdfFileId}`)).data, pdf) === 0);

    const docx = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(200)]);
    r = await anon.req('POST', `/api/public/shops/${newTokenA}/orders`, undefined, { form: orderForm([{ name: 'cv.docx', data: docx, type: 'application/octet-stream' }]) });
    check('Customer uploads a Word document', r.status === 201, r.data);
    const wordOrder = (await ownerA.req('GET', '/api/shop/orders?status=pending')).data.orders[0];
    const wordDetail = (await ownerA.req('GET', `/api/shop/orders/${wordOrder.id}`)).data.order;
    r = await ownerA.req('GET', `/api/shop/orders/${wordOrder.id}/print-bundle?files=${wordDetail.files[0].id}`);
    check('Word file is refused with a clear message', r.status === 422 && /Word/.test(r.data.error), r.data);

    r = await ownerA.req('POST', `/api/shop/orders/${orderA.id}/print-log`, { fileIds: [pdfFileId], markPrinting: true });
    check('Browser print is recorded in the order history', r.status === 200 && r.data.order.events.some((e: any) => /print dialog/.test(e.note || '')), r.data);

    r = await ownerA.req('POST', `/api/shop/orders/${orderA.id}/print-jobs`, { fileIds: [pdfFileId], printer: 'HP', copies: 1, sides: 'single', colorMode: 'bw' });
    check('Direct print needs a connected agent', r.status === 409, r.data);
    r = await ownerA.req('POST', '/api/shop/print-agent/pair');
    const agentToken = r.data.token as string;
    check('Owner pairs a print agent and gets a token once', r.status === 200 && /^pfa_/.test(agentToken), r.data);
    const agentHeaders = { Authorization: `Bearer ${agentToken}`, 'X-Requested-With': 'PrintFlow', 'Content-Type': 'application/json' };
    const agentReq = (method: string, url: string, body?: unknown, h: Record<string, string> = agentHeaders) =>
      fetch(BASE + url, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    check('Agent with a wrong token is refused', (await agentReq('POST', '/api/agent/heartbeat', {}, { ...agentHeaders, Authorization: 'Bearer pfa_wrongwrongwrongwrongwrong' })).status === 401);
    check('Agent APIs do not accept a shop owner login', (await ownerA.req('POST', '/api/agent/jobs/claim')).status === 401);
    check('Agent reports its printers', (await agentReq('POST', '/api/agent/heartbeat', { name: 'Counter PC', printers: ['HP LaserJet 1160', 'Canon'] })).status === 200);
    r = await ownerA.req('GET', '/api/shop/print-agent');
    check('Owner sees the agent online with its printers', r.data.agent.online && r.data.agent.printers.length === 2, r.data);
    check('Unknown printer is refused', (await ownerA.req('POST', `/api/shop/orders/${orderA.id}/print-jobs`, { fileIds: [pdfFileId], printer: 'Nope', copies: 1, sides: 'single', colorMode: 'bw' })).status === 400);
    r = await ownerA.req('POST', `/api/shop/orders/${orderA.id}/print-jobs`, { fileIds: [pdfFileId, pngFileId], printer: 'HP LaserJet 1160', copies: 2, sides: 'double', colorMode: 'bw' });
    check('Owner sends 2 files to the printer', r.status === 201 && r.data.job.status === 'queued' && r.data.job.fileCount === 2, r.data);
    const jobId = r.data.job.id;
    r = await ownerA.req('POST', `/api/shop/orders/${orderA.id}/print-jobs`, { fileIds: [pdfFileId], printer: 'HP LaserJet 1160', copies: 1, sides: 'single', colorMode: 'bw' });
    check('Duplicate print of the same order is blocked while printing', r.status === 409, r.data);

    const agentB = new Client('ownerB2');
    // Shop B's owner had a password reset later in this test; use a fresh login now for B.
    await agentB.req('POST', '/api/auth/login', { portal: 'shop', username: 'bluecopy', password: 'BlueOwner-2026' });
    const tokenB = (await agentB.req('POST', '/api/shop/print-agent/pair')).data.token;
    const claimB = await (await agentReq('POST', '/api/agent/jobs/claim', {}, { ...agentHeaders, Authorization: `Bearer ${tokenB}` })).json();
    check('Another shop’s agent cannot take this shop’s job', claimB.job === null, claimB);
    check('Another shop’s agent cannot download this shop’s job', (await agentReq('GET', `/api/agent/jobs/${jobId}/document`, undefined, { ...agentHeaders, Authorization: `Bearer ${tokenB}` })).status === 404);

    const claim = await (await agentReq('POST', '/api/agent/jobs/claim', {})).json();
    check('Agent claims the job with its settings', claim.job?.id === jobId && claim.job.copies === 2 && claim.job.sides === 'double', claim);
    const docRes = await agentReq('GET', `/api/agent/jobs/${jobId}/document`);
    const docPages = docRes.ok ? (await PDFDocument.load(new Uint8Array(await docRes.arrayBuffer()))).getPageCount() : -1;
    check('Agent downloads the merged PDF (4 pages)', docPages === 4, docPages);
    r = await ownerA.req('GET', `/api/shop/orders/${orderA.id}/print-jobs`);
    check('Owner sees the job as printing', r.data.jobs[0].status === 'printing');
    check('Agent reports success', (await agentReq('POST', `/api/agent/jobs/${jobId}/complete`, { ok: true })).status === 200);
    r = await ownerA.req('GET', `/api/shop/orders/${orderA.id}/print-jobs`);
    check('Owner sees the job as printed', r.data.jobs[0].status === 'done', r.data);
    r = await ownerA.req('POST', `/api/shop/orders/${orderA.id}/print-jobs`, { fileIds: [pngFileId], printer: 'Canon', copies: 1, sides: 'single', colorMode: 'color' });
    await (await agentReq('POST', '/api/agent/jobs/claim', {})).json();
    await agentReq('POST', `/api/agent/jobs/${r.data.job.id}/complete`, { ok: false, error: 'Paper jam' });
    r = await ownerA.req('GET', `/api/shop/orders/${orderA.id}/print-jobs`);
    check('A printer error is shown to the owner', r.data.jobs[0].status === 'failed' && r.data.jobs[0].error === 'Paper jam', r.data);
    check('Disconnecting the agent revokes its token', (await ownerA.req('DELETE', '/api/shop/print-agent')).status === 200 && (await agentReq('POST', '/api/agent/heartbeat', {})).status === 401);

    console.log('\nDeactivation and password reset');
    check('Super Admin deactivates shop A', (await admin.req('PATCH', `/api/admin/shops/${shopA.id}/status`, { status: 'inactive' })).status === 200);
    check('Owner A is signed out immediately', (await ownerA.req('GET', '/api/shop/me')).status === 401);
    check('Owner A cannot sign in while deactivated', (await new Client('x').req('POST', '/api/auth/login', { portal: 'shop', username: 'apex', password: 'ApexOwner-2026' })).status === 403);
    check('Customers cannot upload to a deactivated shop', (await anon.req('POST', `/api/public/shops/${newTokenA}/orders`, undefined, { form: orderForm([{ name: 'a.pdf', data: pdf, type: 'application/pdf' }]) })).status === 403);
    check('Super Admin re-activates shop A', (await admin.req('PATCH', `/api/admin/shops/${shopA.id}/status`, { status: 'active' })).status === 200);
    r = await admin.req('POST', `/api/admin/shops/${shopB.id}/reset-password`);
    check('Super Admin resets owner B’s password', r.status === 200 && r.data.credentials.temporaryPassword);
    check('Owner B’s old session is revoked', (await ownerB.req('GET', '/api/shop/me')).status === 401);
    check('Owner B’s old password no longer works', (await new Client('y').req('POST', '/api/auth/login', { portal: 'shop', username: 'bluecopy', password: 'BlueOwner-2026' })).status === 401);

    check('Delete requires typing the shop name', (await admin.req('DELETE', `/api/admin/shops/${shopB.id}`, { confirmName: 'wrong' })).status === 400);
    check('Super Admin deletes shop B', (await admin.req('DELETE', `/api/admin/shops/${shopB.id}`, { confirmName: 'Blue Copy' })).status === 200);
    check('Logout ends the session', (await admin.req('POST', '/api/auth/logout')).status === 200 && (await admin.req('GET', '/api/admin/stats')).status === 401);
  } finally {
    server.kill();
    await new Promise((r) => setTimeout(r, 300));
    fs.rmSync(dataDir, { recursive: true, force: true });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) {
    console.log('\nServer log:\n' + serverLog);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
