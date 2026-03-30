import Loader from '@/components/Loader/Loader';
import { useCultures } from '@/hooks/cultureHooks';
import { getCultures, getFilteredCultures } from '@/selectors/cultureSelectors';
import { FormattedCulture } from '@/types/culture';

import React from 'react';
import { useSelector } from 'react-redux';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import clsx from 'clsx';

const CultureList = dynamic(() => import('@/components/Header/CultureList'), {
  loading: () => <Loader />,
});

interface SearchResultsOverlayProps {
  onClose: () => void;
}

const SearchResultsOverlay = ({ onClose }: SearchResultsOverlayProps) => {
  const router = useRouter();
  const cultures = useSelector(getCultures);
  const filteredCultures = useSelector(getFilteredCultures);
  const { isLoading, isError, error } = useCultures(cultures.length === 0);

  const handleOnClick = (culture: FormattedCulture) => {
    onClose();
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
        <p className='mt-2 text-sm text-[var(--app-muted)]'>다른 공연명이나 전시명으로 다시 찾아보세요.</p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (isError) return renderError();
    if (filteredCultures.length === 0) return renderEmptyState();

    return <CultureList cultures={filteredCultures} onItemClick={handleOnClick} />;
  };

  return (
    <div className={clsx('flex size-full min-h-0 flex-col gap-4 text-[var(--app-text)]')}>
      <div className='surface-card flex flex-wrap items-center justify-between gap-3 rounded-[28px] px-5 py-4'>
        <div>
          <p className='text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#1f765f] dark:text-[#8dc5b5]'>
            Results
          </p>
          <p className='mt-1 text-lg font-semibold tracking-[-0.03em]'>검색 결과 {filteredCultures.length}개</p>
        </div>
        <button
          type='button'
          onClick={onClose}
          className='soft-chip rounded-full px-4 py-2 text-sm font-medium text-[var(--app-muted)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
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
