'use client';

import { useBottomSheet } from '@/context/BottomSheetContext';

import React from 'react';

import { motion } from 'framer-motion';

const BottomSheet = () => {
  const { isOpen, content, closeBottomSheet } = useBottomSheet();

  return (
    <>
      {isOpen && (
        <>
          <div className='fixed inset-0 z-10 size-full bg-black/50' onClick={closeBottomSheet} />
          <motion.div
            className={`fixed inset-x-0 bottom-0 z-20 h-[260px] w-full rounded-t-lg bg-white shadow-lg dark:bg-neutral-900 dark:text-gray-100 md:left-1/2 md:w-192 md:-translate-x-1/2`}
            animate={{ bottom: 0 }}
            initial={{ bottom: -260 }}
            transition={{ duration: 0.3 }}
          >
            <div className='size-full p-4'>{content}</div>
          </motion.div>
        </>
      )}
    </>
  );
};

export default BottomSheet;
