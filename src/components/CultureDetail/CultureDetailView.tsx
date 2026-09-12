'use client';

import CultureDetailGallery from '@/components/CultureDetail/CultureDetailGallery';
import CultureDetailFacts from '@/components/CultureDetail/CultureDetailFacts';
import CultureDetailHeader from '@/components/CultureDetail/CultureDetailHeader';
import {
  CultureDetailDesktopActions,
  CultureDetailMobileActions,
} from '@/components/CultureDetail/CultureDetailActions';
import CultureDetailSections from '@/components/CultureDetail/CultureDetailSections';
import type { FormattedCultureDetail } from '@/types/culture';
import { getCultureDetailViewModel } from '@/utils/cultureDetailViewModel';
import { getCultureTimingStatus } from '@/utils/cultureTimingStatus';

import React, { useMemo } from 'react';

interface CultureDetailViewProps {
  culture: FormattedCultureDetail;
}

const CultureDetailView = ({ culture }: CultureDetailViewProps) => {
  const detail = useMemo(() => getCultureDetailViewModel(culture), [culture]);
  const { imageList } = detail;

  const dday = useMemo(
    () => getCultureTimingStatus(culture.startDate, culture.endDate),
    [culture.startDate, culture.endDate]
  );
  return (
    <div
      id='culture-detail-scroll-container'
      className='relative h-full overflow-y-auto bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-colors selection:bg-[var(--color-brand-subtle)] selection:text-[var(--color-brand-primary)]'
    >
      <CultureDetailHeader culture={culture} />

      <main className='mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pb-32 sm:pt-10 lg:px-8 lg:pb-20'>
        <div className='lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-12 xl:gap-16'>
          {/* The poster is the visual anchor. Everything around it stays serviceable. */}
          <div className='lg:sticky lg:top-20'>
            <CultureDetailGallery culture={culture} imageList={imageList} />

            <CultureDetailDesktopActions culture={culture} />
          </div>

          <div className='mt-8 lg:mt-0'>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-secondary)]'>
              <span className='font-semibold text-[var(--color-brand-primary)]'>
                {culture.classification || '문화행사'}
              </span>
              {culture.guName && (
                <>
                  <span aria-hidden='true' className='text-[var(--color-text-tertiary)]'>
                    /
                  </span>
                  <span>{culture.guName}</span>
                </>
              )}
              {dday && (
                <>
                  <span aria-hidden='true' className='text-[var(--color-text-tertiary)]'>
                    /
                  </span>
                  <span
                    className={
                      dday.variant === 'urgent'
                        ? 'font-semibold text-[var(--color-error)]'
                        : dday.variant === 'ended'
                          ? 'text-[var(--color-text-tertiary)]'
                          : 'font-medium text-[var(--color-text-secondary)]'
                    }
                  >
                    {dday.text}
                  </span>
                </>
              )}
            </div>

            <h1 className='mt-3 max-w-[18ch] text-3xl font-semibold leading-[1.12] tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl lg:text-[2.8rem]'>
              {culture.title}
            </h1>

            <CultureDetailFacts culture={culture} detail={detail} />

            <CultureDetailSections culture={culture} detail={detail} />
          </div>
        </div>
      </main>

      <CultureDetailMobileActions culture={culture} />

    </div>
  );
};

export default React.memo(CultureDetailView);
