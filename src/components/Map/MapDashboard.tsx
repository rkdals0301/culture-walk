'use client';

import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import CultureList from '@/components/Header/CultureList';
import CultureListLoading from '@/components/Header/CultureListLoading';
import { MapFilterControls, MapLocationControl, MapSortControl } from '@/components/Map/MapControls';
import MapResultSummary from '@/components/Map/MapResultSummary';
import { useCultureContext } from '@/context/CultureContext';
import { useCultures } from '@/hooks/cultureHooks';
import { FormattedCulture } from '@/types/culture';
import { CULTURE_CATEGORY_OPTIONS, type CultureCategoryKey } from '@/utils/cultureCategory';
import {
  type MapSortMode,
  getMapFilterSignature,
  parseMapExploreStateFromSearch,
  serializeMapExploreStateToSearch,
} from '@/utils/exploreState';
import { LocationRequestError, calculateDistanceMeters, getGeolocationErrorMessage } from '@/utils/geo';
import { getMapDetailId, shouldRestoreMapList } from '@/utils/mapRoute';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'react-toastify';

import { usePathname, useRouter } from 'next/navigation';

import clsx from 'clsx';
import { AlertCircle, ChevronUp, List, ListFilter, MapPinned } from 'lucide-react';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';
import SearchCancelIcon from '../../../public/assets/images/search-cancel-icon.svg';
import SearchIcon from '../../../public/assets/images/search-icon.svg';

const ADSENSE_MAP_PANEL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MAP_PANEL;
const DESKTOP_PANEL_WIDTH = 400;
const DESKTOP_DETAIL_PANEL_WIDTH = 480;

interface MapDashboardProps {
  listRequest?: number;
}

