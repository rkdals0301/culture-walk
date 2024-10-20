import Loader from '@/components/Loader/Loader';

import React from 'react';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/Map/MapView'), { loading: () => <Loader /> });

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
