'use client';

import CultureList from '@/components/Header/CultureList';
import Loader from '@/components/Loader/Loader';
import { useCultures } from '@/hooks/cultureHooks';
import { getCultures } from '@/selectors/cultureSelectors';
import { FormattedCulture } from '@/types/culture';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useRouter } from 'next/navigation';

const MapPage = () => {
  const router = useRouter();
  const cultures = useSelector(getCultures);
  const { isLoading, error } = useCultures(cultures.length === 0);

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
  const highlightedCultures = useMemo(() => cultures.slice(0, 3), [cultures]);

  const handleOpenCulture = (culture: FormattedCulture) => {
    router.push(`/map/${culture.id}`);
  };

  const renderListPanel = () => {
    if (isLoading) {
      return (
        <div className='flex h-full items-center justify-center'>
          <Loader />
        </div>
      );
    }

    if (error) {
      return (
        <div className='surface-card flex h-full flex-col items-center justify-center rounded-[28px] p-6 text-center'>
          <p className='text-lg font-semibold tracking-[-0.03em]'>행사 데이터를 불러오지 못했습니다.</p>
          <p className='mt-2 text-sm text-[var(--app-muted)]'>{error.message}</p>
        </div>
      );
    }

    return <CultureList cultures={cultures} onItemClick={handleOpenCulture} />;
  };

  return (
    <div className='pointer-events-none absolute inset-0'>
      <div className='mx-auto flex h-full max-w-[1600px] flex-col px-4 pb-4 pt-[5.75rem] sm:px-6 sm:pb-6 sm:pt-[6.5rem] lg:flex-row lg:gap-6 lg:px-8 lg:pb-8 lg:pt-[7.5rem]'>
        <section className='surface-panel pointer-events-auto mt-auto flex max-h-[72vh] min-h-[430px] w-full flex-col overflow-hidden rounded-[32px] text-[var(--app-text)] lg:mt-0 lg:h-full lg:max-h-none lg:w-[390px] lg:min-w-[390px]'>
          <div className='border-b border-[var(--app-border)] px-5 py-5 sm:px-6'>
            <div className='mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#1f765f]/20 lg:hidden' />
            <p className='text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#1f765f] dark:text-[#8dc5b5]'>
              Urban Cultural Trail
            </p>
            <h2 className='mt-2 text-[1.85rem] font-semibold leading-[1.05] tracking-[-0.05em] sm:text-[2.2rem]'>
              서울의 문화를
              <br />
              지도 위에서 고르세요.
            </h2>
            <p className='mt-3 max-w-md text-sm leading-6 text-[var(--app-muted)]'>
              모바일에서는 빠르게 훑고, PC에서는 왼쪽 레일로 깊게 탐색할 수 있게 다시 구성했습니다.
            </p>
            <div className='mt-5 grid grid-cols-3 gap-2'>
              <div className='soft-chip rounded-[22px] px-3 py-3'>
                <p className='text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]'>Events</p>
                <p className='mt-1 text-xl font-semibold tracking-[-0.04em]'>{totalCount}</p>
              </div>
              <div className='soft-chip rounded-[22px] px-3 py-3'>
                <p className='text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]'>Free</p>
                <p className='mt-1 text-xl font-semibold tracking-[-0.04em]'>{freeCount}</p>
              </div>
              <div className='soft-chip rounded-[22px] px-3 py-3'>
                <p className='text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]'>Districts</p>
                <p className='mt-1 text-xl font-semibold tracking-[-0.04em]'>{districtCount}</p>
              </div>
            </div>
          </div>
          <div className='min-h-0 flex-1 px-3 pb-3 pt-3'>{renderListPanel()}</div>
        </section>

        <div className='hidden flex-1 flex-col justify-between lg:flex'>
          <div className='pointer-events-auto ml-auto w-full max-w-[440px] rounded-[32px] border border-white/10 bg-[#0f241f]/78 p-6 text-[#f8f4eb] shadow-[0_34px_70px_-36px_rgba(0,0,0,0.68)] backdrop-blur-2xl'>
            <p className='text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#8dc5b5]'>Immersive View</p>
            <h3 className='mt-2 text-[2.4rem] font-semibold leading-[1] tracking-[-0.06em]'>
              도시의 리듬을
              <br />
              한 장의 지도로.
            </h3>
            <p className='mt-4 max-w-md text-sm leading-6 text-[#d2dfda]'>
              좌측에서 후보를 훑고, 지도에서 거리를 감각적으로 비교하고, 바로 상세 바텀시트로 이어지는 흐름에 맞춰
              인터페이스를 재구성했습니다.
            </p>
            <div className='mt-6 flex flex-wrap gap-2'>
              {['지도 중심 탐색', '빠른 검색', '상세 바텀시트', '모바일/PC 대응'].map(label => (
                <span
                  key={label}
                  className='rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[#f2eee5]'
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className='pointer-events-auto ml-auto grid w-full max-w-[460px] gap-3'>
            {highlightedCultures.map(culture => (
              <button
                key={culture.id}
                type='button'
                onClick={() => handleOpenCulture(culture)}
                className='surface-card rounded-[28px] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#1f765f]/20 hover:shadow-[0_24px_48px_-30px_rgba(31,118,95,0.45)]'
              >
                <p className='text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#1f765f] dark:text-[#8dc5b5]'>
                  Spotlight
                </p>
                <p className='mt-2 text-lg font-semibold tracking-[-0.03em]'>{culture.title}</p>
                <div className='mt-3 flex flex-wrap gap-2 text-sm text-[var(--app-muted)]'>
                  <span className='rounded-full bg-black/[0.04] px-3 py-1 dark:bg-white/[0.06]'>{culture.displayPlace}</span>
                  <span className='rounded-full bg-black/[0.04] px-3 py-1 dark:bg-white/[0.06]'>{culture.displayPrice}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
