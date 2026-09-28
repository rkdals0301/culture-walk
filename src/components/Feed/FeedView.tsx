'use client';

import { useExploreContext } from '@/context/ExploreContext';
import { useCultureFeed } from '@/hooks/useCultureFeed';
import { useExploreLocationControls } from '@/hooks/useExploreLocationControls';
import { useFeedViewportBehavior } from '@/hooks/useFeedViewportBehavior';
import type { CultureFeedPage, FormattedCultureListItem } from '@/types/culture';
import { CultureCategoryKey } from '@/utils/cultureCategory';

import React, { useCallback, useTransition } from 'react';

import FeedFilterRail from './FeedFilterRail';
import FeedHeader from './FeedHeader';
import FeedResults from './FeedResults';
import FloatingMapButton from './FloatingMapButton';
import ScrollToTopButton from './ScrollToTopButton';

interface FeedViewProps {
  initialData?: CultureFeedPage;
  initialDataFilterKey?: string;
}

const FeedView = ({ initialData, initialDataFilterKey }: FeedViewProps) => {
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
    resetMapFilters,
  } = useExploreContext();
  const { changeSortMode, isLocating, toggleLocation } = useExploreLocationControls();
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
    sortMode: mapSortMode,
    currentLocation,
    initialData,
    initialDataFilterKey,
  });
  const [, startTransition] = useTransition();
  const {
    feedContentRef,
    loadMoreSentinelRef,
    showScrollTop,
    handleScroll,
    handleScrollToTop,
    rememberScrollPosition,
  } = useFeedViewportBehavior({
    cultureCount: cultures.length,
    hasMore,
    isInitialLoading,
    error,
    loadMore,
  });

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

  const handleOpenCulture = useCallback(
    (_culture: FormattedCultureListItem) => rememberScrollPosition(),
    [rememberScrollPosition]
  );

  const isFiltered =
    mapCategory !== 'all' ||
    mapRegion !== 'all' ||
    mapFreeOnly ||
    mapSortMode !== 'date' ||
    Boolean(searchQuery) ||
    Boolean(currentLocation);
  const hasNonSearchFilters =
    mapCategory !== 'all' || mapRegion !== 'all' || mapFreeOnly || mapSortMode !== 'date' || Boolean(currentLocation);
  const handleClearSearch = useCallback(() => setSearchQuery(''), [setSearchQuery]);

  return (
    <div className='relative flex h-full min-h-0 flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'>
      <div ref={feedContentRef} id='feed-content' onScroll={handleScroll} className='min-h-0 flex-1 overflow-y-auto'>
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
          onToggleLocation={toggleLocation}
          isLocating={isLocating}
          onResetFilters={resetMapFilters}
          isFiltered={isFiltered}
          totalCount={totalCount}
          sortMode={mapSortMode}
          onChangeSortMode={changeSortMode}
        />

        <FeedResults
          cultures={cultures}
          totalCount={totalCount}
          currentLocation={currentLocation}
          isInitialLoading={isInitialLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          isFiltered={isFiltered}
          hasNonSearchFilters={hasNonSearchFilters}
          searchQuery={searchQuery}
          loadMoreSentinelRef={loadMoreSentinelRef}
          onOpenCulture={handleOpenCulture}
          onClearSearch={handleClearSearch}
          onResetFilters={resetMapFilters}
          onRetry={retry}
          onRetryLoadMore={retryLoadMore}
        />
      </div>

      <footer className='relative z-40 flex shrink-0 items-center justify-center border-t border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-2'>
        <FloatingMapButton />
        <div className='absolute right-4 top-1/2 -translate-y-1/2 sm:right-6'>
          <ScrollToTopButton visible={showScrollTop} onClick={handleScrollToTop} />
        </div>
      </footer>
    </div>
  );
};

export default FeedView;
