import MapShell from '@/components/Map/MapShell';

import React from 'react';

interface MapLayoutProps {
  children: React.ReactNode;
}

const MapLayout = ({ children }: MapLayoutProps) => {
  return <MapShell>{children}</MapShell>;
};

export default MapLayout;
