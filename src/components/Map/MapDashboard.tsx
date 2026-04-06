'use client';

import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import CultureList from '@/components/Header/CultureList';
import CultureListLoading from '@/components/Header/CultureListLoading';
import { useCultureContext } from '@/context/CultureContext';
import { useCultures } from '@/hooks/cultureHooks';
import { FormattedCulture } from '@/types/culture';

import { useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

interface StatCardProps {
  label: string;
  value: number;
}

const StatCard = ({ label, value }: StatCardProps) => (
  <div className='soft-chip rounded-[18px] px-3 py-2.5'>
    <p className='text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[var(--app-muted)]'>{label}</p>
    <p className='mt-0.5 text-lg font-semibold tracking-[-0.03em]'>{value}</p>
  </div>
);

const ADSENSE_MAP_PANEL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MAP_PANEL;

const MapDashboard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { cultures } = useCultureContext();
  const { isLoading, error } = useCultures();
  const [isDesktopPanelCollapsed, setIsDesktopPanelCollapsed] = useState(false);
  const [isMobileSheetVisible, setIsMobileSheetVisible] = useState(false);
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
  const districtCount = useMemo(() => new Set(cultures.map(culture => culture.guName).filter(Boolean)).size, [cultures]);
  const freeCount = useMemo(
    () =>
      cultures.filter(culture => {
        const value = `${culture.isFree} ${culture.displayPrice}`.toLowerCase();
        return value.includes('free') || value.includes('무료');
      }).length,
    [cultures]
  );
  const handleOpenCulture = (culture: FormattedCulture) => {
    router.push(`/map/${culture.id}`);
  };

  useEffect(() => {
    if (!isDetailRoute) {
      return;
    }

    setIsMobileSheetVisible(false);
  }, [isDetailRoute]);

  const renderListPanel = () => {
    if (isLoading) {
      return <CultureListLoading />;
    }

    if (error) {
      return (
        <div className='surface-card flex h-full flex-col items-center justify-center rounded-[28px] p-6 text-center'>
          <p className='text-lg font-semibold tracking-[-0.03em]'>행사 데이터를 불러오지 못했습니다.</p>
          <p className='mt-2 text-sm text-[var(--app-muted)]'>{error.message}</p>
        </div>
      );
    }

    return <CultureList cultures={cultures} onItemClick={handleOpenCulture} selectedCultureId={selectedCultureId} />;
  };

  return (
    <div className='pointer-events-none absolute inset-0' style={{ pointerEvents: 'none' }}>
      <div className='pointer-events-none flex h-full w-full flex-col px-4 pb-4 pt-[5.4rem] sm:px-6 sm:pb-6 sm:pt-[6rem] lg:px-8 lg:pb-8 lg:pt-[6.8rem]'>
        <div className='pointer-events-none hidden h-full lg:flex'>
          <div
            className={`pointer-events-none h-full transition-[width] duration-300 ${
              isDesktopPanelCollapsed ? 'w-[88px]' : 'w-[340px] xl:w-[372px]'
            }`}
          >
            <div className='pointer-events-auto h-full'>
              {isDesktopPanelCollapsed ? (
                <div className='surface-panel flex h-full flex-col items-center justify-between rounded-[28px] px-3 py-4 text-[var(--app-text)]'>
                  <button
                    type='button'
                    onClick={() => setIsDesktopPanelCollapsed(false)}
                    className='rounded-full bg-[#1f765f] px-3 py-2 text-xs font-semibold text-[#fff8f1] transition hover:bg-[#175846]'
                  >
                    목록 열기
                  </button>
                  <div className='grid gap-2 text-center'>
                    <div className='soft-chip rounded-xl px-2 py-1.5'>
                      <p className='text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)]'>E</p>
                      <p className='text-sm font-semibold'>{totalCount}</p>
                    </div>
                    <div className='soft-chip rounded-xl px-2 py-1.5'>
                      <p className='text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)]'>F</p>
                      <p className='text-sm font-semibold'>{freeCount}</p>
                    </div>
                    <div className='soft-chip rounded-xl px-2 py-1.5'>
                      <p className='text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)]'>D</p>
                      <p className='text-sm font-semibold'>{districtCount}</p>
                    </div>
                  </div>
                  <div className='text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[var(--app-muted)]'>Map</div>
                </div>
              ) : (
                <section className='surface-panel flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] text-[var(--app-text)]'>
                  <div className='border-b border-[var(--app-border)] px-5 py-4 sm:px-6'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#1f765f] dark:text-[#8dc5b5]'>
                          City Culture Guide
                        </p>
                        <h2 className='mt-2 text-[1.6rem] font-semibold leading-[1.12] tracking-[-0.04em]'>지도에서 바로 행사 고르기</h2>
                      </div>
                      <button
                        type='button'
                        onClick={() => setIsDesktopPanelCollapsed(true)}
                        className='soft-chip rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                      >
                        접기
                      </button>
                    </div>
                    <div className='mt-4 grid grid-cols-3 gap-2.5'>
                      <StatCard label='Events' value={totalCount} />
                      <StatCard label='Free' value={freeCount} />
                      <StatCard label='Districts' value={districtCount} />
                    </div>
                    {ADSENSE_MAP_PANEL_SLOT && (
                      <div className='surface-card mt-4 rounded-[18px] p-2.5'>
                        <GoogleAdSlot slot={ADSENSE_MAP_PANEL_SLOT} className='min-h-[88px]' />
                      </div>
                    )}
                  </div>
                  <div className='min-h-0 flex-1 px-3 pb-3 pt-2'>{renderListPanel()}</div>
                </section>
              )}
            </div>
          </div>
          <div className='flex-1' />
        </div>

        {!isDetailRoute && isMobileSheetVisible ? (
          <section className='surface-panel pointer-events-auto mt-auto flex h-[54vh] min-h-[300px] max-h-[560px] w-full flex-col overflow-hidden rounded-[30px] text-[var(--app-text)] lg:hidden'>
            <div className='border-b border-[var(--app-border)] px-5 py-4 sm:px-6'>
              <div className='mb-3'>
                <div className='flex items-center justify-center'>
                  <div className='h-1.5 w-12 rounded-full bg-[#1f765f]/20' />
                </div>
                <div className='mt-2 flex justify-end'>
                  <button
                    type='button'
                    onClick={() => setIsMobileSheetVisible(false)}
                    className='soft-chip rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)]'
                  >
                    지도만 보기
                  </button>
                </div>
              </div>
              <p className='text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#1f765f] dark:text-[#8dc5b5]'>
                City Culture Guide
              </p>
              <h2 className='mt-2 text-[1.45rem] font-semibold leading-[1.12] tracking-[-0.04em]'>지도에서 바로 행사 고르기</h2>
              <div className='mt-4 grid grid-cols-3 gap-2.5'>
                <StatCard label='Events' value={totalCount} />
                <StatCard label='Free' value={freeCount} />
                <StatCard label='Districts' value={districtCount} />
              </div>
              {ADSENSE_MAP_PANEL_SLOT && (
                <div className='surface-card mt-4 rounded-[18px] p-2.5'>
                  <GoogleAdSlot slot={ADSENSE_MAP_PANEL_SLOT} className='min-h-[72px]' />
                </div>
              )}
            </div>
            <div className='min-h-0 flex-1 px-3 pb-3 pt-2'>{renderListPanel()}</div>
          </section>
        ) : !isDetailRoute ? (
          <div className='pointer-events-auto mt-auto flex justify-center lg:hidden'>
            <button
              type='button'
              onClick={() => setIsMobileSheetVisible(true)}
              className='surface-panel rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--app-text)]'
            >
              행사 목록 보기 {totalCount > 0 ? `(${totalCount})` : ''}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MapDashboard;
