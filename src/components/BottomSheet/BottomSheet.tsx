'use client';

import { useBottomSheet } from '@/context/BottomSheetContext';
import { useSideMenu } from '@/context/SideMenuContext';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';

import React, { useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion';

import CloseIcon from '../../../public/assets/images/close-icon.svg';

const BottomSheet = () => {
  const { isOpen, content, footer, closeBottomSheet } = useBottomSheet();
  const { isOpen: isSideMenuOpen } = useSideMenu();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileSheetMode, setMobileSheetMode] = useState<'peek' | 'expanded'>('peek');
  const dragControls = useDragControls();
  const shouldReduceMotion = useReducedMotion();
  const isActive = isOpen && !isSideMenuOpen;
  const mobileSheetHeight = mobileSheetMode === 'expanded' ? 'calc(100dvh - 3rem)' : '52dvh';
  const panelTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
  const backdropTransition = shouldReduceMotion ? { duration: 0.01 } : { duration: 0.2, ease: 'easeOut' as const };

  useDialogFocusTrap(isActive, panelRef, closeBottomSheet, '[aria-label="상세 패널 닫기"]');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const updateViewport = () => setIsDesktop(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (isActive) {
      setMobileSheetMode('peek');
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
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
  }, [isActive, closeBottomSheet]);

  if (!mounted) {
    return null;
  }

  const toggleMobileSheetMode = () => {
    setMobileSheetMode(mode => (mode === 'peek' ? 'expanded' : 'peek'));
  };

  const handleMobileDragEnd = (_: PointerEvent, info: { offset: { y: number } }) => {
    if (info.offset.y < -64) {
      setMobileSheetMode('expanded');
      return;
    }

    if (info.offset.y > 88) {
      if (mobileSheetMode === 'expanded') {
        setMobileSheetMode('peek');
      } else {
        closeBottomSheet();
      }
    }
  };

  return (
    <AnimatePresence initial={false}>
      {isActive && (
        <React.Fragment>
          <motion.div
            className='bg-[#081311]/18 pointer-events-none fixed inset-0 z-40 size-full lg:hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
          />
          <motion.div
            ref={panelRef}
            className='surface-panel pointer-events-auto fixed inset-x-3 bottom-3 z-50 flex h-[52dvh] max-h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-[24px] text-[var(--app-text)] md:bottom-6 md:left-auto md:right-6 md:w-[420px] lg:bottom-0 lg:left-[var(--map-sidebar-width)] lg:right-auto lg:top-[72px] lg:h-[calc(100dvh-72px)] lg:max-h-none lg:w-[400px] lg:rounded-none lg:border-b-0 lg:border-l-0 lg:border-t-0 lg:shadow-none'
            role='dialog'
            aria-modal='true'
            aria-label='행사 상세 정보'
            tabIndex={-1}
            drag={isDesktop ? false : 'y'}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={shouldReduceMotion ? 0 : 0.08}
            onDragEnd={handleMobileDragEnd}
            animate={isDesktop ? { opacity: 1, x: 0 } : { opacity: 1, y: 0, height: mobileSheetHeight }}
            initial={isDesktop ? { opacity: 0, x: -32 } : { opacity: 0, y: 48, height: '52dvh' }}
            exit={isDesktop ? { opacity: 0, x: -24 } : { opacity: 0, y: 48 }}
            transition={panelTransition}
          >
            <div className='grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4 pt-3 lg:flex lg:justify-end'>
              <div className='lg:hidden' />
              <button
                type='button'
                onPointerDown={event => dragControls.start(event)}
                onClick={event => {
                  if (event.detail === 0) {
                    toggleMobileSheetMode();
                  }
                }}
                className='flex h-7 w-16 touch-none items-center justify-center rounded-full lg:hidden'
                aria-label={mobileSheetMode === 'peek' ? '상세 정보 확장' : '상세 정보 축소'}
              >
                <span className='h-1.5 w-14 rounded-full bg-[#1f765f]/20' />
              </button>
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
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
