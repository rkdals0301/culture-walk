import { getWorkerEnv } from '@/server/cloudflare';
import { Culture, CultureFeedMetadata, CultureFeedPage, CultureListItem, CultureMapResponse } from '@/types/culture';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

const CULTURE_CACHE_VERSION_KEY = 'cultures:cache-version';
const CULTURE_LIST_CACHE_NAMESPACE = 'cultures:list:v6';
const CULTURE_LIST_FALLBACK_CACHE_KEY = 'cultures:list:last:v1';
const CULTURE_LIST_FALLBACK_METADATA_KEY = 'cultures:list:last-meta:v1';
const CULTURE_FEED_PAGE_CACHE_NAMESPACE = 'cultures:feed-page:v1';
const CULTURE_FEED_METADATA_CACHE_NAMESPACE = 'cultures:feed-metadata:v1';
const CULTURE_MAP_VIEWPORT_CACHE_NAMESPACE = 'cultures:map-viewport:v1';
const CULTURE_DETAIL_CACHE_NAMESPACE = 'cultures:detail:last:v1';
const LEGACY_CULTURE_DETAIL_CACHE_NAMESPACE = 'cultures:detail:v2:';
const CULTURE_LIST_FALLBACK_TTL_SECONDS = 60 * 60 * 24 * 14;
export interface CultureListFallbackMetadata {
  cachedAt: string;
  itemCount: number;
}
type StoredCultureDetail = {
  cacheVersion: string;
  culture: Culture;
};
type CultureCacheListResult = {
  keys?: Array<{ name: string }>;
};
type CultureCacheBinding = {
  get: (key: string, type?: 'json') => Promise<unknown>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  list?: (options?: { prefix?: string; limit?: number }) => Promise<CultureCacheListResult>;
};

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

const getCultureCache = async () => {
  const env = await getWorkerEnv();
  return env.CULTURE_CACHE as CultureCacheBinding | undefined;
};

export const readKvCache = async <T>(key: string): Promise<T | null> => {
  const cache = await getCultureCache();
  if (!cache) return null;

  try {
    return (await cache.get(key, 'json')) as T | null;
  } catch (error) {
    console.error('[kv] read failed', key, error);
    return null;
  }
};

export const writeKvCache = async <T>(key: string, value: T, ttlSeconds: number) => {
  const cache = await getCultureCache();
  if (!cache) return;

  try {
    await cache.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
  } catch (error) {
    console.error('[kv] write failed', key, error);
  }
};

export const getCulturesCacheVersion = async (): Promise<string> => {
  const cache = await getCultureCache();
  if (!cache) return 'local';

  try {
    const version = await cache.get(CULTURE_CACHE_VERSION_KEY);
    return typeof version === 'string' && version ? version : 'v1';
  } catch (error) {
    console.error('[kv] version read failed', error);
    return 'v1';
  }
};

export const bumpCulturesCacheVersion = async () => {
  const cache = await getCultureCache();
  const version = new Date().toISOString();

  if (!cache) return version;

  try {
    await cache.put(CULTURE_CACHE_VERSION_KEY, version);
  } catch (error) {
    console.error('[kv] version write failed', error);
  }

  return version;
};

export const getCulturesListCacheKey = async () => {
  const cacheVersion = await getCulturesCacheVersion();
  return createCacheKey(CULTURE_LIST_CACHE_NAMESPACE, {
    version: cacheVersion,
    koreaDate: getKoreaDateStartIso().slice(0, 10),
  });
};

export const getCultureDetailCacheKey = (id: number) => createCacheKey(CULTURE_DETAIL_CACHE_NAMESPACE, { id });

export const readCultureDetailCache = async (id: number) =>
  readKvCache<StoredCultureDetail>(getCultureDetailCacheKey(id));

export const writeCultureDetailCache = async (id: number, cacheVersion: string, culture: Culture, ttlSeconds: number) =>
  writeKvCache(getCultureDetailCacheKey(id), { cacheVersion, culture }, ttlSeconds);

export const readLegacyCultureDetailCache = async (id: number): Promise<Culture | null> => {
  const cache = await getCultureCache();
  if (!cache?.list) return null;

  const prefix = `${LEGACY_CULTURE_DETAIL_CACHE_NAMESPACE}${stableStringify({ id }).slice(0, -1)},`;

  try {
    const result = await cache.list({ prefix, limit: 20 });
    let latestCulture: Culture | null = null;
    for (const key of result.keys ?? []) {
      const culture = (await cache.get(key.name, 'json')) as Culture | null;
      if (culture?.id !== id) {
        continue;
      }

      if (!latestCulture) {
        latestCulture = culture;
        continue;
      }

      const currentUpdatedAt = new Date(culture.updatedAt ?? 0).getTime();
      const latestUpdatedAt = new Date(latestCulture.updatedAt ?? 0).getTime();
      if (currentUpdatedAt > latestUpdatedAt) {
        latestCulture = culture;
      }
    }

    return latestCulture;
  } catch (error) {
    console.error('[kv] legacy detail read failed', id, error);
  }

  return null;
};

