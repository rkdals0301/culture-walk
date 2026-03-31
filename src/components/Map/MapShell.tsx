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
      <div className='pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(8,19,17,0.28)_0%,rgba(8,19,17,0.04)_30%,rgba(8,19,17,0.16)_100%)] dark:bg-[linear-gradient(180deg,rgba(8,19,17,0.48)_0%,rgba(8,19,17,0.1)_30%,rgba(8,19,17,0.24)_100%)]' />
      <div className='pointer-events-none relative z-20 h-full'>{children}</div>
    </div>
  );
};

export default MapShell;
