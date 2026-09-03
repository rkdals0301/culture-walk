'use client';

import clsx from 'clsx';
import { RotateCcw } from 'lucide-react';

export interface MapResultSummaryProps {
  visibleCount: number;
  totalCount: number;
  activeFilterLabels: string[];
  hasActiveFilters: boolean;
  isLoading: boolean;
  onReset: () => void;
  compact?: boolean;
}

const MapResultSummary = ({
  visibleCount,
  totalCount,
  activeFilterLabels,
  hasActiveFilters,
  isLoading,
  onReset,
  compact = false,
}: MapResultSummaryProps) => {
  const contextLabel = activeFilterLabels.length > 0 ? activeFilterLabels.join(' · ') : '전국 전체';

  return (
    <div className={clsx('explore-summary', compact ? 'mt-2' : 'mt-3.5')}>
      <div className='flex items-center justify-between gap-3'>
        <div className='min-w-0'>
          <strong aria-live='polite' aria-atomic='true' className='text-lg font-bold tracking-tight text-[var(--color-text-primary)]'>
            {isLoading ? '행사 불러오는 중...' : `행사 ${visibleCount.toLocaleString()}개`}
          </strong>
        </div>
        <span className='shrink-0 rounded-full bg-[var(--color-surface-chip)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-secondary)]'>
          {isLoading ? '확인 중' : `전체 ${totalCount.toLocaleString()}개`}
        </span>
      </div>

      <div className='mt-2 flex min-h-8 items-center justify-between gap-2 border-t border-[var(--color-border-primary)] pt-2'>
        <p
          className='flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-[var(--color-text-secondary)]'
          aria-live='polite'
          aria-atomic='true'
        >
          <span className='size-1.5 shrink-0 rounded-full bg-[var(--color-brand-primary)]' aria-hidden='true' />
          <span className='truncate'>{isLoading ? '행사 정보를 확인하고 있습니다.' : contextLabel}</span>
        </p>
        {hasActiveFilters && !isLoading && (
          <button
            type='button'
            onClick={onReset}
            className='inline-flex min-h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-xs font-bold text-[var(--color-brand-primary)] transition-colors hover:bg-[var(--color-brand-subtle)] active:opacity-75'
          >
            <RotateCcw aria-hidden='true' className='size-3' strokeWidth={2} />
            초기화
          </button>
        )}
      </div>
    </div>
  );
};

export default MapResultSummary;
