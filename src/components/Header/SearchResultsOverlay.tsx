import React from 'react';
import styles from './SearchResultsOverlay.module.scss';
import { FormattedCulture } from '@/types/culture';
import Loader from '@/components/Loader/Loader';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { useSelector } from 'react-redux';
import { useCultures } from '@/hooks/cultureHooks';
import { CultureList } from '@/components/CultureList';

interface SearchResultsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchResultsOverlay = ({ isOpen, onClose }: SearchResultsOverlayProps) => {
  const router = useRouter();
  const { cultures, filteredCultures } = useSelector((state: RootState) => state.culture);
  const { isLoading, isError, error } = useCultures(isOpen && cultures.length === 0);

  const handleOnClick = (culture: FormattedCulture) => {
    onClose();
    router.push(`/map/${culture.id}`, { scroll: false });
  };

  // 렌더링할 내용을 반환하는 함수
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

  return <div className={`${styles['search-results-overlay']} ${isOpen ? styles['open'] : ''}`}>{renderContent()}</div>;
};

export default SearchResultsOverlay;
