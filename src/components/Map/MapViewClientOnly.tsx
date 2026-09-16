'use client';

import MapView from '@/components/Map/MapView';
import type { CultureMapCluster, CultureMapViewport, FormattedCultureListItem } from '@/types/culture';

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
    <MapView
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
