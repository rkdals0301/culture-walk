'use client';

import dynamic from 'next/dynamic';

const BottomSheet = dynamic(() => import('./BottomSheet'), {
  loading: () => null,
  ssr: false,
});

export default BottomSheet;
