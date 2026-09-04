'use client';

import { useBottomSheet, type BottomSheetMode } from '@/context/BottomSheetContext';
import { useSideMenu } from '@/context/SideMenuContext';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';

import React, { useEffect, useRef, useState } from 'react';

import { usePathname } from 'next/navigation';

import {
  AnimatePresence,
  type AnimationPlaybackControls,
  type MotionStyle,
  type PanInfo,
  animate,
  motion,
  useDragControls,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';
import CloseIcon from '../../../public/assets/images/close-icon.svg';

type BottomSheetMotionStyle = MotionStyle & {
  '--bottom-sheet-base-height'?: string;
};

const MOBILE_SHEET_PEEK_HEIGHT_RATIO = 0.74;
const SHEET_EASE = [0.16, 1, 0.3, 1] as const;
const MOBILE_SHEET_BASE_HEIGHTS: Record<BottomSheetMode, string> = {
  peek: '74dvh',
  expanded: '100dvh - 3rem - env(safe-area-inset-bottom, 0px)',
};

const BottomSheet = () => {
  const {
    isOpen,
    content,
    footer,
    closeOnRouteExit,
    backLabel,
    backBottomSheet,
    closeBottomSheet,
    dismissBottomSheet,
    mobileSheetMode,
    setMobileSheetMode,
  } = useBottomSheet();
  const { isOpen: isSideMenuOpen } = useSideMenu();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isWideDesktop, setIsWideDesktop] = useState(false);
  const dragControls = useDragControls();
  const shouldReduceMotion = useReducedMotion();
  const sheetDragDelta = useMotionValue(0);
  const sheetHeight = useMotionTemplate`calc(var(--bottom-sheet-base-height) + ${sheetDragDelta}px)`;
  const sheetHeightAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const snapAnimationIdRef = useRef(0);
  const dragBaseModeRef = useRef<BottomSheetMode>('peek');
  const dragStartDeltaRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const isInteractive = isOpen && !isSideMenuOpen;
  const sheetContentKey = `${pathname ?? 'sheet'}:${backLabel ?? 'root'}`;
  const mobileSheetStyle: BottomSheetMotionStyle = {
    '--bottom-sheet-base-height': MOBILE_SHEET_BASE_HEIGHTS[mobileSheetMode],
    height: sheetHeight,
  };
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
    if (!isOpen) {
      snapAnimationIdRef.current += 1;
      sheetHeightAnimationRef.current?.stop();
      sheetHeightAnimationRef.current = null;
      sheetDragDelta.set(0);
    }
  }, [isOpen, sheetDragDelta]);

  useEffect(() => {
    return () => sheetHeightAnimationRef.current?.stop();
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

  const animateSheetToDelta = (targetDelta: number, targetMode: BottomSheetMode, startDelta?: number) => {
    snapAnimationIdRef.current += 1;
    const animationId = snapAnimationIdRef.current;
    sheetHeightAnimationRef.current?.stop();
    sheetHeightAnimationRef.current = null;

    if (startDelta !== undefined) {
      sheetDragDelta.set(startDelta);
    }

    if (shouldReduceMotion) {
      sheetDragDelta.set(0);
      setMobileSheetMode(targetMode);
      return;
    }

    sheetHeightAnimationRef.current = animate(sheetDragDelta, targetDelta, {
      type: 'spring',
      duration: 0.5,
      bounce: 0.2,
      onComplete: () => {
        if (snapAnimationIdRef.current !== animationId) {
          return;
        }

        sheetDragDelta.set(0);
        setMobileSheetMode(targetMode);
      },
    });
  };

  const animateSheetToMode = (nextMode: BottomSheetMode) => {
    const currentHeight = panelRef.current?.getBoundingClientRect().height ?? 0;
    const targetBaseHeight =
      nextMode === 'expanded'
        ? window.innerHeight - 48
        : window.innerHeight * MOBILE_SHEET_PEEK_HEIGHT_RATIO;

    setMobileSheetMode(nextMode);
    animateSheetToDelta(0, nextMode, currentHeight - targetBaseHeight);
  };

  const toggleMobileSheetMode = () => {
    const nextMode = mobileSheetMode === 'peek' ? 'expanded' : 'peek';
    animateSheetToMode(nextMode);
  };

  const handleMobileDragStart = () => {
    snapAnimationIdRef.current += 1;
    sheetHeightAnimationRef.current?.stop();
    sheetHeightAnimationRef.current = null;
    dragBaseModeRef.current = mobileSheetMode;
    dragStartDeltaRef.current = sheetDragDelta.get();
    hasDraggedRef.current = false;
  };

  const handleMobileDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 4) {
      hasDraggedRef.current = true;
    }

    sheetDragDelta.set(dragStartDeltaRef.current - info.offset.y);
  };

  const handleMobileDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const baseMode = dragBaseModeRef.current;
    const totalDelta = sheetDragDelta.get();
    const velocityY = info.velocity.y;

    if (baseMode === 'peek') {
      if (velocityY < -420 || totalDelta > 64) {
        animateSheetToMode('expanded');
        return;
      }

      if (velocityY > 520 || totalDelta < -96) {
        closeBottomSheet();
        return;
      }

      animateSheetToMode('peek');
      return;
    }

    if (velocityY > 420 || totalDelta < -72) {
      animateSheetToMode('peek');
      return;
    }

    animateSheetToMode(baseMode);
  };

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
            className='bottom-sheet-panel surface-panel pointer-events-auto fixed inset-x-3 z-50 flex h-[74dvh] flex-col overflow-hidden rounded-[24px] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-2xl backdrop-blur-xl md:left-auto md:right-6 md:w-[420px] lg:h-auto min-[1280px]:left-[var(--map-sidebar-width)] min-[1280px]:right-auto min-[1280px]:h-[calc(100dvh-72px)] min-[1280px]:w-[480px] min-[1280px]:rounded-none min-[1280px]:border-b-0 min-[1280px]:border-l-0 min-[1280px]:border-t-0 min-[1280px]:shadow-none'
            role='dialog'
            aria-hidden={isSideMenuOpen}
            aria-modal={isInteractive}
            aria-label='행사 상세 정보'
            inert={isSideMenuOpen}
            tabIndex={-1}
            style={isDesktop ? undefined : mobileSheetStyle}
            drag={isDesktop ? false : 'y'}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0}
            dragMomentum={false}
            onDragStart={handleMobileDragStart}
            onDrag={handleMobileDrag}
            onDragEnd={handleMobileDragEnd}
            animate={isDesktop ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 }}
            initial={isDesktop ? { opacity: 0, x: isWideDesktop ? -32 : 32 } : { opacity: 0, y: 24 }}
            exit={isDesktop ? { opacity: 0, x: isWideDesktop ? -24 : 24 } : { opacity: 0, y: 48 }}
            transition={panelTransition}
          >
            <div className='grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4 pt-3 lg:flex lg:justify-end'>
              {backLabel ? (
                <button
                  type='button'
                  onClick={backBottomSheet}
                  className='flex h-10 min-w-10 items-center gap-1 rounded-xl px-2.5 text-xs font-bold text-[var(--color-brand-primary)] transition hover:opacity-80 lg:hidden'
                  aria-label={`${backLabel}으로 돌아가기`}
                >
                  <ArrowBackIcon className='size-3.5' />
                  {backLabel}
                </button>
              ) : (
                <div className='lg:hidden' />
              )}
              <button
                type='button'
                onPointerDown={event => dragControls.start(event)}
                onClick={event => {
                  if (hasDraggedRef.current) {
                    hasDraggedRef.current = false;
                    return;
                  }

                  toggleMobileSheetMode();
                }}
                className='flex h-7 w-16 touch-none items-center justify-center rounded-full lg:hidden'
                aria-label={mobileSheetMode === 'peek' ? '상세 정보 확장' : '상세 정보 축소'}
                aria-expanded={mobileSheetMode === 'expanded'}
              >
                <span className='h-1.5 w-14 rounded-full bg-[var(--color-border-control)] opacity-50' />
              </button>
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
