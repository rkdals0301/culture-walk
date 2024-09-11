'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import styles from './Header.module.scss';
import ThemeToggle from '@components/Common/Theme/ThemeToggle';
import SearchBar from '@components/Common/Header/SearchBar';
import SideMenu from '@components/Common/Header/SideMenu';
import { useState } from 'react';

const Header = () => {
  const { theme } = useTheme();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  const gnbIconSrc = theme === 'dark' ? '/assets/gnb-icon-dark.svg' : '/assets/gnb-icon-light.svg';

  const toggleSideMenu = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles['header-top']}>
        <div className={styles['gnb-wrapper']}>
          <button type='button' className={styles['gnb-button']} onClick={toggleSideMenu}>
            <Image src={gnbIconSrc} width={24} height={24} alt='gnb' />
          </button>
        </div>
        <Link href='/'>
          <div className={styles['logo-wrapper']}>
            <Image src='/assets/logo.svg' width={24} height={24} alt='logo' />
            <span className={styles['logo-text']}>문화산책</span>
          </div>
        </Link>
        <div className={styles['theme-toggle-wrapper']}>
          <ThemeToggle />
        </div>
      </div>
      <div className={styles['header-bottom']}>
        <SearchBar />
      </div>
      <SideMenu isOpen={isSideMenuOpen} onClose={toggleSideMenu} />
    </header>
  );
};

export default Header;
