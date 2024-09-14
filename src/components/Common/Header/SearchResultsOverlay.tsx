import Image from 'next/image';
import styles from './SearchResultsOverlay.module.scss';
import { useEffect, useState } from 'react';
import { fetchCultures } from '@/utils/api/culture';
import { FormattedCulture } from '@/types/culture';
import { formatCultureData } from '@/utils/cultureUtils';
import Loader from '@/components/Common/Loader/Loader';

interface SearchResultsOverlayProps {
  isOpen: boolean;
}

const SearchResultsOverlay = ({ isOpen }: SearchResultsOverlayProps) => {
  const [cultures, setCultures] = useState<FormattedCulture[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return; // isOpen이 false일 때는 데이터를 요청하지 않음

    const fetchData = async () => {
      setLoading(true); // 로딩 시작
      setError(null); // Reset error state before fetching

      try {
        const data = await fetchCultures();
        const formattedCultures = formatCultureData(data);
        setCultures(formattedCultures);
      } catch (err) {
        console.error('Error fetching cultures:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen]);

  if (loading) {
    return (
      <div className={`${styles['search-results-overlay']} ${isOpen ? styles.open : ''}`}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles['search-results-overlay']} ${isOpen ? styles.open : ''}`}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`${styles['search-results-overlay']} ${isOpen ? styles.open : ''}`}>
      <ul className={styles['item-list-wrapper']}>
        {cultures.map(culture => (
          <li key={culture.id} className={styles['item-wrapper']}>
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
                placeholder='blur'
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchResultsOverlay;
