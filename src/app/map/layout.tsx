'use client';

// src/app/map/layout.tsx
import dynamic from 'next/dynamic';
import React from 'react';

const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false });

const MapLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <>
      <MapView />
      {children}
    </>
  );
};

export default MapLayout;
