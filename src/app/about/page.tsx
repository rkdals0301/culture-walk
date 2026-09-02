import InfoPageShell from '@/components/Info/InfoPageShell';

import type { Metadata } from 'next';
import Link from 'next/link';

import { ArrowUpRight, MapPinned, RefreshCw } from 'lucide-react';

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
      title='전국 문화행사를 지도 위에서 더 쉽게 찾습니다.'
      description='문화산책은 한국관광공사 TourAPI 공개 정보를 바탕으로 전국의 축제, 공연, 전시, 체험 행사를 위치 중심으로 탐색할 수 있게 만든 서비스입니다.'
      action={
        <Link
          href='/map'
          className='group inline-flex min-h-11 w-fit items-center gap-2 border-b-2 border-[var(--color-brand-primary)] px-1 pb-2 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-brand-hover)] hover:text-[var(--color-brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'
        >
          <MapPinned aria-hidden='true' className='size-4 text-[var(--color-brand-primary)]' strokeWidth={1.8} />
          지도에서 행사 찾기
          <ArrowUpRight
            aria-hidden='true'
            className='size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5'
            strokeWidth={1.8}
          />
        </Link>
      }
    >
      <section
        className='grid gap-5 border-l-2 border-[var(--color-accent-primary)] py-1 pl-4 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,auto)] sm:items-center sm:gap-8 sm:pl-5'
        aria-labelledby='about-categories-title'
      >
        <div>
          <h2 id='about-categories-title' className='text-base font-semibold'>
            지역에서 만날 수 있는 네 가지 장르
          </h2>
          <p className='mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]'>
            축제, 공연, 전시, 체험을 한 지도에서 살펴볼 수 있습니다.
          </p>
        </div>
        <ul aria-label='문화행사 분류' className='flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold sm:justify-end'>
          {['축제', '공연', '전시', '체험'].map(category => (
            <li key={category} className='flex items-center gap-2'>
              <span className='h-px w-4 bg-[var(--color-accent-primary)]' aria-hidden='true' />
              {category}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby='about-principles-title'>
        <div>
          <h2 id='about-principles-title' className='text-2xl font-semibold tracking-[-0.03em]'>
            찾는 순간부터 방문까지
          </h2>
        </div>
        <ol className='info-route-list relative mt-5 grid gap-0 border-l border-[var(--color-border-brand-subtle)] pl-6 sm:pl-8'>
          <li className='relative grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-6'>
            <span
              className='absolute -left-[1.7rem] top-1.5 size-2 rounded-full border-2 border-[var(--color-brand-primary)] bg-[var(--color-bg-primary)] sm:-left-[2.2rem]'
              aria-hidden='true'
            />
            <p className='text-sm font-semibold tabular-nums text-[var(--color-brand-primary)]'>01</p>
            <div>
              <h3 className='text-lg font-semibold'>지도에서 먼저 감을 잡습니다.</h3>
              <p className='mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]'>
                행사 목록만 보는 대신 현재 위치, 지역, 장소의 관계를 함께 비교할 수 있도록 지도와 리스트를 한 흐름으로
                제공합니다.
              </p>
            </div>
          </li>
          <li className='relative grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-6'>
            <span
              className='absolute -left-[1.7rem] top-5 size-2 rounded-full border-2 border-[var(--color-brand-primary)] bg-[var(--color-bg-primary)] sm:-left-[2.2rem]'
              aria-hidden='true'
            />
            <p className='text-sm font-semibold tabular-nums text-[var(--color-brand-primary)]'>02</p>
            <div>
              <h3 className='text-lg font-semibold'>공개 데이터로 오늘을 갱신합니다.</h3>
              <p className='mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]'>
                한국관광공사 TourAPI 데이터를 바탕으로 행사 정보를 동기화하고, 종료된 행사는 제외해 탐색 시점에 유효한
                정보를 우선 보여드립니다.
              </p>
            </div>
          </li>
          <li className='relative grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-6'>
            <span
              className='absolute -left-[1.7rem] top-5 size-2 rounded-full border-2 border-[var(--color-brand-primary)] bg-[var(--color-bg-primary)] sm:-left-[2.2rem]'
              aria-hidden='true'
            />
            <p className='text-sm font-semibold tabular-nums text-[var(--color-brand-primary)]'>03</p>
            <div>
              <h3 className='text-lg font-semibold'>상세를 확인하고 다음 행동으로 갑니다.</h3>
              <p className='mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]'>
                관심 행사의 장소, 일정, 요금, 대상 정보를 확인한 뒤 제공되는 경우 공식 홈페이지나 예약 페이지로 바로
                이동할 수 있습니다.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className='grid gap-3 border-t border-[var(--color-border-primary)] pt-6 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8'>
        <h2 className='text-base font-semibold'>제공 정보</h2>
        <p className='max-w-4xl text-sm leading-7 text-[var(--color-text-secondary)]'>
          행사명, 분류, 지역, 장소, 일정, 요금, 이용 대상, 대표 이미지, 외부 상세 링크를 제공합니다. 원천 데이터의
          변경이나 기관 사정에 따라 일정과 예약 가능 여부가 달라질 수 있으므로 최종 방문 전 공식 상세 페이지를 함께
          확인해 주세요.
        </p>
      </section>
    </InfoPageShell>
  );
};

export default AboutPage;
