import type { CultureMapBounds, CultureMapResponse } from '@/types/culture';
import { formatCultureData } from '@/utils/cultureUtils';
import { type MapDataMode, isBoundsWithin, isCoordinateWithinBounds } from '@/utils/mapViewport';

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 12;

interface CultureMapCacheEntry {
  expiresAt: number;
  fetchedBounds: CultureMapBounds;
  filterKey: string;
  mode: MapDataMode;
  response: CultureMapResponse;
}

interface CreateCultureMapClientCacheOptions {
  ttlMs?: number;
  maxEntries?: number;
  now?: () => number;
}

const getBoundsArea = (bounds: CultureMapBounds) =>
  Math.max(0, bounds.neLat - bounds.swLat) * Math.max(0, bounds.neLng - bounds.swLng);

export const createCultureMapClientCache = ({
  ttlMs = DEFAULT_TTL_MS,
  maxEntries = DEFAULT_MAX_ENTRIES,
  now = Date.now,
}: CreateCultureMapClientCacheOptions = {}) => {
  const entries = new Map<string, CultureMapCacheEntry>();

  const read = (filterKey: string, bounds: CultureMapBounds, mode: MapDataMode) => {
    let matchedKey: string | null = null;
    let matchedEntry: CultureMapCacheEntry | null = null;
    let matchedArea = Number.POSITIVE_INFINITY;

    entries.forEach((entry, key) => {
      if (entry.expiresAt <= now()) {
        entries.delete(key);
        return;
      }

      if (entry.filterKey !== filterKey || entry.mode !== mode || !isBoundsWithin(bounds, entry.fetchedBounds)) {
        return;
      }

      const area = getBoundsArea(entry.fetchedBounds);
      if (area <= matchedArea) {
        matchedKey = key;
        matchedEntry = entry;
        matchedArea = area;
      }
    });

    if (matchedKey === null || matchedEntry === null) return null;

    const selectedKey = matchedKey as string;
    const selectedEntry = matchedEntry as CultureMapCacheEntry;

    // Promote the selected entry so the bounded cache behaves like a small LRU.
    entries.delete(selectedKey);
    entries.set(selectedKey, selectedEntry);
    return selectedEntry.response;
  };

  const write = (
    filterKey: string,
    mode: MapDataMode,
    fetchedBounds: CultureMapBounds,
    response: CultureMapResponse
  ) => {
    const key = `${filterKey}:${fetchedBounds.swLat},${fetchedBounds.swLng},${fetchedBounds.neLat},${fetchedBounds.neLng}`;
    entries.delete(key);
    entries.set(key, {
      expiresAt: now() + ttlMs,
      fetchedBounds,
      filterKey,
      mode,
      response,
    });

    while (entries.size > maxEntries) {
      const oldestKey = entries.keys().next().value;
      if (oldestKey === undefined) break;
      entries.delete(oldestKey);
    }
  };

  const invalidate = (filterKey: string, mode: MapDataMode) => {
    entries.forEach((entry, key) => {
      if (entry.filterKey === filterKey && entry.mode === mode) entries.delete(key);
    });
  };

  return { invalidate, read, write };
};

export const cultureMapClientCache = createCultureMapClientCache();

export const normalizeCultureMapResponse = (response: Partial<CultureMapResponse>): CultureMapResponse => ({
  items: response.items ?? [],
  clusters: response.clusters ?? [],
  isClustered: response.isClustered ?? false,
  totalCount: response.totalCount ?? 0,
  viewportCount: response.viewportCount ?? 0,
  regionOptions: response.regionOptions ?? [],
});

export const selectCultureMapViewport = (
  response: CultureMapResponse,
  bounds: CultureMapBounds
): CultureMapResponse => {
  if (response.isClustered) {
    const clusters = response.clusters.filter(cluster => isCoordinateWithinBounds(cluster.lat, cluster.lng, bounds));
    return {
      ...response,
      items: [],
      clusters,
      viewportCount: clusters.reduce((sum, cluster) => sum + cluster.count, 0),
    };
  }

  const items = response.items.filter(item => isCoordinateWithinBounds(item.lat, item.lng, bounds));
  return {
    ...response,
    items: formatCultureData(items),
    clusters: [],
    viewportCount: items.length,
  };
};