const MapDashboard = ({ listRequest = 0 }: MapDashboardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    cultures,
    mapCultures,
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
    loadCultures,
  } = useCultureContext();
  const { isLoading, error } = useCultures();
  const [isDesktopPanelCollapsed, setIsDesktopPanelCollapsed] = useState(false);
  const [isWideDesktop, setIsWideDesktop] = useState(false);
  const [isMobileSheetVisible, setIsMobileSheetVisible] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [focusCultureId, setFocusCultureId] = useState<number | null>(null);
  const [restoredSelectedCultureId, setRestoredSelectedCultureId] = useState<number | null>(null);
  const [isFilterPending, startFilterTransition] = useTransition();
  const routeCultureId = getMapDetailId(pathname);
  const isDetailRoute = routeCultureId !== null;
  const selectedCultureId = routeCultureId ?? restoredSelectedCultureId;
  const isLocating = locationStatus === 'requesting';
  const previousFilterSignatureRef = useRef('');
  const routeRestorePendingRef = useRef(false);

  const totalCount = cultures.length;
  const regionOptions = useMemo(
    () =>
      Array.from(new Set(cultures.map(culture => (culture.guName ?? '').split(/\s+/)[0]).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, 'ko')
      ),
    [cultures]
  );
  const visibleCultures = useMemo(() => {
    if (mapSortMode !== 'distance' || !currentLocation) {
      return mapCultures;
    }

    return [...mapCultures].sort(
      (left, right) =>
        calculateDistanceMeters(currentLocation, { lat: left.lat, lng: left.lng }) -
        calculateDistanceMeters(currentLocation, { lat: right.lat, lng: right.lng })
    );
  }, [currentLocation, mapCultures, mapSortMode]);
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
  const mapFilterSignature = getMapFilterSignature({
    searchQuery,
    mapCategory,
    mapRegion,
    mapFreeOnly,
    sortMode: mapSortMode,
  });
  const filterMotionKey = mapFilterSignature;

  useEffect(() => {
    if (pathname !== '/map' || typeof window === 'undefined') {
      return;
    }

    const restoredState = parseMapExploreStateFromSearch(window.location.search);
    routeRestorePendingRef.current = true;
    if (restoredState) {
      setSearchQuery(restoredState.searchQuery);
      setMapCategory(restoredState.mapCategory);
      setMapRegion(restoredState.mapRegion);
      setMapFreeOnly(restoredState.mapFreeOnly);
      setMapSortMode(restoredState.sortMode);
      setMapListScrollTop(restoredState.mapListScrollTop);
      setIsMobileSheetVisible(restoredState.listOpen);
      setFocusCultureId(restoredState.focusCultureId ?? null);
      setRestoredSelectedCultureId(restoredState.selectedCultureId ?? null);
    } else {
      setSearchQuery('');
      setMapCategory('all');
      setMapRegion('all');
      setMapFreeOnly(false);
      setMapSortMode('date');
      setMapListScrollTop(0);
      setIsMobileSheetVisible(false);
      setFocusCultureId(null);
      setRestoredSelectedCultureId(null);
    }
  }, [pathname, setMapCategory, setMapFreeOnly, setMapListScrollTop, setMapRegion, setMapSortMode, setSearchQuery]);

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

  useEffect(() => {
    if (pathname !== '/map' || typeof window === 'undefined') {
      return;
    }

    if (routeRestorePendingRef.current) {
      routeRestorePendingRef.current = false;
      return;
    }

    const serializedSearch = serializeMapExploreStateToSearch({
      searchQuery,
      mapCategory,
      mapRegion,
      mapFreeOnly,
      sortMode: currentLocation ? mapSortMode : mapSortMode === 'distance' ? 'date' : mapSortMode,
      mapListScrollTop,
      listOpen: isMobileSheetVisible,
      focusCultureId,
      selectedCultureId: restoredSelectedCultureId,
    });
    const nextSearch = serializedSearch ? `?${serializedSearch}` : '';
    const currentSearch = window.location.search;
    if (currentSearch === nextSearch) {
      return;
    }

    router.replace(`/map${nextSearch}`, { scroll: false });
  }, [
    currentLocation,
    isMobileSheetVisible,
    mapCategory,
    mapFreeOnly,
    mapListScrollTop,
    mapRegion,
    mapSortMode,
    pathname,
    router,
    searchQuery,
    focusCultureId,
    restoredSelectedCultureId,
  ]);

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
      sortMode: currentLocation ? mapSortMode : mapSortMode === 'distance' ? 'date' : mapSortMode,
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
    if (isDetailRoute || typeof window === 'undefined') {
      return;
    }

    if (!shouldRestoreMapList(window.location.search)) {
      return;
    }

    setIsMobileSheetVisible(true);
  }, [isDetailRoute, pathname]);

  useEffect(() => {
    if (previousFilterSignatureRef.current === '') {
      previousFilterSignatureRef.current = mapFilterSignature;
      return;
    }

    if (previousFilterSignatureRef.current !== mapFilterSignature) {
      setMapListScrollTop(0);
      previousFilterSignatureRef.current = mapFilterSignature;
    }
  }, [mapFilterSignature, setMapListScrollTop]);

  useEffect(() => {
    if (listRequest === 0) {
      return;
    }

    setIsMobileSheetVisible(true);
    document.getElementById('culture-list')?.focus();
  }, [listRequest]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const updateViewport = () => setIsWideDesktop(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    const listPanelWidth = isDesktopPanelCollapsed ? 0 : DESKTOP_PANEL_WIDTH;
    const detailPanelWidth = isDetailRoute && isWideDesktop ? DESKTOP_DETAIL_PANEL_WIDTH : 0;
    document.documentElement.style.setProperty('--map-sidebar-width', `${listPanelWidth}px`);
    document.documentElement.style.setProperty('--map-detail-width', `${detailPanelWidth}px`);

    const notifyMapResize = () => window.dispatchEvent(new Event('resize'));
    const animationFrame = window.requestAnimationFrame(notifyMapResize);
    const transitionTimer = window.setTimeout(notifyMapResize, 280);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(transitionTimer);
    };
  }, [isDesktopPanelCollapsed, isDetailRoute, isWideDesktop]);

  const renderListPanel = () => {
    if (isLoading) {
      return <CultureListLoading />;
    }

    if (error) {
      return (
        <div
          className='status-callout status-callout-shell flex h-full items-center justify-center px-4 sm:px-6'
          data-status='api-error'
          role='alert'
        >
          <div className='status-callout-card w-full rounded-[1.25rem] p-5 text-left'>
            <div className='status-callout-icon' aria-hidden='true'>
              <AlertCircle className='size-5' strokeWidth={2} />
            </div>
            <p className='mt-4 text-base font-semibold'>행사 데이터를 불러오지 못했습니다.</p>
            <p className='mt-2 text-sm leading-6 text-[var(--color-text-secondary)]'>
              잠시 후 다시 시도하거나 페이지를 새로고침해 주세요.
            </p>
            <button
              type='button'
              onClick={() => void loadCultures({ force: true })}
              className='mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-brand-on-primary)] transition hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)]'
            >
              다시 불러오기
            </button>
          </div>
        </div>
      );
    }

    if (visibleCultures.length === 0) {
      return (
        <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
          <p className='text-base font-semibold'>
            {hasActiveFilters ? '조건에 맞는 행사가 없습니다.' : '표시할 행사가 없습니다.'}
          </p>
          <p className='mt-2 max-w-xs text-sm leading-6 text-[var(--color-text-secondary)]'>
            {hasActiveFilters ? '검색어를 지우거나 지역·분류 조건을 넓혀보세요.' : '잠시 후 다시 확인해 주세요.'}
          </p>
          <button
            type='button'
            onClick={resetMapFilters}
            className='mt-4 inline-flex min-h-11 items-center rounded-lg bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-brand-on-primary)] transition hover:bg-[var(--color-brand-hover)]'
          >
            {hasActiveFilters ? '조건 초기화' : '필터 초기화'}
          </button>
        </div>
      );
    }

    return (
      <CultureList
        cultures={visibleCultures}
        onItemClick={handleOpenCulture}
        selectedCultureId={selectedCultureId}
        currentLocation={currentLocation}
        initialScrollTop={mapListScrollTop}
        onScrollPositionChange={setMapListScrollTop}
      />
    );
  };

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
                visibleCount={visibleCultures.length}
                totalCount={totalCount}
                activeFilterLabels={activeFilterLabels}
                hasActiveFilters={hasActiveFilters}
                isLoading={isLoading}
                onReset={resetMapFilters}
              />

              <form
                role='search'
                className='shadow-2xs focus-within:ring-[var(--color-brand-primary)]/20 mt-3 flex h-11 items-center gap-2.5 rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3.5 transition-all focus-within:border-[var(--color-brand-primary)] focus-within:ring-2'
                onSubmit={event => event.preventDefault()}
              >
                <SearchIcon className='size-[18px] shrink-0 text-[var(--color-brand-primary)]' />
                <input
                  id='map-search-input'
                  type='text'
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder='행사명 또는 장소 검색'
                  aria-label='문화행사 검색'
                  autoComplete='off'
                  spellCheck={false}
                  enterKeyHint='search'
                  className='min-w-0 flex-1 bg-transparent text-sm font-medium placeholder:text-[var(--color-text-secondary)]'
                />
                {searchQuery && (
                  <button
                    type='button'
                    onClick={() => setSearchQuery('')}
                    className='flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)]'
                    aria-label='검색어 초기화'
                  >
                    <SearchCancelIcon className='size-4' />
                  </button>
                )}
              </form>

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
                {renderListPanel()}
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

      <div className='safe-area-mobile-list-shell pointer-events-none flex h-full w-full flex-col px-4 pt-[5.4rem] sm:px-6 sm:pt-[6rem] md:hidden'>
        {!isDetailRoute && isMobileSheetVisible ? (
          <section
            className='surface-panel pointer-events-auto mt-auto flex h-[calc(100dvh-6.4rem)] max-h-none min-h-[400px] w-full flex-col overflow-hidden rounded-b-none rounded-t-[28px] border-x-0 border-b-0 border-t border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] shadow-2xl backdrop-blur-xl'
            aria-busy={isFilterPending || isLoading}
          >
            <div className='border-b border-[var(--color-border-primary)] px-4 pb-3 pt-4'>
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <h3 className='text-base font-bold text-[var(--color-text-primary)]'>행사 목록</h3>
                </div>
                <button
                  type='button'
                  onClick={() => setIsMobileSheetVisible(false)}
                  className='inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[var(--color-surface-chip)] px-3 text-xs font-bold text-[var(--color-text-primary)] transition hover:bg-[var(--color-interactive-hover)]'
                >
                  <MapPinned
                    aria-hidden='true'
                    className='size-3.5 text-[var(--color-brand-primary)]'
                    strokeWidth={2}
                  />
                  지도만 보기
                </button>
              </div>
              <MapResultSummary
                visibleCount={visibleCultures.length}
                totalCount={totalCount}
                activeFilterLabels={activeFilterLabels}
                hasActiveFilters={hasActiveFilters}
                isLoading={isLoading}
                onReset={resetMapFilters}
                compact
              />
              <form
                role='search'
                className='shadow-2xs focus-within:ring-[var(--color-brand-primary)]/20 mt-2.5 flex h-10 items-center gap-2 rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 transition-all focus-within:border-[var(--color-brand-primary)] focus-within:ring-2'
                onSubmit={event => event.preventDefault()}
              >
                <SearchIcon className='size-4 shrink-0 text-[var(--color-brand-primary)]' />
                <input
                  id='map-search-input-mobile'
                  type='text'
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder='행사명 또는 장소 검색'
                  aria-label='문화행사 검색'
                  autoComplete='off'
                  spellCheck={false}
                  enterKeyHint='search'
                  className='min-w-0 flex-1 bg-transparent text-xs font-medium placeholder:text-[var(--color-text-secondary)] sm:text-sm'
                />
                {searchQuery && (
                  <button
                    type='button'
                    onClick={() => setSearchQuery('')}
                    className='flex size-7 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)]'
                    aria-label='검색어 초기화'
                  >
                    <SearchCancelIcon className='size-3.5' />
                  </button>
                )}
              </form>
              <div className='mt-2.5 flex items-center justify-between gap-2'>
                <button
                  type='button'
                  onClick={() => setIsMobileFiltersOpen(current => !current)}
                  aria-expanded={isMobileFiltersOpen}
                  aria-controls='map-mobile-filters'
                  className={clsx(
                    'flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all duration-150',
                    isMobileFiltersOpen || hasActiveFilters
                      ? 'border-[var(--color-border-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-hover)]'
                      : 'border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <ListFilter aria-hidden='true' className='size-3.5' strokeWidth={2} />
                  <span>필터</span>
                  {activeFilterLabels.length > 0 && (
                    <span className='flex size-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-[0.68rem] font-bold text-[var(--color-brand-on-primary)]'>
                      {activeFilterLabels.length}
                    </span>
                  )}
                  <ChevronUp
                    aria-hidden='true'
                    className={clsx('size-3.5 transition-transform duration-150', !isMobileFiltersOpen && 'rotate-180')}
                    strokeWidth={2.2}
                  />
                </button>
                <div className='flex min-w-0 items-center justify-end gap-2'>
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
                {renderListPanel()}
              </div>
            </div>
          </section>
        ) : !isDetailRoute ? (
          <div className='pointer-events-auto mt-auto flex justify-center pb-2'>
            <button
              type='button'
              onClick={() => setIsMobileSheetVisible(true)}
              className='group inline-flex min-h-12 items-center gap-3 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] px-4 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] shadow-lg transition-all duration-150 active:scale-[0.98]'
              aria-label={`행사 목록 열기, ${visibleCultures.length}개 행사`}
            >
              <span className='shadow-xs flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-white'>
                <List aria-hidden='true' className='size-4' strokeWidth={2} />
              </span>
              <span className='flex min-w-0 flex-col'>
                <span className='text-[0.68rem] font-bold text-[var(--color-brand-primary)]'>
                  {hasActiveFilters ? '필터 적용됨' : '지도 행사'}
                </span>
                <span className='whitespace-nowrap text-xs font-bold text-[var(--color-text-primary)] sm:text-sm'>
                  행사 {visibleCultures.length.toLocaleString()}개 보기
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
