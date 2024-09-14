'use client';

import Image from 'next/image';
import styles from './MapZoomControls.module.scss';
import React from 'react';

interface MapZoomControlsProps {
  map: google.maps.Map | null; // Google Map 객체를 받을 prop
}

const MapZoomControls = ({ map }: MapZoomControlsProps) => {
  const handleZoomIn = () => {
    if (map) {
      const zoomLevel = map.getZoom();
      if (typeof zoomLevel === 'number') {
        map.setZoom(zoomLevel + 1); // Zoom in by increasing zoom level
      } else {
        console.error('Zoom level is undefined or not a number');
      }
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const zoomLevel = map.getZoom();
      if (typeof zoomLevel === 'number') {
        map.setZoom(zoomLevel - 1); // Zoom in by increasing zoom level
      } else {
        console.error('Zoom level is undefined or not a number');
      }
    }
  };
  return (
    <div className={styles['map-zoom-controls']}>
      <button className={styles['zoom-in-button']} onClick={handleZoomIn}>
        <Image src='/assets/map-zoom-plus-icon.svg' alt='map-zoom-plus-icon' width={12} height={12} priority />
      </button>
      <button className={styles['zoom-out-button']} onClick={handleZoomOut}>
        <Image src='/assets/map-zoom-minus-icon.svg' alt='map-zoom-minus-icon' width={12} height={12} priority />
      </button>
    </div>
  );
};

export default React.memo(MapZoomControls);
