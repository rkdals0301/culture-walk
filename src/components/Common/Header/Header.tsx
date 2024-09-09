import Image from 'next/image';
import styles from './Header.module.scss';
// import ThemeToggle from '@/components/Common/Theme/ThemeToggle';
import SearchBar from '@/components/Common/Header/SearchBar';

const Header = () => (
  <header className={styles.header}>
    <div className={styles['header-top']}>
      <div className={styles['gnb-wrapper']}>
        <button type='button' className={styles['gnb-button']}>
          <Image src='/assets/gnb-icon-light.svg' width={32} height={32} alt='gnb' className={styles.gnb} />
        </button>
      </div>
      <div className={styles['logo-wrapper']}>
        <Image src='/assets/logo.svg' width={32} height={32} alt='logo' />
        <span className={styles['logo-text']}>문화산책</span>
      </div>

      {/* <div className={styles['theme-toggle-wrapper']}>
        <ThemeToggle />
      </div> */}
    </div>
    <div className={styles['header-bottom']}>
      <SearchBar />
    </div>
  </header>
);

export default Header;
