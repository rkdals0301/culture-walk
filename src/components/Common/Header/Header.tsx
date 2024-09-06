import styles from '@/components/Common/Header/Header.module.scss';
import Image from 'next/image';
import ThemeToggle from '@/components/Common/Theme/ThemeToggle';

const Header = () => (
  <header className={styles.header}>
    <div className={styles.logo}>
      <Image src='/assets/logo.svg' width={32} height={32} alt='logo' />
      <span className={styles['logo-text']}>문화산책</span>
    </div>
    {/* <nav>
      <form>
        <label htmlFor='search'></label>
        <input type='text' id='search' name='search' placeholder='Search events' />
      </form>
    </nav> */}
    <div className='theme-toggle'>
      <ThemeToggle />
    </div>
  </header>
);

export default Header;
