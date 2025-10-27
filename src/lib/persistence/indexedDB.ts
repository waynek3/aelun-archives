// Minimal IndexedDB helper without external deps

export interface IDBOpenConfig {
  name: string;
  version: number;
  upgrade?: (db: IDBDatabase, oldVersion: number, newVersion: number | null) => void;
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(config: IDBOpenConfig): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(config.name, config.version);

    request.onupgradeneeded = (ev) => {
      const db = request.result;
      const e = ev as IDBVersionChangeEvent;
      config.upgrade?.(db, e.oldVersion, db.version);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export function getStore(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode = 'readonly'
): IDBObjectStore {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

export async function put<T>(db: IDBDatabase, store: string, value: T, key?: IDBValidKey) {
  return new Promise<void>((resolve, reject) => {
    const os = getStore(db, store, 'readwrite');
    const req = key !== undefined ? os.put(value, key) : os.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function get<T>(db: IDBDatabase, store: string, key: IDBValidKey) {
  return new Promise<T | undefined>((resolve, reject) => {
    const os = getStore(db, store, 'readonly');
    const req = os.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function getAll<T>(db: IDBDatabase, store: string) {
  return new Promise<T[]>((resolve, reject) => {
    const os = getStore(db, store, 'readonly');
    const req = os.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function del(db: IDBDatabase, store: string, key: IDBValidKey) {
  return new Promise<void>((resolve, reject) => {
    const os = getStore(db, store, 'readwrite');
    const req = os.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clear(db: IDBDatabase, store: string) {
  return new Promise<void>((resolve, reject) => {
    const os = getStore(db, store, 'readwrite');
    const req = os.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
