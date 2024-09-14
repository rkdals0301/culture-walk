'use client';

import React, { useState, useCallback } from 'react';
import styles from './MapFindMyLocationControl.module.scss';
import Image from 'next/image';

interface MapFindMyLocationControlProps {
  map: google.maps.Map | null;
}

const MapFindMyLocationControl = ({ map }: MapFindMyLocationControlProps) => {
  const [loading, setLoading] = useState(false);

  const handleFindMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const currentLocation = new google.maps.LatLng(latitude, longitude);

        if (map) {
          map.setZoom(14);
          map.panTo(currentLocation);
        }

        setLoading(false);
      },
      error => {
        setLoading(false);
        let errorMessage = 'An unknown error occurred.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Request to get user location timed out.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true, // 정확도를 높이기 위한 옵션
        timeout: 10000, // 10초 후 타임아웃
        maximumAge: 0, // 캐시된 위치 정보 사용 금지
      }
    );
  }, [map]);

  return (
    <button className={styles['find-my-location-control']} onClick={handleFindMyLocation} disabled={loading}>
      <Image src='/assets/map-my-location-icon.svg' alt='Find my location' width={20} height={20} priority />
    </button>
  );
};

export default React.memo(MapFindMyLocationControl);
