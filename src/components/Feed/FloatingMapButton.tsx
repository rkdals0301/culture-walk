'use client';

import { useCultureContext } from '@/context/CultureContext';
import { serializeMapExploreStateToSearch } from '@/utils/exploreState';

import React from 'react';

import { useRouter } from 'next/navigation';

import { Map as MapIcon } from 'lucide-react';

const FloatingMapButton = () => {
  const router = useRouter();
  const {
    searchQuery,
    mapCategory,
    mapRegion,
    mapFreeOnly,
    mapSortMode,
    currentLocation,
  } = useCultureContext();

  const handleNavigateToMap = () => {
    const serializedSearch = serializeMapExploreStateToSearch({
      searchQuery,
      mapCategory,
      mapRegion,
      mapFreeOnly,
      sortMode: currentLocation ? mapSortMode : mapSortMode === 'distance' ? 'date' : mapSortMode,
      mapListScrollTop: 0,
      listOpen: false,
    });

    const targetUrl = serializedSearch ? `/map?${serializedSearch}` : '/map';
    router.push(targetUrl);
  };

  return (
    <aside
      aria-label='지도 보기'
      className='pointer-events-none fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] z-40 flex justify-center px-4'
    >
      <button
        type='button'
        onClick={handleNavigateToMap}
        className='pointer-events-auto flex items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 py-3 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[var(--color-brand-hover)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'
        aria-label='지도에서 보기'
      >
        <MapIcon className='size-3.5' strokeWidth={2.2} />
        <span className='tracking-tight'>지도 보기</span>
      </button>
    </aside>
  );
};

export default React.memo(FloatingMapButton);
