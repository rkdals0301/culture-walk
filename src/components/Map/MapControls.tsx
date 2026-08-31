'use client';

import { CULTURE_CATEGORY_OPTIONS, CultureCategoryKey } from '@/utils/cultureCategory';

import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

import MapFindMyLocationIcon from '../../../public/assets/images/map-find-my-location-icon.svg';

export type MapSortMode = 'date' | 'distance';

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
                ? 'h-11 min-w-0 whitespace-nowrap rounded-lg bg-[var(--app-primary)] px-1 text-xs font-semibold text-[var(--app-on-primary)]'
                : 'h-11 min-w-0 whitespace-nowrap rounded-lg border border-[var(--app-border)] px-1 text-xs font-semibold text-[var(--app-muted)] transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
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
          className='h-11 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-2 pr-8 text-xs font-semibold text-[var(--app-text)]'
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
          className='pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--app-muted)]'
          strokeWidth={1.8}
        />
      </div>
      <label
        className={clsx(
          'flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--app-focus)]',
          freeOnly
            ? 'border-[var(--app-primary)]/35 bg-[var(--app-primary)]/10 text-[var(--app-primary)]'
            : 'border-[var(--app-border)] text-[var(--app-muted)]'
        )}
      >
        <input
          type='checkbox'
          checked={freeOnly}
          onChange={event => onFreeOnlyChange(event.target.checked)}
          className='peer sr-only'
        />
        <span className='flex size-4 items-center justify-center rounded-[5px] border border-[var(--app-border)] bg-[var(--app-card)] peer-checked:border-[var(--app-primary)] peer-checked:bg-[var(--app-primary)]'>
          <span className={freeOnly ? 'size-1.5 rounded-[2px] bg-white' : 'hidden'} />
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
    className='flex rounded-lg border border-[var(--app-border)] bg-[var(--app-chip)] p-0.5'
    role='group'
    aria-label='행사 정렬 방식'
  >
    <button
      type='button'
      onClick={() => onChange('date')}
      aria-pressed={mode === 'date'}
      className={
        mode === 'date'
          ? 'h-11 rounded-md bg-[var(--app-card)] px-3 text-xs font-semibold text-[var(--app-text)] shadow-sm'
          : 'h-11 rounded-md px-3 text-xs font-semibold text-[var(--app-muted)]'
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
          ? 'h-11 rounded-md bg-[var(--app-card)] px-3 text-xs font-semibold text-[var(--app-primary)] shadow-sm'
          : 'h-11 rounded-md px-3 text-xs font-semibold text-[var(--app-muted)] disabled:cursor-not-allowed disabled:opacity-45'
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
    disabled={isLocating}
    aria-pressed={isActive}
    aria-label={isActive ? '현재 위치 사용 해제' : '현재 위치 사용'}
    title={isActive ? '현재 위치 사용 해제' : '현재 위치 사용'}
    className={clsx(
      'flex h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition',
      isActive
        ? 'border-[var(--app-primary)]/35 bg-[var(--app-primary)]/10 text-[var(--app-primary)]'
        : 'border-[var(--app-border)] text-[var(--app-muted)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
      isLocating && 'cursor-wait opacity-70'
    )}
  >
    <MapFindMyLocationIcon className={clsx('size-3.5', isLocating && 'animate-spin')} />
    {isLocating ? '위치 확인 중' : isActive ? '위치 사용 중' : '내 위치'}
  </button>
);
