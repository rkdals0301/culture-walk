import {
  type CultureCacheBinding,
  readCultureReadModelCache,
  writeCultureReadModelCache,
} from '@/cache/kv';
import { getWorkerEnv } from '@/server/cloudflare';
import { createCultureListItemRevision, queryCultureListFromD1 } from '@/services/cultureListRepository';
import type { D1Binding } from '@/services/cultureSyncTypes';
import { CultureListItem } from '@/types/culture';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

export { createCultureListItemRevision } from '@/services/cultureListRepository';

export type CultureListSnapshotSource = 'kv-read-model' | 'd1-read-through';

export interface CultureListSnapshot {
  items: CultureListItem[];
  source: CultureListSnapshotSource;
  cachedAt: string | null;
  revisions: Record<string, string>;
}

export const filterCurrentCultureListItems = (
  items: readonly CultureListItem[],
  referenceDate: Date = new Date()
) => {
  const koreaToday = new Date(getKoreaDateStartIso(referenceDate)).getTime();

  return items.filter(item => {
    const endDate = new Date(item.endDate).getTime();
    return Number.isFinite(endDate) && endDate >= koreaToday;
  });
};

export const readCultureReadModelSnapshot = async (
  cacheOverride?: CultureCacheBinding
): Promise<CultureListSnapshot | null> => {
  const readModel = await readCultureReadModelCache(cacheOverride);
  if (!readModel?.items.length) return null;

  return {
    items: filterCurrentCultureListItems(readModel.items),
    source: 'kv-read-model',
    cachedAt: readModel.cachedAt,
    revisions: readModel.revisions ?? {},
  };
};

export const refreshCultureListSnapshotCache = async (options: {
  cache?: CultureCacheBinding;
  d1: D1Binding;
}) => {
  const { items, revisions } = await queryCultureListFromD1(options.d1);

  const readModel = await writeCultureReadModelCache(items, revisions, options.cache);
  console.info(
    `[read-model] publish ${readModel.published ? 'completed' : 'failed'} items=${items.length} cachedAt=${readModel.cachedAt}`
  );
  return {
    items,
    cachedAt: readModel.cachedAt,
    revisions,
    published: readModel.published,
  };
};

type CulturePublicListReadOptions = {
  cache?: CultureCacheBinding;
  d1?: D1Binding;
};

let cultureListReadThroughPromise: Promise<CultureListSnapshot | null> | null = null;

const readCultureListFromD1AndWarmCache = async (
  d1: D1Binding,
  cache?: CultureCacheBinding
): Promise<CultureListSnapshot | null> => {
  try {
    const publication = await refreshCultureListSnapshotCache({ d1, cache });
    if (!publication.items.length) return null;

    return {
      items: filterCurrentCultureListItems(publication.items),
      source: 'd1-read-through',
      cachedAt: publication.published ? publication.cachedAt : null,
      revisions: publication.revisions,
    };
  } catch (error) {
    console.error('[read-model] D1 read-through failed', error);
    return null;
  }
};

/**
 * Public list reads stay KV-first. On a KV miss, Paid D1 acts as a read-through
 * recovery source and the successful result is published back to KV. Runtime
 * misses share one in-flight rebuild so a cold cache does not stampede D1.
 */
export const getCulturePublicListSnapshot = async (
  options?: CulturePublicListReadOptions
): Promise<CultureListSnapshot | null> => {
  const env = options ? null : await getWorkerEnv();
  const cache = options?.cache ?? (env?.CULTURE_CACHE as CultureCacheBinding | undefined);
  const cached = await readCultureReadModelSnapshot(cache);
  if (cached) return cached;

  const d1 = options?.d1 ?? (env?.DB as D1Binding | undefined);
  if (!d1) {
    if (process.env.NODE_ENV === 'development' && !options) {
      try {
        const prodUrl = process.env.APP_BASE_URL || 'https://culturewalk.gangmin.dev';
        const res = await fetch(`${prodUrl}/api/cultures`);
        if (res.ok) {
          const items = (await res.json()) as CultureListItem[];
          if (Array.isArray(items) && items.length) {
            return {
              items: filterCurrentCultureListItems(items),
              source: 'kv-read-model',
              cachedAt: new Date().toISOString(),
              revisions: {},
            };
          }
        }
      } catch (err) {
        console.warn('[read-model] Local dev proxy fallback failed', err);
      }
    }
    return null;
  }

  if (options) {
    return readCultureListFromD1AndWarmCache(d1, cache);
  }

  if (!cultureListReadThroughPromise) {
    cultureListReadThroughPromise = readCultureListFromD1AndWarmCache(d1, cache).finally(() => {
      cultureListReadThroughPromise = null;
    });
  }

  return cultureListReadThroughPromise;
};
