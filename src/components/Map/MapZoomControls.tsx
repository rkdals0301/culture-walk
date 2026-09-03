'use client';

import IconButton from '@/components/Common/IconButton';

import React, { useCallback } from 'react';

import MapAddIcon from '../../../public/assets/images/map-add-icon.svg';
import MapRemoveIcon from '../../../public/assets/images/map-remove-icon.svg';

interface MapZoomControlsProps {
  map: {
    getLevel: () => number;
    setLevel: (level: number) => void;
  } | null;
}

const MapZoomControls = ({ map }: MapZoomControlsProps) => {
  const handleZoomIn = useCallback(() => {
    if (map) {
      const level = map.getLevel();
      map.setLevel(Math.max(1, level - 1));
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      const level = map.getLevel();
      map.setLevel(Math.min(14, level + 1));
    }
  }, [map]);

  return (
    <div className='surface-panel flex flex-col items-center justify-center gap-1 rounded-2xl p-1 shadow-lg backdrop-blur-md'>
      <IconButton
        className='size-9 rounded-xl'
        icon={<MapAddIcon className='size-4' />}
        ariaLabel='지도 확대'
        onClick={handleZoomIn}
        variant='secondary'
      />
      <IconButton
        icon={<MapRemoveIcon className='size-4' />}
        className='size-9 rounded-xl'
        ariaLabel='지도 축소'
        onClick={handleZoomOut}
        variant='secondary'
      />
    </div>
  );
};

export default React.memo(MapZoomControls);
