'use client';

import { useState } from 'react';
import styles from './MapFindMyLocationControl.module.scss';

interface MapFindMyLocationControlProps {
  map: google.maps.Map | null; // Google Map 객체를 받을 prop
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
          map.setZoom(14); // 줌 레벨 조정 (필요에 따라 조정 가능)
          map.panTo(currentLocation); // 사용자의 위치로 지도를 이동
        }

        setLoading(false);
      },
      error => {
        console.error('Error getting location: ', error);
        setLoading(false);
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
