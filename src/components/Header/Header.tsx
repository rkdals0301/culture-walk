'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useDispatch } from 'react-redux';
import styles from './Header.module.scss';
import SearchBar from '@/components/Header/SearchBar';
import SearchResultsOverlay from '@/components/Header/SearchResultsOverlay';
import { toggleSideMenu } from '@/slices/sideMenuSlice';

const Header = () => {
  const { resolvedTheme } = useTheme();
  const dispatch = useDispatch();
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const gnbIconSrc = resolvedTheme === 'dark' ? '/assets/gnb-icon-dark.svg' : '/assets/gnb-icon-light.svg';
  const leftArrowIconSrc =
    resolvedTheme === 'dark' ? '/assets/left-arrow-icon-dark.svg' : '/assets/left-arrow-icon-light.svg';

  const handleOpenSideMenu = () => {
    dispatch(toggleSideMenu());
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
          <button type='button' className={styles['gnb-button']} onClick={handleOpenSideMenu}>
            <Image src={gnbIconSrc} width={24} height={24} alt='gnb' priority />
          </button>
        </div>
        <Link href='/'>
          <div className={styles['logo-wrapper']}>
            <Image src='/assets/logo.svg' width={24} height={24} alt='logo' priority />
            <span className={styles['logo-text']}>문화산책</span>
          </div>
        </Link>
      </div>
      <div className={styles['header-bottom']}>
        {isOverlayVisible && (
          <button type='button' className={styles['back-btn']} onClick={handleBackClick}>
            <Image src={leftArrowIconSrc} width={24} height={24} alt='back_icon' priority />
          </button>
        )}
        <SearchBar onSearchClick={handleSearchClick} />
      </div>
      <SearchResultsOverlay isOpen={isOverlayVisible} onClose={handleBackClick} />
    </header>
  );
};

export default Header;
