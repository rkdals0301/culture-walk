import type { FormattedCultureDetail } from '@/types/culture';
import type { CultureDetailViewModel } from '@/utils/cultureDetailViewModel';

import { ChevronDown, ExternalLink, Navigation } from 'lucide-react';

interface CultureDetailSectionsProps {
  culture: FormattedCultureDetail;
  detail: CultureDetailViewModel;
}

const CultureDetailSections = ({ culture, detail }: CultureDetailSectionsProps) => {
  const { fullAddress, hasOverview, hasProgram, visibleAdditionalInformation } = detail;
  const kakaoNavUrl = `https://map.kakao.com/link/to/${encodeURIComponent(culture.title)},${culture.lat},${culture.lng}`;
  const naverNavUrl = `https://map.naver.com/v5/search/${encodeURIComponent(fullAddress || culture.title)}`;

  return (
    <>
      {(hasOverview || hasProgram) && (
        <section className='mt-12 border-t border-[var(--color-detail-divider)] pt-7 sm:mt-14 sm:pt-8'>
          {hasOverview && (
            <div>
              <h2 className='text-base font-semibold tracking-tight text-[var(--color-text-primary)]'>행사 소개</h2>
              <div className='mt-4 max-w-[68ch] text-[0.9375rem] leading-[1.85] text-[var(--color-text-secondary)] sm:text-base'>
                <p className='whitespace-pre-line break-words'>{culture.overview}</p>
              </div>
            </div>
          )}

          {hasProgram && (
            <div className={hasOverview ? 'mt-8 border-t border-[var(--color-detail-divider)] pt-7' : undefined}>
              <h2 className='text-base font-semibold tracking-tight text-[var(--color-text-primary)]'>프로그램</h2>
              <div className='mt-4 max-w-[68ch] text-[0.9375rem] leading-[1.85] text-[var(--color-text-secondary)] sm:text-base'>
                <p className='whitespace-pre-line break-words'>{culture.programIntroduction}</p>
              </div>
            </div>
          )}
        </section>
      )}

      <section className='mt-12 border-t border-[var(--color-detail-divider)] pt-7 sm:mt-14 sm:pt-8'>
        <h2 className='text-base font-semibold tracking-tight text-[var(--color-text-primary)]'>오시는 길</h2>
        <p className='mt-2 max-w-[68ch] text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-[0.9375rem]'>
          {fullAddress || '장소 정보가 없습니다.'}
        </p>

        <div className='mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs'>
          <a
            href={kakaoNavUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1.5 rounded-md px-1 py-1 font-medium text-[var(--color-text-primary)] underline decoration-[var(--color-detail-divider)] underline-offset-4 transition hover:text-[var(--color-brand-primary)] hover:decoration-[var(--color-brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
          >
            <Navigation className='size-3.5 text-[var(--color-brand-primary)]' strokeWidth={1.8} />
            <span>카카오맵</span>
            <ExternalLink className='size-3 text-[var(--color-text-tertiary)]' strokeWidth={1.8} />
          </a>

          <a
            href={naverNavUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1.5 rounded-md px-1 py-1 font-medium text-[var(--color-text-primary)] underline decoration-[var(--color-detail-divider)] underline-offset-4 transition hover:text-[var(--color-brand-primary)] hover:decoration-[var(--color-brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
          >
            <span>네이버 지도</span>
            <ExternalLink className='size-3 text-[var(--color-text-tertiary)]' strokeWidth={1.8} />
          </a>
        </div>
      </section>

      {visibleAdditionalInformation.length > 0 && (
        <details open className='group mt-10 border-t border-[var(--color-detail-divider)] pt-4'>
          <summary className='flex cursor-pointer list-none items-center justify-between gap-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'>
            <span>추가 안내</span>
            <ChevronDown
              className='size-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200 group-open:rotate-180'
              strokeWidth={1.8}
            />
          </summary>
          <dl className='mt-3 space-y-4 pb-2 text-xs leading-relaxed text-[var(--color-text-secondary)] sm:text-sm'>
            {visibleAdditionalInformation.map((item, index) => (
              <div key={`${item.name}-${index}`} className='sm:grid sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-3'>
                <dt className='font-semibold text-[var(--color-text-primary)]'>{item.name}</dt>
                <dd className='whitespace-pre-line break-words'>{item.text}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </>
  );
};

export default CultureDetailSections;
