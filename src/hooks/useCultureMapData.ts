import type { CultureMapBounds, CultureMapResponse, CultureMapViewport, FormattedCulture } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';
import {
  cultureMapClientCache,
  normalizeCultureMapResponse,
  selectCultureMapViewport,
} from '@/utils/cultureMapClientCache';
import { CultureCategoryKey } from '@/utils/cultureCategory';
import {
  MAP_CLUSTER_GRID_SIZE,
  MAP_ITEM_REQUEST_GRID_SIZE,
  expandMapBounds,
  getMapDataMode,
  snapMapBoundsOutward,
} from '@/utils/mapViewport';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import axios from 'axios';

const REQUEST_DEBOUNCE_MS = 250;

const EMPTY_MAP_RESPONSE: CultureMapResponse = {
  items: [],
  clusters: [],
  isClustered: false,
  totalCount: 0,
  viewportCount: 0,
  regionOptions: [],
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
  const fetchBounds = useMemo(() => {
    if (!bounds) return null;
    const expanded = expandMapBounds(bounds);
    const requestGridSize = mode === 'clusters' ? MAP_CLUSTER_GRID_SIZE : MAP_ITEM_REQUEST_GRID_SIZE;
    return snapMapBoundsOutward(expanded, requestGridSize);
  }, [bounds, mode]);
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

    const cachedResponse = cultureMapClientCache.read(filterKey, bounds, mode);
    if (cachedResponse) {
      setData(selectCultureMapViewport(cachedResponse, bounds));
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

          const responseData = normalizeCultureMapResponse(response.data);
          cultureMapClientCache.write(filterKey, mode, fetchBounds, responseData);
          setData(selectCultureMapViewport(responseData, bounds));
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
    cultureMapClientCache.invalidate(filterKey, mode);
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
