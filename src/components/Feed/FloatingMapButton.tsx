'use client';

import { useExploreContext } from '@/context/ExploreContext';
import { getEffectiveMapSortMode } from '@/utils/exploreState';
import { createMapExploreUrl } from '@/utils/mapRoute';

import React from 'react';

import { useRouter } from 'next/navigation';

import { Map as MapIcon } from 'lucide-react';

const FloatingMapButton = () => {
  const router = useRouter();
  const { searchQuery, mapCategory, mapRegion, mapFreeOnly, mapSortMode, currentLocation } = useExploreContext();

  const handleNavigateToMap = () => {
    const targetUrl = createMapExploreUrl('/map', {
      searchQuery,
      mapCategory,
      mapRegion,
      mapFreeOnly,
      sortMode: getEffectiveMapSortMode(mapSortMode, Boolean(currentLocation)),
      mapListScrollTop: 0,
      listOpen: false,
    });
    router.push(targetUrl);
  };

  return (
    <aside aria-label='지도 보기' className='flex w-full justify-center'>
      <button
        type='button'
        onClick={handleNavigateToMap}
        className='flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-5 py-2.5 text-xs font-bold text-[var(--color-brand-on-primary)] shadow-md transition-all duration-200 hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
        aria-label='지도에서 보기'
      >
        <MapIcon className='size-3.5' strokeWidth={2.2} />
        <span className='tracking-tight'>지도에서 보기</span>
      </button>
    </aside>
  );
};

export default React.memo(FloatingMapButton);
