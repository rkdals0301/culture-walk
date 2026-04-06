'use client';

import { useBottomSheet } from '@/context/BottomSheetContext';

import React, { useEffect, useRef } from 'react';

import { LazyMotion, domAnimation } from 'framer-motion';
import * as m from 'framer-motion/m';

const BottomSheet = () => {
  const { isOpen, content, closeBottomSheet } = useBottomSheet();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeBottomSheet();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeBottomSheet]);

  useEffect(() => {
    if (!isOpen) {
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
  }, [isOpen, closeBottomSheet]);

  return (
    <>
      {isOpen && (
        <LazyMotion features={domAnimation}>
          <div className='pointer-events-none fixed inset-0 z-40 size-full bg-[#081311]/42 backdrop-blur-[1px]' />
          <m.div
            ref={panelRef}
            className='surface-panel pointer-events-auto fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100dvh-7.5rem)] flex-col overflow-hidden rounded-[30px] text-[var(--app-text)] md:bottom-6 md:left-auto md:right-6 md:w-[440px] md:max-h-[calc(100dvh-9rem)]'
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 48 }}
            transition={{ duration: 0.28 }}
          >
            <div className='grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4 pt-3'>
              <div />
              <div className='h-1.5 w-14 rounded-full bg-[#1f765f]/20' />
              <button
                type='button'
                onClick={closeBottomSheet}
                className='soft-chip justify-self-end rounded-full px-3 py-1 text-xs font-semibold text-[var(--app-muted)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                aria-label='상세 패널 닫기'
              >
                닫기
              </button>
            </div>
            <div className='min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4'>{content}</div>
          </m.div>
        </LazyMotion>
      )}
    </>
  );
};

export default BottomSheet;
