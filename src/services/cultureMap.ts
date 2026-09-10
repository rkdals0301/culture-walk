import {
  type CultureFeedFilters,
  filterCultureListItems,
  getCultureRegionOptions,
  normalizeCultureFeedFilters,
} from '@/services/cultureFeed';
import type { CultureListItem, CultureMapBounds, CultureMapResponse } from '@/types/culture';
import { sortCulturesByRelevantDate } from '@/utils/cultureSort';
import { getKoreaDateStartIso } from '@/utils/dateUtils';
import { MAP_CLUSTER_GRID_SIZE, getMapDataMode, isCoordinateWithinBounds } from '@/utils/mapViewport';

/**
 * Build the map payload entirely from the published KV read model. Keeping this
 * module pure prevents map traffic from acquiring a hidden D1 dependency.
 */
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
  const regionOptions = getCultureRegionOptions(items);

  if (mode === 'items') {
    return {
      items: sortCulturesByRelevantDate(viewportItems, getKoreaDateStartIso()),
      clusters: [],
      isClustered: false,
      totalCount: filteredItems.length,
      viewportCount: viewportItems.length,
      regionOptions,
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
    regionOptions,
  };
};
