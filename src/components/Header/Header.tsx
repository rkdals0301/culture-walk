'use client';

import IconButton from '@/components/Common/IconButton';
import SearchView from '@/components/Header/SearchView';
import ThemeToggleButton from '@/components/Theme/ThemeToggleButton';
import { useSideMenu } from '@/context/SideMenuContext';

import { useState } from 'react';

import Link from 'next/link';

import SideMenuIcon from '../../../public/assets/menu-icon.svg';
import SearchIcon from '../../../public/assets/search-icon.svg';

const Header = () => {
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const { openSideMenu } = useSideMenu(); // 사이드 메뉴를 여는 함수 사용

  const handleOpenSideMenu = () => {
    openSideMenu(); // 사이드 메뉴 열기
  };

  const handleOpenOverlay = () => {
    setIsSearchBarVisible(true); // 클릭 시 오버레이 표시
  };

  const handleCloseOverlay = () => {
    setIsSearchBarVisible(false); // 클릭 시 오버레이 표시
  };

  return (
    <header className='fixed inset-0 z-10 flex h-14 w-full flex-col border-b border-b-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-b-neutral-700 dark:bg-neutral-900 dark:text-gray-100'>
      <div className='flex h-full flex-none items-center justify-between'>
        <div className='flex h-full items-center justify-center gap-2'>
          <IconButton
            icon={<SideMenuIcon />} // 아이콘 전달
            ariaLabel='사이드메뉴 열기' // 접근성 라벨
            onClick={handleOpenSideMenu} // 클릭 핸들러
          />
          <Link href='/' className='flex h-full items-center justify-center'>
            <div className='flex items-center justify-center text-xl font-bold'>문화산책</div>
          </Link>
        </div>
        <div className='flex h-full items-center justify-center gap-2'>
          <IconButton
            icon={<SearchIcon />} // 아이콘 전달
            ariaLabel='검색바 열기' // 접근성 라벨
            onClick={handleOpenOverlay}
          />
          <ThemeToggleButton />
        </div>
      </div>
      {isSearchBarVisible && <SearchView onClose={handleCloseOverlay} />}
    </header>
  );
};

export default Header;
