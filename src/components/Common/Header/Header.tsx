'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import styles from './Header.module.scss';
import ThemeToggle from '@components/Common/Theme/ThemeToggle';
import SearchBar from '@components/Common/Header/SearchBar';
import SideMenu from '@components/Common/Header/SideMenu';
import SearchResultsOverlay from '@components/Common/Header/SearchResultsOverlay';

const Header = () => {
  const { theme } = useTheme();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const gnbIconSrc = theme === 'dark' ? '/assets/gnb-icon-dark.svg' : '/assets/gnb-icon-light.svg';
  const leftArrowIconSrc = theme === 'dark' ? '/assets/left-arrow-icon-dark.svg' : '/assets/left-arrow-icon-light.svg';

  const toggleSideMenu = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
  };

  const handleSearchClick = () => {
    setIsOverlayVisible(true); // 클릭 시 오버레이 표시/숨김 토글
  };

  const handleBackClick = () => {
    setIsOverlayVisible(false); // 클릭 시 오버레이 표시/숨김 토글
  };

  return (
    <header className={styles.header}>
      <div className={styles['header-top']}>
        <div className={styles['gnb-wrapper']}>
          <button type='button' className={styles['gnb-button']} onClick={toggleSideMenu}>
            <Image src={gnbIconSrc} width={24} height={24} alt='gnb' priority />
          </button>
        </div>
        <Link href='/'>
          <div className={styles['logo-wrapper']}>
            <Image src='/assets/logo.svg' width={24} height={24} alt='logo' priority />
            <span className={styles['logo-text']}>문화산책</span>
          </div>
        </Link>
        <div className={styles['theme-toggle-wrapper']}>
          <ThemeToggle />
        </div>
      </div>
      <div className={styles['header-bottom']}>
        {isOverlayVisible && (
          <button type='button' className={styles['back-btn']} onClick={handleBackClick}>
            <Image src={leftArrowIconSrc} width={24} height={24} alt='back_icon' priority />
          </button>
        )}
        <SearchBar onSearchClick={handleSearchClick} />
      </div>
      <SideMenu isOpen={isSideMenuOpen} onClose={toggleSideMenu} />
      <SearchResultsOverlay isOpen={isOverlayVisible} />
    </header>
  );
};

export default Header;
