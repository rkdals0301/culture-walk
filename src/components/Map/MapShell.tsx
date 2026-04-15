import MapViewClientOnly from '@/components/Map/MapViewClientOnly';

interface MapShellProps {
  children: React.ReactNode;
}

const MapShell = ({ children }: MapShellProps) => {
  return (
    <div className='relative h-full overflow-hidden'>
      <div className='absolute inset-0 z-0'>
        <MapViewClientOnly />
      </div>
      <div className='pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-[linear-gradient(180deg,rgba(8,19,17,0.14)_0%,rgba(8,19,17,0.03)_62%,transparent_100%)] dark:bg-[linear-gradient(180deg,rgba(8,19,17,0.26)_0%,rgba(8,19,17,0.06)_62%,transparent_100%)] sm:h-32 lg:h-36' />
      <div className='pointer-events-none relative z-20 h-full'>{children}</div>
    </div>
  );
};

export default MapShell;
