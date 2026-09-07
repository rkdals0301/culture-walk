import type { CultureMapBounds, CultureMapResponse, CultureMapViewport, FormattedCulture } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';
import { CultureCategoryKey } from '@/utils/cultureCategory';
import { formatCultureData } from '@/utils/cultureUtils';
import {
  type MapDataMode,
  expandMapBounds,
  getMapDataMode,
  isBoundsWithin,
  isCoordinateWithinBounds,
} from '@/utils/mapViewport';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import axios from 'axios';

const REQUEST_DEBOUNCE_MS = 250;
const CLIENT_CACHE_TTL_MS = 60_000;
const CLIENT_CACHE_MAX_ENTRIES = 12;

const EMPTY_MAP_RESPONSE: CultureMapResponse = {
  items: [],
  clusters: [],
  isClustered: false,
  totalCount: 0,
  viewportCount: 0,
  regionOptions: [],
};

interface CultureMapCacheEntry {
  expiresAt: number;
  fetchedBounds: CultureMapBounds;
  filterKey: string;
  mode: MapDataMode;
  response: CultureMapResponse;
}

const cultureMapCache = new Map<string, CultureMapCacheEntry>();

const getBoundsArea = (bounds: CultureMapBounds) =>
  Math.max(0, bounds.neLat - bounds.swLat) * Math.max(0, bounds.neLng - bounds.swLng);

