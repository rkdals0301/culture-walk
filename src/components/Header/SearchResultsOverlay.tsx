import CultureList from '@/components/Header/CultureList';
import Loader from '@/components/Loader/Loader';
import { useCultures } from '@/hooks/cultureHooks';
import { getCultures, getFilteredCultures } from '@/selectors/cultureSelectors';
import { FormattedCulture } from '@/types/culture';

import React from 'react';
import { useSelector } from 'react-redux';

import { useRouter } from 'next/navigation';

import clsx from 'clsx';

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
    router.push(`/map/${culture.id}`, { scroll: false });
  };

  const renderError = () => (
    <div className='flex size-full items-center justify-center'>
      <p className='text-red-500'>{error?.message}</p>
    </div>
  );

  const renderEmptyState = () => (
    <div className='flex size-full items-center justify-center'>
      <div>
        <p className='text-center'>검색 결과가 없습니다.</p>
        <p className='text-center'>다른 검색어로 검색해 보세요.</p>
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
    <div
      className={clsx('size-full overflow-y-auto bg-white p-4 text-gray-900 dark:bg-neutral-900 dark:text-gray-100')}
    >
      {renderContent()}
    </div>
  );
};

export default SearchResultsOverlay;
