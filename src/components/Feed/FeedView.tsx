'use client';

import { useCultureContext } from '@/context/CultureContext';
import { useCultureFeed } from '@/hooks/useCultureFeed';
import { FormattedCulture } from '@/types/culture';
import { CultureCategoryKey } from '@/utils/cultureCategory';
import { getEffectiveMapSortMode, serializeMapExploreStateToSearch } from '@/utils/exploreState';

import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { CalendarX, Search } from 'lucide-react';

import FeedCultureCard from './FeedCultureCard';
import FeedFilterRail from './FeedFilterRail';
import FeedHeader from './FeedHeader';
import FeedSkeleton from './FeedSkeleton';
import FloatingMapButton from './FloatingMapButton';
import ScrollToTopButton from './ScrollToTopButton';

const FeedView = () => {
  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
    mapCategory,
    setMapCategory,
    mapRegion,
    setMapRegion,
    mapFreeOnly,
    setMapFreeOnly,
    mapSortMode,
    currentLocation,
    requestLocation,
    cancelLocation,
    locationStatus,
    resetMapFilters,
  } = useCultureContext();
  const {
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
  } = useCultureFeed({
    searchQuery,
    category: mapCategory,
    region: mapRegion,
    freeOnly: mapFreeOnly,
  });
  const [, startTransition] = useTransition();
  const feedContentRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isLocating = locationStatus === 'requesting';

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 300);
  }, []);

  const handleScrollToTop = useCallback(() => {
    if (feedContentRef.current) {
      feedContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const focusSearch = () => {
      const feedContent = feedContentRef.current;
      if (feedContent) {
        feedContent.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => {
        const input = document.getElementById('feed-search-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get('focus') === 'search') {
      focusSearch();
    }

    window.addEventListener('cw:focus-feed-search', focusSearch);
    return () => {
      window.removeEventListener('cw:focus-feed-search', focusSearch);
    };
  }, []);

  useEffect(() => {
    const root = feedContentRef.current;
    const sentinel = loadMoreSentinelRef.current;
    if (!root || !sentinel || !hasMore || isInitialLoading || error) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { root, rootMargin: '720px 0px', threshold: 0 }
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [error, hasMore, isInitialLoading, loadMore]);

  const handleSelectCategory = useCallback(
    (category: CultureCategoryKey) => {
      startTransition(() => {
        setMapCategory(category);
      });
    },
    [setMapCategory]
  );

  const handleSelectRegion = useCallback(
    (region: string) => {
      startTransition(() => {
        setMapRegion(region);
      });
    },
    [setMapRegion]
  );

  const handleToggleFreeOnly = useCallback(() => {
    startTransition(() => {
      setMapFreeOnly(!mapFreeOnly);
    });
  }, [mapFreeOnly, setMapFreeOnly]);

  const handleToggleLocation = useCallback(async () => {
    if (locationStatus === 'requesting') {
      cancelLocation();
      return;
    }
    await requestLocation();
  }, [cancelLocation, locationStatus, requestLocation]);

  const handleOpenCulture = useCallback(
    (culture: FormattedCulture) => {
      const serializedSearch = serializeMapExploreStateToSearch({
        searchQuery,
        mapCategory,
        mapRegion,
        mapFreeOnly,
        sortMode: getEffectiveMapSortMode(mapSortMode, Boolean(currentLocation)),
        mapListScrollTop: 0,
        listOpen: false,
      });

      const detailUrl = serializedSearch ? `/map/${culture.id}?${serializedSearch}` : `/map/${culture.id}`;
      router.push(detailUrl);
    },
    [currentLocation, mapCategory, mapFreeOnly, mapRegion, mapSortMode, router, searchQuery]
  );

  const isFiltered = mapCategory !== 'all' || mapRegion !== 'all' || mapFreeOnly || Boolean(searchQuery);
  const handleClearSearch = useCallback(() => setSearchQuery(''), [setSearchQuery]);

  return (
    <div
      ref={feedContentRef}
      id='feed-content'
      onScroll={handleScroll}
      className='relative h-full overflow-y-auto bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'
    >
      {/* Editorial Header with Inline Search */}
      <FeedHeader
        totalCount={totalCount}
        freeCount={freeCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={handleClearSearch}
      />

      {/* Sticky Interactive Filter Bar (Airbnb style) */}
      <FeedFilterRail
        selectedCategory={mapCategory}
        onSelectCategory={handleSelectCategory}
        selectedRegion={mapRegion}
        onSelectRegion={handleSelectRegion}
        regionOptions={regionOptions}
        isFreeOnly={mapFreeOnly}
        onToggleFreeOnly={handleToggleFreeOnly}
        currentLocation={currentLocation}
        onToggleLocation={handleToggleLocation}
        isLocating={isLocating}
        onResetFilters={resetMapFilters}
        isFiltered={isFiltered}
        totalCount={totalCount}
      />

      {/* Main Grid Content Area */}
      <main className='mx-auto max-w-7xl px-4 py-5 pb-28 sm:px-6 sm:py-6 sm:pb-32 lg:px-8'>
        {/* Clean results count indicator */}
        <div className='mb-4 flex items-center justify-between text-xs font-semibold text-[var(--color-text-tertiary)]'>
          <span>행사 {totalCount.toLocaleString('ko-KR')}개</span>
        </div>

        {/* Loading Skeleton State */}
        {isInitialLoading && <FeedSkeleton count={20} />}

        {/* Error State */}
        {!isInitialLoading && error && cultures.length === 0 && (
          <div className='flex min-h-[360px] flex-col items-center justify-center gap-3 text-center'>
            <CalendarX className='size-10 text-[var(--color-text-tertiary)] opacity-50' />
            <p className='text-sm font-bold text-[var(--color-text-primary)]'>행사 정보를 불러오지 못했습니다</p>
            <p className='text-xs text-[var(--color-text-secondary)]'>네트워크 상태를 확인하고 다시 시도해 주세요.</p>
            <button
              type='button'
              onClick={retry}
              className='mt-2 rounded-lg bg-[var(--color-text-primary)] px-4 py-2 text-xs font-bold text-[var(--color-text-inverse)] shadow-xs'
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isInitialLoading && !error && cultures.length === 0 && (
          <div className='flex min-h-[360px] flex-col items-center justify-center gap-3 text-center py-12'>
            <Search className='size-10 text-[var(--color-text-tertiary)] opacity-50' />
            <h3 className='text-base font-bold text-[var(--color-text-primary)]'>조건에 맞는 행사가 없습니다</h3>
            <p className='text-xs text-[var(--color-text-secondary)] max-w-sm'>
              선택한 카테고리나 지역에 해당하는 행사가 없습니다. 다른 조건으로 검색하거나 필터를 초기화해 보세요.
            </p>
            {isFiltered && (
              <button
                type='button'
                onClick={resetMapFilters}
                className='mt-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-4 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:border-[var(--color-border-control)] transition-colors'
              >
                모든 필터 초기화
              </button>
            )}
          </div>
        )}

        {/* Culture Cards Grid (Mobile First 2-column) */}
        {!isInitialLoading && cultures.length > 0 && (
          <div className='feed-results-enter grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
            {cultures.map((culture, index) => (
              <FeedCultureCard
                key={culture.id}
                culture={culture}
                currentLocation={currentLocation}
                onOpenCulture={handleOpenCulture}
                isAboveFold={index < 5}
              />
            ))}
          </div>
        )}

        {cultures.length > 0 && error && (
          <div className='mt-8 flex flex-col items-center gap-2 text-center' role='alert'>
            <p className='text-sm font-semibold text-[var(--color-text-secondary)]'>더 많은 행사를 불러오지 못했습니다.</p>
            <button
              type='button'
              onClick={() => void retryLoadMore()}
              className='rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-4 py-2 text-xs font-bold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-control)]'
            >
              다시 불러오기
            </button>
          </div>
        )}

        {cultures.length > 0 && hasMore && !error && (
          <div ref={loadMoreSentinelRef} className='mt-8 min-h-10' aria-hidden='true'>
            {isLoadingMore && <FeedSkeleton count={20} />}
          </div>
        )}
      </main>

      {/* Floating Map Switcher */}
      <FloatingMapButton />

      {/* Floating Scroll to Top Button */}
      <div className='fixed right-4 sm:right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] z-40'>
        <ScrollToTopButton visible={showScrollTop} onClick={handleScrollToTop} />
      </div>
    </div>
  );
};

export default FeedView;
