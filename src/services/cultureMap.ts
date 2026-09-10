import { getDb } from '@/db/client';
import { cultures } from '@/db/schema';
import {
  CultureFeedFilters,
  createCultureFeedFilterKey,
  filterCultureListItems,
  normalizeCultureFeedFilters,
} from '@/services/cultureFeed';
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
import type { CultureListItem, CultureMapBounds, CultureMapCluster, CultureMapResponse } from '@/types/culture';
import { sortCulturesByRelevantDate } from '@/utils/cultureSort';
import { getKoreaDateStartIso } from '@/utils/dateUtils';
import {
  MAP_CLUSTER_GRID_SIZE,
  type MapDataMode,
  getMapDataMode,
  isCoordinateWithinBounds,
} from '@/utils/mapViewport';

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

export const buildCultureMapResponseFromSnapshot = (
  items: readonly CultureListItem[],
  input: {
    filters: CultureFeedFilters;
    bounds: CultureMapBounds;
    level?: number;
  }
): CultureMapResponse => {
  const filters = normalizeCultureFeedFilters(input.filters);
  const filteredItems = filterCultureListItems(items, filters);
  const viewportItems = filteredItems.filter(culture =>
    isCoordinateWithinBounds(culture.lat, culture.lng, input.bounds)
  );
  const mode = getMapDataMode(input.level ?? 0);

  if (mode === 'items') {
    return {
      items: sortCulturesByRelevantDate(viewportItems, getKoreaDateStartIso()),
      clusters: [],
      isClustered: false,
      totalCount: filteredItems.length,
      viewportCount: viewportItems.length,
      regionOptions: [...CULTURE_REGION_OPTIONS],
    };
  }

  const buckets = new Map<
    string,
    { count: number; latTotal: number; lngTotal: number; latitudeBucket: number; longitudeBucket: number }
  >();

  for (const culture of viewportItems) {
    const latitudeBucket = Math.trunc(culture.lat / MAP_CLUSTER_GRID_SIZE);
    const longitudeBucket = Math.trunc(culture.lng / MAP_CLUSTER_GRID_SIZE);
    const key = `${latitudeBucket}:${longitudeBucket}`;
    const existing = buckets.get(key);

    if (existing) {
      existing.count += 1;
      existing.latTotal += culture.lat;
      existing.lngTotal += culture.lng;
      continue;
    }

    buckets.set(key, {
      count: 1,
      latTotal: culture.lat,
      lngTotal: culture.lng,
      latitudeBucket,
      longitudeBucket,
    });
  }

  const clusters = Array.from(buckets.values())
    .sort(
      (left, right) =>
        left.latitudeBucket - right.latitudeBucket || left.longitudeBucket - right.longitudeBucket
    )
    .map(bucket => ({
      id: `map-cluster-${bucket.latitudeBucket}-${bucket.longitudeBucket}`,
      lat: bucket.latTotal / bucket.count,
      lng: bucket.lngTotal / bucket.count,
      count: bucket.count,
    }));

  return {
    items: [],
    clusters,
    isClustered: true,
    totalCount: filteredItems.length,
    viewportCount: viewportItems.length,
    regionOptions: [...CULTURE_REGION_OPTIONS],
  };
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
