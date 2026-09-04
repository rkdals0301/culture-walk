'use client';

import { CULTURE_CATEGORY_OPTIONS, CultureCategoryKey } from '@/utils/cultureCategory';
import type { MapSortMode } from '@/utils/exploreState';
import { GeoPoint } from '@/utils/geo';

import React from 'react';

import { Calendar, ChevronDown, Compass, Navigation, RotateCcw, Ticket } from 'lucide-react';

interface FeedFilterRailProps {
  selectedCategory: CultureCategoryKey;
  onSelectCategory: (category: CultureCategoryKey) => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  regionOptions: string[];
  isFreeOnly: boolean;
  onToggleFreeOnly: () => void;
  sortMode: MapSortMode;
  onSelectSortMode: (mode: MapSortMode) => void;
  currentLocation: GeoPoint | null;
  onToggleLocation: () => void;
  isLocating: boolean;
  onResetFilters: () => void;
  isFiltered: boolean;
  totalCount: number;
}

const FeedFilterRail = ({
  selectedCategory,
  onSelectCategory,
  selectedRegion,
  onSelectRegion,
  regionOptions,
  isFreeOnly,
  onToggleFreeOnly,
  sortMode,
  onSelectSortMode,
  currentLocation,
  onToggleLocation,
  isLocating,
  onResetFilters,
  isFiltered,
}: FeedFilterRailProps) => {
  return (
    <div className='sticky top-14 sm:top-16 z-20 border-b border-[var(--color-border-primary)] bg-[var(--color-surface-primary)]/95 backdrop-blur-md transition-colors'>
      <div className='mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8'>
        {/* Toss App Horizontal Category Scroll Chips */}
        <div
          className='flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none'
          role='tablist'
          aria-label='문화행사 카테고리'
        >
          {CULTURE_CATEGORY_OPTIONS.map(option => {
            const isSelected = selectedCategory === option.key;

            return (
              <button
                type='button'
                key={option.key}
                role='tab'
                aria-selected={isSelected}
                onClick={() => onSelectCategory(option.key)}
                className={`flex shrink-0 items-center rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all duration-150 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] ${
                  isSelected
                    ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                    : 'bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter & Sort Controls Row */}
        <div className='mt-2 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-primary)] text-xs'>
          <div className='flex flex-wrap items-center gap-2'>
            {/* Region Dropdown */}
            <div className='relative'>
              <select
                aria-label='지역 필터'
                value={selectedRegion}
                onChange={e => onSelectRegion(e.target.value)}
                className='h-8 sm:h-9 appearance-none rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] pl-3 pr-7 text-xs font-semibold text-[var(--color-text-primary)] shadow-2xs transition-colors hover:border-[var(--color-border-control)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]'
              >
                <option value='all'>전국 전체</option>
                {regionOptions.map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden='true'
                className='pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]'
                strokeWidth={2}
              />
            </div>

            {/* Free Only Toggle */}
            <button
              type='button'
              onClick={onToggleFreeOnly}
              aria-pressed={isFreeOnly}
              className={`flex h-8 sm:h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all active:scale-[0.97] ${
                isFreeOnly
                  ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)] font-bold'
                  : 'border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Ticket className='size-3.5' strokeWidth={2} />
              <span>무료만</span>
            </button>

            {/* Location Toggle */}
            <button
              type='button'
              onClick={onToggleLocation}
              disabled={isLocating}
              className={`flex h-8 sm:h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all active:scale-[0.97] ${
                currentLocation
                  ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)] font-bold'
                  : 'border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Compass
                className={`size-3.5 ${isLocating ? 'animate-spin text-[var(--color-brand-primary)]' : ''}`}
                strokeWidth={2}
              />
              <span>{isLocating ? '위치 확인 중...' : currentLocation ? '내 주변' : '내 위치'}</span>
            </button>

            {/* Reset Filters if dirty */}
            {isFiltered && (
              <button
                type='button'
                onClick={onResetFilters}
                className='flex h-8 sm:h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]'
                aria-label='필터 조건 초기화'
              >
                <RotateCcw className='size-3' />
                <span>초기화</span>
              </button>
            )}
          </div>

          {/* Toss Style Segmented Sort Control */}
          <div className='flex items-center rounded-xl bg-[var(--color-surface-chip)] p-0.5 text-xs'>
            <button
              type='button'
              onClick={() => onSelectSortMode('date')}
              aria-pressed={sortMode === 'date'}
              className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1 font-bold transition-all ${
                sortMode === 'date'
                  ? 'border-[var(--color-border-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-hover)] shadow-2xs'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:bg-[var(--color-surface-primary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Calendar className='size-3 stroke-[2.2]' />
              <span>일정순</span>
            </button>
            <button
              type='button'
              onClick={() => {
                if (!currentLocation) {
                  onToggleLocation();
                }
                onSelectSortMode('distance');
              }}
              aria-pressed={sortMode === 'distance'}
              className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1 font-bold transition-all ${
                sortMode === 'distance'
                  ? 'border-[var(--color-border-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-hover)] shadow-2xs'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:bg-[var(--color-surface-primary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Navigation className='size-3 stroke-[2.2]' />
              <span>거리순</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FeedFilterRail);
