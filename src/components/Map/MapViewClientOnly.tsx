'use client';

import Loader from '@/components/Loader/Loader';
import type { CultureMapBounds, FormattedCulture } from '@/types/culture';

import dynamic from 'next/dynamic';

const MapViewNoSsr = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => <Loader />,
});

interface MapViewClientOnlyProps {
  visibleCultures: FormattedCulture[];
  isLoading: boolean;
  error: Error | null;
  onBoundsChange: (bounds: CultureMapBounds) => void;
  onContinueWithList?: () => void;
}

const MapViewClientOnly = ({
  visibleCultures,
  isLoading,
  error,
  onBoundsChange,
  onContinueWithList,
}: MapViewClientOnlyProps) => {
  return (
    <MapViewNoSsr
      visibleCultures={visibleCultures}
      isLoading={isLoading}
      error={error}
      onBoundsChange={onBoundsChange}
      onContinueWithList={onContinueWithList}
    />
  );
};

export default MapViewClientOnly;
