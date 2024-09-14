'use client';

import React, { useMemo } from 'react';
import { MarkerClustererF } from '@react-google-maps/api';
import { FormattedCulture } from '@/types/culture';
import MapMarker from '@/components/Map/MapMarker';
// import styles from './MapMarkerClusterer.module';

interface MapMarkerClustererProps {
  cultures: FormattedCulture[];
}

const MapMarkerClusterer: React.FC<MapMarkerClustererProps> = ({ cultures }) => {
  const clusterOptions = useMemo(
    () => ({
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
    }),
    []
  );

  return (
    <MarkerClustererF options={clusterOptions}>
      {clusterer => (
        <>
          {cultures.map(culture => (
            <MapMarker
              key={culture.id}
              culture={culture}
              clusterer={clusterer as any} // 타입 캐스팅
            />
          ))}
        </>
      )}
    </MarkerClustererF>
  );
};

export default React.memo(MapMarkerClusterer);
