import CultureList from '@/components/Header/CultureList';
import CultureListLoading from '@/components/Header/CultureListLoading';
import { useCultureContext } from '@/context/CultureContext';
import { useCultures } from '@/hooks/cultureHooks';
import { FormattedCulture } from '@/types/culture';

import React from 'react';

import { useRouter } from 'next/navigation';

import clsx from 'clsx';

interface SearchResultsOverlayProps {
  onCloseWithoutHistory: () => void;
  onResetSearch: () => void;
}

const SearchResultsOverlay = ({ onCloseWithoutHistory, onResetSearch }: SearchResultsOverlayProps) => {
  const router = useRouter();
  const { filteredCultures, searchQuery, setMapCategory, setMapFreeOnly } = useCultureContext();
  const { isLoading, isError, error } = useCultures();
  const normalizedQuery = searchQuery.trim();

  const handleOnClick = (culture: FormattedCulture) => {
    setMapCategory('all');
    setMapFreeOnly(false);
    onCloseWithoutHistory();
    router.push(`/map/${culture.id}`);
  };

  const renderError = () => (
    <div className='surface-card flex size-full items-center justify-center rounded-2xl p-8'>
      <p className='text-sm font-medium text-[#8e3b34] dark:text-[#ffb3a9]'>{error?.message}</p>
    </div>
  );

  const renderEmptyState = () => (
    <div className='surface-card flex size-full items-center justify-center rounded-2xl p-8 text-center'>
      <div className='max-w-sm'>
        <p className='text-lg font-semibold'>검색 결과가 없습니다.</p>
        <p className='mt-2 text-sm leading-6 text-[var(--app-muted)]'>
          {normalizedQuery
            ? `"${normalizedQuery}"와 일치하는 항목이 없습니다. 검색어를 바꾸거나 전체 행사를 확인해보세요.`
            : '현재 확인할 수 있는 행사가 없습니다. 지도의 행사 목록에서 다시 확인해보세요.'}
        </p>
        {normalizedQuery ? (
          <button
            type='button'
            onClick={onResetSearch}
            className='mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--app-primary)] px-4 text-sm font-semibold text-[var(--app-on-primary)] transition hover:bg-[var(--app-primary-hover)]'
          >
            검색어 지우기
          </button>
        ) : (
          <button
            type='button'
            onClick={onCloseWithoutHistory}
            className='mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--app-primary)] px-4 text-sm font-semibold text-[var(--app-on-primary)] transition hover:bg-[var(--app-primary-hover)]'
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
      className={clsx('pointer-events-auto flex size-full min-h-0 flex-col gap-2.5 text-[var(--app-text)] sm:gap-3')}
    >
      <div className='surface-card flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3.5 py-3 sm:px-5 sm:py-4'>
        <div className='min-w-0'>
          <p className='text-[0.68rem] font-semibold text-[var(--app-primary)]'>
            행사 검색
          </p>
          <p className='mt-0.5 text-[1rem] font-semibold sm:mt-1 sm:text-lg'>
            검색 결과 {filteredCultures.length}개
          </p>
          <p className='mt-0.5 truncate text-[0.82rem] text-[var(--app-muted)] sm:mt-1 sm:text-sm'>
            {normalizedQuery ? `검색어: ${normalizedQuery}` : '전체 행사 목록'}
          </p>
        </div>
      </div>
      <div className='min-h-0 flex-1'>{renderContent()}</div>
    </div>
  );
};

export default SearchResultsOverlay;
