'use client';

import { useBottomSheet } from '@/context/BottomSheetContext';

import dynamic from 'next/dynamic';

const BottomSheetNoSsr = dynamic(() => import('./BottomSheet'), {
  loading: () => null,
  ssr: false,
});

const BottomSheetClientOnly = () => {
  const { isOpen } = useBottomSheet();

  // The closed sheet is not part of the initial experience. Keep its
  // animation runtime out of the first route load and fetch it on demand.
  if (!isOpen) {
    return null;
  }

  return <BottomSheetNoSsr />;
};

export default BottomSheetClientOnly;
