'use client';

import { useBottomSheet } from '@/context/BottomSheetContext';

import React, { useEffect } from 'react';

import { AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
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
          <div className='fixed inset-0 z-10 size-full bg-black/50' onClick={closeBottomSheet} />
          <m.div
            className={`fixed inset-x-0 bottom-0 z-20 h-[260px] w-full rounded-t-lg bg-white shadow-lg dark:bg-neutral-900 dark:text-gray-100 md:left-1/2 md:w-192 md:-translate-x-1/2`}
            animate={{ bottom: 0 }}
            initial={{ bottom: -260 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 5 }}
              >
                <div className='size-full p-4'>{content}</div>
              </m.div>
            </AnimatePresence>
          </m.div>
        </LazyMotion>
      )}
    </>
  );
};

export default BottomSheet;
