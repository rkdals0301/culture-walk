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
  const { isLoading, error } = useCultures(isOpen && cultures.length === 0);

  const handleOnClick = (culture: FormattedCulture) => {
    onClose();
    router.push(`/map/${culture.id}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className={`${styles['search-results-overlay']} ${isOpen ? styles.open : ''}`}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles['search-results-overlay']} ${isOpen ? styles.open : ''}`}>
        <div className={styles['error-message']}>오류: {error.message}</div>
      </div>
    );
  }

  if (filteredCultures.length === 0) {
    return (
      <div className={`${styles['search-results-overlay']} ${isOpen ? styles.open : ''}`}>
        <div className={styles['no-results']}>검색 결과가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={`${styles['search-results-overlay']} ${isOpen ? styles.open : ''}`}>
      <CultureList cultures={filteredCultures} onItemClick={handleOnClick} />
    </div>
  );
};

export default SearchResultsOverlay;