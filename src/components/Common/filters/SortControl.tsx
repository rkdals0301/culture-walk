'use client';

import type { MapSortMode } from '@/utils/exploreState';
import clsx from 'clsx';
import { Calendar, Navigation } from 'lucide-react';

export interface SortControlProps {
  mode: MapSortMode;
  hasLocation: boolean;
  isLocating: boolean;
  onChange: (mode: MapSortMode) => void;
  size?: 'sm' | 'md';
}

export const SortControl = ({ mode, hasLocation, isLocating, onChange, size = 'md' }: SortControlProps) => (
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
