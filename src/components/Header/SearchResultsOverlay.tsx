import React from 'react';
import styles from './SearchResultsOverlay.module.scss';
import { FormattedCulture } from '@/types/culture';
import Loader from '@/components/Loader/Loader';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useCultures } from '@/hooks/cultureHooks';
import { CultureList } from '@/components/CultureList';
import clsx from 'clsx';
import { getCultures, getFilteredCultures } from '@/selectors/cultureSelectors'; // selector import

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
      return <div className={styles['error-message']}>{error.message}</div>;
    }

    if (filteredCultures.length === 0) {
      return (
        <div className={styles['no-results']}>
          <h3>검색 결과가 없습니다.</h3>
          <p>다른 검색어를 시도해 보세요.</p>
        </div>
      );
    }

    return <CultureList cultures={filteredCultures} onItemClick={handleOnClick} />;
  };

  return <div className={clsx(styles['search-results-overlay'], { [styles['open']]: isOpen })}>{renderContent()}</div>;
};

export default SearchResultsOverlay;
