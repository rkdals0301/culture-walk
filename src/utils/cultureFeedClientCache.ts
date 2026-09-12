import type { FormattedCultureListItem } from '@/types/culture';

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 24;

export interface CultureFeedCacheValue {
  cultures: FormattedCultureListItem[];
  totalCount: number;
  freeCount: number;
  regionOptions: string[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface CultureFeedCacheEntry {
  expiresAt: number;
  value: CultureFeedCacheValue;
}

interface CreateCultureFeedClientCacheOptions {
  ttlMs?: number;
  maxEntries?: number;
  now?: () => number;
}

export const createCultureFeedClientCache = ({
  ttlMs = DEFAULT_TTL_MS,
  maxEntries = DEFAULT_MAX_ENTRIES,
  now = Date.now,
}: CreateCultureFeedClientCacheOptions = {}) => {
  const entries = new Map<string, CultureFeedCacheEntry>();

  const read = (key: string) => {
    const entry = entries.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= now()) {
      entries.delete(key);
      return null;
    }

    entries.delete(key);
    entries.set(key, entry);
    return entry.value;
  };

  const write = (key: string, value: CultureFeedCacheValue) => {
    entries.delete(key);
    entries.set(key, {
      expiresAt: now() + ttlMs,
      value,
    });

    while (entries.size > maxEntries) {
      const oldestKey = entries.keys().next().value;
      if (oldestKey === undefined) break;
      entries.delete(oldestKey);
    }
  };

  const invalidate = (key: string) => {
    entries.delete(key);
  };

  return { invalidate, read, write };
};

export const cultureFeedClientCache = createCultureFeedClientCache();
