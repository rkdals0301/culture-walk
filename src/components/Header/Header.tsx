'use client';

import IconButton from '@/components/Common/IconButton';
import ThemeToggleButton from '@/components/Theme/ThemeToggleButton';
import { useSideMenu } from '@/context/SideMenuContext';

import { useCallback, useEffect, useRef, useState } from 'react';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AnimatePresence, LazyMotion, domAnimation, useReducedMotion } from 'framer-motion';
import * as m from 'framer-motion/m';

import SideMenuIcon from '../../../public/assets/images/menu-icon.svg';
import SearchIcon from '../../../public/assets/images/search-icon.svg';

import { NAVIGATION_LINKS } from '@/constants/navigation';

const SearchView = dynamic(() => import('@/components/Header/SearchView'), {
  loading: () => null,
});

const Header = () => {
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const { openSideMenu } = useSideMenu(); // 사이드 메뉴를 여는 함수 사용
  const pathname = usePathname();
  const hasSearchHistoryEntryRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const searchTransition = shouldReduceMotion ? { duration: 0.01 } : { duration: 0.2, ease: 'easeOut' as const };
  const restoreSearchTriggerFocus = useCallback(() => {
    document.querySelector<HTMLButtonElement>('button[aria-label="행사 검색 열기"]')?.focus();
  }, []);

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

  const handleCloseOverlay = useCallback((options?: { syncHistory?: boolean }) => {
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
  }, []);

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
    <header className='safe-area-header-offset pointer-events-none fixed inset-x-0 top-0 z-30 lg:h-[72px]'>
      {pathname === '/map' && (
        <a
          href='#culture-list'
          className='safe-area-skip-link pointer-events-none fixed z-[70] rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-on-primary)] opacity-0 transition-opacity duration-200 focus-visible:pointer-events-auto focus-visible:opacity-100'
        >
          행사 목록으로 건너뛰기
        </a>
      )}
      <div className='surface-panel pointer-events-auto mx-auto flex max-w-[1500px] items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[var(--color-text-primary)] shadow-none sm:gap-3 sm:px-4 lg:h-full lg:max-w-none lg:rounded-none lg:border-x-0 lg:border-t-0 lg:px-5 lg:py-0 lg:shadow-none'>
        <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
          <IconButton
            icon={<SideMenuIcon />}
            ariaLabel='사이드메뉴 열기'
            onClick={handleOpenSideMenu}
            variant='secondary'
          />
          <Link href='/map' className='flex min-w-0 items-center gap-3'>
            <Image
              src='/assets/images/logo-128.png'
              alt='문화산책'
              width={44}
              height={44}
              preload
              className='rounded-lg shadow-none'
            />
            <div className='min-w-0'>
              <p className='truncate text-[0.66rem] font-semibold text-[var(--color-brand-primary)]'>
                전국 문화행사 지도
              </p>
              <span className='truncate text-base font-semibold sm:text-lg'>문화산책</span>
            </div>
          </Link>
        </div>
        <nav className='hidden items-center gap-1 lg:flex' aria-label='주요 메뉴'>
          {NAVIGATION_LINKS.map(link => {
            const isActive = link.href === '/map' ? pathname?.startsWith('/map') : pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[var(--color-surface-chip)] text-[var(--color-brand-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className='flex shrink-0 items-center gap-2'>
          <IconButton
            icon={<SearchIcon />}
            ariaLabel='행사 검색 열기'
            title='행사 검색'
            label={<span className='header-search-label'>검색</span>}
            onClick={handleOpenOverlay}
            variant='secondary'
            className='header-search-button h-11 w-auto lg:hidden'
          />
          <ThemeToggleButton />
        </div>
      </div>
      <LazyMotion features={domAnimation}>
        <AnimatePresence initial={false} onExitComplete={restoreSearchTriggerFocus}>
          {isSearchBarVisible && (
            <m.div
              className='fixed inset-0 z-50'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={searchTransition}
            >
              <SearchView
                onClose={() => handleCloseOverlay({ syncHistory: true })}
                onCloseWithoutHistory={() => handleCloseOverlay({ syncHistory: false })}
              />
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </header>
  );
};

export default Header;
