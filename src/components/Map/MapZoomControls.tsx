'use client';

import React, { useCallback } from 'react';
import MapAddIcon from '../../../public/assets/map-add-icon.svg';
import MapRemoveIcon from '../../../public/assets/map-remove-icon.svg';
import IconButton from '@/components/Common/IconButton';

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
    <div className='absolute bottom-5 right-2 flex flex-col items-center justify-center rounded-lg bg-white shadow-lg'>
      <IconButton
        className='size-8 rounded-t-lg bg-gray-100 shadow-lg hover:bg-gray-300 dark:bg-gray-100 dark:hover:bg-gray-300'
        icon={<MapAddIcon />}
        ariaLabel='지도 확대'
        onClick={handleZoomIn}
        iconClassName='dark:text-gray-900' // 아이콘 색상 스타일
      />
      <div className='h-px w-full bg-gray-200' /> {/* 버튼 사이의 선 */}
      <IconButton
        icon={<MapRemoveIcon />}
        className='size-8 rounded-b-lg bg-gray-100 shadow-lg hover:bg-gray-300 dark:bg-gray-100 dark:hover:bg-gray-300'
        ariaLabel='지도 축소'
        onClick={handleZoomOut}
        iconClassName='dark:text-gray-900' // 아이콘 색상 스타일
      />
    </div>
  );
};

export default React.memo(MapZoomControls);
