'use client';

import React from 'react';
import { MarkerClustererF } from '@react-google-maps/api';
import { FormattedCulture } from '@/types/culture';
import MapMarker from '@/components/Map/MapMarker';
// import styles from './MapMarkerClusterer.module';

interface MapMarkerClustererProps {
  cultures: FormattedCulture[];
}

const MapMarkerClusterer: React.FC<MapMarkerClustererProps> = ({ cultures }) => {
  return (
    <MarkerClustererF
      options={{
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
      }}
    >
      {/* @ts-expect-error Async Server Component */}
      {clusterer => cultures.map(culture => <MapMarker key={culture.id} culture={culture} clusterer={clusterer} />)}
    </MarkerClustererF>
  );
};

export default React.memo(MapMarkerClusterer);
