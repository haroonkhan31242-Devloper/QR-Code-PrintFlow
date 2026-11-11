import fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { db } from './db';
import { storedFilePath } from './repo';
import { HttpError } from './validate';
import type { PaperSize } from '../shared/types';

/** File types that can be merged into a print bundle (Word needs Word/LibreOffice and is downloaded instead). */
export const PRINTABLE_MIMES = ['application/pdf', 'image/png', 'image/jpeg'];
export const isPrintableMime = (mime: string) => PRINTABLE_MIMES.includes(mime);

const PAGE_SIZES: Record<PaperSize, [number, number]> = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  Legal: [612, 1008],
};

interface FileRow {
  id: string;
  original_name: string;
  stored_name: string | null;
  mime: string;
  shop_id: string;
}

/**
 * Loads the requested files of one order, scoped to the shop, and checks they can be printed.
 * Order of fileIds is kept, so the printout follows the owner's selection.
 */
export function loadPrintableFiles(shopId: string, orderId: string, fileIds: string[]): FileRow[] {
  if (!fileIds.length) throw new HttpError(400, 'Select at least one file to print.');
  if (fileIds.length > 50) throw new HttpError(400, 'Too many files selected.');
  const rows = db.prepare('SELECT id, original_name, stored_name, mime, shop_id FROM order_files WHERE order_id = ? AND shop_id = ?').all(orderId, shopId) as unknown as FileRow[];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: FileRow[] = [];
  for (const id of new Set(fileIds)) {
    const f = byId.get(id);
    if (!f) throw new HttpError(404, 'One of the selected files was not found in this order.');
    if (!f.stored_name) throw new HttpError(410, `"${f.original_name}" has been deleted and can’t be printed.`);
    if (!isPrintableMime(f.mime)) throw new HttpError(422, `"${f.original_name}" is a Word document. Download it and print it from Word.`);
    out.push(f);
  }
  return out;
}

/** Builds one PDF containing all selected documents and images, in order. Images are fitted to the paper size. */
export async function buildPrintBundle(files: FileRow[], paperSize: PaperSize): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  out.setTitle('PrintFlow print job');
  const [pw, ph] = PAGE_SIZES[paperSize] ?? PAGE_SIZES.A4;
  const margin = 18;

  for (const f of files) {
    const bytes = fs.readFileSync(storedFilePath(f.shop_id, f.stored_name!));
    if (f.mime === 'application/pdf') {
      let src: PDFDocument;
      try {
        src = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
      } catch (err: any) {
        const msg = String(err?.message || '');
        throw new HttpError(
          422,
          /encrypt/i.test(msg)
            ? `"${f.original_name}" is password protected. Download it and print it from a PDF reader.`
            : `"${f.original_name}" could not be read as a PDF. Download it and print it from a PDF reader.`,
        );
      }
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    } else {
      const img = f.mime === 'image/png' ? await out.embedPng(bytes) : await out.embedJpg(bytes);
      // Use landscape paper for wide images.
      const landscape = img.width > img.height;
      const [w, h] = landscape ? [ph, pw] : [pw, ph];
      const page = out.addPage([w, h]);
      const scale = Math.min((w - margin * 2) / img.width, (h - margin * 2) / img.height, 1e9);
      const dw = img.width * scale;
      const dh = img.height * scale;
      page.drawImage(img, { x: (w - dw) / 2, y: (h - dh) / 2, width: dw, height: dh });
    }
  }
  return out.save();
}

export function setPdfFrameHeaders(res: import('express').Response, filename: string, inline = true) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Cache-Control', 'private, no-store');
  // Allow framing by our own pages only (used for in-app preview and printing).
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${filename.replace(/[^\w.-]/g, '_')}"`);
}
