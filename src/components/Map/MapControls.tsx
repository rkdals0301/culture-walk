'use client';

import { CULTURE_CATEGORY_OPTIONS, CultureCategoryKey } from '@/utils/cultureCategory';

import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

import MapFindMyLocationIcon from '../../../public/assets/images/map-find-my-location-icon.svg';

import type { MapSortMode } from '@/utils/exploreState';
export type { MapSortMode };

interface MapFilterControlsProps {
  category: CultureCategoryKey;
  freeOnly: boolean;
  region: string;
  regionOptions: string[];
  onCategoryChange: (category: CultureCategoryKey) => void;
  onFreeOnlyChange: (freeOnly: boolean) => void;
  onRegionChange: (region: string) => void;
}

export const MapFilterControls = ({
  category,
  freeOnly,
  region,
  regionOptions,
  onCategoryChange,
  onFreeOnlyChange,
  onRegionChange,
}: MapFilterControlsProps) => (
  <div className='grid gap-2'>
    <div className='grid grid-cols-5 gap-1.5' role='group' aria-label='행사 분류 필터'>
      {CULTURE_CATEGORY_OPTIONS.map(option => {
        const isActive = category === option.key;
        return (
          <button
            key={option.key}
            type='button'
            onClick={() => onCategoryChange(option.key)}
            aria-pressed={isActive}
            className={
              isActive
                ? 'h-11 min-w-0 whitespace-nowrap rounded-lg bg-[var(--color-brand-primary)] px-1 text-xs font-semibold text-[var(--color-brand-on-primary)] transition-colors duration-150'
                : 'h-11 min-w-0 whitespace-nowrap rounded-lg border border-[var(--color-border-control)] px-1 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-interactive-active)]'
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
    <div className='flex items-center gap-2'>
      <div className='relative min-w-0 flex-1'>
        <select
          value={region}
          onChange={event => onRegionChange(event.target.value)}
          aria-label='지역 필터'
          className='h-11 w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 pr-8 text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-input-hover)] focus-visible:border-[var(--color-input-focus)]'
        >
          <option value='all'>전국</option>
          {regionOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden='true'
          className='pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]'
          strokeWidth={1.8}
        />
      </div>
      <label
        className={clsx(
          'flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus-ring)]',
          freeOnly
            ? 'border-[var(--color-border-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]'
            : 'border-[var(--color-border-control)] text-[var(--color-text-secondary)] hover:bg-[var(--color-interactive-hover)]'
        )}
      >
        <input
          type='checkbox'
          checked={freeOnly}
          onChange={event => onFreeOnlyChange(event.target.checked)}
          className='peer sr-only'
        />
        <span className='flex size-4 items-center justify-center rounded-[5px] border border-[var(--color-input-border)] bg-[var(--color-input-bg)] peer-checked:border-[var(--color-brand-primary)] peer-checked:bg-[var(--color-brand-primary)]'>
          <span className={freeOnly ? 'size-1.5 rounded-[2px] bg-[var(--color-brand-on-primary)]' : 'hidden'} />
        </span>
        무료
      </label>
    </div>
  </div>
);

interface MapSortControlProps {
  mode: MapSortMode;
  hasLocation: boolean;
  isLocating: boolean;
  onChange: (mode: MapSortMode) => void;
}

export const MapSortControl = ({ mode, hasLocation, isLocating, onChange }: MapSortControlProps) => (
  <div
    className='flex rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] p-0.5'
    role='group'
    aria-label='행사 정렬 방식'
  >
    <button
      type='button'
      onClick={() => onChange('date')}
      aria-pressed={mode === 'date'}
      className={
        mode === 'date'
          ? 'h-11 rounded-md bg-[var(--color-surface-elevated)] px-3 text-xs font-semibold text-[var(--color-text-primary)] shadow-sm transition-colors duration-150'
          : 'h-11 rounded-md px-3 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-interactive-active)]'
      }
    >
      일정순
    </button>
    <button
      type='button'
      onClick={() => onChange('distance')}
      disabled={isLocating}
      aria-pressed={mode === 'distance'}
      aria-label={hasLocation ? '거리순으로 정렬' : '현재 위치를 확인하고 거리순으로 정렬'}
      title={hasLocation ? '거리순으로 정렬' : '현재 위치를 확인하고 거리순으로 정렬'}
      className={
        mode === 'distance'
          ? 'h-11 rounded-md bg-[var(--color-surface-elevated)] px-3 text-xs font-semibold text-[var(--color-brand-primary)] shadow-sm transition-colors duration-150'
          : 'h-11 rounded-md px-3 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-interactive-active)] disabled:cursor-not-allowed disabled:bg-[var(--color-interactive-disabled)] disabled:text-[var(--color-text-disabled)]'
      }
    >
      거리순
    </button>
  </div>
);

interface MapLocationControlProps {
  isActive: boolean;
  isLocating: boolean;
  onToggle: () => void;
}

export const MapLocationControl = ({ isActive, isLocating, onToggle }: MapLocationControlProps) => (
  <button
    type='button'
    onClick={onToggle}
    aria-pressed={isActive}
    aria-label={isLocating ? '위치 확인 취소' : isActive ? '현재 위치 사용 해제' : '현재 위치 사용'}
    title={isLocating ? '위치 확인 취소' : isActive ? '현재 위치 사용 해제' : '현재 위치 사용'}
    className={clsx(
      'flex h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition',
      isActive
        ? 'border-[var(--color-border-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]'
        : 'border-[var(--color-border-control)] text-[var(--color-text-secondary)] hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)]',
      isLocating &&
        'cursor-pointer border-[var(--color-disabled-border)] bg-[var(--color-interactive-disabled)] text-[var(--color-text-disabled)]'
    )}
  >
    <MapFindMyLocationIcon className={clsx('size-3.5', isLocating && 'animate-spin')} />
     {isLocating ? '취소' : isActive ? '위치 사용 중' : '내 위치'}
  </button>
);
