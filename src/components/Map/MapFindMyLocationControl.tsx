'use client';

import IconButton from '@/components/Common/IconButton';

import React, { useCallback, useState } from 'react';
import { toast } from 'react-toastify';

import MapFindMyLocationIcon from '../../../public/assets/images/map-find-my-location-icon.svg';

interface MapFindMyLocationControlProps {
  onLocationUpdate: (lat: number, lng: number) => void; // 위치 업데이트 콜백
}

const getCurrentPosition = (options: PositionOptions) =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const MapFindMyLocationControl = ({ onLocationUpdate }: MapFindMyLocationControlProps) => {
  const [loading, setLoading] = useState(false);

  const handleFindMyLocation = useCallback(async () => {
    if (loading) {
      return;
    }

    if (!navigator.geolocation) {
      toast.error('브라우저가 위치 정보 기능을 지원하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      let position: GeolocationPosition;

      try {
        position = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 0,
        });
      } catch {
        position = await getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 7000,
          maximumAge: 120000,
        });
      }

      const { latitude, longitude } = position.coords;
      onLocationUpdate(latitude, longitude);
    } catch (error) {
      const geolocationError = error as GeolocationPositionError;
      let errorMessage = '알 수 없는 오류가 발생했습니다.';

      switch (geolocationError.code) {
        case geolocationError.PERMISSION_DENIED:
          errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
          break;
        case geolocationError.POSITION_UNAVAILABLE:
          errorMessage = '현재 위치 정보를 사용할 수 없습니다.';
          break;
        case geolocationError.TIMEOUT:
          errorMessage = '위치 확인 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
          break;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loading, onLocationUpdate]);

  return (
    <div className='surface-panel rounded-[22px] p-1'>
      <IconButton
        ariaLabel='내 위치 찾기'
        fullWidth={false}
        disabled={loading}
        onClick={handleFindMyLocation}
        className='rounded-[16px]'
        icon={<MapFindMyLocationIcon className={loading ? 'animate-spin' : undefined} />}
        variant='secondary'
      />
    </div>
  );
};

export default React.memo(MapFindMyLocationControl);
