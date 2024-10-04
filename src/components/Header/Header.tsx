'use client';

import IconButton from '@/components/Common/IconButton';
// 컨텍스트에서 사이드 메뉴 상태 가져오기
import SearchBar from '@/components/Header/SearchBar';
import SearchResultsOverlay from '@/components/Header/SearchResultsOverlay';
import { useSideMenu } from '@/context/SideMenuContext';

import { useState } from 'react';

import Link from 'next/link';

import ArrowBackIcon from '../../../public/assets/arrow-back-icon.svg';
import SideMenuIcon from '../../../public/assets/menu-icon.svg';

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
    <header className='fixed left-0 top-0 z-10 flex h-20 w-full flex-col gap-1 border-b border-b-gray-300 bg-white p-2 text-gray-900 dark:border-b-neutral-700 dark:bg-neutral-900 dark:text-gray-100'>
      <div className='relative flex h-7 flex-none items-center justify-center'>
        <div className='absolute left-0 flex h-full items-center justify-center'>
          <IconButton
            icon={<SideMenuIcon />} // 아이콘 전달
            ariaLabel='사이드메뉴 열기' // 접근성 라벨
            onClick={handleOpenSideMenu} // 클릭 핸들러
          />
        </div>
        <Link href='/' className='flex h-full items-center'>
          <div className='flex items-center justify-center text-lg font-bold'>문화산책</div>
        </Link>
      </div>
      <div className='flex grow items-center gap-2'>
        {isOverlayVisible && (
          <IconButton
            icon={<ArrowBackIcon />} // 아이콘 전달
            ariaLabel='검색 결과 닫기' // 접근성 라벨
            onClick={handleCloseOverlay} // 클릭 핸들러
          />
        )}
        <SearchBar onSearchClick={handleOpenOverlay} />
      </div>
      <SearchResultsOverlay isOpen={isOverlayVisible} onClose={handleCloseOverlay} />
    </header>
  );
};

export default Header;
