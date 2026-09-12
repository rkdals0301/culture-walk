import axios from 'axios';

import type { CultureFeedFilters } from '@/services/cultureFeed';
import type { CultureFeedPage, FormattedCultureListItem } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';
import { CultureCategoryKey } from '@/utils/cultureCategory';
import { formatCultureData } from '@/utils/cultureUtils';
import type { MapSortMode } from '@/utils/exploreState';
import type { GeoPoint } from '@/utils/geo';

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';

const FEED_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;

interface UseCultureFeedOptions {
  searchQuery: string;
  category: CultureCategoryKey;
  region: string;
  freeOnly: boolean;
  sortMode?: MapSortMode;
  currentLocation?: GeoPoint | null;
}

const isRequestAborted = (error: unknown) =>
  axios.isCancel(error) ||
  (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError');

const toError = (error: unknown) => (error instanceof Error ? error : new Error('문화 목록 조회에 실패했습니다.'));

interface FeedCacheEntry {
  cultures: FormattedCultureListItem[];
  totalCount: number;
  freeCount: number;
  regionOptions: string[];
  nextCursor: string | null;
  hasMore: boolean;
  timestamp: number;
}

const feedMemoryCache = new Map<string, FeedCacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

const getFeedCacheKey = (filters: CultureFeedFilters) =>
  `${filters.searchQuery}|${filters.category}|${filters.region}|${filters.freeOnly ? '1' : '0'}|${filters.sortMode ?? 'date'}|${filters.userLat ? filters.userLat.toFixed(4) : ''}|${filters.userLng ? filters.userLng.toFixed(4) : ''}`;

export const useCultureFeed = ({
  searchQuery,
  category,
  region,
  freeOnly,
  sortMode = 'date',
  currentLocation = null,
}: UseCultureFeedOptions) => {
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(() => searchQuery.trim());

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const filters = useMemo<CultureFeedFilters>(
    () => ({
      searchQuery: debouncedSearchQuery,
      category,
      region,
      freeOnly,
      sortMode: sortMode === 'distance' && currentLocation ? 'distance' : 'date',
      userLat: sortMode === 'distance' && currentLocation ? currentLocation.lat : null,
      userLng: sortMode === 'distance' && currentLocation ? currentLocation.lng : null,
    }),
    [category, currentLocation, debouncedSearchQuery, freeOnly, region, sortMode]
  );

  const filterKey = useMemo(() => getFeedCacheKey(filters), [filters]);

  const [cultures, setCultures] = useState<FormattedCultureListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [freeCount, setFreeCount] = useState(0);
  const [regionOptions, setRegionOptions] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const requestVersionRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean, version: number, controller: AbortController) => {
      const params: Record<string, string | number> = {
        limit: FEED_PAGE_SIZE,
        category: filters.category,
        region: filters.region,
        free: filters.freeOnly ? '1' : '0',
      };
      if (filters.searchQuery) params.q = filters.searchQuery;
      if (filters.sortMode) params.sort = filters.sortMode;
      if (filters.userLat != null && filters.userLng != null) {
        params.lat = filters.userLat;
        params.lng = filters.userLng;
      }
      if (cursor) params.cursor = cursor;

      const response = await axiosInstance.get<CultureFeedPage>('/api/cultures/feed', {
        params,
        signal: controller.signal,
      });

      if (version !== requestVersionRef.current) return;

      const page = response.data;
      const nextItems = formatCultureData(page.items ?? []);

      setCultures(current => {
        if (version !== requestVersionRef.current) return current;

        const resolvedCultures = (() => {
          if (!append) return nextItems;
          const existingIds = new Set(current.map(item => item.id));
          const uniqueItems = nextItems.filter(item => !existingIds.has(item.id));
          return uniqueItems.length > 0 ? [...current, ...uniqueItems] : current;
        })();

        feedMemoryCache.set(filterKey, {
          cultures: resolvedCultures,
          totalCount: page.totalCount,
          freeCount: page.freeCount,
          regionOptions: page.regionOptions ?? [],
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          timestamp: Date.now(),
        });

        return resolvedCultures;
      });

      setTotalCount(page.totalCount);
      setFreeCount(page.freeCount);
      setRegionOptions(current => {
        const nextRegions = page.regionOptions ?? [];
        if (current.length === nextRegions.length && current.every((region, index) => region === nextRegions[index])) {
          return current;
        }
        return nextRegions;
      });
      nextCursorRef.current = page.nextCursor;
      setHasMore(page.hasMore);
      hasMoreRef.current = page.hasMore;
      setError(null);
    },
    [filterKey, filters]
  );

  useEffect(() => {
    const cachedEntry = feedMemoryCache.get(filterKey);
    const isValid = cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS;

    if (isValid && retryNonce === 0) {
      setCultures(cachedEntry.cultures);
      setTotalCount(cachedEntry.totalCount);
      setFreeCount(cachedEntry.freeCount);
      setRegionOptions(cachedEntry.regionOptions);
      setHasMore(cachedEntry.hasMore);
      nextCursorRef.current = cachedEntry.nextCursor;
      hasMoreRef.current = cachedEntry.hasMore;
      setIsInitialLoading(false);
      setIsLoadingMore(false);
      setError(null);
      return;
    }

    const version = requestVersionRef.current + 1;
    requestVersionRef.current = version;
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    nextCursorRef.current = null;
    hasMoreRef.current = true;
    inFlightRef.current = null;
    setCultures([]);
    setTotalCount(0);
    setFreeCount(0);
    setHasMore(true);
    setError(null);
    setIsInitialLoading(true);
    setIsLoadingMore(false);

    const request = fetchPage(null, false, version, controller)
      .catch(caughtError => {
        if (version !== requestVersionRef.current || isRequestAborted(caughtError)) return;
        setError(toError(caughtError));
      })
      .finally(() => {
        if (version !== requestVersionRef.current) return;
        setIsInitialLoading(false);
        inFlightRef.current = null;
      });

    inFlightRef.current = request;

    return () => {
      controller.abort();
      if (inFlightRef.current === request) {
        inFlightRef.current = null;
      }
    };
  }, [fetchPage, filterKey, retryNonce]);

  const loadMore = useCallback(async (options?: { retry?: boolean }) => {
    const cursor = nextCursorRef.current;
    if (!cursor || !hasMoreRef.current || inFlightRef.current || (error && !options?.retry)) return;

    const version = requestVersionRef.current;
    const controller = abortControllerRef.current;
    if (!controller) return;

    setIsLoadingMore(true);
    setError(null);
    const request = fetchPage(cursor, true, version, controller)
      .catch(caughtError => {
        if (version !== requestVersionRef.current || isRequestAborted(caughtError)) return;
        setError(toError(caughtError));
      })
      .finally(() => {
        if (version !== requestVersionRef.current) return;
        setIsLoadingMore(false);
        inFlightRef.current = null;
      });

    inFlightRef.current = request;
    await request;
  }, [error, fetchPage]);

  const retry = useCallback(() => setRetryNonce(value => value + 1), []);
  const retryLoadMore = useCallback(() => loadMore({ retry: true }), [loadMore]);

  return {
    cultures,
    totalCount,
    freeCount,
    regionOptions,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    error,
    loadMore,
    retry,
    retryLoadMore,
  };
};
