import MapViewClientOnly from '@/components/Map/MapViewClientOnly';

import React from 'react';

interface MapLayoutProps {
  children: React.ReactNode;
}

const MapLayout = ({ children }: MapLayoutProps) => {
  return (
    <div className='relative h-full overflow-hidden'>
      <div className='absolute inset-0 z-0'>
        <MapViewClientOnly />
      </div>
      <div className='pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(8,19,17,0.34)_0%,rgba(8,19,17,0.06)_28%,rgba(8,19,17,0.2)_100%)] dark:bg-[linear-gradient(180deg,rgba(8,19,17,0.52)_0%,rgba(8,19,17,0.12)_28%,rgba(8,19,17,0.3)_100%)]' />
      <div className='relative z-20 h-full'>{children}</div>
    </div>
  );
};

export default MapLayout;
