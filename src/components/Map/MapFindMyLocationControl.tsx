'use client';

import IconButton from '@/components/Common/IconButton';
import { getGeolocationErrorMessage, requestCurrentLocation } from '@/utils/geo';

import React, { useCallback, useState } from 'react';
import { toast } from 'react-toastify';

import MapFindMyLocationIcon from '../../../public/assets/images/map-find-my-location-icon.svg';

interface MapFindMyLocationControlProps {
  onLocationUpdate: (lat: number, lng: number) => void; // 위치 업데이트 콜백
}

const MapFindMyLocationControl = ({ onLocationUpdate }: MapFindMyLocationControlProps) => {
  const [loading, setLoading] = useState(false);

  const handleFindMyLocation = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const location = await requestCurrentLocation();
      onLocationUpdate(location.lat, location.lng);
    } catch (error) {
      toast.error(getGeolocationErrorMessage(error));
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
