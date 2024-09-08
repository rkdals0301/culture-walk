import Image from 'next/image';
import styles from './Header.module.scss';
import ThemeToggle from '@/components/Common/Theme/ThemeToggle';
import SearchInput from '@/components/Common/Header/SearchInput';

const Header = () => (
  <header className={styles.header}>
    <div className={styles['header-top']}>
      <div className={styles['logo-wrapper']}>
        <Image src='/assets/logo.svg' width={32} height={32} alt='logo' />
        <span className={styles['logo-text']}>문화산책</span>
      </div>

      <div className={styles['theme-toggle-wrapper']}>
        <ThemeToggle />
      </div>
    </div>
    <div className={styles['header-bottom']}>
      <SearchInput />
    </div>
  </header>
);

export default Header;
