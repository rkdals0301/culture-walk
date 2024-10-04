import { CultureList } from '@/components/CultureList';
import Loader from '@/components/Loader/Loader';
import { useCultures } from '@/hooks/cultureHooks';
import { getCultures, getFilteredCultures } from '@/selectors/cultureSelectors';
import { FormattedCulture } from '@/types/culture';

import React from 'react';
import { useSelector } from 'react-redux';

import { useRouter } from 'next/navigation';

import clsx from 'clsx';

// selector import

interface SearchResultsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchResultsOverlay = ({ isOpen, onClose }: SearchResultsOverlayProps) => {
  const router = useRouter();
  const cultures = useSelector(getCultures); // 전체 문화 데이터 가져오기
  const filteredCultures = useSelector(getFilteredCultures); // 필터링된 문화 데이터 가져오기
  const { isLoading, isError, error } = useCultures(isOpen && cultures.length === 0);

  const handleOnClick = (culture: FormattedCulture) => {
    onClose();
    router.push(`/map/${culture.id}`, { scroll: false });
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loader />;
    }

    if (isError) {
      return <div className='flex h-full items-center justify-center'>{error.message}</div>;
    }

    if (filteredCultures.length === 0) {
      return (
        <div className='flex h-full items-center justify-center'>
          <div>
            <h3 className='text-lg font-bold'>검색 결과가 없습니다.</h3>
            <p>다른 검색어를 시도해 보세요.</p>
          </div>
        </div>
      );
    }

    return <CultureList cultures={filteredCultures} onItemClick={handleOnClick} />;
  };

  return (
    <div
      className={clsx(
        'fixed left-0 top-20 h-[calc(100dvh-5rem)] w-full overflow-y-auto bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100',
        { block: isOpen, hidden: !isOpen }
      )}
    >
      {renderContent()}
    </div>
  );
};

export default SearchResultsOverlay;
