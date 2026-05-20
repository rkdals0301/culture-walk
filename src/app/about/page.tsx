import InfoPageShell from '@/components/Info/InfoPageShell';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서비스 소개',
  description: '문화산책이 서울 문화행사 정보를 수집하고 지도 기반으로 제공하는 방식과 이용 가치를 안내합니다.',
  alternates: {
    canonical: '/about',
  },
};

const AboutPage = () => {
  return (
    <InfoPageShell
      eyebrow='About CultureWalk'
      title='서울 문화행사를 지도 위에서 더 쉽게 찾습니다.'
      description='문화산책은 서울시 문화행사 공개 정보를 바탕으로 전시, 공연, 축제, 체험 행사를 위치 중심으로 탐색할 수 있게 만든 서비스입니다.'
    >
      <div className='grid gap-4 md:grid-cols-3'>
        <article className='surface-card rounded-[28px] p-5'>
          <h2 className='text-lg font-semibold tracking-[-0.03em]'>지도 중심 탐색</h2>
          <p className='mt-3 text-sm leading-6 text-[var(--app-muted)]'>
            행사 목록만 보는 방식보다 현재 위치, 지역, 장소의 거리를 함께 비교할 수 있도록 지도와 리스트를 함께 제공합니다.
          </p>
        </article>
        <article className='surface-card rounded-[28px] p-5'>
          <h2 className='text-lg font-semibold tracking-[-0.03em]'>공개 데이터 기반</h2>
          <p className='mt-3 text-sm leading-6 text-[var(--app-muted)]'>
            서울시 문화행사 데이터를 정기적으로 동기화하고, 종료된 행사는 제외해 탐색 시점에 유효한 정보를 우선 노출합니다.
          </p>
        </article>
        <article className='surface-card rounded-[28px] p-5'>
          <h2 className='text-lg font-semibold tracking-[-0.03em]'>빠른 상세 이동</h2>
          <p className='mt-3 text-sm leading-6 text-[var(--app-muted)]'>
            관심 있는 행사를 선택하면 장소, 일정, 요금, 대상 정보를 확인하고 서울문화포털 또는 예약 페이지로 이동할 수 있습니다.
          </p>
        </article>
      </div>

      <article className='surface-card rounded-[28px] p-5 sm:p-6'>
        <h2 className='text-xl font-semibold tracking-[-0.03em]'>제공 정보</h2>
        <p className='mt-3 text-sm leading-7 text-[var(--app-muted)]'>
          문화산책은 행사명, 분류, 자치구, 장소, 일정, 요금, 이용 대상, 대표 이미지, 외부 상세 링크를 제공합니다.
          원천 데이터의 변경이나 기관 사정에 따라 행사 일정과 예약 가능 여부가 달라질 수 있으므로 최종 방문 전 공식
          상세 페이지를 함께 확인하는 것을 권장합니다.
        </p>
      </article>
    </InfoPageShell>
  );
};

export default AboutPage;
