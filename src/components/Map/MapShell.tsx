'use client';

import MapDashboard from '@/components/Map/MapDashboard';
import MapViewClientOnly from '@/components/Map/MapViewClientOnly';

import { useState } from 'react';

interface MapShellProps {
  children?: React.ReactNode;
}

const MapShell = ({ children }: MapShellProps) => {
  const [listRequest, setListRequest] = useState(0);

  return (
    <div className='relative h-full overflow-hidden'>
      <div className='map-viewport absolute z-0' data-keeps-detail-open>
        <MapViewClientOnly onContinueWithList={() => setListRequest(request => request + 1)} />
      </div>
      <div className='map-top-scrim pointer-events-none absolute z-10 h-28 sm:h-32 lg:h-16' />
      <div className='map-side-scrim pointer-events-none absolute z-10 hidden md:block' />
      <div className='pointer-events-none relative z-20 h-full'>
        <MapDashboard listRequest={listRequest} />
        {children}
      </div>
    </div>
  );
};

export default MapShell;
