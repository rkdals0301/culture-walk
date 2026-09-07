'use client';

import MapDashboard from '@/components/Map/MapDashboard';
import MapViewClientOnly from '@/components/Map/MapViewClientOnly';
import { useCultureMapData } from '@/hooks/useCultureMapData';
import { useCultureContext } from '@/context/CultureContext';
import type { CultureMapBounds } from '@/types/culture';

import { useCallback, useState } from 'react';

import Link from 'next/link';

import { LayoutGrid } from 'lucide-react';

interface MapShellProps {
  children?: React.ReactNode;
}

const MapShell = ({ children }: MapShellProps) => {
  const { searchQuery, mapCategory, mapRegion, mapFreeOnly } = useCultureContext();
  const [listRequest, setListRequest] = useState(0);
  // Wait for Kakao Maps' first idle event so the initial request is the actual
  // viewport instead of a second, broad country-wide query.
  const [mapBounds, setMapBounds] = useState<CultureMapBounds | null>(null);
  const mapData = useCultureMapData({
    bounds: mapBounds,
    searchQuery,
    category: mapCategory,
    region: mapRegion,
    freeOnly: mapFreeOnly,
  });
  const handleBoundsChange = useCallback((nextBounds: CultureMapBounds) => {
    const normalizeCoordinate = (value: number) => Math.round(value * 10_000) / 10_000;
    const normalizedBounds: CultureMapBounds = {
      swLat: normalizeCoordinate(nextBounds.swLat),
      swLng: normalizeCoordinate(nextBounds.swLng),
      neLat: normalizeCoordinate(nextBounds.neLat),
      neLng: normalizeCoordinate(nextBounds.neLng),
    };

    setMapBounds(currentBounds => {
      const isSameBounds = currentBounds !== null && Object.keys(normalizedBounds).every(
        key =>
          normalizedBounds[key as keyof CultureMapBounds] === currentBounds[key as keyof CultureMapBounds]
      );
      return isSameBounds ? currentBounds : normalizedBounds;
    });
  }, []);

  return (
    <div className='relative h-full overflow-hidden'>
      <div className='map-viewport absolute z-0' data-keeps-detail-open>
        <MapViewClientOnly
          visibleCultures={mapData.cultures}
          isLoading={mapData.isLoading}
          error={mapData.error}
          onBoundsChange={handleBoundsChange}
          onContinueWithList={() => setListRequest(request => request + 1)}
        />
      </div>
      <div className='map-top-scrim pointer-events-none absolute z-10 h-28 sm:h-32 lg:h-16' />
      <div className='safe-area-map-feed-link pointer-events-none absolute z-20 flex'>
        <Link
          href='/'
          className='group pointer-events-auto inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] px-3.5 py-2 text-xs font-bold text-[var(--color-text-primary)] shadow-md transition-all duration-150 hover:text-[var(--color-brand-primary)] active:scale-95'
          aria-label='문화 큐레이션 둘러보기로 이동'
        >
          <LayoutGrid className='size-3.5 text-[var(--color-brand-primary)]' strokeWidth={2.2} />
          <span className='tracking-tight'>피드로 보기</span>
        </Link>
      </div>
      <div className='pointer-events-none relative z-20 h-full'>
        <MapDashboard
          listRequest={listRequest}
          visibleCultures={mapData.cultures}
          totalCount={mapData.totalCount}
          viewportCount={mapData.viewportCount}
          regionOptions={mapData.regionOptions}
          isLoading={mapData.isLoading}
          error={mapData.error}
          onRetry={mapData.retry}
        />
        {children}
      </div>
    </div>
  );
};

export default MapShell;
