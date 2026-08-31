import CultureCategoryBadge from '@/components/Common/CultureCategoryBadge';
import InfoPageShell from '@/components/Info/InfoPageShell';

import type { Metadata } from 'next';

import { ArrowUpRight, MapPinned, RefreshCw, Route } from 'lucide-react';

export const metadata: Metadata = {
  title: '서비스 소개',
  description: '문화산책이 전국 문화행사 정보를 수집하고 지도 기반으로 제공하는 방식과 이용 가치를 안내합니다.',
  alternates: {
    canonical: '/about',
  },
};

const AboutPage = () => {
  return (
    <InfoPageShell
      eyebrow='문화산책 소개'
      title='전국 문화행사를 지도 위에서 더 쉽게 찾습니다.'
      description='문화산책은 한국관광공사 TourAPI 공개 정보를 바탕으로 전국의 축제, 공연, 전시, 체험 행사를 위치 중심으로 탐색할 수 있게 만든 서비스입니다.'
    >
      <section
        className='grid gap-4 border-y border-[var(--app-border)] py-5 sm:flex sm:items-center sm:justify-between sm:gap-8'
        aria-labelledby='about-categories-title'
      >
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.12em] text-[var(--app-primary)]'>탐색 범위</p>
          <h2 id='about-categories-title' className='mt-1 text-base font-semibold'>
            지역에서 만날 수 있는 네 가지 장르
          </h2>
        </div>
        <ul aria-label='문화행사 분류' className='flex flex-wrap gap-2'>
          {['축제', '공연', '전시', '체험'].map(category => (
            <li key={category}>
              <CultureCategoryBadge classification={category} className='rounded-lg px-3 py-2 text-xs' />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby='about-principles-title'>
        <div className='mb-3 flex items-end justify-between gap-4'>
          <div>
            <p className='text-xs font-bold uppercase tracking-[0.12em] text-[var(--app-primary)]'>서비스 원칙</p>
            <h2 id='about-principles-title' className='mt-1 text-2xl font-semibold tracking-[-0.03em]'>
              찾는 순간부터 방문까지
            </h2>
          </div>
          <Route aria-hidden='true' className='hidden size-7 text-[var(--app-accent)] sm:block' strokeWidth={1.6} />
        </div>
        <div className='divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]'>
          <article className='grid gap-4 py-6 sm:grid-cols-[auto_1fr] sm:gap-6'>
            <span
              className='flex size-11 items-center justify-center rounded-lg bg-[var(--app-chip)] text-[var(--app-primary)]'
              aria-hidden='true'
            >
              <MapPinned className='size-5' strokeWidth={1.8} />
            </span>
            <div>
              <h3 className='text-lg font-semibold'>지도에서 먼저 감을 잡습니다.</h3>
              <p className='mt-2 max-w-3xl text-sm leading-7 text-[var(--app-muted)]'>
                행사 목록만 보는 대신 현재 위치, 지역, 장소의 관계를 함께 비교할 수 있도록 지도와 리스트를 한 흐름으로
                제공합니다.
              </p>
            </div>
          </article>
          <article className='grid gap-4 py-6 sm:grid-cols-[auto_1fr] sm:gap-6'>
            <span
              className='flex size-11 items-center justify-center rounded-lg bg-[var(--app-chip)] text-[var(--app-primary)]'
              aria-hidden='true'
            >
              <RefreshCw className='size-5' strokeWidth={1.8} />
            </span>
            <div>
              <h3 className='text-lg font-semibold'>공개 데이터로 오늘을 갱신합니다.</h3>
              <p className='mt-2 max-w-3xl text-sm leading-7 text-[var(--app-muted)]'>
                한국관광공사 TourAPI 데이터를 바탕으로 행사 정보를 동기화하고, 종료된 행사는 제외해 탐색 시점에 유효한
                정보를 우선 보여드립니다.
              </p>
            </div>
          </article>
          <article className='grid gap-4 py-6 sm:grid-cols-[auto_1fr] sm:gap-6'>
            <span
              className='flex size-11 items-center justify-center rounded-lg bg-[var(--app-chip)] text-[var(--app-primary)]'
              aria-hidden='true'
            >
              <ArrowUpRight className='size-5' strokeWidth={1.8} />
            </span>
            <div>
              <h3 className='text-lg font-semibold'>상세를 확인하고 다음 행동으로 갑니다.</h3>
              <p className='mt-2 max-w-3xl text-sm leading-7 text-[var(--app-muted)]'>
                관심 행사의 장소, 일정, 요금, 대상 정보를 확인한 뒤 제공되는 경우 공식 홈페이지나 예약 페이지로 바로
                이동할 수 있습니다.
              </p>
            </div>
          </article>
        </div>
      </section>

      <aside className='grid gap-3 border-l-2 border-[var(--app-accent)] pl-4 sm:pl-5'>
        <p className='text-xs font-bold uppercase tracking-[0.12em] text-[var(--app-warm-text)]'>제공 정보</p>
        <p className='max-w-4xl text-sm leading-7 text-[var(--app-muted)]'>
          행사명, 분류, 지역, 장소, 일정, 요금, 이용 대상, 대표 이미지, 외부 상세 링크를 제공합니다. 원천 데이터의
          변경이나 기관 사정에 따라 일정과 예약 가능 여부가 달라질 수 있으므로 최종 방문 전 공식 상세 페이지를 함께
          확인해 주세요.
        </p>
      </aside>
    </InfoPageShell>
  );
};

export default AboutPage;
