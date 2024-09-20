import React from 'react';
import styles from './SearchResultsOverlay.module.scss';
import { FormattedCulture } from '@/types/culture';
import Loader from '@/components/Common/Loader/Loader';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { useSelector } from 'react-redux';
import { useCultures } from '@/hooks/cultureHooks';

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
      <ul className={styles['item-list-wrapper']}>
        {filteredCultures.map(culture => (
          <li key={culture.id} className={styles['item-wrapper']} onClick={() => handleOnClick(culture)}>
            <div className={styles['content-wrapper']}>
              <p className={styles['content-title']}>{culture.title}</p>
              <p className={styles['content-place']}>{culture.displayPlace}</p>
              <p className={styles['content-date']}>{culture.displayDate}</p>
              <p className={styles['content-target']}>{culture.useTarget}</p>
              <p className={styles['content-price']}>{culture.displayPrice}</p>
            </div>
            <div className={styles['image-wrapper']}>
              <Image
                src={culture.mainImage}
                width={100}
                height={100}
                className={styles['image']}
                alt='Culture Image'
                blurDataURL={culture.mainImage}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchResultsOverlay;