export const readCulturesListCache = async () => {
  return readKvCache<CultureListItem[]>(await getCulturesListCacheKey());
};

export const readCulturesListFallbackCache = async () =>
  readKvCache<CultureListItem[]>(CULTURE_LIST_FALLBACK_CACHE_KEY);

export const readCulturesListFallbackMetadata = async () =>
  readKvCache<CultureListFallbackMetadata>(CULTURE_LIST_FALLBACK_METADATA_KEY);

export const getCultureFeedPageCacheKey = async (payload: {
  filters: string;
  cursor: string | null;
  limit: number;
}) =>
  createCacheKey(CULTURE_FEED_PAGE_CACHE_NAMESPACE, {
    version: await getCulturesCacheVersion(),
    koreaDate: getKoreaDateStartIso().slice(0, 10),
    ...payload,
  });

export const readCultureFeedPageCache = async (payload: {
  filters: string;
  cursor: string | null;
  limit: number;
}) => readKvCache<CultureFeedPage>(await getCultureFeedPageCacheKey(payload));

export const writeCultureFeedPageCache = async (
  payload: { filters: string; cursor: string | null; limit: number },
  page: CultureFeedPage,
  ttlSeconds: number
) => writeKvCache(await getCultureFeedPageCacheKey(payload), page, ttlSeconds);

export const getCultureFeedMetadataCacheKey = async (filters: string) =>
  createCacheKey(CULTURE_FEED_METADATA_CACHE_NAMESPACE, {
    version: await getCulturesCacheVersion(),
    koreaDate: getKoreaDateStartIso().slice(0, 10),
    filters,
  });

export const readCultureFeedMetadataCache = async (filters: string) =>
  readKvCache<CultureFeedMetadata>(await getCultureFeedMetadataCacheKey(filters));

export const writeCultureFeedMetadataCache = async (
  filters: string,
  metadata: CultureFeedMetadata,
  ttlSeconds: number
) => writeKvCache(await getCultureFeedMetadataCacheKey(filters), metadata, ttlSeconds);

export const getCultureMapViewportCacheKey = async (payload: {
  bounds: { swLat: number; swLng: number; neLat: number; neLng: number };
  filters: string;
  level: number;
}) =>
  createCacheKey(CULTURE_MAP_VIEWPORT_CACHE_NAMESPACE, {
    version: await getCulturesCacheVersion(),
    koreaDate: getKoreaDateStartIso().slice(0, 10),
    ...payload,
  });

export const readCultureMapViewportCache = async (payload: {
  bounds: { swLat: number; swLng: number; neLat: number; neLng: number };
  filters: string;
  level: number;
}) => readKvCache<CultureMapResponse>(await getCultureMapViewportCacheKey(payload));

export const writeCultureMapViewportCache = async (
  payload: {
    bounds: { swLat: number; swLng: number; neLat: number; neLng: number };
    filters: string;
    level: number;
  },
  response: CultureMapResponse,
  ttlSeconds: number
) => writeKvCache(await getCultureMapViewportCacheKey(payload), response, ttlSeconds);

export const writeCulturesListCaches = async (cultures: CultureListItem[], ttlSeconds: number) => {
  const cachedAt = new Date().toISOString();
  await Promise.all([
    writeKvCache(await getCulturesListCacheKey(), cultures, ttlSeconds),
    writeKvCache(CULTURE_LIST_FALLBACK_CACHE_KEY, cultures, CULTURE_LIST_FALLBACK_TTL_SECONDS),
    writeKvCache(
      CULTURE_LIST_FALLBACK_METADATA_KEY,
      { cachedAt, itemCount: cultures.length } satisfies CultureListFallbackMetadata,
      CULTURE_LIST_FALLBACK_TTL_SECONDS
    ),
  ]);
};

export const readCultureListItemCache = async (id: number) => {
  const fallback = await readCulturesListFallbackCache();
  const fallbackCulture = fallback?.find(culture => culture.id === id);
  if (fallbackCulture) return fallbackCulture;

  const cachedCultures = await readCulturesListCache();
  return cachedCultures?.find(culture => culture.id === id) ?? null;
};
