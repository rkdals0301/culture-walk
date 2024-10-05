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
            className={`fixed inset-x-0 bottom-0 z-20 flex h-[185px] w-full flex-col rounded-t-xl bg-white shadow-lg dark:bg-neutral-900 dark:text-gray-100 md:left-1/2 md:w-4/5 md:-translate-x-1/2 lg:w-3/5 xl:w-1/2`}
            animate={{ bottom: 0 }}
            initial={{ bottom: -185 }}
            transition={{ duration: 0.3 }}
          >
            <div className='grow overflow-y-auto p-4'>{content}</div>
          </motion.div>
        </>
      )}
    </>
  );
};

export default BottomSheet;
