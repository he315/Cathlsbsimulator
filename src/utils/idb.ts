// ---------------------------------------------------------------------------
// A small IndexedDB wrapper for local, per-browser persistence (procedure
// recordings, mentor notes, expert benchmarks). Every call is wrapped in
// try/catch: in a private window, with blocked site data, in Node tests or in
// a thumbnail capture IndexedDB may be missing or may throw, and the app must
// keep working. In that case the wrapper falls back to an in-memory map for the
// lifetime of the page, so callers never see an exception.
//
// Values must be structured-cloneable (plain objects, arrays, typed arrays).
// ---------------------------------------------------------------------------

export interface IdbStore<T> {
  get(key: string): Promise<T | undefined>;
  put(key: string, value: T): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  getAll(): Promise<{ key: string; value: T }[]>;
  clear(): Promise<boolean>;
  /** true when the store is backed by IndexedDB, false when it fell back to memory */
  persistent(): Promise<boolean>;
}

const DB_NAME = "cathmaster";
/** Object stores the app knows about. Adding one needs a version bump. */
export const IDB_STORES = ["recordings", "recording-index", "mentor-notes", "benchmarks", "skill-ledger"] as const;
export type IdbStoreName = (typeof IDB_STORES)[number];
/** v2 added "recording-index" (small per-recording summaries, so listing and trimming never load full records). */
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memory = new Map<string, Map<string, unknown>>();

function memStore(name: string): Map<string, unknown> {
  let m = memory.get(name);
  if (!m) {
    m = new Map();
    memory.set(name, m);
  }
  return m;
}

function idbFactory(): IDBFactory | null {
  try {
    const g = globalThis as unknown as { indexedDB?: IDBFactory };
    return g.indexedDB ?? null;
  } catch {
    return null;
  }
}

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    const f = idbFactory();
    if (!f) return resolve(null);
    try {
      const req = f.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        try {
          const db = req.result;
          for (const s of IDB_STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
        } catch {
          /* fall through to onerror */
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function wrap<R>(req: IDBRequest<R>): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<R>(name: IdbStoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<R>): Promise<{ ok: true; v: R } | { ok: false }> {
  const db = await openDb();
  if (!db) return { ok: false };
  try {
    const tx = db.transaction(name, mode);
    const v = await wrap(fn(tx.objectStore(name)));
    return { ok: true, v };
  } catch {
    return { ok: false };
  }
}

/** A typed key-value store. Falls back to memory when IndexedDB is unavailable. */
export function idbStore<T>(name: IdbStoreName): IdbStore<T> {
  const mem = () => memStore(name) as Map<string, T>;
  return {
    async get(key) {
      const r = await withStore<T | undefined>(name, "readonly", (s) => s.get(key) as IDBRequest<T | undefined>);
      return r.ok ? r.v : mem().get(key);
    },
    async put(key, value) {
      const r = await withStore(name, "readwrite", (s) => s.put(value as unknown, key));
      if (!r.ok) mem().set(key, value);
      return r.ok;
    },
    async delete(key) {
      const r = await withStore(name, "readwrite", (s) => s.delete(key));
      mem().delete(key);
      return r.ok;
    },
    async keys() {
      const r = await withStore<IDBValidKey[]>(name, "readonly", (s) => s.getAllKeys());
      return r.ok ? r.v.map(String) : [...mem().keys()];
    },
    async getAll() {
      // one transaction, two bulk requests (keys and values come back in the same key order)
      const db = await openDb();
      if (db) {
        try {
          const tx = db.transaction(name, "readonly");
          const st = tx.objectStore(name);
          const [ks, vs] = await Promise.all([wrap(st.getAllKeys()), wrap(st.getAll() as IDBRequest<T[]>)]);
          return ks.map((k, i) => ({ key: String(k), value: vs[i] }));
        } catch {
          /* fall back to memory below */
        }
      }
      return [...mem().entries()].map(([key, value]) => ({ key, value }));
    },
    async clear() {
      const r = await withStore(name, "readwrite", (s) => s.clear());
      mem().clear();
      return r.ok;
    },
    async persistent() {
      return (await openDb()) !== null;
    },
  };
}

/**
 * Keep only the newest `max` entries of a store, ordered by `stamp(value)`
 * (larger = newer). Returns the keys removed.
 */
export async function trimStore<T>(store: IdbStore<T>, max: number, stamp: (v: T) => number): Promise<string[]> {
  try {
    const all = await store.getAll();
    if (all.length <= max) return [];
    all.sort((a, b) => stamp(b.value) - stamp(a.value));
    const drop = all.slice(max).map((x) => x.key);
    for (const k of drop) await store.delete(k);
    return drop;
  } catch {
    return [];
  }
}

/** Test hook: forget the cached connection and the memory fallback. */
export function __resetIdbForTests(): void {
  dbPromise = null;
  memory.clear();
}
