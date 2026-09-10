'use client';

import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import { MapFilterControls, MapLocationControl, MapSortControl } from '@/components/Map/MapControls';
import MapListPanelContent from '@/components/Map/MapListPanelContent';
import MapResultSummary from '@/components/Map/MapResultSummary';
import MapSearchField from '@/components/Map/MapSearchField';
import { useCultureContext } from '@/context/CultureContext';
import { useMapExploreUrlSync } from '@/hooks/useMapExploreUrlSync';
import { useMapPanelLayout } from '@/hooks/useMapPanelLayout';
import { FormattedCulture } from '@/types/culture';
import { CULTURE_CATEGORY_OPTIONS, type CultureCategoryKey } from '@/utils/cultureCategory';
import {
  type MapSortMode,
  getEffectiveMapSortMode,
  serializeMapExploreStateToSearch,
} from '@/utils/exploreState';
import { LocationRequestError, calculateDistanceMeters, getGeolocationErrorMessage } from '@/utils/geo';
import { getMapDetailId } from '@/utils/mapRoute';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'react-toastify';

import { usePathname, useRouter } from 'next/navigation';

import clsx from 'clsx';
import { ChevronUp, List, ListFilter, MapPinned } from 'lucide-react';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';

const ADSENSE_MAP_PANEL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MAP_PANEL;
interface MapDashboardProps {
  listRequest?: number;
  visibleCultures: FormattedCulture[];
  isClustered: boolean;
  totalCount: number;
  viewportCount: number;
  regionOptions: string[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

const MapDashboard = ({
  listRequest = 0,
  visibleCultures: viewportCultures,
  isClustered,
  totalCount,
  viewportCount,
  regionOptions,
  isLoading,
  error,
  onRetry,
}: MapDashboardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    searchQuery,
    mapCategory,
    mapRegion,
    mapFreeOnly,
    mapSortMode,
    locationStatus,
    mapListScrollTop,
    setSearchQuery,
    setMapCategory,
    setMapRegion,
    setMapFreeOnly,
    resetMapFilters,
    currentLocation,
    setCurrentLocation,
    setMapSortMode,
    requestLocation: requestLocationFromProvider,
    cancelLocation,
    setMapListScrollTop,
  } = useCultureContext();
  const [isDesktopPanelCollapsed, setIsDesktopPanelCollapsed] = useState(false);
  const [isMobileSheetVisible, setIsMobileSheetVisible] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [focusCultureId, setFocusCultureId] = useState<number | null>(null);
  const [restoredSelectedCultureId, setRestoredSelectedCultureId] = useState<number | null>(null);
  const [isFilterPending, startFilterTransition] = useTransition();
  const routeCultureId = getMapDetailId(pathname);
  const isDetailRoute = routeCultureId !== null;
  const selectedCultureId = routeCultureId ?? restoredSelectedCultureId;
  const isLocating = locationStatus === 'requesting';

  const visibleCultures = useMemo(() => {
    if (mapSortMode !== 'distance' || !currentLocation) {
      return viewportCultures;
    }

    return [...viewportCultures].sort(
      (left, right) =>
        calculateDistanceMeters(currentLocation, { lat: left.lat, lng: left.lng }) -
        calculateDistanceMeters(currentLocation, { lat: right.lat, lng: right.lng })
    );
  }, [currentLocation, mapSortMode, viewportCultures]);
  const hasActiveFilters = Boolean(searchQuery.trim()) || mapCategory !== 'all' || mapRegion !== 'all' || mapFreeOnly;
  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    const normalizedSearchQuery = searchQuery.trim();
    const categoryLabel = CULTURE_CATEGORY_OPTIONS.find(option => option.key === mapCategory)?.label;

    if (normalizedSearchQuery) {
      labels.push(`“${normalizedSearchQuery}”`);
    }
    if (categoryLabel && mapCategory !== 'all') {
      labels.push(categoryLabel);
    }
    if (mapRegion !== 'all') {
      labels.push(mapRegion);
    }
    if (mapFreeOnly) {
      labels.push('무료');
    }

    return labels;
  }, [mapCategory, mapFreeOnly, mapRegion, searchQuery]);
  const mapFilterSignature = useMapExploreUrlSync({
    currentLocation,
    focusCultureId,
    isMobileSheetVisible,
    mapCategory,
    mapFreeOnly,
    mapListScrollTop,
    mapRegion,
    mapSortMode,
    restoredSelectedCultureId,
    searchQuery,
    setFocusCultureId,
    setIsMobileSheetVisible,
    setMapCategory,
    setMapFreeOnly,
    setMapListScrollTop,
    setMapRegion,
    setMapSortMode,
    setRestoredSelectedCultureId,
    setSearchQuery,
  });
  const filterMotionKey = mapFilterSignature;

  useMapPanelLayout(isDesktopPanelCollapsed, isDetailRoute);

  useEffect(() => {
    const handleOpenMapSearch = () => {
      setIsMobileSheetVisible(true);
      setTimeout(() => {
        const input = (document.getElementById('map-search-input-mobile') ||
          document.getElementById('map-search-input')) as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      }, 150);
    };

    window.addEventListener('cw:open-map-search', handleOpenMapSearch);
    return () => {
      window.removeEventListener('cw:open-map-search', handleOpenMapSearch);
    };
  }, []);


  const handleCategoryChange = (nextCategory: CultureCategoryKey) => {
    startFilterTransition(() => setMapCategory(nextCategory));
  };

  const handleFreeOnlyChange = (nextFreeOnly: boolean) => {
    startFilterTransition(() => setMapFreeOnly(nextFreeOnly));
  };

  const handleRegionChange = (nextRegion: string) => {
    startFilterTransition(() => setMapRegion(nextRegion));
  };

  const requestLocation = async () => {
    try {
      return await requestLocationFromProvider();
    } catch (locationError) {
      if (locationError instanceof LocationRequestError && locationError.status === 'cancelled') {
        toast.info(getGeolocationErrorMessage(locationError));
      } else {
        toast.error(getGeolocationErrorMessage(locationError));
      }
      return null;
    }
  };

  const handleSortChange = async (nextMode: MapSortMode) => {
    if (nextMode === 'date') {
      setMapSortMode('date');
      return;
    }

    const location = await requestLocation();
    if (location) {
      setMapSortMode('distance');
    }
  };

  const handleLocationToggle = async () => {
    if (locationStatus === 'requesting') {
      cancelLocation();
      return;
    }

    if (currentLocation) {
      setCurrentLocation(null);
      if (mapSortMode === 'distance') {
        setMapSortMode('date');
      }
      return;
    }

    await requestLocation();
  };

  const handleOpenCulture = (culture: FormattedCulture) => {
    const detailPath = `/map/${culture.id}`;
    const serializedSearch = serializeMapExploreStateToSearch({
      searchQuery,
      mapCategory,
      mapRegion,
      mapFreeOnly,
      sortMode: getEffectiveMapSortMode(mapSortMode, Boolean(currentLocation)),
      mapListScrollTop,
      listOpen: false,
    });
    const detailUrl = serializedSearch ? `${detailPath}?${serializedSearch}` : detailPath;

    if (isDetailRoute) {
      router.replace(detailUrl);
      return;
    }

    router.push(detailUrl);
  };

  useEffect(() => {
    if (isDetailRoute || pathname !== '/map' || focusCultureId === null || typeof window === 'undefined') {
      return;
    }

    setIsMobileSheetVisible(true);
    let attempts = 0;
    let focusFrame = 0;
    const focusSelectedRow = () => {
      const selectedRow = document.querySelector<HTMLElement>(`[data-culture-id="${focusCultureId}"]`);
      if (selectedRow) {
        selectedRow.focus();
        setFocusCultureId(null);
        return;
      }

      if (attempts >= 120) {
        setFocusCultureId(null);
        return;
      }

      attempts += 1;
      focusFrame = window.requestAnimationFrame(focusSelectedRow);
    };

    focusFrame = window.requestAnimationFrame(focusSelectedRow);
    return () => window.cancelAnimationFrame(focusFrame);
  }, [focusCultureId, isDetailRoute, pathname, visibleCultures.length]);

  useEffect(() => {
    if (!isDetailRoute) {
      return;
    }

    setIsMobileSheetVisible(false);
  }, [isDetailRoute]);

  useEffect(() => {
    if (!isMobileSheetVisible || isDetailRoute) {
      setIsMobileFiltersOpen(false);
    }
  }, [isDetailRoute, isMobileSheetVisible]);


  useEffect(() => {
    if (listRequest === 0) {
      return;
    }

    setIsMobileSheetVisible(true);
    document.getElementById('culture-list')?.focus();
  }, [listRequest]);

  return (
    <div
      id='culture-list'
      role='region'
      aria-label='문화행사 목록'
      tabIndex={-1}
      className='pointer-events-none absolute inset-0 scroll-mt-24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'
    >
      {!isDetailRoute && <h1 className='sr-only'>전국 문화행사 지도</h1>}
      <aside
        data-keeps-detail-open
        className={clsx(
          'pointer-events-auto absolute bottom-0 left-0 top-[72px] z-20 hidden overflow-hidden text-[var(--color-text-primary)] transition-[width] duration-[280ms]',
          'md:flex',
          isDesktopPanelCollapsed
            ? 'border-r-0'
            : 'border-r border-[var(--color-border-primary)] bg-[var(--color-surface-primary)]'
        )}
        style={{ width: 'var(--map-sidebar-width)' }}
        aria-label='문화행사 탐색 패널'
      >
        {!isDesktopPanelCollapsed && (
          <section className='flex h-full w-[400px] min-w-[400px] flex-col overflow-hidden'>
            <div className='shrink-0 border-b border-[var(--color-border-primary)] px-5 pb-4 pt-5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <h2 className='text-xl font-bold tracking-tight text-[var(--color-text-primary)]'>행사 찾기</h2>
                  <p className='mt-1 text-xs font-medium text-[var(--color-text-secondary)]'>
                    지도와 목록에서 원하는 행사를 찾아보세요
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setIsDesktopPanelCollapsed(true)}
                  className='soft-chip flex size-10 shrink-0 items-center justify-center rounded-xl text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-interactive-active)]'
                  aria-label='행사 목록 패널 접기'
                  title='행사 목록 접기'
                >
                  <ArrowBackIcon className='size-4' />
                </button>
              </div>

              <MapResultSummary
                visibleCount={viewportCount}
                totalCount={totalCount}
                isClustered={isClustered}
                activeFilterLabels={activeFilterLabels}
                hasActiveFilters={hasActiveFilters}
                isLoading={isLoading}
                onReset={resetMapFilters}
              />

              <div className='mt-3'>
                <MapSearchField id='map-search-input' value={searchQuery} onChange={setSearchQuery} />
              </div>

              <div className='mt-3 border-t border-[var(--color-border-primary)] pt-3'>
                <MapFilterControls
                  category={mapCategory}
                  freeOnly={mapFreeOnly}
                  region={mapRegion}
                  regionOptions={regionOptions}
                  onCategoryChange={handleCategoryChange}
                  onFreeOnlyChange={handleFreeOnlyChange}
                  onRegionChange={handleRegionChange}
                />
              </div>

              <div className='mt-3 flex items-center justify-between gap-3 border-t border-[var(--color-border-primary)] pt-3 text-xs text-[var(--color-text-secondary)]'>
                <div className='flex min-w-0 items-center gap-2'>
                  <span className='hidden shrink-0 text-[0.68rem] font-semibold text-[var(--color-text-secondary)] sm:inline'>
                    정렬
                  </span>
                  <MapSortControl
                    mode={mapSortMode}
                    hasLocation={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onChange={handleSortChange}
                  />
                  <MapLocationControl
                    isActive={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onToggle={handleLocationToggle}
                  />
                </div>
                <span className='shrink-0 font-medium text-[var(--color-text-secondary)]'>지도와 동기화</span>
              </div>

              {ADSENSE_MAP_PANEL_SLOT && (
                <div className='mt-3 border-t border-[var(--color-border-primary)] pt-3'>
                  <GoogleAdSlot slot={ADSENSE_MAP_PANEL_SLOT} className='min-h-[88px]' />
                </div>
              )}
            </div>
            <div className='min-h-0 flex-1 px-1 pb-1 pt-1'>
              <div
                key={filterMotionKey}
                className='map-filter-results h-full min-h-0'
                data-filter-pending={isFilterPending ? 'true' : undefined}
                aria-busy={isFilterPending}
              >
                <MapListPanelContent
                  cultures={visibleCultures}
                  currentLocation={currentLocation}
                  error={error}
                  hasActiveFilters={hasActiveFilters}
                  initialScrollTop={mapListScrollTop}
                  isClustered={isClustered}
                  isLoading={isLoading}
                  onItemClick={handleOpenCulture}
                  onResetFilters={resetMapFilters}
                  onRetry={onRetry}
                  onScrollPositionChange={setMapListScrollTop}
                  selectedCultureId={selectedCultureId}
                />
              </div>
            </div>
          </section>
        )}
      </aside>

      {isDesktopPanelCollapsed && !isDetailRoute && (
        <button
          type='button'
          onClick={() => setIsDesktopPanelCollapsed(false)}
          className='pointer-events-auto absolute left-0 top-1/2 z-20 hidden h-14 w-8 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] shadow-[var(--color-shadow-soft)] transition hover:w-9 hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-interactive-active)] md:flex'
          aria-label='행사 목록 패널 펼치기'
          title='행사 목록 펼치기'
        >
          <ArrowBackIcon className='size-4 rotate-180' />
          {hasActiveFilters && (
            <span className='absolute right-1 top-1.5 size-1.5 rounded-full bg-[var(--color-accent-primary)]' />
          )}
        </button>
      )}

      <div className='pointer-events-none flex h-full w-full flex-col pt-[5.4rem] sm:pt-[6rem] md:hidden'>
        {!isDetailRoute && isMobileSheetVisible ? (
          <section
            className='surface-panel pointer-events-auto mt-auto flex h-[calc(100dvh-6.4rem)] max-h-none min-h-[400px] w-full flex-col overflow-hidden rounded-b-none rounded-t-[28px] border-x-0 border-b-0 border-t border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] pb-[env(safe-area-inset-bottom,0px)] text-[var(--color-text-primary)] shadow-2xl backdrop-blur-xl'
            aria-busy={isFilterPending || isLoading}
          >
            {/* Mobile swipe/grab handle indicator */}
            <div
              className='flex w-full shrink-0 cursor-grab items-center justify-center pb-1 pt-2.5 active:cursor-grabbing'
              onClick={() => setIsMobileSheetVisible(false)}
              role='button'
              tabIndex={0}
              aria-label='행사 목록 접고 지도 보기'
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setIsMobileSheetVisible(false);
                }
              }}
            >
              <div className='h-1.5 w-10 rounded-full bg-[var(--color-text-tertiary)]/35 transition-colors hover:bg-[var(--color-text-tertiary)]/60' />
            </div>
            <div className='border-b border-[var(--color-border-primary)] px-4 pb-2.5 pt-1'>
              <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-2'>
                  <h3 className='text-base font-bold text-[var(--color-text-primary)]'>행사 목록</h3>
                  <span className='rounded-full bg-[var(--color-surface-chip)] px-2 py-0.5 text-[0.72rem] font-bold text-[var(--color-brand-primary)]'>
                    {viewportCount.toLocaleString()}개
                  </span>
                </div>
                <button
                  type='button'
                  onClick={() => setIsMobileSheetVisible(false)}
                  className='inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] px-3.5 text-xs font-bold text-[var(--color-text-primary)] shadow-2xs transition hover:bg-[var(--color-interactive-hover)] active:scale-[0.98]'
                  aria-label='목록 접고 지도 보기'
                >
                  <MapPinned
                    aria-hidden='true'
                    className='size-4 text-[var(--color-brand-primary)]'
                    strokeWidth={2.2}
                  />
                  <span>지도 보기</span>
                </button>
              </div>
              <MapResultSummary
                visibleCount={viewportCount}
                totalCount={totalCount}
                isClustered={isClustered}
                activeFilterLabels={activeFilterLabels}
                hasActiveFilters={hasActiveFilters}
                isLoading={isLoading}
                onReset={resetMapFilters}
                compact
              />
              <div className='mt-2'>
                <MapSearchField id='map-search-input-mobile' value={searchQuery} onChange={setSearchQuery} compact />
              </div>
              <div className='mt-2 flex items-center justify-between gap-1.5'>
                <button
                  type='button'
                  onClick={() => setIsMobileFiltersOpen(current => !current)}
                  aria-expanded={isMobileFiltersOpen}
                  aria-controls='map-mobile-filters'
                  className={clsx(
                    'flex h-9 shrink-0 items-center gap-1 rounded-xl border px-2.5 text-xs font-bold transition-all duration-150',
                    isMobileFiltersOpen || hasActiveFilters
                      ? 'border-[var(--color-border-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-hover)]'
                      : 'border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <ListFilter aria-hidden='true' className='size-3.5' strokeWidth={2} />
                  <span>필터</span>
                  {activeFilterLabels.length > 0 && (
                    <span className='flex size-4.5 min-w-[18px] items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1 text-[0.65rem] font-bold text-[var(--color-brand-on-primary)]'>
                      {activeFilterLabels.length}
                    </span>
                  )}
                  <ChevronUp
                    aria-hidden='true'
                    className={clsx('size-3.5 transition-transform duration-150', !isMobileFiltersOpen && 'rotate-180')}
                    strokeWidth={2.2}
                  />
                </button>
                <div className='flex shrink-0 items-center gap-1.5'>
                  <MapSortControl
                    mode={mapSortMode}
                    hasLocation={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onChange={handleSortChange}
                  />
                  <MapLocationControl
                    isActive={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onToggle={handleLocationToggle}
                    compact
                  />
                </div>
              </div>
              {isMobileFiltersOpen && (
                <div
                  id='map-mobile-filters'
                  className='mt-2.5 rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-2.5'
                >
                  <MapFilterControls
                    category={mapCategory}
                    freeOnly={mapFreeOnly}
                    region={mapRegion}
                    regionOptions={regionOptions}
                    onCategoryChange={handleCategoryChange}
                    onFreeOnlyChange={handleFreeOnlyChange}
                    onRegionChange={handleRegionChange}
                  />
                </div>
              )}
            </div>
            <div className='min-h-0 flex-1 px-1 pb-1 pt-1'>
              <div
                key={filterMotionKey}
                className='map-filter-results h-full min-h-0'
                data-filter-pending={isFilterPending ? 'true' : undefined}
                aria-busy={isFilterPending}
              >
                <MapListPanelContent
                  cultures={visibleCultures}
                  currentLocation={currentLocation}
                  error={error}
                  hasActiveFilters={hasActiveFilters}
                  initialScrollTop={mapListScrollTop}
                  isClustered={isClustered}
                  isLoading={isLoading}
                  onItemClick={handleOpenCulture}
                  onResetFilters={resetMapFilters}
                  onRetry={onRetry}
                  onScrollPositionChange={setMapListScrollTop}
                  selectedCultureId={selectedCultureId}
                />
              </div>
            </div>
          </section>
        ) : !isDetailRoute ? (
          <div className='pointer-events-auto mt-auto flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]'>
            <button
              type='button'
              onClick={() => setIsMobileSheetVisible(true)}
              className='group inline-flex min-h-12 items-center gap-3 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] px-4 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] shadow-lg transition-all duration-150 active:scale-[0.98]'
              aria-label={
                isClustered
                  ? '행사 밀집 지역을 확대해서 행사 목록 보기'
                  : `행사 목록 열기, 현재 영역 ${viewportCount}개 행사`
              }
            >
              <span className='shadow-xs flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-white'>
                <List aria-hidden='true' className='size-4' strokeWidth={2} />
              </span>
              <span className='flex min-w-0 flex-col'>
                <span className='text-[0.68rem] font-bold text-[var(--color-brand-primary)]'>
                  {hasActiveFilters ? '필터 적용됨' : '지도 행사'}
                </span>
                <span className='whitespace-nowrap text-xs font-bold text-[var(--color-text-primary)] sm:text-sm'>
                  {isClustered ? '지도를 확대하면 목록 보기' : `현재 영역 ${viewportCount.toLocaleString()}개 보기`}
                </span>
              </span>
              <span className='ml-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-chip)] text-[var(--color-text-primary)]'>
                <ChevronUp aria-hidden='true' className='size-4' strokeWidth={2.2} />
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MapDashboard;
