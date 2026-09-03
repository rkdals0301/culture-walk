'use client';

import MapDashboard from '@/components/Map/MapDashboard';
import MapViewClientOnly from '@/components/Map/MapViewClientOnly';

import { useState } from 'react';

import Link from 'next/link';

import { LayoutGrid } from 'lucide-react';

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
      <div className='pointer-events-none absolute right-4 top-20 z-20 flex'>
        <Link
          href='/'
          className='pointer-events-auto group inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] px-3.5 py-2 text-xs font-bold text-[var(--color-text-primary)] shadow-md transition-all duration-150 active:scale-95 hover:text-[var(--color-brand-primary)]'
          aria-label='문화 큐레이션 둘러보기로 이동'
        >
          <LayoutGrid className='size-3.5 text-[var(--color-brand-primary)]' strokeWidth={2.2} />
          <span className='tracking-tight'>피드로 보기</span>
        </Link>
      </div>
      <div className='pointer-events-none relative z-20 h-full'>
        <MapDashboard listRequest={listRequest} />
        {children}
      </div>
    </div>
  );
};

export default MapShell;
