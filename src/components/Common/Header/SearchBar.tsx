import Image from 'next/image';
import { useTheme } from 'next-themes';
import styles from './SearchBar.module.scss';
import SearchResultsOverlay from '@components/Common/Header/SearchResultsOverlay';
import { useState } from 'react';

const SearchBar = () => {
  const { theme } = useTheme();
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const handleSearchClick = () => {
    setIsOverlayVisible(true); // 클릭 시 오버레이 표시/숨김 토글
  };

  const handleBackClick = () => {
    setIsOverlayVisible(false); // 클릭 시 오버레이 표시/숨김 토글
  };

  const searchIconSrc = theme === 'dark' ? '/assets/search-icon-dark.svg' : '/assets/search-icon-light.svg';
  const leftArrowIconSrc = theme === 'dark' ? '/assets/left-arrow-icon-dark.svg' : '/assets/left-arrow-icon-light.svg';

  return (
    <>
      <div className={styles['search-bar-wrapper']}>
        {isOverlayVisible && (
          <button type='button' className={styles['back-btn']} onClick={handleBackClick}>
            <Image src={leftArrowIconSrc} width={24} height={24} alt='back_icon' />
          </button>
        )}
        <label htmlFor='search'></label>
        <input
          type='text'
          id='search'
          placeholder='문화행사명을 입력해보세요'
          className={styles['search-bar']}
          onFocus={handleSearchClick}
        />
        <button type='button' className={styles['search-btn']}>
          <Image src={searchIconSrc} width={24} height={24} alt='search_icon' />
        </button>
        {isOverlayVisible && <SearchResultsOverlay />}
      </div>
    </>
  );
};

export default SearchBar;
