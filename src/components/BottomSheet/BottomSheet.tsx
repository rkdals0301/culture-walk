'use client';

import { useBottomSheet } from '@/context/BottomSheetContext';

import React, { useEffect } from 'react';

import { LazyMotion, domAnimation } from 'framer-motion';
import * as m from 'framer-motion/m';

const BottomSheet = () => {
  const { isOpen, content, closeBottomSheet } = useBottomSheet();

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

  return (
    <>
      {isOpen && (
        <LazyMotion features={domAnimation}>
          <div className='fixed inset-0 z-40 size-full bg-[#081311]/55 backdrop-blur-sm' onClick={closeBottomSheet} />
          <m.div
            className='surface-panel fixed inset-x-3 bottom-3 z-50 max-h-[calc(100dvh-7.5rem)] overflow-hidden rounded-[30px] text-[var(--app-text)] md:bottom-6 md:left-auto md:right-6 md:w-[440px] md:max-h-[calc(100dvh-9rem)]'
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 48 }}
            transition={{ duration: 0.28 }}
          >
            <div className='mx-auto mt-3 h-1.5 w-14 rounded-full bg-[#1f765f]/20' />
            <div className='max-h-[calc(100%-1rem)] overflow-y-auto px-5 pb-5 pt-4'>{content}</div>
          </m.div>
        </LazyMotion>
      )}
    </>
  );
};

export default BottomSheet;
