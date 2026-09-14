import type { CultureFeedFilters } from '@/services/cultureFeed';
import type { CultureFeedPage, FormattedCultureListItem } from '@/types/culture';
import { getJson, isRequestAbortError } from '@/utils/apiClient';
import { CultureCategoryKey } from '@/utils/cultureCategory';
import { formatCultureData } from '@/utils/cultureUtils';
import type { MapSortMode } from '@/utils/exploreState';
import type { GeoPoint } from '@/utils/geo';
import { cultureFeedClientCache } from '@/utils/cultureFeedClientCache';
import {
  createCultureFeedClientCacheKey,
  createCultureFeedClientFilters,
  createCultureFeedRequestParams,
  mergeCultureFeedItems,
} from '@/utils/cultureFeedClientRequest';
import { startCultureFeedRequestSession } from '@/utils/cultureFeedRequestLifecycle';

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';

const SEARCH_DEBOUNCE_MS = 250;

interface UseCultureFeedOptions {
  searchQuery: string;
  category: CultureCategoryKey;
  region: string;
  freeOnly: boolean;
  sortMode?: MapSortMode;
  currentLocation?: GeoPoint | null;
}

const toError = (error: unknown) => (error instanceof Error ? error : new Error('문화 목록 조회에 실패했습니다.'));

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
    () =>
      createCultureFeedClientFilters({
        searchQuery: debouncedSearchQuery,
        category,
        region,
        freeOnly,
        sortMode,
        currentLocation,
      }),
    [category, currentLocation, debouncedSearchQuery, freeOnly, region, sortMode]
  );

  const filterKey = useMemo(() => createCultureFeedClientCacheKey(filters), [filters]);

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
      const page = await getJson<CultureFeedPage>('/api/cultures/feed', {
        params: createCultureFeedRequestParams(filters, cursor),
        signal: controller.signal,
      });

      if (version !== requestVersionRef.current) return;

      const nextItems = formatCultureData(page.items ?? []);

      setCultures(current => {
        if (version !== requestVersionRef.current) return current;

        const resolvedCultures = mergeCultureFeedItems(current, nextItems, append);

        cultureFeedClientCache.write(filterKey, {
          cultures: resolvedCultures,
          totalCount: page.totalCount,
          freeCount: page.freeCount,
          regionOptions: page.regionOptions ?? [],
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
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
    const { version, controller } = startCultureFeedRequestSession(
      requestVersionRef.current,
      abortControllerRef.current
    );
    requestVersionRef.current = version;
    abortControllerRef.current = controller;
    inFlightRef.current = null;

    const cachedEntry = cultureFeedClientCache.read(filterKey);

    if (cachedEntry) {
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
      return () => {
        controller.abort();
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      };
    }

    nextCursorRef.current = null;
    hasMoreRef.current = true;
    setCultures([]);
    setTotalCount(0);
    setFreeCount(0);
    setHasMore(true);
    setError(null);
    setIsInitialLoading(true);
    setIsLoadingMore(false);

    const request = fetchPage(null, false, version, controller)
      .catch(caughtError => {
        if (version !== requestVersionRef.current || isRequestAbortError(caughtError)) return;
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
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
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
        if (version !== requestVersionRef.current || isRequestAbortError(caughtError)) return;
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

  const retry = useCallback(() => {
    cultureFeedClientCache.invalidate(filterKey);
    setRetryNonce(value => value + 1);
  }, [filterKey]);
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
