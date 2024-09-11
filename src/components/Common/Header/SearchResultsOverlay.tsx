import Image from 'next/image';
import styles from './SearchResultsOverlay.module.scss';

interface SearchResultsOverlayProps {
  isOpen: boolean;
}

const SearchResultsOverlay = ({ isOpen }: SearchResultsOverlayProps) => {
  return (
    <div className={`${styles['search-results-overlay']} ${isOpen ? styles.open : ''}`}>
      <ul className={styles['item-list-wrapper']}>
        {Array.from({ length: 20 }, (_, index) => (
          <li key={index} className={styles['item-wrapper']}>
            <div className={styles['content-wrapper']}>
              <p className={styles['content-title']}>[성동문화재단] 2024년 한국의 디카시 전</p>
              <p className={styles['content-place']}>전시/미술 / 성동구 / 소월아트홀 1층 소월전시실</p>
              <p className={styles['content-date']}>2024-09-09 ~ 2024-09-13</p>
              <p className={styles['content-target']}>누구나</p>
              <p className={styles['content-price']}>무료</p>
            </div>
            <div className={styles['image-wrapper']}>
              <Image
                src='https://culture.seoul.go.kr/cmmn/file/getImage.do?atchFileId=e841eeba9c7d4a07b1fdde44c5c69c77&thumb=Y'
                width={100}
                height={100}
                className={styles['image']}
                alt='culture-img'
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchResultsOverlay;
