'use client';

import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import MapZoomControls from '@components/Map/MapZoomControls';
import MapFindMyLocationControl from '@components/Map/MapFindMyLocationControl';
import styles from './MapView.module.scss';

const MapView = () => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCeYUfoW9AIjh0ZAAwC1AeY6JBvl78omI4',
    language: 'ko',
    region: 'KR', // 한국 지역 설정
  });

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) return <div></div>;

  return (
    <div className={styles['map-view']}>
      <GoogleMap
        mapContainerClassName={styles.map}
        options={{
          disableDefaultUI: true, // 기본 UI 요소 모두 숨김
        }}
        center={{ lat: 37.566535, lng: 126.9779692 }} // 기본 위치 설정
        zoom={12}
        clickableIcons={false}
        onLoad={mapInstance => setMap(mapInstance)}
      >
        <MapFindMyLocationControl map={map} />
        <MapZoomControls map={map} />
      </GoogleMap>
    </div>
  );
};

export default React.memo(MapView);
