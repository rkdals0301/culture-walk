import { getDb } from '@/db/client';
import { cultures } from '@/db/schema';
import { CultureFeedFilters, createCultureFeedFilterKey, normalizeCultureFeedFilters } from '@/services/cultureFeed';
import { getCultureFeedMetadata } from '@/services/cultureFeedData';
import {
  CULTURE_LIST_SELECTION,
  CULTURE_REGION_OPTIONS,
  type CultureListSelectionRow,
  getCultureBaseConditions,
  getMapClusterBucketExpressions,
  getViewportCoordinateCondition,
  mapCultureListRowToItem,
} from '@/services/cultureQuery';
import type { CultureMapBounds, CultureMapCluster, CultureMapResponse } from '@/types/culture';
import { sortCulturesByRelevantDate } from '@/utils/cultureSort';
import { getKoreaDateStartIso } from '@/utils/dateUtils';
import { type MapDataMode, getMapDataMode } from '@/utils/mapViewport';

import { and, asc, sql } from 'drizzle-orm';

const TOTAL_COUNT_CACHE_TTL_MS = 15_000;
const TOTAL_COUNT_CACHE_MAX_ENTRIES = 32;

interface TotalCountCacheEntry {
  count?: number;
  expiresAt: number;
  promise?: Promise<number>;
}

interface CultureMapClusterRow {
  count: number | string | null;
  latitude: number | string | null;
  latitudeBucket: number | string | null;
  longitude: number | string | null;
  longitudeBucket: number | string | null;
}

type CultureDatabase = NonNullable<Awaited<ReturnType<typeof getDb>>>;

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

const toFiniteNumber = (value: number | string | null | undefined, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getCultureMapClusters = async (db: CultureDatabase, where: ReturnType<typeof and>) => {
  const { latitude, longitude, latitudeBucket, longitudeBucket } = getMapClusterBucketExpressions();
  const rows = await db
    .select({
      count: sql<number>`COUNT(*)`,
      latitude: sql<number>`AVG(${latitude})`,
      longitude: sql<number>`AVG(${longitude})`,
      latitudeBucket,
      longitudeBucket,
    })
    .from(cultures)
    .where(where)
    .groupBy(latitudeBucket, longitudeBucket)
    .orderBy(asc(latitudeBucket), asc(longitudeBucket));

  return (rows as CultureMapClusterRow[]).map(
    ({
      count,
      latitude: clusterLatitude,
      longitude: clusterLongitude,
      latitudeBucket: latBucket,
      longitudeBucket: lngBucket,
    }) =>
      ({
        id: `map-cluster-${latBucket ?? 'unknown'}-${lngBucket ?? 'unknown'}`,
        lat: toFiniteNumber(clusterLatitude),
        lng: toFiniteNumber(clusterLongitude),
        count: Math.max(0, Math.round(toFiniteNumber(count))),
      }) satisfies CultureMapCluster
  );
};

export const getCultureMapData = async (input: {
  filters: CultureFeedFilters;
  bounds: CultureMapBounds;
  level?: number;
}): Promise<CultureMapResponse | null> => {
  const db = await getDb();
  if (!db) return null;

  const filters = normalizeCultureFeedFilters(input.filters);
  const koreaToday = getKoreaDateStartIso();
  const baseConditions = getCultureBaseConditions(filters, koreaToday);
  const baseWhere = and(...baseConditions);
  const viewportWhere = and(baseWhere, getViewportCoordinateCondition(input.bounds));
  const totalCountKey = `${koreaToday}:${createCultureFeedFilterKey(filters)}`;
  const mode: MapDataMode = getMapDataMode(input.level ?? 0);

  const viewportDataPromise =
    mode === 'clusters'
      ? getCultureMapClusters(db, viewportWhere)
      : db.select(CULTURE_LIST_SELECTION).from(cultures).where(viewportWhere);

  const [totalCount, viewportData] = await Promise.all([
    getCachedTotalCount(totalCountKey, async () => (await getCultureFeedMetadata(db, filters)).totalCount),
    viewportDataPromise,
  ]);

  if (mode === 'clusters') {
    const clusters = viewportData as CultureMapCluster[];

    return {
      items: [],
      clusters,
      isClustered: true,
      totalCount,
      viewportCount: clusters.reduce((sum, cluster) => sum + cluster.count, 0),
      regionOptions: [...CULTURE_REGION_OPTIONS],
    };
  }

  const items = sortCulturesByRelevantDate(
    (viewportData as CultureListSelectionRow[]).map(mapCultureListRowToItem),
    koreaToday
  );

  return {
    items,
    clusters: [],
    isClustered: false,
    totalCount,
    viewportCount: items.length,
    regionOptions: [...CULTURE_REGION_OPTIONS],
  };
};
