/** Minimal synchronous key-value storage interface.
 *  Implemented by localStorage on web and MMKV on native. */
export interface KVStorage {
  getString(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** Web/SSR-safe implementation backed by localStorage. */
export const webStorage: KVStorage = {
  getString(key) {
    if (typeof localStorage === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(key, value);
    } catch {
      /* quota / private mode */
    }
  },
  remove(key) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/** In-memory fallback (tests / SSR). */
export function memoryStorage(): KVStorage {
  const m = new Map<string, string>();
  return {
    getString: (k) => m.get(k) ?? null,
    set: (k, v) => void m.set(k, v),
    remove: (k) => void m.delete(k),
  };
}
