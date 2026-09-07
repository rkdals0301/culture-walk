import axios from 'axios';

import type { CultureMapBounds, CultureMapResponse, FormattedCulture } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';
import { formatCultureData } from '@/utils/cultureUtils';
import { CultureCategoryKey } from '@/utils/cultureCategory';

import { useCallback, useEffect, useRef, useState } from 'react';

const REQUEST_DEBOUNCE_MS = 250;
const CLIENT_CACHE_TTL_MS = 15_000;
const CLIENT_CACHE_MAX_ENTRIES = 8;

interface CultureMapCacheEntry {
  expiresAt: number;
  response: CultureMapResponse;
}

const cultureMapCache = new Map<string, CultureMapCacheEntry>();

const readCultureMapCache = (key: string) => {
  const entry = cultureMapCache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    cultureMapCache.delete(key);
    return null;
  }

  // Promote recently used entries so the small cache behaves like an LRU.
  cultureMapCache.delete(key);
  cultureMapCache.set(key, entry);
  return entry.response;
};

const writeCultureMapCache = (key: string, response: CultureMapResponse) => {
  cultureMapCache.delete(key);
  cultureMapCache.set(key, { expiresAt: Date.now() + CLIENT_CACHE_TTL_MS, response });

  while (cultureMapCache.size > CLIENT_CACHE_MAX_ENTRIES) {
    const oldestKey = cultureMapCache.keys().next().value;
    if (oldestKey === undefined) break;
    cultureMapCache.delete(oldestKey);
  }
};

interface UseCultureMapDataOptions {
  bounds: CultureMapBounds | null;
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

export const useCultureMapData = ({ bounds, searchQuery, category, region, freeOnly }: UseCultureMapDataOptions) => {
  const [data, setData] = useState<CultureMapResponse>({
    items: [],
    totalCount: 0,
    viewportCount: 0,
    regionOptions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const requestVersionRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const normalizedSearchQuery = searchQuery.trim();
  const normalizedRegion = region.trim();
  const swLat = bounds?.swLat;
  const swLng = bounds?.swLng;
  const neLat = bounds?.neLat;
  const neLng = bounds?.neLng;
  const hasBounds = [swLat, swLng, neLat, neLng].every(value => typeof value === 'number' && Number.isFinite(value));
  const boundsKey = hasBounds ? `${swLat},${swLng},${neLat},${neLng}` : '';
  const requestKey = JSON.stringify([boundsKey, normalizedSearchQuery, category, normalizedRegion, freeOnly]);

  useEffect(() => {
    const version = requestVersionRef.current + 1;
    requestVersionRef.current = version;
    abortControllerRef.current?.abort();

    if (!hasBounds) {
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    setError(null);

    const cachedResponse = readCultureMapCache(requestKey);
    if (cachedResponse) {
      setData({
        ...cachedResponse,
        items: formatCultureData(cachedResponse.items ?? []),
      });
      setIsLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const params: Record<string, string | number> = {
        swLat: swLat as number,
        swLng: swLng as number,
        neLat: neLat as number,
        neLng: neLng as number,
        category,
        region: normalizedRegion,
        free: freeOnly ? '1' : '0',
      };
      if (normalizedSearchQuery) params.q = normalizedSearchQuery;

      void axiosInstance
        .get<CultureMapResponse>('/api/cultures/viewport', {
          params,
          signal: controller.signal,
        })
        .then(response => {
          if (version !== requestVersionRef.current) return;

          const responseData = {
            ...response.data,
            items: response.data.items ?? [],
          };
          writeCultureMapCache(requestKey, responseData);
          setData({
            ...responseData,
            items: formatCultureData(responseData.items),
          });
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
  }, [category, freeOnly, hasBounds, neLat, neLng, normalizedRegion, normalizedSearchQuery, requestKey, retryNonce, swLat, swLng]);

  const retry = useCallback(() => setRetryNonce(value => value + 1), []);

  return {
    cultures: data.items as FormattedCulture[],
    totalCount: data.totalCount,
    viewportCount: data.viewportCount,
    regionOptions: data.regionOptions,
    isLoading,
    error,
    retry,
  };
};
