import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCultureDetailMetadata,
  createCultureEventStructuredData,
  getCultureCanonicalUrl,
  parseCultureId,
} from '../src/server/cultureDetailSeo';
import type { FormattedCultureDetail } from '../src/types/culture';

const culture = (overrides: Partial<FormattedCultureDetail> = {}) =>
  ({
    id: 101,
    classification: '공연',
    date: '',
    endDate: new Date('2026-09-13T00:00:00.000Z'),
    etcDescription: '',
    guName: '서울 종로구',
    homepageDetailAddress: 'https://example.com/book',
    isFree: '무료',
    lat: 37.5,
    lng: 127,
    mainImage: '',
    homepageAddress: 'https://example.com',
    organizationName: '문화산책 운영팀',
    place: '테스트홀',
    address: '서울 종로구 테스트로 1',
    performerInformation: '',
    programIntroduction: '테스트 프로그램',
    registrationDate: '2026-08-01T00:00:00.000Z',
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    themeClassification: '',
    register: '',
    title: '문화산책 테스트 공연',
    useFee: '무료',
    useTarget: '전체 관람가',
    overview: '행사 소개',
    eventTime: '',
    duration: '',
    bookingPlace: '',
    placeInformation: '',
    contact: '',
    festivalGrade: '',
    discountInformation: '',
    additionalInformation: [],
    additionalImages: [],
    updatedAt: new Date('2026-09-10T00:00:00.000Z'),
    displayDate: '2026.09.01 - 2026.09.13',
    displayPlace: '테스트홀',
    displayPrice: '무료',
    ...overrides,
  }) as FormattedCultureDetail;

test('문화 상세 canonical은 지도 상세에서도 독립 상세 URL 하나로 통일한다', () => {
  const item = culture();
  const metadata = createCultureDetailMetadata(item);

  assert.equal(getCultureCanonicalUrl(item.id), 'https://culturewalk.gangmin.dev/cultures/101');
  assert.equal(metadata.alternates?.canonical, getCultureCanonicalUrl(item.id));
  assert.equal(metadata.openGraph && 'url' in metadata.openGraph ? metadata.openGraph.url : null, getCultureCanonicalUrl(item.id));
});

test('종료된 행사는 JSON-LD 상태와 offer availability를 함께 종료 상태로 만든다', () => {
  const item = culture();
  const jsonLd = createCultureEventStructuredData(item, new Date('2026-09-14T00:00:00.000Z').getTime());

  assert.equal(jsonLd.eventStatus, 'https://schema.org/EventCompleted');
  assert.equal(jsonLd.offers?.availability, 'https://schema.org/SoldOut');
  assert.equal(jsonLd.url, getCultureCanonicalUrl(item.id));
  assert.equal(jsonLd['@id'], `${getCultureCanonicalUrl(item.id)}#event`);
});

test('유효한 문화 ID만 SEO 상세 조회에 사용한다', () => {
  assert.equal(parseCultureId('101'), 101);
  assert.equal(parseCultureId('0'), null);
  assert.equal(parseCultureId('-1'), null);
  assert.equal(parseCultureId('101abc'), null);
});
