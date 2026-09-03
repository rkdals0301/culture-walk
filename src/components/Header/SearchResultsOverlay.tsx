import CultureList from '@/components/Header/CultureList';
import CultureListLoading from '@/components/Header/CultureListLoading';
import { useCultureContext } from '@/context/CultureContext';
import { useCultures } from '@/hooks/cultureHooks';
import { FormattedCulture } from '@/types/culture';
import { serializeMapExploreStateToSearch } from '@/utils/exploreState';

import React from 'react';

import { useRouter } from 'next/navigation';

import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';

interface SearchResultsOverlayProps {
  onCloseWithoutHistory: () => void;
  onResetSearch: () => void;
}

const SearchResultsOverlay = ({ onCloseWithoutHistory, onResetSearch }: SearchResultsOverlayProps) => {
  const router = useRouter();
  const {
    filteredCultures,
    searchQuery,
    mapCategory,
    mapRegion,
    mapFreeOnly,
    mapSortMode,
    mapListScrollTop,
    currentLocation,
  } = useCultureContext();
  const { isLoading, isError } = useCultures();
  const normalizedQuery = searchQuery.trim();

  const handleOnClick = (culture: FormattedCulture) => {
    const serializedSearch = serializeMapExploreStateToSearch({
      searchQuery,
      mapCategory,
      mapRegion,
      mapFreeOnly,
      sortMode: currentLocation ? mapSortMode : mapSortMode === 'distance' ? 'date' : mapSortMode,
      mapListScrollTop,
      listOpen: false,
    });
    onCloseWithoutHistory();
    router.push(`/map/${culture.id}${serializedSearch ? `?${serializedSearch}` : ''}`);
  };

  const renderError = () => (
    <div
      className='status-callout status-callout-shell flex size-full items-center justify-center rounded-2xl p-4 sm:p-8'
      data-status='api-error'
      role='alert'
    >
      <div className='status-callout-card w-full max-w-sm rounded-[1.25rem] p-5'>
        <div className='status-callout-icon' aria-hidden='true'>
          <AlertCircle className='size-5' strokeWidth={2} />
        </div>
        <p className='mt-4 text-sm font-semibold'>검색 결과를 불러오지 못했습니다.</p>
        <p className='mt-2 text-sm leading-6 text-[var(--color-text-secondary)]'>잠시 후 다시 시도해 주세요.</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className='surface-card flex size-full items-center justify-center rounded-2xl p-8 text-center'>
      <div className='max-w-sm'>
        <p className='text-lg font-semibold'>검색 결과가 없습니다.</p>
        <p className='mt-2 text-sm leading-6 text-[var(--color-text-secondary)]'>
          {normalizedQuery
            ? `"${normalizedQuery}"와 일치하는 항목이 없습니다. 검색어를 바꾸거나 전체 행사를 확인해보세요.`
            : '현재 확인할 수 있는 행사가 없습니다. 지도의 행사 목록에서 다시 확인해보세요.'}
        </p>
        {normalizedQuery ? (
          <button
            type='button'
            onClick={onResetSearch}
            className='mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-brand-on-primary)] transition hover:bg-[var(--color-brand-hover)]'
          >
            검색어 지우기
          </button>
        ) : (
          <button
            type='button'
            onClick={onCloseWithoutHistory}
            className='mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-brand-on-primary)] transition hover:bg-[var(--color-brand-hover)]'
          >
            지도에서 행사 찾기
          </button>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) return <CultureListLoading />;
    if (isError) return renderError();
    if (filteredCultures.length === 0) return renderEmptyState();

    return <CultureList cultures={filteredCultures} onItemClick={handleOnClick} />;
  };

  return (
    <div
      className={clsx(
        'pointer-events-auto flex size-full min-h-0 flex-col gap-2.5 text-[var(--color-text-primary)] sm:gap-3'
      )}
    >
      <div className='border-b border-[var(--color-border-primary)] pb-3.5 sm:pb-4'>
        <div className='min-w-0'>
          <p className='text-[0.68rem] font-semibold text-[var(--color-brand-primary)]'>행사 검색</p>
          <p className='mt-0.5 text-[1rem] font-semibold sm:mt-1 sm:text-lg'>검색 결과 {filteredCultures.length}개</p>
          <p className='mt-0.5 truncate text-[0.82rem] text-[var(--color-text-secondary)] sm:mt-1 sm:text-sm'>
            {normalizedQuery ? `검색어: ${normalizedQuery}` : '전체 행사 목록'}
          </p>
        </div>
      </div>
      <div className='min-h-0 flex-1'>{renderContent()}</div>
    </div>
  );
};

export default SearchResultsOverlay;
