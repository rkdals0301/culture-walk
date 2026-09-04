'use client';

import { useBottomSheet } from '@/context/BottomSheetContext';
import { useSideMenu } from '@/context/SideMenuContext';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';

import React, { useEffect, useRef, useState } from 'react';

import { usePathname } from 'next/navigation';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';

import CloseIcon from '../../../public/assets/images/close-icon.svg';
const SHEET_EASE = [0.16, 1, 0.3, 1] as const;

const BottomSheet = () => {
  const {
    isOpen,
    content,
    footer,
    closeOnRouteExit,
    closeBottomSheet,
    dismissBottomSheet,
  } = useBottomSheet();
  const { isOpen: isSideMenuOpen } = useSideMenu();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isWideDesktop, setIsWideDesktop] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isInteractive = isOpen && !isSideMenuOpen;
  const sheetContentKey = pathname ?? 'sheet';
  const panelTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.28, ease: SHEET_EASE };
  const backdropTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.2, ease: SHEET_EASE };
  const contentTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.18, ease: SHEET_EASE };

  useDialogFocusTrap(isInteractive, panelRef, closeBottomSheet, '[aria-label="상세 패널 닫기"]');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const wideMediaQuery = window.matchMedia('(min-width: 1280px)');
    const updateViewport = () => setIsDesktop(mediaQuery.matches);
    const updateWideViewport = () => setIsWideDesktop(wideMediaQuery.matches);

    updateViewport();
    updateWideViewport();
    mediaQuery.addEventListener('change', updateViewport);
    wideMediaQuery.addEventListener('change', updateWideViewport);
    return () => {
      mediaQuery.removeEventListener('change', updateViewport);
      wideMediaQuery.removeEventListener('change', updateWideViewport);
    };
  }, []);

  useEffect(() => {
    if (isOpen && closeOnRouteExit && !/^\/map\/\d+$/.test(pathname ?? '')) {
      dismissBottomSheet();
    }
  }, [closeOnRouteExit, dismissBottomSheet, isOpen, pathname]);

  useEffect(() => {
    if (!isInteractive) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (
        panelRef.current?.contains(target) ||
        (target instanceof Element && target.closest('[data-keeps-detail-open]'))
      ) {
        return;
      }

      closeBottomSheet();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [closeBottomSheet, isInteractive]);

  if (!mounted) {
    return null;
  }

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <React.Fragment>
          <motion.div
            className='pointer-events-none fixed inset-0 z-40 size-full bg-[var(--color-sheet-scrim)] lg:hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
          />
          <motion.div
            ref={panelRef}
            className='bottom-sheet-panel surface-panel pointer-events-auto fixed inset-x-3 z-50 flex h-[calc(100dvh-3rem-env(safe-area-inset-bottom,0px))] flex-col overflow-hidden rounded-[24px] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-2xl backdrop-blur-xl md:left-auto md:right-6 md:w-[420px] lg:h-auto min-[1280px]:left-[var(--map-sidebar-width)] min-[1280px]:right-auto min-[1280px]:h-[calc(100dvh-72px)] min-[1280px]:w-[480px] min-[1280px]:rounded-none min-[1280px]:border-b-0 min-[1280px]:border-l-0 min-[1280px]:border-t-0 min-[1280px]:shadow-none'
            role='dialog'
            aria-hidden={isSideMenuOpen}
            aria-modal={isInteractive}
            aria-label='행사 상세 정보'
            inert={isSideMenuOpen}
            tabIndex={-1}
            animate={isDesktop ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 }}
            initial={isDesktop ? { opacity: 0, x: isWideDesktop ? -32 : 32 } : { opacity: 0, y: 24 }}
            exit={isDesktop ? { opacity: 0, x: isWideDesktop ? -24 : 24 } : { opacity: 0, y: 48 }}
            transition={panelTransition}
          >
            <div className='flex shrink-0 justify-end px-4 pt-3 lg:flex lg:justify-end'>
              <button
                type='button'
                onClick={closeBottomSheet}
                className='soft-chip flex size-10 items-center justify-center justify-self-end rounded-xl text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-interactive-active)]'
                aria-label='상세 패널 닫기'
              >
                <CloseIcon className='size-4' />
              </button>
            </div>
            <div className='bottom-sheet-scroll-region min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 sm:px-5'>
              <AnimatePresence initial={false} mode='wait'>
                <motion.div
                  key={sheetContentKey}
                  className='min-h-full'
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
                  transition={contentTransition}
                >
                  {content}
                </motion.div>
              </AnimatePresence>
            </div>
            {footer && (
              <div className='shrink-0 border-t border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] px-4 pb-4 pt-3 sm:px-5'>
                {footer}
              </div>
            )}
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
