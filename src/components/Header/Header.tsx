'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import styles from './Header.module.scss';
import SearchBar from '@/components/Header/SearchBar';
import SearchResultsOverlay from '@/components/Header/SearchResultsOverlay';
import { toggleSideMenu } from '@/slices/sideMenuSlice';
import SideMenuIcon from '../../../public/assets/menu-icon.svg';
import ArrowBackIcon from '../../../public/assets/arrow-back-icon.svg';

const Header = () => {
  const dispatch = useDispatch();
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const handleOpenSideMenu = () => {
    dispatch(toggleSideMenu());
  };

  const handleOpenOverlay = () => {
    setIsOverlayVisible(true); // 클릭 시 오버레이 표시/숨김 토글
  };

  const handleCloseOverlay = () => {
    setIsOverlayVisible(false); // 클릭 시 오버레이 표시/숨김 토글
  };

  return (
    <header className={styles['header']}>
      <div className={styles['header-top']}>
        <div className={styles['side-menu-button-wrapper']}>
          <button type='button' className={styles['side-menu-button']} onClick={handleOpenSideMenu}>
            <SideMenuIcon />
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
          <button type='button' className={styles['back-button']} onClick={handleCloseOverlay}>
            <ArrowBackIcon />
          </button>
        )}
        <SearchBar onSearchClick={handleOpenOverlay} />
      </div>
      <SearchResultsOverlay isOpen={isOverlayVisible} onClose={handleCloseOverlay} />
    </header>
  );
};

export default Header;
