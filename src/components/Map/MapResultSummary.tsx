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
  const contextLabel = activeFilterLabels.length > 0 ? activeFilterLabels.join(' · ') : '전국 · 전체 행사';

  return (
    <div className={clsx('explore-summary', compact ? 'mt-2' : 'mt-4')}>
      <div className='flex items-end justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[var(--color-brand-primary)]'>
            탐색 결과
          </p>
          <p className='mt-1 text-xl font-semibold leading-none tracking-[-0.03em] sm:text-2xl'>
            {isLoading ? (
              <span className='text-base tracking-normal text-[var(--color-text-secondary)]'>행사 불러오는 중</span>
            ) : (
              <>
                <strong aria-live='polite' aria-atomic='true'>
                  {visibleCount}
                </strong>
                <span className='ml-1 text-sm font-medium tracking-normal text-[var(--color-text-secondary)]'>개 행사</span>
              </>
            )}
          </p>
        </div>
        <span className='shrink-0 text-xs font-medium text-[var(--color-text-secondary)]'>
          {isLoading ? '데이터 확인 중' : `전체 ${totalCount}개`}
        </span>
      </div>

      <div className='mt-2.5 flex min-h-11 items-center justify-between gap-2 border-t border-[var(--color-border-primary)] pt-2.5'>
        <p
          className='flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-[var(--color-text-secondary)]'
          aria-live='polite'
          aria-atomic='true'
        >
          <span className='size-1.5 shrink-0 rounded-full bg-[var(--color-accent-primary)]' aria-hidden='true' />
          <span className='truncate'>{isLoading ? '행사 정보를 확인하고 있습니다.' : contextLabel}</span>
        </p>
        {hasActiveFilters && !isLoading && (
          <button
            type='button'
            onClick={onReset}
            className='inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[var(--color-brand-primary)] transition hover:bg-[var(--color-interactive-hover)] active:bg-[var(--color-interactive-active)]'
          >
            <RotateCcw aria-hidden='true' className='size-3.5' strokeWidth={1.8} />
            조건 초기화
          </button>
        )}
      </div>
    </div>
  );
};

export default MapResultSummary;
