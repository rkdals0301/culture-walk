'use client';

import Loader from '@/components/Loader/Loader';
import type { CultureMapCluster, CultureMapViewport, FormattedCulture } from '@/types/culture';

import dynamic from 'next/dynamic';

const MapViewNoSsr = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => <Loader />,
});

interface MapViewClientOnlyProps {
  visibleClusters: CultureMapCluster[];
  isClustered: boolean;
  visibleCultures: FormattedCulture[];
  isLoading: boolean;
  error: Error | null;
  onViewportChange: (viewport: CultureMapViewport) => void;
  onContinueWithList?: () => void;
}

const MapViewClientOnly = ({
  visibleClusters,
  isClustered,
  visibleCultures,
  isLoading,
  error,
  onViewportChange,
  onContinueWithList,
}: MapViewClientOnlyProps) => {
  return (
    <MapViewNoSsr
      visibleClusters={visibleClusters}
      isClustered={isClustered}
      visibleCultures={visibleCultures}
      isLoading={isLoading}
      error={error}
      onViewportChange={onViewportChange}
      onContinueWithList={onContinueWithList}
    />
  );
};

export default MapViewClientOnly;
