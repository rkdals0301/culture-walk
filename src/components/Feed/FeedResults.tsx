import type { FormattedCultureListItem } from '@/types/culture';
import type { GeoPoint } from '@/utils/geo';

import type { RefObject } from 'react';

import { CalendarX, Search } from 'lucide-react';

import FeedCultureCard from './FeedCultureCard';
import FeedSkeleton from './FeedSkeleton';

interface FeedResultsProps {
  cultures: FormattedCultureListItem[];
  totalCount: number;
  currentLocation?: GeoPoint | null;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: unknown;
  isFiltered: boolean;
  loadMoreSentinelRef: RefObject<HTMLDivElement | null>;
  onOpenCulture: (culture: FormattedCultureListItem) => void;
  onResetFilters: () => void;
  onRetry: () => void;
  onRetryLoadMore: () => Promise<unknown> | unknown;
}

const FeedResults = ({
  cultures,
  totalCount,
  currentLocation,
  isInitialLoading,
  isLoadingMore,
  hasMore,
  error,
  isFiltered,
  loadMoreSentinelRef,
  onOpenCulture,
  onResetFilters,
  onRetry,
  onRetryLoadMore,
}: FeedResultsProps) => (
  <main className='mx-auto max-w-7xl px-4 py-5 pb-28 sm:px-6 sm:py-6 sm:pb-32 lg:px-8'>
    <div className='mb-4 flex items-center justify-between text-xs font-semibold text-[var(--color-text-tertiary)]'>
      <span>행사 {totalCount.toLocaleString('ko-KR')}개</span>
    </div>

    {isInitialLoading && <FeedSkeleton count={20} />}

    {!isInitialLoading && Boolean(error) && cultures.length === 0 && (
      <div className='flex min-h-[360px] flex-col items-center justify-center gap-3 text-center'>
        <CalendarX className='size-10 text-[var(--color-text-tertiary)] opacity-50' />
        <p className='text-sm font-bold text-[var(--color-text-primary)]'>행사 정보를 불러오지 못했습니다</p>
        <p className='text-xs text-[var(--color-text-secondary)]'>네트워크 상태를 확인하고 다시 시도해 주세요.</p>
        <button
          type='button'
          onClick={onRetry}
          className='mt-2 rounded-lg bg-[var(--color-text-primary)] px-4 py-2 text-xs font-bold text-[var(--color-text-inverse)] shadow-xs'
        >
          다시 시도
        </button>
      </div>
    )}

    {!isInitialLoading && !Boolean(error) && cultures.length === 0 && (
      <div className='flex min-h-[360px] flex-col items-center justify-center gap-3 py-12 text-center'>
        <Search className='size-10 text-[var(--color-text-tertiary)] opacity-50' />
        <h3 className='text-base font-bold text-[var(--color-text-primary)]'>조건에 맞는 행사가 없습니다</h3>
        <p className='max-w-sm text-xs text-[var(--color-text-secondary)]'>
          선택한 카테고리나 지역에 해당하는 행사가 없습니다. 다른 조건으로 검색하거나 필터를 초기화해 보세요.
        </p>
        {isFiltered && (
          <button
            type='button'
            onClick={onResetFilters}
            className='mt-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-4 py-2 text-xs font-bold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-control)]'
          >
            모든 필터 초기화
          </button>
        )}
      </div>
    )}

    {!isInitialLoading && cultures.length > 0 && (
      <div className='feed-results-enter grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
        {cultures.map((culture, index) => (
          <FeedCultureCard
            key={culture.id}
            culture={culture}
            currentLocation={currentLocation}
            onOpenCulture={onOpenCulture}
            isAboveFold={index < 4}
          />
        ))}
      </div>
    )}

    {cultures.length > 0 && Boolean(error) && (
      <div className='mt-8 flex flex-col items-center gap-2 text-center' role='alert'>
        <p className='text-sm font-semibold text-[var(--color-text-secondary)]'>더 많은 행사를 불러오지 못했습니다.</p>
        <button
          type='button'
          onClick={() => void onRetryLoadMore()}
          className='rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-4 py-2 text-xs font-bold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-control)]'
        >
          다시 불러오기
        </button>
      </div>
    )}

    {cultures.length > 0 && hasMore && !Boolean(error) && (
      <div ref={loadMoreSentinelRef} className='mt-8 min-h-10' aria-hidden='true'>
        {isLoadingMore && <FeedSkeleton count={20} />}
      </div>
    )}
  </main>
);

export default FeedResults;
