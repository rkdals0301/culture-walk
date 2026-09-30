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
  onMapSdkError?: () => void;
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
  onMapSdkError,
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
      onMapSdkError={onMapSdkError}
      onContinueWithList={onContinueWithList}
    />
  );
};

export default MapViewClientOnly;
