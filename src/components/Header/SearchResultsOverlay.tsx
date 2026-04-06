import CultureList from '@/components/Header/CultureList';
import CultureListLoading from '@/components/Header/CultureListLoading';
import { useCultureContext } from '@/context/CultureContext';
import { useCultures } from '@/hooks/cultureHooks';
import { FormattedCulture } from '@/types/culture';

import React from 'react';

import { useRouter } from 'next/navigation';

import clsx from 'clsx';

interface SearchResultsOverlayProps {
  onClose: () => void;
  onCloseWithoutHistory: () => void;
}

const SearchResultsOverlay = ({ onClose, onCloseWithoutHistory }: SearchResultsOverlayProps) => {
  const router = useRouter();
  const { filteredCultures, searchQuery } = useCultureContext();
  const { isLoading, isError, error } = useCultures();
  const normalizedQuery = searchQuery.trim();

  const handleOnClick = (culture: FormattedCulture) => {
    onCloseWithoutHistory();
    router.push(`/map/${culture.id}`);
  };

  const renderError = () => (
    <div className='surface-card flex size-full items-center justify-center rounded-[28px] p-8'>
      <p className='text-sm font-medium text-[#8e3b34] dark:text-[#ffb3a9]'>{error?.message}</p>
    </div>
  );

  const renderEmptyState = () => (
    <div className='surface-card flex size-full items-center justify-center rounded-[28px] p-8 text-center'>
      <div className='max-w-sm'>
        <p className='text-lg font-semibold tracking-[-0.03em]'>검색 결과가 없습니다.</p>
        <p className='mt-2 text-sm text-[var(--app-muted)]'>
          {normalizedQuery ? `"${normalizedQuery}"` : '입력한 검색어'}와 일치하는 항목이 없습니다.
        </p>
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
    <div className={clsx('pointer-events-auto flex size-full min-h-0 flex-col gap-2.5 sm:gap-3 text-[var(--app-text)]')}>
      <div className='surface-card flex flex-wrap items-center justify-between gap-3 rounded-[22px] px-3.5 py-3 sm:rounded-[24px] sm:px-5 sm:py-4'>
        <div className='min-w-0'>
          <p className='text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#1f765f] dark:text-[#8dc5b5]'>
            Results
          </p>
          <p className='mt-0.5 text-[1rem] font-semibold tracking-[-0.02em] sm:mt-1 sm:text-lg'>
            검색 결과 {filteredCultures.length}개
          </p>
          <p className='mt-0.5 truncate text-[0.82rem] text-[var(--app-muted)] sm:mt-1 sm:text-sm'>
            {normalizedQuery ? `검색어: ${normalizedQuery}` : '전체 행사 목록'}
          </p>
        </div>
        <button
          type='button'
          onClick={onClose}
          className='soft-chip hidden rounded-full px-4 py-2 text-sm font-medium text-[var(--app-muted)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08] sm:inline-flex'
        >
          결과 닫기
        </button>
      </div>
      <div className='min-h-0 flex-1'>
        {renderContent()}
      </div>
    </div>
  );
};

export default SearchResultsOverlay;
