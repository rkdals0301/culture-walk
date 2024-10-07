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
            className={`fixed inset-x-0 bottom-0 z-20 h-[270px] w-full rounded-t-xl bg-white shadow-lg dark:bg-neutral-900 dark:text-gray-100 md:left-1/2 md:w-3/5 md:-translate-x-1/2 lg:w-3/5 xl:w-2/5`}
            animate={{ bottom: 0 }}
            initial={{ bottom: -270 }}
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
