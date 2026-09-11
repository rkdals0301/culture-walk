'use client';

import IconButton from '@/components/Common/IconButton';
import { useExploreLocationControls } from '@/hooks/useExploreLocationControls';

import React, { useCallback } from 'react';

import MapFindMyLocationIcon from '../../../public/assets/images/map-find-my-location-icon.svg';

const MapFindMyLocationControl = () => {
  const { isLocating: loading, requestLocationWithFeedback, toggleLocation } = useExploreLocationControls();

  const handleFindMyLocation = useCallback(async () => {
    if (loading) {
      await toggleLocation();
      return;
    }
    await requestLocationWithFeedback();
  }, [loading, requestLocationWithFeedback, toggleLocation]);

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
