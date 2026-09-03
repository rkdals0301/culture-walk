import { getWorkerEnv } from '@/server/cloudflare';
import { CultureListItem } from '@/types/culture';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

const CULTURE_CACHE_VERSION_KEY = 'cultures:cache-version';
const CULTURE_LIST_CACHE_NAMESPACE = 'cultures:list:v6';
type CultureCacheBinding = {
  get: (key: string, type?: 'json') => Promise<unknown>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
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

export const getCulturesCacheVersion = async () => {
  const cache = await getCultureCache();
  if (!cache) return 'local';

  try {
    return (await cache.get(CULTURE_CACHE_VERSION_KEY)) ?? 'v1';
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

export const readCulturesListCache = async () => {
  return readKvCache<CultureListItem[]>(await getCulturesListCacheKey());
};

export const readCultureListItemCache = async (id: number) => {
  const cachedCultures = await readCulturesListCache();
  return cachedCultures?.find(culture => culture.id === id) ?? null;
};
