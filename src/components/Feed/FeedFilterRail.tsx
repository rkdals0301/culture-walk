'use client';

import {
  CategoryChips,
  FreeOnlyToggle,
  LocationToggle,
  RegionSelect,
  ResetFiltersButton,
  SortControl,
} from '@/components/Common/FilterControls';
import { CultureCategoryKey } from '@/utils/cultureCategory';
import type { MapSortMode } from '@/utils/exploreState';
import { GeoPoint } from '@/utils/geo';

import React from 'react';

interface FeedFilterRailProps {
  selectedCategory: CultureCategoryKey;
  onSelectCategory: (category: CultureCategoryKey) => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  regionOptions: string[];
  isFreeOnly: boolean;
  onToggleFreeOnly: () => void;
  currentLocation: GeoPoint | null;
  onToggleLocation: () => void;
  isLocating: boolean;
  onResetFilters: () => void;
  isFiltered: boolean;
  totalCount: number;
  sortMode: MapSortMode;
  onChangeSortMode: (mode: MapSortMode) => void;
}

const FeedFilterRail = ({
  selectedCategory,
  onSelectCategory,
  selectedRegion,
  onSelectRegion,
  regionOptions,
  isFreeOnly,
  onToggleFreeOnly,
  currentLocation,
  onToggleLocation,
  isLocating,
  onResetFilters,
  isFiltered,
  sortMode,
  onChangeSortMode,
}: FeedFilterRailProps) => {
  return (
    <div className='sticky top-14 sm:top-16 z-20 border-b border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] shadow-2xs transition-colors'>
      <div className='mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8'>
        {/* Category Scroll Chips */}
        <CategoryChips
          selected={selectedCategory}
          onSelect={onSelectCategory}
          layout='scroll'
          size='md'
        />

        {/* Secondary Filter & Sort Controls Row */}
        <div className='mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-primary)] pt-2 text-xs'>
          <div className='flex flex-wrap items-center gap-2'>
            <RegionSelect
              region={selectedRegion}
              regionOptions={regionOptions}
              onChange={onSelectRegion}
              size='md'
            />

            <FreeOnlyToggle
              isFreeOnly={isFreeOnly}
              onToggle={onToggleFreeOnly}
              size='md'
            />

            <LocationToggle
              isActive={Boolean(currentLocation)}
              aria-pressed={Boolean(currentLocation)}
              aria-label={isLocating ? '위치 확인 취소' : currentLocation ? '내 주변 해제' : '내 위치'}
              title={isLocating ? '위치 확인 취소' : currentLocation ? '내 주변 해제' : '내 위치'}
              isLocating={isLocating}
              onToggle={onToggleLocation}
              size='md'
            />

            {isFiltered && (
              <ResetFiltersButton
                onReset={onResetFilters}
                size='md'
              />
            )}
          </div>

          <SortControl
            mode={sortMode}
            hasLocation={Boolean(currentLocation)}
            isLocating={isLocating}
            onChange={onChangeSortMode}
            size='md'
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(FeedFilterRail);
