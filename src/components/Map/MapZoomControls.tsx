'use client';

import IconButton from '@/components/Common/IconButton';

import React, { useCallback } from 'react';

import MapAddIcon from '../../../public/assets/images/map-add-icon.svg';
import MapRemoveIcon from '../../../public/assets/images/map-remove-icon.svg';

interface MapZoomControlsProps {
  map: google.maps.Map | null; // Google Map 객체를 받을 prop
}

const MapZoomControls = ({ map }: MapZoomControlsProps) => {
  const handleZoomIn = useCallback(() => {
    if (map) {
      const zoomLevel = map.getZoom();
      if (typeof zoomLevel === 'number') {
        map.setZoom(zoomLevel + 1); // Zoom in by increasing zoom level
      } else {
        console.error('Zoom level is undefined or not a number');
      }
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      const zoomLevel = map.getZoom();
      if (typeof zoomLevel === 'number') {
        map.setZoom(zoomLevel - 1); // Zoom out by decreasing zoom level
      } else {
        console.error('Zoom level is undefined or not a number');
      }
    }
  }, [map]);

  return (
    <div className='surface-panel absolute bottom-5 right-3 z-20 flex flex-col items-center justify-center gap-1 rounded-[22px] p-1 md:bottom-6 md:right-6'>
      <IconButton
        className='rounded-[16px]'
        icon={<MapAddIcon />}
        ariaLabel='지도 확대'
        onClick={handleZoomIn}
        variant='secondary'
      />
      <IconButton
        icon={<MapRemoveIcon />}
        className='rounded-[16px]'
        ariaLabel='지도 축소'
        onClick={handleZoomOut}
        variant='secondary'
      />
    </div>
  );
};

export default React.memo(MapZoomControls);
