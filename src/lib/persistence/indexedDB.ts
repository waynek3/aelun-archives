// Minimal IndexedDB helper without external deps
import { handleAsyncError } from '@/lib/utils/errorHandler'

export interface IDBOpenConfig {
  name: string;
  version: number;
  upgrade?: (db: IDBDatabase, oldVersion: number, newVersion: number | null) => void;
}

export interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoffMultiplier?: number
  context?: string
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

/**
 * Retry logic utility
 * Retries a function with exponential backoff on failure
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 100,
    backoffMultiplier = 2,
    context = 'Database Operation'
  } = options

  let lastError: Error | unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        handleAsyncError(error, context)
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1)

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError
}

/**
 * Wrapped versions of database operations with retry logic
 */

export async function putWithRetry<T>(
  db: IDBDatabase,
  store: string,
  value: T,
  key?: IDBValidKey,
  options?: RetryOptions
): Promise<void> {
  return retryOperation(
    () => put(db, store, value, key),
    { ...options, context: options?.context || `Put to ${store}` }
  )
}

export async function getWithRetry<T>(
  db: IDBDatabase,
  store: string,
  key: IDBValidKey,
  options?: RetryOptions
): Promise<T | undefined> {
  return retryOperation(
    () => get<T>(db, store, key),
    { ...options, context: options?.context || `Get from ${store}` }
  )
}

export async function getAllWithRetry<T>(
  db: IDBDatabase,
  store: string,
  options?: RetryOptions
): Promise<T[]> {
  return retryOperation(
    () => getAll<T>(db, store),
    { ...options, context: options?.context || `Get all from ${store}` }
  )
}

export async function delWithRetry(
  db: IDBDatabase,
  store: string,
  key: IDBValidKey,
  options?: RetryOptions
): Promise<void> {
  return retryOperation(
    () => del(db, store, key),
    { ...options, context: options?.context || `Delete from ${store}` }
  )
}

export async function clearWithRetry(
  db: IDBDatabase,
  store: string,
  options?: RetryOptions
): Promise<void> {
  return retryOperation(
    () => clear(db, store),
    { ...options, context: options?.context || `Clear ${store}` }
  )
}
