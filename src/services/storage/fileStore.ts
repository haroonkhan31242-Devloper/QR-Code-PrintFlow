import { ServiceError } from '../errors';

/**
 * Uploaded file contents, stored as Blobs in IndexedDB (localStorage is too small for documents).
 * Keys are the order-file ids from the localStorage database.
 * A Supabase version would use a Storage bucket with the same keys.
 */

const DB_NAME = 'printflow-files';
const STORE = 'files';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new ServiceError(503, 'This browser cannot store files (IndexedDB is unavailable).'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new ServiceError(503, 'Could not open file storage in this browser.'));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        let result: T | undefined;
        if (req) req.onsuccess = () => (result = req.result);
        tx.oncomplete = () => resolve(result);
        tx.onabort = tx.onerror = () => {
          const name = tx.error?.name;
          reject(
            new ServiceError(
              507,
              name === 'QuotaExceededError' ? 'Browser storage is full. Delete files of old orders and try again.' : 'Could not save the file in this browser.',
            ),
          );
        };
      }),
  );
}

export async function putFile(id: string, blob: Blob): Promise<void> {
  await run('readwrite', (s) => s.put(blob, id));
}

export async function getFile(id: string): Promise<Blob | null> {
  const blob = await run<Blob>('readonly', (s) => s.get(id));
  return blob ?? null;
}

export async function deleteFiles(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await run('readwrite', (s) => {
    for (const id of ids) s.delete(id);
  });
}

export async function clearFiles(): Promise<void> {
  await run('readwrite', (s) => s.clear());
}
