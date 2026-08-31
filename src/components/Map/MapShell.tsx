import MapDashboard from '@/components/Map/MapDashboard';
import MapViewClientOnly from '@/components/Map/MapViewClientOnly';

interface MapShellProps {
  children: React.ReactNode;
}

const MapShell = ({ children }: MapShellProps) => {
  return (
    <div className='relative h-full overflow-hidden'>
      <div className='map-viewport absolute z-0' data-keeps-detail-open>
        <MapViewClientOnly />
      </div>
      <div className='map-top-scrim pointer-events-none absolute z-10 h-28 sm:h-32 lg:h-16' />
      <div className='map-side-scrim pointer-events-none absolute z-10 hidden lg:block' />
      <div className='pointer-events-none relative z-20 h-full'>
        <MapDashboard />
        {children}
      </div>
    </div>
  );
};

export default MapShell;
