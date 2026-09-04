import InfoPageShell from '@/components/Info/InfoPageShell';

import type { Metadata } from 'next';
import Link from 'next/link';

import { ArrowRight, ExternalLink, MapPinned, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: '서비스 소개',
  description: '문화산책이 전국 문화행사 정보를 수집하고 지도 기반으로 제공하는 방식과 이용 가치를 안내합니다.',
  alternates: {
    canonical: '/about',
  },
};

const CATEGORIES = [
  { title: '축제', detail: '계절과 지역의 분위기를 만나는 행사' },
  { title: '공연', detail: '무대와 음악이 있는 시간' },
  { title: '전시', detail: '작품과 공간을 천천히 살펴보는 자리' },
  { title: '체험', detail: '직접 참여하며 기억을 남기는 프로그램' },
];

const ABOUT_STEPS = [
  {
    icon: MapPinned,
    title: '지도에서 고르기',
    detail:
      '행사 목록만 보는 대신 현재 위치, 지역, 장소의 관계를 함께 비교할 수 있도록 지도와 리스트를 한 흐름으로 제공합니다.',
  },
  {
    icon: RefreshCw,
    title: '공개 정보로 갱신하기',
    detail:
      '한국관광공사 TourAPI 데이터를 바탕으로 행사 정보를 동기화하고, 종료된 행사는 제외해 탐색 시점에 유효한 정보를 우선 보여드립니다.',
  },
  {
    icon: ExternalLink,
    title: '공식 안내로 확인하기',
    detail:
      '관심 행사의 장소, 일정, 요금, 대상 정보를 확인한 뒤 제공되는 경우 공식 홈페이지나 예약 페이지로 바로 이동할 수 있습니다.',
  },
];

const ABOUT_DETAILS = [
  { title: '행사 기본', detail: '행사명, 분류, 지역' },
  { title: '일정과 장소', detail: '기간, 장소, 주소' },
  { title: '이용 조건', detail: '요금, 이용 대상, 문의처' },
  { title: '바로가기', detail: '대표 이미지, 공식 홈페이지와 예약 링크' },
];

const AboutPage = () => {
  return (
    <InfoPageShell
      title='전국 문화행사를 지도 위에서 더 쉽게 찾습니다.'
      description='문화산책은 한국관광공사 TourAPI 공개 정보를 바탕으로 전국의 축제, 공연, 전시, 체험 행사를 위치 중심으로 탐색할 수 있게 만든 서비스입니다.'
      action={
        <Link href='/map' className='info-map-action group'>
          <span className='info-map-action-icon'>
            <MapPinned aria-hidden='true' className='size-5' strokeWidth={1.8} />
          </span>
          <span className='info-map-action-copy'>
            <span className='info-map-action-label'>문화지도</span>
            지도에서 행사 찾기
          </span>
          <ArrowRight
            aria-hidden='true'
            className='info-map-action-arrow transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5'
            strokeWidth={1.8}
          />
        </Link>
      }
    >
      <section className='info-section info-section-split' aria-labelledby='about-categories-title'>
        <div className='info-section-header'>
          <h2 id='about-categories-title' className='info-section-heading'>
            네 가지 행사, 한 화면에서
          </h2>
          <p className='info-section-lede'>축제, 공연, 전시, 체험을 지역과 장소의 관계까지 함께 살펴볼 수 있습니다.</p>
        </div>
        <ul aria-label='문화행사 분류' className='info-category-grid'>
          {CATEGORIES.map(category => (
            <li key={category.title} className='info-category-item'>
              <span className='info-category-name'>{category.title}</span>
              <span className='info-category-detail'>{category.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className='info-section info-section-split' aria-labelledby='about-principles-title'>
        <div className='info-section-header'>
          <h2 id='about-principles-title' className='info-section-heading'>
            찾는 흐름은 단순합니다.
          </h2>
          <p className='info-section-lede'>지금 갈 만한 곳을 고르고, 필요한 정보를 확인한 뒤 공식 안내로 이어집니다.</p>
        </div>
        <ol className='info-route-list'>
          {ABOUT_STEPS.map(({ icon: Icon, title: stepTitle, detail }, index) => (
            <li key={stepTitle} className='info-route-item'>
              <span className='info-route-index' aria-hidden='true'>
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className='info-route-body'>
                <div className='info-route-heading'>
                  <span className='info-route-icon'>
                    <Icon aria-hidden='true' className='size-[1.05rem]' strokeWidth={1.8} />
                  </span>
                  <h3>{stepTitle}</h3>
                </div>
                <p>{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className='info-section info-section-split' aria-labelledby='about-details-title'>
        <div className='info-section-header'>
          <h2 id='about-details-title' className='info-section-heading'>
            결정하기 전에 필요한 정보를 모았습니다.
          </h2>
          <p className='info-section-lede'>행사마다 제공되는 기본 정보와 공식 안내를 함께 확인할 수 있습니다.</p>
        </div>
        <dl className='info-fact-grid'>
          {ABOUT_DETAILS.map(({ title: detailTitle, detail }) => (
            <div key={detailTitle} className='info-fact-item'>
              <dt>{detailTitle}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <aside className='info-note' aria-label='방문 전 안내'>
        <span className='info-note-icon'>
          <ExternalLink aria-hidden='true' className='size-[1.1rem]' strokeWidth={1.8} />
        </span>
        <div>
          <h2>방문 전 공식 안내를 확인하세요.</h2>
          <p>
            원천 데이터의 변경이나 기관 사정에 따라 일정과 예약 가능 여부가 달라질 수 있습니다. 최종 방문 전 공식 상세
            페이지를 함께 확인해 주세요.
          </p>
        </div>
      </aside>
    </InfoPageShell>
  );
};

export default AboutPage;
