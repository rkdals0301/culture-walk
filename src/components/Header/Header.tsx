'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSideMenu } from '@/context/SideMenuContext'; // 컨텍스트에서 사이드 메뉴 상태 가져오기
import styles from './Header.module.scss';
import SearchBar from '@/components/Header/SearchBar';
import SearchResultsOverlay from '@/components/Header/SearchResultsOverlay';
import SideMenuIcon from '../../../public/assets/menu-icon.svg';
import ArrowBackIcon from '../../../public/assets/arrow-back-icon.svg';

const Header = () => {
  const { openSideMenu } = useSideMenu(); // 사이드 메뉴를 여는 함수 사용
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const handleOpenSideMenu = () => {
    openSideMenu(); // 사이드 메뉴 열기
  };

  const handleOpenOverlay = () => {
    setIsOverlayVisible(true); // 클릭 시 오버레이 표시
  };

  const handleCloseOverlay = () => {
    setIsOverlayVisible(false); // 클릭 시 오버레이 숨김
  };

  return (
    <header className={styles['header']}>
      <div className={styles['header-top']}>
        <div className={styles['side-menu-button-wrapper']}>
          <button type='button' aria-label='사이드메뉴 열기' className='button' onClick={handleOpenSideMenu}>
            <SideMenuIcon />
          </button>
        </div>
        <Link href='/' className='link'>
          <div className={styles['logo-wrapper']}>
            <div className={styles['logo-text']}>문화산책</div>
          </div>
        </Link>
      </div>
      <div className={styles['header-bottom']}>
        {isOverlayVisible && (
          <button type='button' aria-label='검색 결과 닫기' className='button' onClick={handleCloseOverlay}>
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
