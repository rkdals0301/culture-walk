'use client';

import Loader from '@/components/Loader/Loader';

import dynamic from 'next/dynamic';

const MapViewNoSsr = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => <Loader />,
});

interface MapViewClientOnlyProps {
  onContinueWithList?: () => void;
}

const MapViewClientOnly = ({ onContinueWithList }: MapViewClientOnlyProps) => {
  return <MapViewNoSsr onContinueWithList={onContinueWithList} />;
};

export default MapViewClientOnly;
