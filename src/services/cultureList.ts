import {
  type CultureCacheBinding,
  readCultureReadModelCache,
  writeCultureReadModelCache,
} from '@/cache/kv';
import { logEvent } from '@/server/structuredLog';
import { createCultureListItemRevision, queryCultureListFromD1 } from '@/services/cultureListRepository';
import type { RuntimeDeps } from '@/server/runtimeTypes';
import type { D1Binding } from '@/services/cultureSyncTypes';
import { CultureSearchableListItem } from '@/types/culture';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

export { createCultureListItemRevision } from '@/services/cultureListRepository';

export type CultureListSnapshotSource = 'kv-read-model' | 'd1-read-through';

export interface CultureListSnapshot {
  items: CultureSearchableListItem[];
  source: CultureListSnapshotSource;
  cachedAt: string | null;
  revisions: Record<string, string>;
}

export const filterCurrentCultureListItems = (
  items: readonly CultureSearchableListItem[],
  referenceDate: Date = new Date()
) => {
  const koreaToday = new Date(getKoreaDateStartIso(referenceDate)).getTime();

  return items.filter(item => {
    const endDate = new Date(item.endDate).getTime();
    return Number.isFinite(endDate) && endDate >= koreaToday;
  });
};

export const readCultureReadModelSnapshot = async (
  cache: CultureCacheBinding | undefined
): Promise<CultureListSnapshot | null> => {
  const readModel = await readCultureReadModelCache(cache);
  if (!readModel) return null;

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
  const startedAt = Date.now();
  const { items, revisions } = await queryCultureListFromD1(options.d1);

  const readModel = await writeCultureReadModelCache(items, revisions, options.cache);
  logEvent(readModel.published ? 'info' : 'warn', 'culture.read_model.publish', {
    published: readModel.published,
    itemCount: items.length,
    cachedAt: readModel.cachedAt,
    durationMs: Date.now() - startedAt,
  });
  return {
    items,
    cachedAt: readModel.cachedAt,
    revisions,
    published: readModel.published,
  };
};

type CulturePublicListReadOptions = RuntimeDeps;

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
    logEvent('error', 'culture.read_model.read_through_failed', {}, error);
    return null;
  }
};

/**
 * Public list reads stay KV-first. On a KV miss, Paid D1 acts as a read-through
 * recovery source and the successful result is published back to KV. Runtime
 * misses share one in-flight rebuild so a cold cache does not stampede D1.
 */
export const getCulturePublicListSnapshot = async (
  options: CulturePublicListReadOptions
): Promise<CultureListSnapshot | null> => {
  const cache = options.cache;
  const cached = await readCultureReadModelSnapshot(cache);
  if (cached) return cached;

  const d1 = options.d1;
  if (!d1) return null;

  if (!cultureListReadThroughPromise) {
    cultureListReadThroughPromise = readCultureListFromD1AndWarmCache(d1, cache).finally(() => {
      cultureListReadThroughPromise = null;
    });
  }

  return cultureListReadThroughPromise;
};
