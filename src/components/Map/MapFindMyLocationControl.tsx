'use client';

import React, { useState, useCallback } from 'react';
import styles from './MapFindMyLocationControl.module.scss';
import MapFindMyLocationIcon from '../../../public//assets/map-find-my-location-icon.svg';

interface MapFindMyLocationControlProps {
  onLocationUpdate: (lat: number, lng: number) => void; // 위치 업데이트 콜백
}

const MapFindMyLocationControl = ({ onLocationUpdate }: MapFindMyLocationControlProps) => {
  const [loading, setLoading] = useState(false);

  const handleFindMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('브라우저가 위치 정보 기능을 지원하지 않습니다.');
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
        let errorMessage = '알 수 없는 오류가 발생했습니다.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              '위치 정보 접근이 거부되었습니다. 위치 권한을 브라우저 설정에서 수동으로 변경해야 합니다. 브라우저 설정 페이지에서 위치 권한을 확인하세요.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청이 시간 초과되었습니다.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true, // GPS 사용
        timeout: 5000,
        maximumAge: 60000, // 캐시된 위치 사용 1분간
      }
    );
  }, [onLocationUpdate]);

  return (
    <button
      aria-label='내 위치 찾기'
      className={styles['find-my-location-control']}
      onClick={handleFindMyLocation}
      disabled={loading}
    >
      <MapFindMyLocationIcon />
    </button>
  );
};

export default React.memo(MapFindMyLocationControl);
