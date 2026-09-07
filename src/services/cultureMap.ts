import { getDb } from '@/db/client';
import { cultures } from '@/db/schema';
import { CultureMapBounds, CultureMapResponse } from '@/types/culture';
import { createCultureFeedFilterKey, CultureFeedFilters, normalizeCultureFeedFilters } from '@/services/cultureFeed';
import { getCultureFeedMetadata } from '@/services/cultureFeedData';
import {
  CULTURE_LIST_SELECTION,
  CULTURE_REGION_OPTIONS,
  getCultureBaseConditions,
  getViewportCoordinateCondition,
  mapCultureListRowToItem,
  type CultureListSelectionRow,
} from '@/services/cultureQuery';
import { sortCulturesByRelevantDate } from '@/utils/cultureSort';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

import { and } from 'drizzle-orm';

const TOTAL_COUNT_CACHE_TTL_MS = 15_000;
const TOTAL_COUNT_CACHE_MAX_ENTRIES = 32;

interface TotalCountCacheEntry {
  count?: number;
  expiresAt: number;
  promise?: Promise<number>;
}

// A short-lived isolate-local cache avoids running the same full-filter COUNT
// for every small map pan. The viewport query remains fresh on each request.
const totalCountCache = new Map<string, TotalCountCacheEntry>();

const getCachedTotalCount = async (key: string, query: () => Promise<number>) => {
  const cached = totalCountCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.promise) return cached.promise;
    if (cached.count !== undefined) return cached.count;
  }

  const promise = Promise.resolve().then(query);
  totalCountCache.set(key, {
    expiresAt: Date.now() + TOTAL_COUNT_CACHE_TTL_MS,
    promise,
  });

  try {
    const count = await promise;
    totalCountCache.set(key, {
      count,
      expiresAt: Date.now() + TOTAL_COUNT_CACHE_TTL_MS,
    });

    while (totalCountCache.size > TOTAL_COUNT_CACHE_MAX_ENTRIES) {
      const oldestKey = totalCountCache.keys().next().value;
      if (oldestKey === undefined) break;
      totalCountCache.delete(oldestKey);
    }

    return count;
  } catch (error) {
    if (totalCountCache.get(key)?.promise === promise) {
      totalCountCache.delete(key);
    }
    throw error;
  }
};

export const getCultureMapData = async (
  input: { filters: CultureFeedFilters; bounds: CultureMapBounds }
): Promise<CultureMapResponse | null> => {
  const db = await getDb();
  if (!db) return null;

  const filters = normalizeCultureFeedFilters(input.filters);
  const koreaToday = getKoreaDateStartIso();
  const baseConditions = getCultureBaseConditions(filters, koreaToday);
  const baseWhere = and(...baseConditions);
  const viewportWhere = and(baseWhere, getViewportCoordinateCondition(input.bounds));
  const totalCountKey = `${koreaToday}:${createCultureFeedFilterKey(filters)}`;

  const [totalCount, viewportRows] = await Promise.all([
    getCachedTotalCount(totalCountKey, async () => (await getCultureFeedMetadata(db, filters)).totalCount),
    db
      .select(CULTURE_LIST_SELECTION)
      .from(cultures)
      .where(viewportWhere),
  ]);

  const items = sortCulturesByRelevantDate(
    (viewportRows as CultureListSelectionRow[]).map(mapCultureListRowToItem),
    koreaToday
  );

  return {
    items,
    totalCount,
    viewportCount: items.length,
    regionOptions: [...CULTURE_REGION_OPTIONS],
  };
};
