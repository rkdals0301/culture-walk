'use client';

import Loader from '@/components/Loader/Loader';
import type { CultureMapCluster, CultureMapViewport, FormattedCultureListItem } from '@/types/culture';

import dynamic from 'next/dynamic';

const MapViewNoSsr = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => <Loader />,
});

interface MapViewClientOnlyProps {
  kakaoMapAppKey?: string | null;
  visibleClusters: CultureMapCluster[];
  isClustered: boolean;
  visibleCultures: FormattedCultureListItem[];
  isLoading: boolean;
  error: Error | null;
  onViewportChange: (viewport: CultureMapViewport) => void;
  onContinueWithList?: () => void;
}

const MapViewClientOnly = ({
  kakaoMapAppKey,
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
      kakaoMapAppKey={kakaoMapAppKey}
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
