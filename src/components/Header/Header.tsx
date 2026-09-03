'use client';

import IconButton from '@/components/Common/IconButton';
import ThemeToggleButton from '@/components/Theme/ThemeToggleButton';
import { useSideMenu } from '@/context/SideMenuContext';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import SideMenuIcon from '../../../public/assets/images/menu-icon.svg';

import { NAVIGATION_LINKS } from '@/constants/navigation';

const Header = () => {
  const { openSideMenu } = useSideMenu();
  const pathname = usePathname();

  const handleOpenSideMenu = () => {
    openSideMenu();
  };

  return (
    <header className='safe-area-header-offset pointer-events-auto fixed inset-x-0 top-0 z-30 border-b border-[var(--color-border-primary)] bg-[var(--color-surface-primary)]/95 backdrop-blur-md transition-colors'>
      {pathname === '/' ? (
        <a
          href='#feed-content'
          className='safe-area-skip-link pointer-events-none fixed z-[70] rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-on-primary)] opacity-0 transition-opacity duration-200 focus-visible:pointer-events-auto focus-visible:opacity-100'
        >
          행사 둘러보기로 건너뛰기
        </a>
      ) : pathname === '/map' ? (
        <a
          href='#culture-list'
          className='safe-area-skip-link pointer-events-none fixed z-[70] rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-on-primary)] opacity-0 transition-opacity duration-200 focus-visible:pointer-events-auto focus-visible:opacity-100'
        >
          행사 목록으로 건너뛰기
        </a>
      ) : null}
      <div className='mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 text-[var(--color-text-primary)]'>
        <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
          <IconButton
            icon={<SideMenuIcon />}
            ariaLabel='사이드메뉴 열기'
            onClick={handleOpenSideMenu}
            variant='secondary'
            className='size-9 sm:size-10 rounded-lg transition-colors hover:bg-[var(--color-surface-chip)]'
          />
          <Link href='/' className='group flex min-w-0 items-center gap-2 sm:gap-2.5 transition-opacity duration-150 hover:opacity-90'>
            <Image
              src='/favicon.svg'
              alt='문화산책'
              width={32}
              height={32}
              preload
              className='size-7 sm:size-8 rounded-lg shadow-2xs'
            />
            <div className='min-w-0'>
              <span className='block truncate text-sm font-bold tracking-tight sm:text-base'>문화산책</span>
            </div>
          </Link>
        </div>
        <nav className='hidden items-center gap-1 lg:flex' aria-label='주요 메뉴'>
          {NAVIGATION_LINKS.map(link => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : link.href === '/map'
                  ? pathname?.startsWith('/map')
                  : pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className='flex shrink-0 items-center gap-1.5'>
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
