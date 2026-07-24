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
      <div className='map-top-scrim pointer-events-none absolute z-10 h-28 bg-[linear-gradient(180deg,rgba(8,19,17,0.14)_0%,rgba(8,19,17,0.03)_62%,transparent_100%)] dark:bg-[linear-gradient(180deg,rgba(8,19,17,0.26)_0%,rgba(8,19,17,0.06)_62%,transparent_100%)] sm:h-32 lg:h-16' />
      <div className='map-side-scrim pointer-events-none absolute z-10 hidden lg:block' />
      <div className='pointer-events-none relative z-20 h-full'>{children}</div>
    </div>
  );
};

export default MapShell;
