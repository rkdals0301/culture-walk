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

import { ChevronRight, Compass, Info, Mail, MapPin } from 'lucide-react';

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
          'safe-area-side-panel fixed left-0 top-0 z-[80] flex h-dvh w-[calc(100vw-16px)] max-w-[320px] flex-col rounded-r-2xl border-r border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] shadow-2xl transition-transform duration-300 ease-out',
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
          <Link href='/' className='flex min-w-0 items-center gap-3' onClick={closeSideMenu}>
            <Image
              src='/favicon.svg'
              alt='문화산책'
              width={42}
              height={42}
              className='size-10 rounded-xl shadow-xs'
            />
            <div className='min-w-0'>
              <h2 id='side-menu-title' className='truncate text-lg font-bold tracking-tight'>
                문화산책
              </h2>
              <p className='text-[0.7rem] font-medium text-[var(--color-text-tertiary)]'>
                전국 문화행사
              </p>
            </div>
          </Link>
          <IconButton icon={<CloseIcon />} ariaLabel='사이드메뉴 닫기' onClick={closeSideMenu} variant='secondary' className='size-10 rounded-xl' />
        </div>

        <nav className='mt-6' aria-label='주요 메뉴'>
          <p className='px-3 text-xs font-semibold text-[var(--color-text-tertiary)]'>서비스 바로가기</p>
          <div className='mt-3 flex flex-col gap-1'>
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
                  onClick={closeSideMenu}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'flex min-h-12 items-center justify-between gap-3 rounded-xl px-3.5 text-[0.95rem] font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)] shadow-xs'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-brand-primary)]'
                  )}
                >
                  <span className='flex items-center gap-3'>
                    <span
                      className={clsx(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-[var(--color-brand-primary)] text-white shadow-2xs'
                          : 'bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)]'
                      )}
                    >
                      {link.href === '/' && <Compass className='size-4' strokeWidth={2} />}
                      {link.href === '/map' && <MapPin className='size-4' strokeWidth={2} />}
                      {link.href === '/about' && <Info className='size-4' strokeWidth={2} />}
                      {link.href === '/contact' && <Mail className='size-4' strokeWidth={2} />}
                    </span>
                    <span>{link.label}</span>
                  </span>
                  <ChevronRight className='size-4 opacity-40' strokeWidth={2.2} />
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
