'use client';

import IconButton from '@/components/Common/IconButton';
import ThemeToggleButton from '@/components/Theme/ThemeToggleButton';
import { useSideMenu } from '@/context/SideMenuContext';

import { useCallback, useEffect, useRef, useState } from 'react';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

import SideMenuIcon from '../../../public/assets/images/menu-icon.svg';
import SearchIcon from '../../../public/assets/images/search-icon.svg';

const SearchView = dynamic(() => import('@/components/Header/SearchView'), {
  loading: () => null,
});

const Header = () => {
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const { openSideMenu } = useSideMenu(); // 사이드 메뉴를 여는 함수 사용
  const hasSearchHistoryEntryRef = useRef(false);

  useEffect(() => {
    void import('@/components/Header/SearchView');
  }, []);

  const handleOpenSideMenu = () => {
    openSideMenu(); // 사이드 메뉴 열기
  };

  const handleOpenOverlay = () => {
    if (isSearchBarVisible) {
      return;
    }

    setIsSearchBarVisible(true); // 클릭 시 오버레이 표시
    if (typeof window !== 'undefined') {
      const currentState = window.history.state && typeof window.history.state === 'object' ? window.history.state : {};
      window.history.pushState({ ...currentState, __cwSearchOverlay: true }, '', window.location.href);
      hasSearchHistoryEntryRef.current = true;
    }
  };

  const handleCloseOverlay = useCallback(
    (options?: { syncHistory?: boolean }) => {
      const syncHistory = options?.syncHistory ?? true;
      setIsSearchBarVisible(false);

      if (!syncHistory) {
        hasSearchHistoryEntryRef.current = false;
        return;
      }

      if (typeof window !== 'undefined' && hasSearchHistoryEntryRef.current) {
        hasSearchHistoryEntryRef.current = false;
        window.history.back();
      }
    },
    []
  );

  useEffect(() => {
    const handlePopState = () => {
      if (!isSearchBarVisible) {
        return;
      }

      hasSearchHistoryEntryRef.current = false;
      setIsSearchBarVisible(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isSearchBarVisible]);

  return (
    <header className='pointer-events-none fixed inset-x-0 top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8'>
      <div className='surface-panel pointer-events-auto mx-auto flex max-w-[1500px] items-center justify-between gap-3 rounded-[24px] px-3 py-2.5 text-[var(--app-text)] sm:px-4'>
        <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
          <IconButton icon={<SideMenuIcon />} ariaLabel='사이드메뉴 열기' onClick={handleOpenSideMenu} variant='secondary' />
          <Link href='/' className='flex min-w-0 items-center gap-3'>
            <Image
              src='/assets/images/logo-128.png'
              alt='CultureWalk'
              width={44}
              height={44}
              className='rounded-2xl shadow-[0_18px_40px_-26px_rgba(31,118,95,0.95)]'
            />
            <div className='min-w-0'>
              <p className='text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-[#1f765f] dark:text-[#8dc5b5]'>
                Seoul Culture Map
              </p>
              <h1 className='truncate text-base font-semibold tracking-[-0.03em] sm:text-lg'>CultureWalk</h1>
            </div>
          </Link>
        </div>
        <div className='flex items-center gap-2'>
          <IconButton icon={<SearchIcon />} ariaLabel='검색바 열기' onClick={handleOpenOverlay} variant='secondary' />
          <ThemeToggleButton />
        </div>
      </div>
      {isSearchBarVisible && (
        <SearchView
          onClose={() => handleCloseOverlay({ syncHistory: true })}
          onCloseWithoutHistory={() => handleCloseOverlay({ syncHistory: false })}
        />
      )}
    </header>
  );
};

export default Header;
