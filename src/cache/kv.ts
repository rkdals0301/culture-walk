import { getWorkerEnv } from '@/server/cloudflare';
import { Culture, CultureListItem } from '@/types/culture';

const CULTURE_READ_MODEL_CACHE_KEY = 'cultures:read-model:v1';
const CULTURE_LIST_FALLBACK_CACHE_KEY = 'cultures:list:last:v1';
const CULTURE_LIST_FALLBACK_METADATA_KEY = 'cultures:list:last-meta:v1';
const CULTURE_DETAIL_CACHE_NAMESPACE = 'cultures:detail:last:v1';
const CULTURE_READ_MODEL_TTL_SECONDS = 60 * 60 * 24 * 14;
const CULTURE_READ_MODEL_MEMORY_TTL_MS = 60 * 1000;
export interface CultureListFallbackMetadata {
  cachedAt: string;
  itemCount: number;
}
export interface CultureReadModel {
  cachedAt: string | null;
  items: CultureListItem[];
  revisions?: Record<string, string>;
}
type StoredCultureDetail = {
  cacheVersion: string;
  culture: Culture;
};
export type CultureCacheBinding = {
  get: (key: string, type?: 'json') => Promise<unknown>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

let cultureReadModelMemoryCache: { value: CultureReadModel; expiresAt: number } | null = null;

const sortObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
};

const stableStringify = (value: unknown) => JSON.stringify(sortObjectKeys(value));

export const createCacheKey = (namespace: string, payload: object) => `${namespace}:${stableStringify(payload)}`;

const getCultureCache = async (cacheOverride?: CultureCacheBinding) => {
  if (cacheOverride) return cacheOverride;
  const env = await getWorkerEnv();
  return env.CULTURE_CACHE as CultureCacheBinding | undefined;
};

export const readKvCache = async <T>(key: string, cacheOverride?: CultureCacheBinding): Promise<T | null> => {
  const cache = await getCultureCache(cacheOverride);
  if (!cache) return null;

  try {
    return (await cache.get(key, 'json')) as T | null;
  } catch (error) {
    console.error('[kv] read failed', key, error);
    return null;
  }
};

export const writeKvCache = async <T>(
  key: string,
  value: T,
  ttlSeconds: number,
  cacheOverride?: CultureCacheBinding
) => {
  const cache = await getCultureCache(cacheOverride);
  if (!cache) return false;

  try {
    await cache.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
    return true;
  } catch (error) {
    console.error('[kv] write failed', key, error);
    return false;
  }
};

export const getCultureDetailCacheKey = (id: number) => createCacheKey(CULTURE_DETAIL_CACHE_NAMESPACE, { id });

export const readCultureDetailCache = async (id: number, cacheOverride?: CultureCacheBinding) =>
  readKvCache<StoredCultureDetail>(getCultureDetailCacheKey(id), cacheOverride);

export const writeCultureDetailCache = async (
  id: number,
  cacheVersion: string,
  culture: Culture,
  ttlSeconds: number,
  cacheOverride?: CultureCacheBinding
) => writeKvCache(getCultureDetailCacheKey(id), { cacheVersion, culture }, ttlSeconds, cacheOverride);

export const readCulturesListFallbackCache = async (cacheOverride?: CultureCacheBinding) =>
  readKvCache<CultureListItem[]>(CULTURE_LIST_FALLBACK_CACHE_KEY, cacheOverride);

export const readCulturesListFallbackMetadata = async (cacheOverride?: CultureCacheBinding) =>
  readKvCache<CultureListFallbackMetadata>(CULTURE_LIST_FALLBACK_METADATA_KEY, cacheOverride);

export const readCultureReadModelCache = async (
  cacheOverride?: CultureCacheBinding
): Promise<CultureReadModel | null> => {
  if (!cacheOverride && cultureReadModelMemoryCache && cultureReadModelMemoryCache.expiresAt > Date.now()) {
    return cultureReadModelMemoryCache.value;
  }

  const current = await readKvCache<CultureReadModel>(CULTURE_READ_MODEL_CACHE_KEY, cacheOverride);
  if (current?.items?.length) {
    if (!cacheOverride) {
      cultureReadModelMemoryCache = {
        value: current,
        expiresAt: Date.now() + CULTURE_READ_MODEL_MEMORY_TTL_MS,
      };
    }
    return current;
  }

  // Transitional compatibility for the snapshot that was seeded before the
  // dedicated read-model envelope was introduced. New syncs only publish the
  // single read-model key below, keeping KV writes bounded on the Free plan.
  const [legacyItems, legacyMetadata] = await Promise.all([
    readCulturesListFallbackCache(cacheOverride),
    readCulturesListFallbackMetadata(cacheOverride),
  ]);
  if (!legacyItems?.length) return null;

  const legacyReadModel = {
    cachedAt: legacyMetadata?.cachedAt ?? null,
    items: legacyItems,
    revisions: {},
  };
  if (!cacheOverride) {
    cultureReadModelMemoryCache = {
      value: legacyReadModel,
      expiresAt: Date.now() + CULTURE_READ_MODEL_MEMORY_TTL_MS,
    };
  }
  return legacyReadModel;
};

export const writeCultureReadModelCache = async (
  cultures: CultureListItem[],
  revisions: Record<string, string>,
  cacheOverride?: CultureCacheBinding
) => {
  const readModel: CultureReadModel = {
    cachedAt: new Date().toISOString(),
    items: cultures,
    revisions,
  };
  const published = await writeKvCache(
    CULTURE_READ_MODEL_CACHE_KEY,
    readModel,
    CULTURE_READ_MODEL_TTL_SECONDS,
    cacheOverride
  );
  if (published && !cacheOverride) {
    cultureReadModelMemoryCache = {
      value: readModel,
      expiresAt: Date.now() + CULTURE_READ_MODEL_MEMORY_TTL_MS,
    };
  }
  return { ...readModel, published };
};
