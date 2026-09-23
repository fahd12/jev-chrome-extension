export type CacheStorage = {
  get(key: string): Promise<boolean | undefined>;
  set(key: string, value: boolean): Promise<void>;
};

export type VerdictCache = {
  get(hash: string): Promise<boolean | undefined>;
  set(hash: string, slop: boolean): Promise<void>;
};

const SESSION_PREFIX = 'slopCache:';

/** In-memory map in front of a best-effort persistent store. */
export function createVerdictCache(storage: CacheStorage): VerdictCache {
  const memory = new Map<string, boolean>();

  return {
    async get(hash) {
      if (memory.has(hash)) {
        return memory.get(hash);
      }
      try {
        const stored = await storage.get(hash);
        if (stored !== undefined) {
          memory.set(hash, stored);
        }
        return stored;
      } catch (error) {
        console.warn('Slop cache read failed', error);
        return undefined;
      }
    },
    async set(hash, slop) {
      memory.set(hash, slop);
      try {
        await storage.set(hash, slop);
      } catch (error) {
        console.warn('Slop cache write failed', error);
      }
    },
  };
}

export function chromeSessionStorage(): CacheStorage {
  return {
    async get(key) {
      const storageKey = `${SESSION_PREFIX}${key}`;
      const stored = await chrome.storage.session.get(storageKey);
      const value = stored[storageKey];
      return typeof value === 'boolean' ? value : undefined;
    },
    async set(key, value) {
      await chrome.storage.session.set({ [`${SESSION_PREFIX}${key}`]: value });
    },
  };
}
