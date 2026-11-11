import { countPdfPages } from '../shared/pricing';
import { invalid } from './errors';

/** Checks an uploaded file's extension AND its first bytes (so a renamed file is rejected), and counts its pages. */

interface FileKind {
  ext: string;
  mime: string;
  matches: (head: Uint8Array) => boolean;
}

const startsWith = (head: Uint8Array, sig: number[]) => sig.every((b, i) => head[i] === b);

const KINDS: FileKind[] = [
  { ext: 'pdf', mime: 'application/pdf', matches: (h) => new TextDecoder('latin1').decode(h).includes('%PDF-') },
  { ext: 'png', mime: 'image/png', matches: (h) => startsWith(h, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { ext: 'jpg', mime: 'image/jpeg', matches: (h) => startsWith(h, [0xff, 0xd8, 0xff]) },
  { ext: 'jpeg', mime: 'image/jpeg', matches: (h) => startsWith(h, [0xff, 0xd8, 0xff]) },
  { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', matches: (h) => startsWith(h, [0x50, 0x4b, 0x03, 0x04]) },
  { ext: 'doc', mime: 'application/msword', matches: (h) => startsWith(h, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) },
];

export interface CheckedFile {
  file: File;
  originalName: string;
  mime: string;
  size: number;
  pages: number;
}

export function sanitizeFileName(name: string) {
  return name.replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, '_').slice(0, 150) || 'document';
}

export async function inspectUpload(file: File): Promise<CheckedFile> {
  const originalName = sanitizeFileName(file.name);
  const ext = originalName.split('.').pop()?.toLowerCase() ?? '';
  const kind = KINDS.find((k) => k.ext === ext);
  if (!kind) throw invalid(`"${originalName}" is not a supported file type. Use PDF, Word or JPG/PNG.`);
  if (file.size === 0) throw invalid(`"${originalName}" is empty.`);
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  if (!kind.matches(head)) throw invalid(`"${originalName}" does not look like a real .${ext} file.`);

  let pages = 1;
  try {
    if (kind.ext === 'pdf') pages = await pdfPageCount(file);
    else if (kind.ext === 'docx') pages = (await docxPageCount(file)) ?? 1;
  } catch {
    pages = 1;
  }
  return { file, originalName, mime: kind.mime, size: file.size, pages };
}

/** Accurate count via pdf-lib; falls back to a byte scan for damaged or encrypted files. */
export async function pdfPageCount(file: Blob): Promise<number> {
  const buf = await file.arrayBuffer();
  try {
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
    return Math.max(1, doc.getPageCount());
  } catch {
    return countPdfPages(new TextDecoder('latin1').decode(buf));
  }
}

/** Reads <Pages> from docProps/app.xml inside a .docx (a zip file). Returns null if unavailable. */
export async function docxPageCount(file: Blob): Promise<number | null> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(buf.buffer);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const entries = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);
  for (let i = 0; i < entries && ptr + 46 <= buf.length; i++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) return null;
    const method = view.getUint16(ptr + 10, true);
    const compSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOffset = view.getUint32(ptr + 42, true);
    const name = new TextDecoder().decode(buf.subarray(ptr + 46, ptr + 46 + nameLen));
    if (name === 'docProps/app.xml') {
      const start = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
      const raw = buf.slice(start, start + compSize);
      let xml: string;
      if (method === 8) {
        if (typeof DecompressionStream === 'undefined') return null;
        const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        xml = await new Response(stream).text();
      } else {
        xml = new TextDecoder().decode(raw);
      }
      const m = xml.match(/<Pages>(\d+)<\/Pages>/);
      return m ? Math.max(1, Math.min(5000, Number(m[1]))) : null;
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}
