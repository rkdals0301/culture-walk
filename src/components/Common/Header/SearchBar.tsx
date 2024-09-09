import Image from 'next/image';
import { useTheme } from 'next-themes';
import styles from './SearchBar.module.scss';

const SearchBar = () => {
  const { theme } = useTheme();

  const gnbIconSrc = theme === 'dark' ? '/assets/search-icon-dark.svg' : '/assets/search-icon-light.svg';

  return (
    <>
      <div className={styles['search-bar-wrapper']}>
        <label htmlFor='search'></label>
        <input type='text' id='search' placeholder='문화행사명을 입력해보세요' className={styles['search-bar']} />
        <button type='button' className={styles['search-btn']}>
          <Image src={gnbIconSrc} width={24} height={24} alt='search_icon' />
        </button>
      </div>
    </>
  );
};

export default SearchBar;
