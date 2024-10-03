'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false });

interface MapLayoutProps {
  children: React.ReactNode;
}

const MapLayout = ({ children }: MapLayoutProps) => {
  return (
    <>
      <MapView />
      {children}
    </>
  );
};

export default MapLayout;
