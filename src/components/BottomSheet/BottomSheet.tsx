'use client';

import { useBottomSheet } from '@/context/BottomSheetContext';
import { useSideMenu } from '@/context/SideMenuContext';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';

import React, { useEffect, useRef, useState } from 'react';

import { LazyMotion, domAnimation } from 'framer-motion';
import * as m from 'framer-motion/m';

import CloseIcon from '../../../public/assets/images/close-icon.svg';

const BottomSheet = () => {
  const { isOpen, content, footer, closeBottomSheet } = useBottomSheet();
  const { isOpen: isSideMenuOpen } = useSideMenu();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const isActive = isOpen && !isSideMenuOpen;

  useDialogFocusTrap(isActive, panelRef, closeBottomSheet, '[aria-label="상세 패널 닫기"]');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (panelRef.current?.contains(target)) {
        return;
      }

      closeBottomSheet();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isActive, closeBottomSheet]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {isActive && (
        <LazyMotion features={domAnimation}>
          <div className='bg-[#081311]/18 pointer-events-none fixed inset-0 z-40 size-full lg:hidden' />
          <m.div
            ref={panelRef}
            className='surface-panel pointer-events-auto fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-[24px] text-[var(--app-text)] md:bottom-6 md:left-auto md:right-6 md:max-h-[calc(100dvh-8rem)] md:w-[420px] lg:bottom-0 lg:left-0 lg:right-auto lg:top-[72px] lg:h-[calc(100dvh-72px)] lg:max-h-none lg:w-[400px] lg:rounded-none lg:border-b-0 lg:border-l-0 lg:border-t-0 lg:shadow-none'
            role='dialog'
            aria-modal='true'
            aria-label='행사 상세 정보'
            tabIndex={-1}
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 48 }}
            transition={{ duration: 0.28 }}
          >
            <div className='grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4 pt-3 lg:flex lg:justify-end'>
              <div className='lg:hidden' />
              <div className='h-1.5 w-14 rounded-full bg-[#1f765f]/20 lg:hidden' />
              <button
                type='button'
                onClick={closeBottomSheet}
                className='soft-chip flex size-8 items-center justify-center justify-self-end rounded-full text-[var(--app-muted)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                aria-label='상세 패널 닫기'
              >
                <CloseIcon className='size-4' />
              </button>
            </div>
            <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 sm:px-5'>{content}</div>
            {footer && (
              <div className='shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-4 pb-4 pt-3 sm:px-5'>
                {footer}
              </div>
            )}
          </m.div>
        </LazyMotion>
      )}
    </>
  );
};

export default BottomSheet;
