'use client';

import React, { useState, useCallback } from 'react';
import styles from './MapFindMyLocationControl.module.scss';
import Image from 'next/image';

interface MapFindMyLocationControlProps {
  onLocationUpdate: (lat: number, lng: number) => void; // 위치 업데이트 콜백
}

const MapFindMyLocationControl = ({ onLocationUpdate }: MapFindMyLocationControlProps) => {
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
        onLocationUpdate(latitude, longitude); // 부모 컴포넌트로 위치 전달
        setLoading(false);
      },
      error => {
        setLoading(false);
        let errorMessage = 'An unknown error occurred.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user. Please enable location services.';
            // 위치 권한이 거부되었을 때 다시 요청하도록 유도
            if (window.confirm('Location access was denied. Do you want to try again?')) {
              handleFindMyLocation(); // 다시 요청
            }
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
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onLocationUpdate]);

  return (
    <button className={styles['find-my-location-control']} onClick={handleFindMyLocation} disabled={loading}>
      <Image src='/assets/map-my-location-icon.svg' alt='Find my location' width={20} height={20} priority />
    </button>
  );
};

export default React.memo(MapFindMyLocationControl);
