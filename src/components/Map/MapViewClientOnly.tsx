'use client';

import Loader from '@/components/Loader/Loader';

import dynamic from 'next/dynamic';

const MapViewNoSsr = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => <Loader />,
});

const MapViewClientOnly = () => {
  return <MapViewNoSsr />;
};

export default MapViewClientOnly;
