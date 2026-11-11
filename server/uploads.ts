import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import { config } from './config';
import { countPdfPages } from '../shared/pricing';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES } from '../shared/types';

const tmpDir = path.join(config.uploadDir, '_incoming');
fs.mkdirSync(tmpDir, { recursive: true });

export const uploadMiddleware = multer({
  storage: multer.diskStorage({
    destination: tmpDir,
    filename: (_req, _file, cb) => cb(null, crypto.randomBytes(16).toString('hex')),
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: MAX_UPLOAD_FILES, fields: 20, fieldSize: 4 * 1024, parts: 40 },
}).array('files', MAX_UPLOAD_FILES);

interface FileKind {
  ext: string;
  mime: string;
  matches: (head: Buffer) => boolean;
}

const KINDS: FileKind[] = [
  { ext: 'pdf', mime: 'application/pdf', matches: (h) => h.subarray(0, 1024).includes('%PDF-') },
  { ext: 'png', mime: 'image/png', matches: (h) => h.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'jpg', mime: 'image/jpeg', matches: (h) => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff },
  { ext: 'jpeg', mime: 'image/jpeg', matches: (h) => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff },
  {
    ext: 'docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    matches: (h) => h.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
  },
  { ext: 'doc', mime: 'application/msword', matches: (h) => h.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) },
];

export interface CheckedFile {
  tmpPath: string;
  originalName: string;
  ext: string;
  mime: string;
  size: number;
  pages: number;
}

export class UploadRejected extends Error {}

/** Accurate PDF page count via pdf-lib; falls back to a byte scan for damaged or encrypted files. */
async function pdfPageCount(filePath: string): Promise<number> {
  const bytes = fs.readFileSync(filePath);
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    return Math.max(1, doc.getPageCount());
  } catch {
    return countPdfPages(bytes.toString('latin1'));
  }
}

/** Checks extension AND file signature (magic bytes), and counts pages. */
export async function inspectUpload(file: Express.Multer.File): Promise<CheckedFile> {
  const originalName = sanitizeFileName(file.originalname);
  const ext = path.extname(originalName).slice(1).toLowerCase();
  const kind = KINDS.find((k) => k.ext === ext);
  if (!kind) throw new UploadRejected(`"${originalName}" is not a supported file type. Use PDF, Word or JPG/PNG.`);
  if (file.size === 0) throw new UploadRejected(`"${originalName}" is empty.`);

  const fd = fs.openSync(file.path, 'r');
  const head = Buffer.alloc(1024);
  fs.readSync(fd, head, 0, 1024, 0);
  fs.closeSync(fd);
  if (!kind.matches(head)) throw new UploadRejected(`"${originalName}" does not look like a real .${ext} file.`);

  let pages = 1;
  try {
    if (kind.ext === 'pdf') pages = await pdfPageCount(file.path);
    else if (kind.ext === 'docx') pages = docxPageCount(file.path) ?? 1;
  } catch {
    pages = 1;
  }
  return { tmpPath: file.path, originalName, ext: kind.ext, mime: kind.mime, size: file.size, pages };
}

export function discardUploads(files: Express.Multer.File[] | undefined) {
  for (const f of files ?? []) fs.rm(f.path, { force: true }, () => {});
}

export function moveIntoShopFolder(shopId: string, tmpPath: string, ext: string): string {
  const dir = path.join(config.uploadDir, shopId);
  fs.mkdirSync(dir, { recursive: true });
  const storedName = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
  fs.renameSync(tmpPath, path.join(dir, storedName));
  return storedName;
}

function sanitizeFileName(name: string): string {
  // multer decodes names as latin1; restore UTF-8 names from phones.
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  const base = path.basename(decoded.includes('�') ? name : decoded);
  return base.replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, '_').slice(0, 150) || 'document';
}

/** Reads <Pages> from docProps/app.xml inside a .docx (zip) file. Returns null if unavailable. */
function docxPageCount(filePath: string): number | null {
  const buf = fs.readFileSync(filePath);
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) return null;
  const entries = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < entries && ptr + 46 <= buf.length; i++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOffset = buf.readUInt32LE(ptr + 42);
    const name = buf.toString('utf8', ptr + 46, ptr + 46 + nameLen);
    if (name === 'docProps/app.xml') {
      const lNameLen = buf.readUInt16LE(localOffset + 26);
      const lExtraLen = buf.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + lNameLen + lExtraLen;
      const raw = buf.subarray(start, start + compSize);
      const xml = (method === 8 ? zlib.inflateRawSync(raw) : raw).toString('utf8');
      const m = xml.match(/<Pages>(\d+)<\/Pages>/);
      return m ? Math.max(1, Math.min(5000, Number(m[1]))) : null;
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}
