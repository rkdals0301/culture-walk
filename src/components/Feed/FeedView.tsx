'use client';

import Loader from '@/components/Loader/Loader';
import { useCultureContext } from '@/context/CultureContext';
import { useCultures } from '@/hooks/cultureHooks';
import { FormattedCulture } from '@/types/culture';
import { CultureCategoryKey } from '@/utils/cultureCategory';
import { MapSortMode, serializeMapExploreStateToSearch } from '@/utils/exploreState';

import React, { useCallback, useEffect, useMemo, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { CalendarX, Search } from 'lucide-react';

import FeedCultureCard from './FeedCultureCard';
import FeedFilterRail from './FeedFilterRail';
import FeedHeader from './FeedHeader';
import FeedSkeleton from './FeedSkeleton';
import FloatingMapButton from './FloatingMapButton';

const FeedView = () => {
  const router = useRouter();
  const {
    cultures,
    mapCultures,
    searchQuery,
    setSearchQuery,
    mapCategory,
    setMapCategory,
    mapRegion,
    setMapRegion,
    mapFreeOnly,
    setMapFreeOnly,
    mapSortMode,
    setMapSortMode,
    currentLocation,
    requestLocation,
    cancelLocation,
    locationStatus,
    resetMapFilters,
  } = useCultureContext();

  const { isLoading, error } = useCultures();
  const [, startTransition] = useTransition();

  const isLocating = locationStatus === 'requesting';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const focusSearch = () => {
      const feedContent = document.getElementById('feed-content');
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

  const regionOptions = useMemo(
    () =>
      Array.from(new Set(cultures.map(culture => (culture.guName ?? '').split(/\s+/)[0]).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, 'ko')
      ),
    [cultures]
  );

  const freeCount = useMemo(() => {
    return cultures.filter(c => c.isFree.includes('무료') || c.useFee?.includes('무료')).length;
  }, [cultures]);

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

  const handleSelectSortMode = useCallback(
    (mode: MapSortMode) => {
      startTransition(() => {
        setMapSortMode(mode);
      });
    },
    [setMapSortMode]
  );

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
        sortMode: currentLocation ? mapSortMode : mapSortMode === 'distance' ? 'date' : mapSortMode,
        mapListScrollTop: 0,
        listOpen: false,
      });

      const detailUrl = serializedSearch ? `/map/${culture.id}?${serializedSearch}` : `/map/${culture.id}`;
      router.push(detailUrl);
    },
    [currentLocation, mapCategory, mapFreeOnly, mapRegion, mapSortMode, router, searchQuery]
  );

  const isFiltered = mapCategory !== 'all' || mapRegion !== 'all' || mapFreeOnly || Boolean(searchQuery);

  return (
    <div id='feed-content' className='relative h-full overflow-y-auto bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'>
      {/* Editorial Header with Inline Search */}
      <FeedHeader
        totalCount={cultures.length}
        freeCount={freeCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
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
        sortMode={mapSortMode}
        onSelectSortMode={handleSelectSortMode}
        currentLocation={currentLocation}
        onToggleLocation={handleToggleLocation}
        isLocating={isLocating}
        onResetFilters={resetMapFilters}
        isFiltered={isFiltered}
        totalCount={mapCultures.length}
      />

      {/* Main Grid Content Area */}
      <main className='mx-auto max-w-7xl px-4 py-5 pb-28 sm:px-6 sm:py-6 sm:pb-32 lg:px-8'>
        {/* Clean results count indicator */}
        <div className='mb-4 flex items-center justify-between text-xs font-semibold text-[var(--color-text-tertiary)]'>
          <span>행사 {mapCultures.length.toLocaleString('ko-KR')}개</span>
        </div>

        {/* Loading Skeleton State */}
        {isLoading && <FeedSkeleton count={15} />}

        {/* Error State */}
        {!isLoading && error && (
          <div className='flex min-h-[360px] flex-col items-center justify-center gap-3 text-center'>
            <CalendarX className='size-10 text-[var(--color-text-tertiary)] opacity-50' />
            <p className='text-sm font-bold text-[var(--color-text-primary)]'>행사 정보를 불러오지 못했습니다</p>
            <p className='text-xs text-[var(--color-text-secondary)]'>네트워크 상태를 확인하고 다시 시도해 주세요.</p>
            <button
              type='button'
              onClick={() => window.location.reload()}
              className='mt-2 rounded-lg bg-[var(--color-text-primary)] px-4 py-2 text-xs font-bold text-[var(--color-text-inverse)] shadow-xs'
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && mapCultures.length === 0 && (
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
        {!isLoading && !error && mapCultures.length > 0 && (
          <div className='grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
            {mapCultures.map(culture => (
              <FeedCultureCard
                key={culture.id}
                culture={culture}
                currentLocation={currentLocation}
                onOpenCulture={handleOpenCulture}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Map Switcher */}
      <FloatingMapButton />
    </div>
  );
};

export default FeedView;
