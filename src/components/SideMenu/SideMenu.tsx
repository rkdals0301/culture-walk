'use client';

import IconButton from '@/components/Common/IconButton';
import { useSideMenu } from '@/context/SideMenuContext';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';

import { useEffect, useRef } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import clsx from 'clsx';

import { NAVIGATION_LINKS } from '@/constants/navigation';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';
import CloseIcon from '../../../public/assets/images/close-icon.svg';

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
          'fixed inset-0 z-[70] size-full bg-[var(--color-overlay)] backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeSideMenu}
        aria-hidden='true'
      />

      <aside
        ref={panelRef}
        className={clsx(
          'safe-area-side-panel fixed left-0 top-0 z-[80] flex h-dvh w-[calc(100vw-16px)] max-w-[320px] flex-col rounded-r-lg border-r border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] shadow-[var(--color-shadow)] transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role='dialog'
        aria-modal='true'
        aria-labelledby='side-menu-title'
        aria-hidden={!isOpen}
        inert={!isOpen}
        tabIndex={-1}
      >
        <div className='flex items-center justify-between gap-4 border-b border-[var(--color-border-primary)] pb-5'>
          <Link href='/map' className='flex min-w-0 items-center gap-3' onClick={closeSideMenu}>
            <Image
              src='/assets/images/logo-128.png'
              alt='문화산책'
              width={44}
              height={44}
              className='rounded-lg shadow-[var(--color-shadow-brand)]'
            />
            <div className='min-w-0'>
              <p className='text-[0.66rem] font-semibold text-[var(--color-brand-primary)]'>전국 문화행사 지도</p>
              <h2 id='side-menu-title' className='truncate text-lg font-semibold'>
                문화산책
              </h2>
            </div>
          </Link>
          <IconButton icon={<CloseIcon />} ariaLabel='사이드메뉴 닫기' onClick={closeSideMenu} variant='secondary' />
        </div>

        <nav className='mt-6' aria-label='주요 메뉴'>
          <p className='px-1 text-xs font-semibold text-[var(--color-text-secondary)]'>메뉴</p>
          <div className='mt-2 divide-y divide-[var(--color-border-primary)]'>
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
                      ? 'text-[var(--color-brand-primary)]'
                      : 'text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)]'
                  )}
                >
                  <span>{link.label}</span>
                  <ArrowBackIcon className='size-4 rotate-180 text-[var(--color-text-secondary)]' />
                </Link>
              );
            })}
          </div>
        </nav>

        <div className='mt-auto border-t border-[var(--color-border-primary)] pt-4'>
          <Link
            href='/privacy'
            onClick={closeSideMenu}
            className='text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]'
          >
            개인정보처리방침
          </Link>
          <p className='mt-2 text-xs text-[var(--color-text-secondary)]'>문화산책 · 전국 문화행사</p>
        </div>
      </aside>
    </>
  );
};

export default SideMenu;
