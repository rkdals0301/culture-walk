'use client';

import React from 'react';
import { MarkerF } from '@react-google-maps/api';
import { FormattedCulture } from '@/types/culture';
import { MarkerClusterer } from '@googlemaps/markerclusterer'; // 클러스터러 타입

interface MapMarkerProps {
  culture: FormattedCulture;
  clusterer?: MarkerClusterer;
}

const MapMarker = ({ culture, clusterer }: MapMarkerProps) => {
  const offset = 0.00001 * (culture.id % 10); // index에 따라 오프셋을 조정 (10개의 그룹으로 나누어 각 그룹 내에서 위치 조정)
  const position = {
    lat: +culture.lat + offset,
    lng: +culture.lng + offset,
  };

  return (
    <MarkerF
      position={position}
      title={culture.title}
      onClick={() => {
        console.log(`Marker clicked: ${culture.title}`);
      }}
      // icon={{
      //   url: '/path/to/custom-icon.png', // 커스텀 아이콘 사용 (필요할 경우)
      //   scaledSize: new google.maps.Size(30, 30), // 아이콘 크기 조정 (옵션)
      // }}
      clusterer={clusterer}
    />
  );
};

export default React.memo(MapMarker);
