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
      <button
        className={styles['zoom-in-button']}
        onClick={handleZoomIn}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
          e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }}
      >
        <Image src='/assets/map-zoom-plus-icon.svg' alt='map-zoom-plus-icon' width={12} height={12} priority />
      </button>
      <button
        className={styles['zoom-out-button']}
        onClick={handleZoomOut}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
          e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }}
      >
        <Image src='/assets/map-zoom-minus-icon.svg' alt='map-zoom-minus-icon' width={12} height={12} priority />
      </button>
    </div>
  );
};

export default React.memo(MapZoomControls);