const readCultureMapCache = (filterKey: string, bounds: CultureMapBounds, mode: MapDataMode) => {
  let matchedKey: string | null = null;
  let matchedEntry: CultureMapCacheEntry | null = null;
  let matchedArea = Number.POSITIVE_INFINITY;

  cultureMapCache.forEach((entry, key) => {
    if (entry.expiresAt <= Date.now()) {
      cultureMapCache.delete(key);
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

  if (matchedKey === null || matchedEntry === null) {
    return null;
  }

  const selectedKey = matchedKey as string;
  const selectedEntry = matchedEntry as CultureMapCacheEntry;

  // Promote the entry so the bounded cache behaves like a small LRU.
  cultureMapCache.delete(selectedKey);
  cultureMapCache.set(selectedKey, selectedEntry);
  return selectedEntry.response;
};

const writeCultureMapCache = (
  filterKey: string,
  mode: MapDataMode,
  fetchedBounds: CultureMapBounds,
  response: CultureMapResponse
) => {
  const key = `${filterKey}:${fetchedBounds.swLat},${fetchedBounds.swLng},${fetchedBounds.neLat},${fetchedBounds.neLng}`;
  cultureMapCache.delete(key);
  cultureMapCache.set(key, {
    expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
    fetchedBounds,
    filterKey,
    mode,
    response,
  });

  while (cultureMapCache.size > CLIENT_CACHE_MAX_ENTRIES) {
    const oldestKey = cultureMapCache.keys().next().value;
    if (oldestKey === undefined) break;
    cultureMapCache.delete(oldestKey);
  }
};

const normalizeMapResponse = (response: Partial<CultureMapResponse>): CultureMapResponse => ({
  items: response.items ?? [],
  clusters: response.clusters ?? [],
  isClustered: response.isClustered ?? false,
  totalCount: response.totalCount ?? 0,
  viewportCount: response.viewportCount ?? 0,
  regionOptions: response.regionOptions ?? [],
});

const selectCurrentViewport = (response: CultureMapResponse, bounds: CultureMapBounds): CultureMapResponse => {
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

interface UseCultureMapDataOptions {
  viewport: CultureMapViewport | null;
  searchQuery: string;
  category: CultureCategoryKey;
  region: string;
  freeOnly: boolean;
}

const isRequestAborted = (error: unknown) =>
  axios.isCancel(error) ||
  (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError');

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error('현재 지도 영역 데이터를 불러오지 못했습니다.');

export const useCultureMapData = ({ viewport, searchQuery, category, region, freeOnly }: UseCultureMapDataOptions) => {
  const [data, setData] = useState<CultureMapResponse>(EMPTY_MAP_RESPONSE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const requestVersionRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const normalizedSearchQuery = searchQuery.trim();
  const normalizedRegion = region.trim();
  const viewportBounds = viewport?.bounds;
  const level = viewport?.level ?? 0;
  const mode = getMapDataMode(level);
  const swLat = viewportBounds?.swLat;
  const swLng = viewportBounds?.swLng;
  const neLat = viewportBounds?.neLat;
  const neLng = viewportBounds?.neLng;
  const hasBounds = Boolean(viewportBounds) && [swLat, swLng, neLat, neLng].every(value => Number.isFinite(value));
  const bounds = useMemo<CultureMapBounds | null>(
    () =>
      hasBounds
        ? {
            swLat: swLat as number,
            swLng: swLng as number,
            neLat: neLat as number,
            neLng: neLng as number,
          }
        : null,
    [hasBounds, neLat, neLng, swLat, swLng]
  );
  const fetchBounds = useMemo(() => (bounds ? expandMapBounds(bounds) : null), [bounds]);
  const boundsKey = hasBounds ? `${swLat},${swLng},${neLat},${neLng}` : '';
  const fetchBoundsKey = fetchBounds
    ? `${fetchBounds.swLat},${fetchBounds.swLng},${fetchBounds.neLat},${fetchBounds.neLng}`
    : '';
  const filterKey = JSON.stringify([normalizedSearchQuery, category, normalizedRegion, freeOnly, mode]);

  useEffect(() => {
    const version = requestVersionRef.current + 1;
    requestVersionRef.current = version;
    abortControllerRef.current?.abort();

    if (!hasBounds || !bounds || !fetchBounds) {
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    setError(null);

    const cachedResponse = readCultureMapCache(filterKey, bounds, mode);
    if (cachedResponse) {
      setData(selectCurrentViewport(cachedResponse, bounds));
      setIsLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const params: Record<string, string | number> = {
        swLat: fetchBounds.swLat,
        swLng: fetchBounds.swLng,
        neLat: fetchBounds.neLat,
        neLng: fetchBounds.neLng,
        level,
        category,
        region: normalizedRegion,
        free: freeOnly ? '1' : '0',
      };
      if (normalizedSearchQuery) params.q = normalizedSearchQuery;

      void axiosInstance
        .get<Partial<CultureMapResponse>>('/api/cultures/viewport', {
          params,
          signal: controller.signal,
        })
        .then(response => {
          if (version !== requestVersionRef.current) return;

          const responseData = normalizeMapResponse(response.data);
          writeCultureMapCache(filterKey, mode, fetchBounds, responseData);
          setData(selectCurrentViewport(responseData, bounds));
        })
        .catch(caughtError => {
          if (version !== requestVersionRef.current || isRequestAborted(caughtError)) return;
          setError(toError(caughtError));
        })
        .finally(() => {
          if (version !== requestVersionRef.current) return;
          setIsLoading(false);
        });
    }, REQUEST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    bounds,
    boundsKey,
    category,
    fetchBounds,
    fetchBoundsKey,
    filterKey,
    freeOnly,
    hasBounds,
    level,
    mode,
    neLat,
    neLng,
    normalizedRegion,
    normalizedSearchQuery,
    retryNonce,
    swLat,
    swLng,
  ]);

  const retry = useCallback(() => {
    cultureMapCache.forEach((entry, key) => {
      if (entry.filterKey === filterKey && entry.mode === mode) {
        cultureMapCache.delete(key);
      }
    });
    setRetryNonce(value => value + 1);
  }, [filterKey, mode]);

  return {
    cultures: data.items as FormattedCulture[],
    clusters: data.clusters,
    isClustered: data.isClustered,
    totalCount: data.totalCount,
    viewportCount: data.viewportCount,
    regionOptions: data.regionOptions,
    isLoading,
    error,
    retry,
  };
};
