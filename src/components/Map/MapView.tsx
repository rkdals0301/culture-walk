'use client';

// import styles from './MapView.module.scss';
import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const MapView = () => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCeYUfoW9AIjh0ZAAwC1AeY6JBvl78omI4',
    language: 'ko',
    region: 'KR', // 한국 지역 설정
  });

  useEffect(() => {
    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setPosition({ lat, lng });
        },
        error => {
          console.error('Error getting location:', error);
          setPosition({ lat: 37.715133, lng: 126.734086 });
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setPosition({ lat: 37.715133, lng: 126.734086 });
    }
  }, []);

  useEffect(() => {
    if (map && position) {
      const newLatLng = new google.maps.LatLng(position.lat, position.lng);
      map.panTo(newLatLng);

      if (marker) {
        marker.setPosition(newLatLng);
      } else {
        const newMarker = new google.maps.Marker({
          position: newLatLng,
          map: map,
          title: 'You are here!',
        });
        setMarker(newMarker);
      }
    }
  }, [map, position]);

  const handleFindMyLocation = () => {
    if (position && map) {
      const newLatLng = new google.maps.LatLng(position.lat, position.lng);
      map.panTo(newLatLng);
    }
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          disableDefaultUI: true, // 기본 UI 요소 모두 숨김
          zoomControl: true, // 줌 컨트롤만 표시
        }}
        center={position ?? { lat: 37.7749, lng: -122.4194 }} // 기본 위치 설정
        zoom={12}
        clickableIcons={false}
        onLoad={mapInstance => setMap(mapInstance)}
      >
        {position && <Marker position={position} title='You are here!' />}
      </GoogleMap>
      <button
        style={{
          width: '40px',
          height: '40px',
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
        }}
        onClick={handleFindMyLocation}
      >
        <span role='img' aria-label='locate'>
          📍
        </span>
      </button>
    </div>
  );
};

export default React.memo(MapView);
