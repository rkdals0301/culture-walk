'use client';

import { useState } from 'react';
import styles from './MapFindMyLocationControl.module.scss';

interface MapFindMyLocationControlProps {
  map: google.maps.Map | null;
}

const MapFindMyLocationControl = ({ map }: MapFindMyLocationControlProps) => {
  const [loading, setLoading] = useState(false);

  const handleFindMyLocation = () => {
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
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location access denied by user.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            alert('Request to get user location timed out.');
            break;
          default:
            alert('An unknown error occurred.');
            break;
        }
      },
      {
        enableHighAccuracy: true, // 정확도를 높이기 위한 옵션
        timeout: 10000, // 10초 후 타임아웃
        maximumAge: 0, // 캐시된 위치 정보 사용 금지
      }
    );
  };

  return (
    <button
      className={styles['find-my-location-control']}
      onClick={handleFindMyLocation}
      disabled={loading}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
        e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      }}
    >
      <span role='img' aria-label='locate'>
        📍
      </span>
    </button>
  );
};

export default MapFindMyLocationControl;
