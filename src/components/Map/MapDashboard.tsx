'use client';

import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import CultureList from '@/components/Header/CultureList';
import CultureListLoading from '@/components/Header/CultureListLoading';
import { useCultureContext } from '@/context/CultureContext';
import { useCultures } from '@/hooks/cultureHooks';
import { FormattedCulture } from '@/types/culture';
import { CULTURE_CATEGORY_OPTIONS, CultureCategoryKey } from '@/utils/cultureCategory';
import { calculateDistanceMeters, getGeolocationErrorMessage, requestCurrentLocation } from '@/utils/geo';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { usePathname, useRouter } from 'next/navigation';

import clsx from 'clsx';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';
import MapFindMyLocationIcon from '../../../public/assets/images/map-find-my-location-icon.svg';
import SearchCancelIcon from '../../../public/assets/images/search-cancel-icon.svg';
import SearchIcon from '../../../public/assets/images/search-icon.svg';

interface FilterControlsProps {
  category: CultureCategoryKey;
  freeOnly: boolean;
  region: string;
  regionOptions: string[];
  onCategoryChange: (category: CultureCategoryKey) => void;
  onFreeOnlyChange: (freeOnly: boolean) => void;
  onRegionChange: (region: string) => void;
}

const FilterControls = ({
  category,
  freeOnly,
  region,
  regionOptions,
  onCategoryChange,
  onFreeOnlyChange,
  onRegionChange,
}: FilterControlsProps) => (
  <div className='flex items-center gap-2'>
    <select
      value={region}
      onChange={event => onRegionChange(event.target.value)}
      aria-label='지역 필터'
      className='h-8 w-[6.7rem] shrink-0 rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-2 text-xs font-semibold text-[var(--app-text)]'
    >
      <option value='all'>전국</option>
      {regionOptions.map(option => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <div className='min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
      <div className='flex w-max gap-1.5' role='group' aria-label='행사 분류 필터'>
        {CULTURE_CATEGORY_OPTIONS.map(option => {
          const isActive = category === option.key;
          return (
            <button
              key={option.key}
              type='button'
              onClick={() => onCategoryChange(option.key)}
              aria-pressed={isActive}
              className={
                isActive
                  ? 'h-8 whitespace-nowrap rounded-lg bg-[#1f765f] px-2.5 text-xs font-semibold text-white dark:bg-[#3c9d80] dark:text-[#071410]'
                  : 'h-8 whitespace-nowrap rounded-lg border border-[var(--app-border)] px-2.5 text-xs font-semibold text-[var(--app-muted)] transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
    <label className='flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-2.5 text-xs font-semibold text-[var(--app-muted)]'>
      <input
        type='checkbox'
        checked={freeOnly}
        onChange={event => onFreeOnlyChange(event.target.checked)}
        className='peer sr-only'
      />
      <span className='flex size-4 items-center justify-center rounded-[5px] border border-[var(--app-border)] bg-[var(--app-card)] peer-checked:border-[#2f9b7f] peer-checked:bg-[#2f9b7f]'>
        <span className={freeOnly ? 'size-1.5 rounded-[2px] bg-white' : 'hidden'} />
      </span>
      무료
    </label>
  </div>
);

type MapSortMode = 'date' | 'distance';

interface SortControlProps {
  mode: MapSortMode;
  hasLocation: boolean;
  isLocating: boolean;
  onChange: (mode: MapSortMode) => void;
}

const SortControl = ({ mode, hasLocation, isLocating, onChange }: SortControlProps) => (
  <div
    className='flex rounded-lg border border-[var(--app-border)] bg-[var(--app-chip)] p-0.5'
    role='group'
    aria-label='행사 정렬 방식'
  >
    <button
      type='button'
      onClick={() => onChange('date')}
      aria-pressed={mode === 'date'}
      className={
        mode === 'date'
          ? 'h-7 rounded-md bg-[var(--app-card)] px-2.5 text-[0.72rem] font-semibold text-[var(--app-text)] shadow-sm'
          : 'h-7 rounded-md px-2.5 text-[0.72rem] font-semibold text-[var(--app-muted)]'
      }
    >
      일정순
    </button>
    <button
      type='button'
      onClick={() => onChange('distance')}
      disabled={isLocating}
      aria-pressed={mode === 'distance'}
      aria-label={hasLocation ? '거리순으로 정렬' : '현재 위치를 확인하고 거리순으로 정렬'}
      title={hasLocation ? '거리순으로 정렬' : '현재 위치를 확인하고 거리순으로 정렬'}
      className={
        mode === 'distance'
          ? 'h-7 rounded-md bg-[var(--app-card)] px-2.5 text-[0.72rem] font-semibold text-[var(--app-warm-text)] shadow-sm'
          : 'h-7 rounded-md px-2.5 text-[0.72rem] font-semibold text-[var(--app-muted)] disabled:cursor-not-allowed disabled:opacity-45'
      }
    >
      거리순
    </button>
  </div>
);

interface LocationControlProps {
  isActive: boolean;
  isLocating: boolean;
  onToggle: () => void;
}

const LocationControl = ({ isActive, isLocating, onToggle }: LocationControlProps) => (
  <button
    type='button'
    onClick={onToggle}
    disabled={isLocating}
    aria-pressed={isActive}
    aria-label={isActive ? '현재 위치 사용 해제' : '현재 위치 사용'}
    title={isActive ? '현재 위치 사용 해제' : '현재 위치 사용'}
    className={clsx(
      'flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[0.72rem] font-semibold transition',
      isActive
        ? 'border-[#d98b2f]/35 bg-[#d98b2f]/10 text-[var(--app-warm-text)]'
        : 'border-[var(--app-border)] text-[var(--app-muted)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
      isLocating && 'cursor-wait opacity-70'
    )}
  >
    <MapFindMyLocationIcon className={clsx('size-3.5', isLocating && 'animate-spin')} />
    {isLocating ? '위치 확인 중' : isActive ? '위치 사용 중' : '내 위치'}
  </button>
);

const ADSENSE_MAP_PANEL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MAP_PANEL;
const DESKTOP_PANEL_WIDTH = 400;

const MapDashboard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    cultures,
    mapCultures,
    searchQuery,
    mapCategory,
    mapRegion,
    mapFreeOnly,
    setSearchQuery,
    setMapCategory,
    setMapRegion,
    setMapFreeOnly,
    resetMapFilters,
    currentLocation,
    setCurrentLocation,
  } = useCultureContext();
  const { isLoading, error } = useCultures();
  const [isDesktopPanelCollapsed, setIsDesktopPanelCollapsed] = useState(false);
  const [isMobileSheetVisible, setIsMobileSheetVisible] = useState(false);
  const [sortMode, setSortMode] = useState<MapSortMode>('date');
  const [isLocating, setIsLocating] = useState(false);
  const isDetailRoute = /^\/map\/\d+/.test(pathname ?? '');
  const selectedCultureId = useMemo(() => {
    const match = (pathname ?? '').match(/^\/map\/(\d+)/);
    if (!match) {
      return null;
    }

    const parsed = Number.parseInt(match[1], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [pathname]);

  const totalCount = cultures.length;
  const regionOptions = useMemo(
    () =>
      Array.from(new Set(cultures.map(culture => culture.guName.split(/\s+/)[0]).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'ko')
      ),
    [cultures]
  );
  const visibleCultures = useMemo(() => {
    if (sortMode !== 'distance' || !currentLocation) {
      return mapCultures;
    }

    return [...mapCultures].sort(
      (left, right) =>
        calculateDistanceMeters(currentLocation, { lat: left.lat, lng: left.lng }) -
        calculateDistanceMeters(currentLocation, { lat: right.lat, lng: right.lng })
    );
  }, [currentLocation, mapCultures, sortMode]);
  const hasActiveFilters = Boolean(searchQuery.trim()) || mapCategory !== 'all' || mapRegion !== 'all' || mapFreeOnly;

  const requestLocation = async () => {
    if (currentLocation) {
      return currentLocation;
    }

    if (isLocating) {
      return null;
    }

    setIsLocating(true);
    try {
      const location = await requestCurrentLocation();
      setCurrentLocation(location);
      return location;
    } catch (locationError) {
      toast.error(getGeolocationErrorMessage(locationError));
      return null;
    } finally {
      setIsLocating(false);
    }
  };

  const handleSortChange = async (nextMode: MapSortMode) => {
    if (nextMode === 'date') {
      setSortMode('date');
      return;
    }

    const location = await requestLocation();
    if (location) {
      setSortMode('distance');
    }
  };

  const handleLocationToggle = async () => {
    if (currentLocation) {
      setCurrentLocation(null);
      if (sortMode === 'distance') {
        setSortMode('date');
      }
      return;
    }

    await requestLocation();
  };

  const handleOpenCulture = (culture: FormattedCulture) => {
    router.push(`/map/${culture.id}`);
  };

  useEffect(() => {
    if (!isDetailRoute) {
      return;
    }

    setIsMobileSheetVisible(false);
  }, [isDetailRoute]);

  useEffect(() => {
    const panelWidth = isDetailRoute || !isDesktopPanelCollapsed ? DESKTOP_PANEL_WIDTH : 0;
    document.documentElement.style.setProperty('--map-sidebar-width', `${panelWidth}px`);

    const notifyMapResize = () => window.dispatchEvent(new Event('resize'));
    const animationFrame = window.requestAnimationFrame(notifyMapResize);
    const transitionTimer = window.setTimeout(notifyMapResize, 300);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(transitionTimer);
    };
  }, [isDesktopPanelCollapsed, isDetailRoute]);

  const renderListPanel = () => {
    if (isLoading) {
      return <CultureListLoading />;
    }

    if (error) {
      return (
        <div className='flex h-full flex-col items-center justify-center p-6 text-center'>
          <p className='text-base font-semibold'>행사 데이터를 불러오지 못했습니다.</p>
          <p className='mt-2 text-sm text-[var(--app-muted)]'>{error.message}</p>
        </div>
      );
    }

    if (visibleCultures.length === 0) {
      return (
        <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
          <p className='text-base font-semibold'>검색 결과가 없습니다.</p>
          <p className='mt-2 text-sm leading-6 text-[var(--app-muted)]'>다른 행사명이나 분류를 입력해보세요.</p>
          <button
            type='button'
            onClick={resetMapFilters}
            className='mt-4 rounded-xl bg-[#1f765f] px-4 py-2 text-sm font-semibold text-[#fff8f1] transition hover:bg-[#175846]'
          >
            필터 초기화
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
      />
    );
  };

  return (
    <div className='pointer-events-none absolute inset-0'>
      <aside
        className={clsx(
          'pointer-events-auto absolute bottom-0 left-0 top-[72px] z-20 hidden overflow-hidden text-[var(--app-text)] transition-[width] duration-300 lg:flex',
          isDesktopPanelCollapsed && !isDetailRoute
            ? 'border-r-0'
            : 'border-r border-[var(--app-border)] bg-[var(--app-surface)] backdrop-blur-2xl'
        )}
        style={{ width: 'var(--map-sidebar-width)' }}
        aria-label='문화행사 탐색 패널'
      >
        {(!isDesktopPanelCollapsed || isDetailRoute) && (
          <section className='flex h-full w-[400px] min-w-[400px] flex-col overflow-hidden'>
            <div className='shrink-0 border-b border-[var(--app-border)] px-5 pb-3.5 pt-4'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='text-[0.7rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>전국 문화행사</p>
                  <h2 className='mt-1 text-xl font-semibold leading-[1.2]'>행사 찾기</h2>
                </div>
                {!isDetailRoute && (
                  <button
                    type='button'
                    onClick={() => setIsDesktopPanelCollapsed(true)}
                    className='soft-chip flex size-9 shrink-0 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                    aria-label='행사 목록 패널 접기'
                    title='행사 목록 접기'
                  >
                    <ArrowBackIcon className='size-4' />
                  </button>
                )}
              </div>

              <form
                role='search'
                className='mt-3.5 flex h-11 items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3'
                onSubmit={event => event.preventDefault()}
              >
                <SearchIcon className='size-[18px] shrink-0 text-[#1f765f]' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder='행사명으로 검색'
                  aria-label='문화행사 검색'
                  autoComplete='off'
                  spellCheck={false}
                  enterKeyHint='search'
                  className='min-w-0 flex-1 bg-transparent text-sm font-medium placeholder:text-[var(--app-muted)]'
                />
                {searchQuery && (
                  <button
                    type='button'
                    onClick={() => setSearchQuery('')}
                    className='flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--app-muted)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                    aria-label='검색어 초기화'
                  >
                    <SearchCancelIcon className='size-4' />
                  </button>
                )}
              </form>

              <div className='mt-2.5'>
                <FilterControls
                  category={mapCategory}
                  freeOnly={mapFreeOnly}
                  region={mapRegion}
                  regionOptions={regionOptions}
                  onCategoryChange={setMapCategory}
                  onFreeOnlyChange={setMapFreeOnly}
                  onRegionChange={setMapRegion}
                />
              </div>

              <div className='mt-2.5 flex items-center justify-between gap-3 text-xs text-[var(--app-muted)]'>
                <div className='flex min-w-0 items-center gap-2'>
                  <SortControl
                    mode={sortMode}
                    hasLocation={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onChange={handleSortChange}
                  />
                  <LocationControl
                    isActive={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onToggle={handleLocationToggle}
                  />
                </div>
                <strong className='font-semibold text-[var(--app-text)]'>
                  {visibleCultures.length}개<span className='font-medium text-[var(--app-muted)]'> / {totalCount}</span>
                </strong>
              </div>

              {ADSENSE_MAP_PANEL_SLOT && (
                <div className='mt-3 border-t border-[var(--app-border)] pt-3'>
                  <GoogleAdSlot slot={ADSENSE_MAP_PANEL_SLOT} className='min-h-[88px]' />
                </div>
              )}
            </div>
            <div className='min-h-0 flex-1 px-2 pb-2 pt-2'>{renderListPanel()}</div>
          </section>
        )}
      </aside>

      {isDesktopPanelCollapsed && !isDetailRoute && (
        <button
          type='button'
          onClick={() => setIsDesktopPanelCollapsed(false)}
          className='pointer-events-auto absolute left-0 top-1/2 z-20 hidden h-14 w-8 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--app-shadow-soft)] backdrop-blur-xl transition hover:w-9 hover:bg-[var(--app-card)] lg:flex'
          aria-label='행사 목록 패널 펼치기'
          title='행사 목록 펼치기'
        >
          <ArrowBackIcon className='size-4 rotate-180' />
          {hasActiveFilters && <span className='absolute right-1 top-1.5 size-1.5 rounded-full bg-[#d98b2f]' />}
        </button>
      )}

      <div className='pointer-events-none flex h-full w-full flex-col px-4 pb-4 pt-[5.4rem] sm:px-6 sm:pb-6 sm:pt-[6rem] lg:hidden'>
        {!isDetailRoute && isMobileSheetVisible ? (
          <section className='surface-panel pointer-events-auto mt-auto flex h-[72vh] max-h-[82dvh] min-h-[390px] w-full flex-col overflow-hidden rounded-[24px] text-[var(--app-text)]'>
            <div className='border-b border-[var(--app-border)] px-4 py-3'>
              <div className='mb-2 flex items-center justify-center'>
                <div className='h-1.5 w-12 rounded-full bg-[#1f765f]/20' />
              </div>
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='text-[0.7rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>행사 목록</p>
                  <p className='mt-1 truncate text-sm font-medium text-[var(--app-muted)]'>
                    총 {visibleCultures.length}개
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setIsMobileSheetVisible(false)}
                  className='shrink-0 rounded-full bg-[#1f765f] px-3.5 py-2 text-xs font-semibold text-[#fff8f1] shadow-[0_14px_30px_-22px_rgba(31,118,95,0.9)]'
                >
                  지도만 보기
                </button>
              </div>
              <div className='mt-3'>
                <FilterControls
                  category={mapCategory}
                  freeOnly={mapFreeOnly}
                  region={mapRegion}
                  regionOptions={regionOptions}
                  onCategoryChange={setMapCategory}
                  onFreeOnlyChange={setMapFreeOnly}
                  onRegionChange={setMapRegion}
                />
              </div>
              <div className='mt-2.5 flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-2'>
                  <SortControl
                    mode={sortMode}
                    hasLocation={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onChange={handleSortChange}
                  />
                  <LocationControl
                    isActive={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onToggle={handleLocationToggle}
                  />
                </div>
                <strong className='text-xs font-semibold text-[var(--app-text)]'>{visibleCultures.length}개</strong>
              </div>
            </div>
            <div className='min-h-0 flex-1 px-2 pb-2 pt-2'>{renderListPanel()}</div>
          </section>
        ) : !isDetailRoute ? (
          <div className='pointer-events-auto mt-auto flex justify-center'>
            <button
              type='button'
              onClick={() => setIsMobileSheetVisible(true)}
              className='surface-panel rounded-full border-[#1f765f]/20 px-5 py-3 text-sm font-semibold text-[var(--app-text)] shadow-[0_20px_44px_-30px_rgba(16,33,29,0.6)]'
            >
              목록 보기 {visibleCultures.length > 0 ? `· ${visibleCultures.length}개` : ''}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MapDashboard;
