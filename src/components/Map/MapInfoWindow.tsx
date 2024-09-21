'use client';

import React from 'react';
import { InfoWindowF } from '@react-google-maps/api';
import { FormattedCulture } from '@/types/culture';
import styles from './MapInfoWindow.module.scss';

interface InfoWindowProps {
  anchor: google.maps.Marker | undefined;
  cultures: FormattedCulture[];
  onCultureClick: (culture: FormattedCulture) => void;
  onClose: () => void;
}

const MapInfoWindow = ({ anchor, cultures, onCultureClick, onClose }: InfoWindowProps) => {
  return (
    <InfoWindowF anchor={anchor} onCloseClick={onClose}>
      <div className={styles['info-window-container']}>
        <ul className={styles['info-window-list']}>
          {cultures.map(culture => (
            <li className={styles['info-window-list-item']} key={culture.id} onClick={() => onCultureClick(culture)}>
              {culture.title}
            </li>
          ))}
        </ul>
      </div>
    </InfoWindowF>
  );
};

export default React.memo(MapInfoWindow);
