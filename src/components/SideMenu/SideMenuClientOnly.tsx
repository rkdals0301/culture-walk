'use client';

import dynamic from 'next/dynamic';

const SideMenu = dynamic(() => import('./SideMenu'), {
  loading: () => null,
  ssr: false,
});

export default SideMenu;
