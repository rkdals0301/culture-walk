'use client';

import IconButton from '@/components/Common/IconButton';
import { useSideMenu } from '@/context/SideMenuContext';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';

import { useEffect, useRef } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import clsx from 'clsx';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';
import CloseIcon from '../../../public/assets/images/close-icon.svg';

const NAVIGATION_LINKS = [
  { href: '/map', label: '문화지도' },
  { href: '/about', label: '서비스 소개' },
  { href: '/contact', label: '문의하기' },
];

const SideMenu = () => {
  const { isOpen, closeSideMenu } = useSideMenu();
  const pathname = usePathname();
  const panelRef = useRef<HTMLElement>(null);

  useDialogFocusTrap(isOpen, panelRef, closeSideMenu, '[aria-label="사이드메뉴 닫기"]');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-30 size-full bg-[#081311]/55 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeSideMenu}
        aria-hidden='true'
      />

      <aside
        ref={panelRef}
        className={clsx(
          'fixed left-0 top-0 z-40 flex h-dvh w-[calc(100vw-16px)] max-w-[320px] flex-col rounded-r-lg border-r border-[var(--app-border)] bg-[#fafcf9] p-5 shadow-[var(--app-shadow)] transition-transform duration-300 dark:bg-[#101916] sm:p-6',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role='dialog'
        aria-modal='true'
        aria-labelledby='side-menu-title'
        aria-hidden={!isOpen}
        inert={!isOpen}
        tabIndex={-1}
      >
        <div className='flex items-center justify-between gap-4 border-b border-[var(--app-border)] pb-5'>
          <Link href='/map' className='flex min-w-0 items-center gap-3' onClick={closeSideMenu}>
            <Image
              src='/assets/images/logo-128.png'
              alt='CultureWalk'
              width={44}
              height={44}
              className='rounded-lg shadow-[0_18px_38px_-28px_rgba(31,118,95,0.8)]'
            />
            <div className='min-w-0'>
              <p className='text-[0.66rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>전국 문화행사 지도</p>
              <h2 id='side-menu-title' className='truncate text-lg font-semibold'>
                CultureWalk
              </h2>
            </div>
          </Link>
          <IconButton icon={<CloseIcon />} ariaLabel='사이드메뉴 닫기' onClick={closeSideMenu} variant='secondary' />
        </div>

        <nav className='mt-6' aria-label='주요 메뉴'>
          <p className='px-1 text-xs font-semibold text-[var(--app-muted)]'>메뉴</p>
          <div className='mt-2 divide-y divide-[var(--app-border)]'>
            {NAVIGATION_LINKS.map(link => {
              const isActive = link.href === '/map' ? pathname?.startsWith('/map') : pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeSideMenu}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'flex min-h-14 items-center justify-between gap-3 px-1 text-[0.95rem] font-semibold transition-colors',
                    isActive
                      ? 'text-[#1f765f] dark:text-[#8dc5b5]'
                      : 'text-[var(--app-text)] hover:text-[#1f765f] dark:hover:text-[#8dc5b5]'
                  )}
                >
                  <span>{link.label}</span>
                  <ArrowBackIcon className='size-4 rotate-180 text-[var(--app-muted)]' />
                </Link>
              );
            })}
          </div>
        </nav>

        <div className='mt-auto border-t border-[var(--app-border)] pt-4'>
          <Link
            href='/privacy'
            onClick={closeSideMenu}
            className='text-xs font-medium text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)]'
          >
            개인정보처리방침
          </Link>
          <p className='mt-2 text-xs text-[var(--app-muted)]'>CultureWalk · 전국 문화행사</p>
        </div>
      </aside>
    </>
  );
};

export default SideMenu;
