'use client';

import dynamic from 'next/dynamic';
// import styles from './page.module.scss';

const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false });

const MapLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <MapView />
      {children}
    </>
  );
};

export default MapLayout;
