import Image from 'next/image';
import { useTheme } from 'next-themes';
import styles from './SearchBar.module.scss';

interface SearchBarProps {
  onSearchClick: () => void;
}

const SearchBar = ({ onSearchClick }: SearchBarProps) => {
  const { resolvedTheme } = useTheme();

  const searchIconSrc = resolvedTheme === 'dark' ? '/assets/search-icon-dark.svg' : '/assets/search-icon-light.svg';

  return (
    <div className={styles['search-bar-wrapper']}>
      <label htmlFor='search'></label>
      <input
        type='text'
        id='search'
        placeholder='문화행사명을 입력해보세요'
        className={styles['search-bar']}
        onFocus={onSearchClick}
      />
      <button type='button' className={styles['search-btn']}>
        <Image src={searchIconSrc} width={24} height={24} alt='search_icon' priority />
      </button>
    </div>
  );
};

export default SearchBar;
