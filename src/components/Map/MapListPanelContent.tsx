import CultureList from '@/components/Header/CultureList';
import CultureListLoading from '@/components/Header/CultureListLoading';
import type { FormattedCultureListItem } from '@/types/culture';
import type { GeoPoint } from '@/utils/geo';

import { AlertCircle } from 'lucide-react';

interface MapListPanelContentProps {
  cultures: FormattedCultureListItem[];
  currentLocation: GeoPoint | null;
  error: Error | null;
  hasActiveFilters: boolean;
  initialScrollTop: number;
  isClustered: boolean;
  isLoading: boolean;
  onItemClick: (culture: FormattedCultureListItem) => void;
  onResetFilters: () => void;
  onRetry: () => void;
  onScrollPositionChange: (scrollTop: number) => void;
  selectedCultureId: number | null;
}

const MapListPanelContent = ({
  cultures,
  currentLocation,
  error,
  hasActiveFilters,
  initialScrollTop,
  isClustered,
  isLoading,
  onItemClick,
  onResetFilters,
  onRetry,
  onScrollPositionChange,
  selectedCultureId,
}: MapListPanelContentProps) => {
  if (isLoading) {
    return <CultureListLoading />;
  }

  if (error) {
    return (
      <div
        className='status-callout status-callout-shell flex h-full items-center justify-center px-4 sm:px-6'
        data-status='api-error'
        role='alert'
      >
        <div className='status-callout-card w-full rounded-[1.25rem] p-5 text-left'>
          <div className='status-callout-icon' aria-hidden='true'>
            <AlertCircle className='size-5' strokeWidth={2} />
          </div>
          <p className='mt-4 text-base font-semibold'>행사 데이터를 불러오지 못했습니다.</p>
          <p className='mt-2 text-sm leading-6 text-[var(--color-text-secondary)]'>
            잠시 후 다시 시도하거나 페이지를 새로고침해 주세요.
          </p>
          <button
            type='button'
            onClick={onRetry}
            className='mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-brand-on-primary)] transition hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)]'
          >
            다시 불러오기
          </button>
        </div>
      </div>
    );
  }

  if (isClustered) {
    return (
      <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
        <p className='text-base font-semibold'>행사 밀집 지역을 표시하고 있습니다.</p>
        <p className='mt-2 max-w-xs text-sm leading-6 text-[var(--color-text-secondary)]'>
          지도에서 원하는 지역을 눌러 확대하면 해당 지역의 행사 목록을 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  if (cultures.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
        <p className='text-base font-semibold'>
          {hasActiveFilters ? '조건에 맞는 행사가 없습니다.' : '표시할 행사가 없습니다.'}
        </p>
        <p className='mt-2 max-w-xs text-sm leading-6 text-[var(--color-text-secondary)]'>
          {hasActiveFilters ? '검색어를 지우거나 지역·분류 조건을 넓혀보세요.' : '잠시 후 다시 확인해 주세요.'}
        </p>
        <button
          type='button'
          onClick={onResetFilters}
          className='mt-4 inline-flex min-h-11 items-center rounded-lg bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-brand-on-primary)] transition hover:bg-[var(--color-brand-hover)]'
        >
          {hasActiveFilters ? '조건 초기화' : '필터 초기화'}
        </button>
      </div>
    );
  }

  return (
    <CultureList
      cultures={cultures}
      onItemClick={onItemClick}
      selectedCultureId={selectedCultureId}
      currentLocation={currentLocation}
      initialScrollTop={initialScrollTop}
      onScrollPositionChange={onScrollPositionChange}
    />
  );
};

export default MapListPanelContent;
