import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import { LocationToggle } from '@/components/Common/FilterControls';
import { MapFilterControls, MapSortControl } from '@/components/Map/MapControls';
import MapListPanelContent from '@/components/Map/MapListPanelContent';
import MapResultSummary from '@/components/Map/MapResultSummary';
import MapSearchField from '@/components/Map/MapSearchField';
import type { FormattedCultureListItem } from '@/types/culture';
import type { CultureCategoryKey } from '@/utils/cultureCategory';
import type { MapSortMode } from '@/utils/exploreState';
import type { GeoPoint } from '@/utils/geo';

import { List, X } from 'lucide-react';

const ADSENSE_MAP_PANEL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MAP_PANEL;

interface MapDesktopDashboardProps {
  activeFilterLabels: string[];
  currentLocation: GeoPoint | null;
  error: Error | null;
  filterMotionKey: string;
  handleCategoryChange: (category: CultureCategoryKey) => void;
  handleFreeOnlyChange: (freeOnly: boolean) => void;
  handleLocationToggle: () => void;
  handleOpenCulture: (culture: FormattedCultureListItem) => void;
  handleRegionChange: (region: string) => void;
  handleSortChange: (mode: MapSortMode) => void;
  hasActiveFilters: boolean;
  isClustered: boolean;
  isDesktopPanelCollapsed: boolean;
  isFilterPending: boolean;
  isLoading: boolean;
  isLocating: boolean;
  mapCategory: CultureCategoryKey;
  mapFreeOnly: boolean;
  mapListScrollTop: number;
  mapRegion: string;
  mapSortMode: MapSortMode;
  onRetry: () => void;
  regionOptions: string[];
  resetMapFilters: () => void;
  searchQuery: string;
  selectedCultureId: number | null;
  setIsDesktopPanelCollapsed: (collapsed: boolean) => void;
  setMapListScrollTop: (scrollTop: number) => void;
  setSearchQuery: (query: string) => void;
  totalCount: number;
  viewportCount: number;
  visibleCultures: FormattedCultureListItem[];
}

const MapDesktopDashboard = ({
  activeFilterLabels,
  currentLocation,
  error,
  filterMotionKey,
  handleCategoryChange,
  handleFreeOnlyChange,
  handleLocationToggle,
  handleOpenCulture,
  handleRegionChange,
  handleSortChange,
  hasActiveFilters,
  isClustered,
  isDesktopPanelCollapsed,
  isFilterPending,
  isLoading,
  isLocating,
  mapCategory,
  mapFreeOnly,
  mapListScrollTop,
  mapRegion,
  mapSortMode,
  onRetry,
  regionOptions,
  resetMapFilters,
  searchQuery,
  selectedCultureId,
  setIsDesktopPanelCollapsed,
  setMapListScrollTop,
  setSearchQuery,
  totalCount,
  viewportCount,
  visibleCultures,
}: MapDesktopDashboardProps) => {
  if (isDesktopPanelCollapsed) {
    return (
      <aside
        data-keeps-detail-open
        className='pointer-events-auto absolute left-4 top-[calc(var(--map-header-height)+1rem)] z-30 hidden w-[420px] max-w-[calc(100vw-2rem)] flex-col gap-2.5 rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] p-3.5 shadow-xl transition-all duration-200 md:flex'
        aria-label='문화행사 빠른 검색'
      >
        <div className='flex items-center gap-2'>
          <div className='min-w-0 flex-1'>
            <MapSearchField id='map-search-input-collapsed' value={searchQuery} onChange={setSearchQuery} compact />
          </div>
          <button
            type='button'
            onClick={() => setIsDesktopPanelCollapsed(false)}
            className='inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-brand-primary)] px-3 text-xs font-bold text-[var(--color-brand-on-primary)] shadow-sm transition hover:opacity-95 active:scale-95'
            aria-label='행사 목록 펼치기'
            title='행사 목록 펼치기'
          >
            <List className='size-4' />
            <span>목록</span>
            <span className='rounded-full bg-white/20 px-1.5 py-0.5 text-[0.68rem] font-bold'>
              {viewportCount.toLocaleString()}
            </span>
          </button>
        </div>

        <MapFilterControls
          category={mapCategory}
          freeOnly={mapFreeOnly}
          region={mapRegion}
          regionOptions={regionOptions}
          onCategoryChange={handleCategoryChange}
          onFreeOnlyChange={handleFreeOnlyChange}
          onRegionChange={handleRegionChange}
        />

        <div className='flex flex-wrap items-center justify-between gap-1.5 border-t border-[var(--color-border-primary)] pt-2 text-xs'>
          <div className='flex items-center gap-1.5'>
            <MapSortControl
              mode={mapSortMode}
              hasLocation={Boolean(currentLocation)}
              isLocating={isLocating}
              onChange={handleSortChange}
              size='sm'
            />
            <LocationToggle
              isActive={Boolean(currentLocation)}
              isLocating={isLocating}
              onToggle={handleLocationToggle}
              size='sm'
              compact
            />
          </div>
          {hasActiveFilters && (
            <button
              type='button'
              onClick={resetMapFilters}
              className='h-8 rounded-xl px-2 text-[0.72rem] font-bold text-[var(--color-brand-primary)] transition-colors hover:bg-[var(--color-surface-chip)]'
              aria-label='필터 조건 초기화'
            >
              초기화
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside
      data-keeps-detail-open
      className='pointer-events-auto absolute bottom-4 left-4 top-[calc(var(--map-header-height)+1rem)] z-30 hidden w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] shadow-2xl transition-all duration-300 md:flex'
      aria-label='문화행사 탐색 패널'
    >
      <div className='shrink-0 border-b border-[var(--color-border-primary)] p-4'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <h2 className='text-base font-bold tracking-tight text-[var(--color-text-primary)]'>행사 목록</h2>
            <span className='rounded-full bg-[var(--color-surface-chip)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-brand-primary)]'>
              {viewportCount.toLocaleString()}개
            </span>
          </div>
          <button
            type='button'
            onClick={() => setIsDesktopPanelCollapsed(true)}
            className='soft-chip flex size-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)] active:scale-95'
            aria-label='목록 접고 전체 지도 보기'
            title='목록 접고 전체 지도 보기'
          >
            <X className='size-4' />
          </button>
        </div>

        <div className='mt-3'>
          <MapSearchField id='map-search-input' value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div className='mt-2.5'>
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

        <div className='mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--color-border-primary)] pt-2.5 text-xs'>
          <div className='flex items-center gap-1.5'>
            <MapSortControl
              mode={mapSortMode}
              hasLocation={Boolean(currentLocation)}
              isLocating={isLocating}
              onChange={handleSortChange}
            />
            <LocationToggle
              isActive={Boolean(currentLocation)}
              isLocating={isLocating}
              onToggle={handleLocationToggle}
              compact
              size='sm'
            />
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
        </div>

        {ADSENSE_MAP_PANEL_SLOT && (
          <div className='mt-2.5 border-t border-[var(--color-border-primary)] pt-2.5'>
            <GoogleAdSlot slot={ADSENSE_MAP_PANEL_SLOT} className='min-h-[60px]' />
          </div>
        )}
      </div>

      <div className='min-h-0 flex-1 px-1 py-1'>
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
    </aside>
  );
};

export default MapDesktopDashboard;
