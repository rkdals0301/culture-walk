'use client';

import { useCultureContext } from '@/context/CultureContext';
import { useCultureFeed } from '@/hooks/useCultureFeed';
import { useExploreLocationControls } from '@/hooks/useExploreLocationControls';
import { useFeedViewportBehavior } from '@/hooks/useFeedViewportBehavior';
import { FormattedCultureListItem } from '@/types/culture';
import { CultureCategoryKey } from '@/utils/cultureCategory';

import React, { useCallback, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import FeedFilterRail from './FeedFilterRail';
import FeedHeader from './FeedHeader';
import FeedResults from './FeedResults';
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
    resetMapFilters,
  } = useCultureContext();
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
    (culture: FormattedCultureListItem) => {
      rememberScrollPosition();
      router.push(`/cultures/${culture.id}`);
    },
    [rememberScrollPosition, router]
  );

  const isFiltered =
    mapCategory !== 'all' ||
    mapRegion !== 'all' ||
    mapFreeOnly ||
    mapSortMode !== 'date' ||
    Boolean(searchQuery) ||
    Boolean(currentLocation);
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
        loadMoreSentinelRef={loadMoreSentinelRef}
        onOpenCulture={handleOpenCulture}
        onResetFilters={resetMapFilters}
        onRetry={retry}
        onRetryLoadMore={retryLoadMore}
      />

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
