'use client';

import { CULTURE_CATEGORY_OPTIONS, type CultureCategoryKey } from '@/utils/cultureCategory';
import type { MapSortMode } from '@/utils/exploreState';
import clsx from 'clsx';
import { Calendar, ChevronDown, Compass, Navigation, RotateCcw, Ticket } from 'lucide-react';
import React from 'react';

interface CategoryChipsProps {
  selected: CultureCategoryKey;
  onSelect: (category: CultureCategoryKey) => void;
  layout?: 'scroll' | 'grid';
  size?: 'sm' | 'md';
}

export const CategoryChips = ({
  selected,
  onSelect,
  layout = 'scroll',
  size = 'md',
}: CategoryChipsProps) => {
  return (
    <div
      className={clsx(
        layout === 'scroll'
          ? 'flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none'
          : 'grid grid-cols-5 gap-1.5'
      )}
      role='tablist'
      aria-label='문화행사 카테고리'
    >
      {CULTURE_CATEGORY_OPTIONS.map(option => {
        const isSelected = selected === option.key;
        return (
          <button
            type='button'
            key={option.key}
            role='tab'
            aria-selected={isSelected}
            onClick={() => onSelect(option.key)}
            className={clsx(
              'flex shrink-0 items-center justify-center rounded-full font-bold transition-all duration-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]',
              size === 'sm'
                ? 'h-8 px-1.5 text-[0.72rem]'
                : 'h-8.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm',
              isSelected
                ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                : 'border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            <span className='truncate'>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

interface RegionSelectProps {
  region: string;
  regionOptions: string[];
  onChange: (region: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const RegionSelect = ({
  region,
  regionOptions,
  onChange,
  size = 'md',
  className,
}: RegionSelectProps) => {
  return (
    <div className={clsx('relative', className ? className : 'shrink-0')}>
      <select
        aria-label='지역 필터'
        value={region}
        onChange={e => onChange(e.target.value)}
        className={clsx(
          'appearance-none rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] font-bold text-[var(--color-text-primary)] shadow-2xs transition-colors hover:border-[var(--color-border-control)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]',
          className?.includes('w-full') ? 'w-full' : '',
          size === 'sm' ? 'h-8 pl-2.5 pr-6 text-[0.72rem]' : 'h-8 sm:h-9 pl-3 pr-7 text-xs'
        )}
      >
        <option value='all'>전국 전체</option>
        {regionOptions.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden='true'
        className={clsx(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]',
          size === 'sm' ? 'right-1.5 size-3.5' : 'right-2 size-3.5'
        )}
        strokeWidth={2}
      />
    </div>
  );
};

interface FreeOnlyToggleProps {
  isFreeOnly: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

export const FreeOnlyToggle = ({
  isFreeOnly,
  onToggle,
  size = 'md',
}: FreeOnlyToggleProps) => {
  return (
    <button
      type='button'
      onClick={onToggle}
      aria-pressed={isFreeOnly}
      className={clsx(
        'flex shrink-0 items-center gap-1.5 rounded-xl border font-bold transition-all active:scale-95',
        size === 'sm' ? 'h-8 px-2 text-[0.72rem]' : 'h-8 sm:h-9 px-3 text-xs',
        isFreeOnly
          ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)] shadow-xs'
          : 'border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:text-[var(--color-text-primary)]'
      )}
    >
      <Ticket className='size-3.5' strokeWidth={2} />
      <span>무료만</span>
    </button>
  );
};

interface LocationToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  isLocating: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
  compact?: boolean;
}

export const LocationToggle = ({
  isActive,
  isLocating,
  onToggle,
  size = 'md',
  compact = false,
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  title,
  ...rest
}: LocationToggleProps) => {
  const defaultLabel = isLocating ? '위치 확인 취소' : isActive ? '내 주변 해제' : '내 위치';
  const effectiveLabel = ariaLabel ?? defaultLabel;
  const effectiveTitle = title ?? effectiveLabel;

  return (
    <button
      type='button'
      onClick={onToggle}
      disabled={isLocating}
      aria-pressed={ariaPressed ?? isActive}
      aria-label={effectiveLabel}
      title={effectiveTitle}
      {...rest}
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-xl border font-bold transition-all active:scale-95',
        size === 'sm' ? 'h-8 px-2.5 text-[0.72rem] gap-1' : 'h-8 sm:h-9 px-3 text-xs gap-1.5',
        compact && 'px-2',
        isActive
          ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)] shadow-xs'
          : 'border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:text-[var(--color-text-primary)]',
        isLocating &&
          'cursor-pointer border-[var(--color-disabled-border)] bg-[var(--color-interactive-disabled)] text-[var(--color-text-disabled)]'
      )}
    >
      <Compass
        className={clsx('size-3.5', isLocating && 'animate-spin text-[var(--color-brand-primary)]')}
        strokeWidth={2}
      />
      {!compact && <span>{isLocating ? '확인 중...' : isActive ? '내 주변' : '내 위치'}</span>}
    </button>
  );
};

interface ResetFiltersButtonProps {
  onReset: () => void;
  size?: 'sm' | 'md';
}

export const ResetFiltersButton = ({
  onReset,
  size = 'md',
}: ResetFiltersButtonProps) => {
  return (
    <button
      type='button'
      onClick={onReset}
      className={clsx(
        'flex shrink-0 items-center gap-1 rounded-xl font-bold text-[var(--color-brand-primary)] transition-colors hover:bg-[var(--color-surface-chip)] active:scale-95',
        size === 'sm' ? 'h-8 px-2 text-[0.72rem]' : 'h-8 sm:h-9 px-2.5 text-xs'
      )}
      aria-label='필터 조건 초기화'
    >
      <RotateCcw className='size-3' />
      <span>초기화</span>
    </button>
  );
};

export interface SortControlProps {
  mode: MapSortMode;
  hasLocation: boolean;
  isLocating: boolean;
  onChange: (mode: MapSortMode) => void;
  size?: 'sm' | 'md';
}

export const SortControl = ({
  mode,
  hasLocation,
  isLocating,
  onChange,
  size = 'md',
}: SortControlProps) => (
  <div
    className='flex shrink-0 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] p-0.5'
    role='group'
    aria-label='행사 정렬 방식'
  >
    <button
      type='button'
      onClick={() => onChange('date')}
      aria-pressed={mode === 'date'}
      className={clsx(
        'flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg font-bold transition-all duration-150 active:scale-95',
        size === 'sm' ? 'h-7 px-2 text-[0.72rem]' : 'h-7 sm:h-8 px-2.5 text-xs',
        mode === 'date'
          ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
      )}
    >
      <Calendar className={size === 'sm' ? 'size-3' : 'size-3.5'} strokeWidth={2} />
      <span>일정순</span>
    </button>
    <button
      type='button'
      onClick={() => onChange('distance')}
      disabled={isLocating}
      aria-pressed={mode === 'distance'}
      aria-label={hasLocation ? '거리순으로 정렬' : '현재 위치를 확인하고 거리순으로 정렬'}
      title={hasLocation ? '거리순으로 정렬' : '현재 위치를 확인하고 거리순으로 정렬'}
      className={clsx(
        'flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg font-bold transition-all duration-150 active:scale-95',
        size === 'sm' ? 'h-7 px-2 text-[0.72rem]' : 'h-7 sm:h-8 px-2.5 text-xs',
        mode === 'distance'
          ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:text-[var(--color-text-disabled)]'
      )}
    >
      <Navigation className={size === 'sm' ? 'size-3' : 'size-3.5'} strokeWidth={2} />
      <span>거리순</span>
    </button>
  </div>
);

