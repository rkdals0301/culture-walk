'use client';

import IconButton from '@/components/Common/IconButton';
import { useCultureContext } from '@/context/CultureContext';
import { getGeolocationErrorMessage, LocationRequestError } from '@/utils/geo';

import React, { useCallback } from 'react';
import { toast } from 'react-toastify';

import MapFindMyLocationIcon from '../../../public/assets/images/map-find-my-location-icon.svg';

const MapFindMyLocationControl = () => {
  const { locationStatus, requestLocation, cancelLocation } = useCultureContext();
  const loading = locationStatus === 'requesting';

  const handleFindMyLocation = useCallback(async () => {
    if (loading) {
      cancelLocation();
      return;
    }

    try {
      await requestLocation();
    } catch (error) {
      if (error instanceof LocationRequestError && error.status === 'cancelled') {
        toast.info(getGeolocationErrorMessage(error));
      } else {
        toast.error(getGeolocationErrorMessage(error));
      }
    }
  }, [cancelLocation, loading, requestLocation]);

  return (
    <div className='surface-panel rounded-2xl p-1 shadow-lg backdrop-blur-md'>
      {loading ? (
        <button
          type='button'
          onClick={handleFindMyLocation}
          className='flex size-9 items-center justify-center rounded-xl text-xs font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-interactive-active)]'
          aria-label='위치 확인 취소'
        >
          취소
        </button>
      ) : (
        <IconButton
          ariaLabel='내 위치 찾기'
          fullWidth={false}
          onClick={handleFindMyLocation}
          className='size-9 rounded-xl'
          icon={<MapFindMyLocationIcon className='size-4' />}
          variant='secondary'
        />
      )}
    </div>
  );
};

export default React.memo(MapFindMyLocationControl);
