'use client';

import { useBottomSheet } from '@/context/BottomSheetContext';
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

type MobileSheetMode = 'peek' | 'expanded';
type BottomSheetMotionStyle = MotionStyle & {
  '--bottom-sheet-base-height'?: string;
};

const MOBILE_SHEET_BASE_HEIGHTS: Record<MobileSheetMode, string> = {
  peek: '52dvh',
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
  } = useBottomSheet();
  const { isOpen: isSideMenuOpen } = useSideMenu();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isWideDesktop, setIsWideDesktop] = useState(false);
  const [mobileSheetMode, setMobileSheetMode] = useState<MobileSheetMode>('peek');
  const dragControls = useDragControls();
  const shouldReduceMotion = useReducedMotion();
  const sheetDragDelta = useMotionValue(0);
  const sheetHeight = useMotionTemplate`calc(var(--bottom-sheet-base-height) + ${sheetDragDelta}px)`;
  const sheetHeightAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const snapAnimationIdRef = useRef(0);
  const dragBaseModeRef = useRef<MobileSheetMode>('peek');
  const dragStartDeltaRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const isInteractive = isOpen && !isSideMenuOpen;
  const sheetContentKey = `${pathname ?? 'sheet'}:${backLabel ?? 'root'}`;
  const mobileSheetStyle: BottomSheetMotionStyle = {
    '--bottom-sheet-base-height': MOBILE_SHEET_BASE_HEIGHTS[mobileSheetMode],
    height: sheetHeight,
    willChange: 'height',
  };
  const panelTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
  const backdropTransition = shouldReduceMotion ? { duration: 0.01 } : { duration: 0.2, ease: 'easeOut' as const };
  const contentTransition = shouldReduceMotion ? { duration: 0.01 } : { duration: 0.18, ease: 'easeOut' as const };

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
      setMobileSheetMode('peek');
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
  }, [isInteractive, closeBottomSheet]);

  if (!mounted) {
    return null;
  }

  const stopSheetHeightAnimation = () => {
    snapAnimationIdRef.current += 1;
    sheetHeightAnimationRef.current?.stop();
    sheetHeightAnimationRef.current = null;
  };

  const getSheetSnapDistance = () => {
    if (typeof window === 'undefined') {
      return 320;
    }

    const peekHeight = window.innerHeight * 0.52;
    const maxHeight = panelRef.current ? Number.parseFloat(window.getComputedStyle(panelRef.current).maxHeight) : NaN;
    const expandedHeight = Number.isFinite(maxHeight) ? maxHeight : window.innerHeight - 48;

    return Math.max(160, expandedHeight - peekHeight);
  };

  const animateSheetToMode = (targetMode: MobileSheetMode, baseMode: MobileSheetMode) => {
    const snapDistance = getSheetSnapDistance();
    const targetDelta = targetMode === baseMode ? 0 : targetMode === 'expanded' ? snapDistance : -snapDistance;

    stopSheetHeightAnimation();

    if (shouldReduceMotion) {
      sheetDragDelta.set(targetDelta);
      if (targetMode !== baseMode) {
        setMobileSheetMode(targetMode);
        sheetDragDelta.set(0);
      }
      return;
    }

    const animationId = snapAnimationIdRef.current;
    sheetHeightAnimationRef.current = animate(sheetDragDelta, targetDelta, {
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        if (snapAnimationIdRef.current !== animationId) {
          return;
        }

        if (targetMode !== baseMode) {
          setMobileSheetMode(targetMode);
          sheetDragDelta.set(0);
        }

        sheetHeightAnimationRef.current = null;
      },
    });
  };

  const toggleMobileSheetMode = () => {
    const nextMode: MobileSheetMode = mobileSheetMode === 'peek' ? 'expanded' : 'peek';
    animateSheetToMode(nextMode, mobileSheetMode);
  };

  const handleMobileDragStart = () => {
    stopSheetHeightAnimation();
    hasDraggedRef.current = false;
    dragBaseModeRef.current = mobileSheetMode;
    dragStartDeltaRef.current = sheetDragDelta.get();
  };

  const handleMobileDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const snapDistance = getSheetSnapDistance();
    const overshoot = shouldReduceMotion ? 0 : 20;
    const nextDelta = dragStartDeltaRef.current - info.offset.y;
    const clampedDelta = Math.min(snapDistance + overshoot, Math.max(-snapDistance - overshoot, nextDelta));

    if (Math.abs(info.offset.y) > 4) {
      hasDraggedRef.current = true;
    }

    sheetDragDelta.set(clampedDelta);
  };

  const handleMobileDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const baseMode = dragBaseModeRef.current;
    const snapDistance = getSheetSnapDistance();
    const projectedDelta = dragStartDeltaRef.current - (info.offset.y + info.velocity.y * 0.12);
    const expandThreshold = Math.max(56, snapDistance * 0.16);
    const closeThreshold = Math.max(88, snapDistance * 0.24);
    const fastUpwardSwipe = info.velocity.y < -520;
    const fastDownwardSwipe = info.velocity.y > 520;

    if (baseMode === 'peek' && (projectedDelta > expandThreshold || fastUpwardSwipe)) {
      animateSheetToMode('expanded', baseMode);
      return;
    }

    if (baseMode === 'peek' && (projectedDelta < -closeThreshold || fastDownwardSwipe)) {
      closeBottomSheet();
      return;
    }

    if (baseMode === 'expanded' && (projectedDelta < -expandThreshold || fastDownwardSwipe)) {
      animateSheetToMode('peek', baseMode);
      return;
    }

    animateSheetToMode(baseMode, baseMode);
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
            className='bottom-sheet-panel surface-panel pointer-events-auto fixed inset-x-3 z-50 flex h-[52dvh] flex-col overflow-hidden rounded-[18px] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] md:left-auto md:right-6 md:w-[420px] lg:h-auto min-[1280px]:left-[var(--map-sidebar-width)] min-[1280px]:right-auto min-[1280px]:h-[calc(100dvh-72px)] min-[1280px]:w-[400px] min-[1280px]:rounded-none min-[1280px]:border-b-0 min-[1280px]:border-l-0 min-[1280px]:border-t-0 min-[1280px]:shadow-none'
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
            initial={isDesktop ? { opacity: 0, x: isWideDesktop ? -32 : 32 } : { opacity: 0 }}
            exit={isDesktop ? { opacity: 0, x: isWideDesktop ? -24 : 24 } : { opacity: 0, y: 48 }}
            transition={panelTransition}
          >
            <div className='grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4 pt-3 lg:flex lg:justify-end'>
              {backLabel ? (
                <button
                  type='button'
                  onClick={backBottomSheet}
                  className='flex h-11 min-w-11 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[var(--color-text-secondary)] lg:hidden'
                  aria-label={`${backLabel}으로 돌아가기`}
                >
                  <ArrowBackIcon className='size-4' />
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
                <span className='h-1.5 w-14 rounded-full bg-[var(--color-brand-subtle)]' />
              </button>
              <button
                type='button'
                onClick={closeBottomSheet}
                className='soft-chip flex size-11 items-center justify-center justify-self-end rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-interactive-active)]'
                aria-label='상세 패널 닫기'
              >
                <CloseIcon className='size-4' />
              </button>
            </div>
            <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 sm:px-5'>
              <AnimatePresence initial={false} mode='wait'>
                <motion.div
                  key={sheetContentKey}
                  className='min-h-full'
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -8 }}
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
