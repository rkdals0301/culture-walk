'use client';

import MapDashboard from '@/components/Map/MapDashboard';
import MapViewClientOnly from '@/components/Map/MapViewClientOnly';
import { useCultureContext } from '@/context/CultureContext';
import { useCultureMapData } from '@/hooks/useCultureMapData';
import type { CultureMapBounds, CultureMapViewport } from '@/types/culture';

import { useCallback, useState } from 'react';

import Link from 'next/link';

import { LayoutGrid } from 'lucide-react';

interface MapShellProps {
  children?: React.ReactNode;
}

const MapShell = ({ children }: MapShellProps) => {
  const { searchQuery, mapCategory, mapRegion, mapFreeOnly } = useCultureContext();
  const [listRequest, setListRequest] = useState(0);
  // Wait for Kakao Maps' first idle event so the initial request includes the
  // actual viewport and its zoom level.
  const [mapViewport, setMapViewport] = useState<CultureMapViewport | null>(null);
  const mapData = useCultureMapData({
    viewport: mapViewport,
    searchQuery,
    category: mapCategory,
    region: mapRegion,
    freeOnly: mapFreeOnly,
  });
  const handleViewportChange = useCallback((nextViewport: CultureMapViewport) => {
    const normalizeCoordinate = (value: number) => Math.round(value * 10_000) / 10_000;
    const normalizedBounds: CultureMapBounds = {
      swLat: normalizeCoordinate(nextViewport.bounds.swLat),
      swLng: normalizeCoordinate(nextViewport.bounds.swLng),
      neLat: normalizeCoordinate(nextViewport.bounds.neLat),
      neLng: normalizeCoordinate(nextViewport.bounds.neLng),
    };

    setMapViewport(currentViewport => {
      const isSameBounds =
        currentViewport !== null &&
        Object.keys(normalizedBounds).every(
          key =>
            normalizedBounds[key as keyof CultureMapBounds] === currentViewport.bounds[key as keyof CultureMapBounds]
        );
      const isSameLevel = currentViewport?.level === nextViewport.level;
      return isSameBounds && isSameLevel ? currentViewport : { bounds: normalizedBounds, level: nextViewport.level };
    });
  }, []);

  return (
    <div className='relative h-full overflow-hidden'>
      <div className='map-viewport absolute z-0' data-keeps-detail-open>
        <MapViewClientOnly
          visibleClusters={mapData.clusters}
          isClustered={mapData.isClustered}
          visibleCultures={mapData.cultures}
          isLoading={mapData.isLoading}
          error={mapData.error}
          onViewportChange={handleViewportChange}
          onContinueWithList={() => setListRequest(request => request + 1)}
        />
      </div>
      <div className='map-top-scrim pointer-events-none absolute z-10 h-28 sm:h-32 lg:h-16' />
      <div className='safe-area-map-feed-link pointer-events-none absolute z-20 flex lg:hidden'>
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
          isClustered={mapData.isClustered}
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
