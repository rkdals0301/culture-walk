import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createCultureDetailMetadata,
  createCultureEventStructuredData,
  createUnavailableCultureMetadata,
  resolveFormattedCultureDetailLookupById,
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
  assert.equal(jsonLd.isAccessibleForFree, true);
  assert.equal(jsonLd.offers?.price, 0);
  assert.equal(jsonLd.offers?.availability, 'https://schema.org/SoldOut');
  assert.equal(jsonLd.url, getCultureCanonicalUrl(item.id));
  assert.equal(jsonLd['@id'], `${getCultureCanonicalUrl(item.id)}#event`);
});

test('날짜만 등록된 행사는 한국 종료일이 지나기 전까지 진행 상태와 날짜 단위 JSON-LD를 유지한다', () => {
  const item = culture();
  const jsonLd = createCultureEventStructuredData(item, new Date('2026-09-13T06:00:00.000Z').getTime());

  assert.equal(jsonLd.eventStatus, 'https://schema.org/EventScheduled');
  assert.equal(jsonLd.startDate, '2026-09-01');
  assert.equal(jsonLd.endDate, '2026-09-13');
  assert.equal(jsonLd.offers?.availability, 'https://schema.org/InStock');
});

test('부분 무료·조건부 무료 요금은 무료 Offer로 오인하지 않는다', () => {
  const partial = createCultureEventStructuredData(
    culture({ isFree: '무료', useFee: '무료 (체험부스 일부 유료)' }),
    new Date('2026-09-01T00:00:00.000Z').getTime()
  );
  const conditional = createCultureEventStructuredData(
    culture({ isFree: '유료', useFee: '유료 · 군민 무료입장' }),
    new Date('2026-09-01T00:00:00.000Z').getTime()
  );

  assert.equal(partial.isAccessibleForFree, undefined);
  assert.equal(partial.offers, undefined);
  assert.equal(conditional.isAccessibleForFree, undefined);
  assert.equal(conditional.offers, undefined);
});

test('요금이 알려지지 않은 행사에는 무료 접근 여부를 단정하지 않는다', () => {
  const unknownFee = createCultureEventStructuredData(culture({ isFree: '', useFee: '' }));

  assert.equal(unknownFee.isAccessibleForFree, undefined);
  assert.equal(unknownFee.offers, undefined);
});

test('단일 명시 요금만 Event Offer 가격으로 노출한다', () => {
  const singlePrice = createCultureEventStructuredData(culture({ isFree: '유료', useFee: '10,000원' }));
  const multiplePrices = createCultureEventStructuredData(
    culture({ isFree: '유료', useFee: '성인 10,000원, 청소년 5,000원' })
  );

  assert.equal(singlePrice.offers?.price, 10000);
  assert.equal(multiplePrices.offers, undefined);
});

test('유효한 문화 ID만 SEO 상세 조회에 사용한다', () => {
  assert.equal(parseCultureId('101'), 101);
  assert.equal(parseCultureId('0'), null);
  assert.equal(parseCultureId('-1'), null);
  assert.equal(parseCultureId('101abc'), null);
});

test('read model이 없을 때 상세 lookup은 실제 404 대신 일시적 unavailable을 반환한다', async () => {
  const lookup = await resolveFormattedCultureDetailLookupById(101, {
    cache: {
      get: async () => null,
      put: async () => undefined,
    },
  });

  assert.deepEqual(lookup, { status: 'unavailable' });
});

test('read model에서 빠진 ID는 unavailable이 아닌 실제 not found로 구분한다', async () => {
  const lookup = await resolveFormattedCultureDetailLookupById(101, {
    cache: {
      get: async key =>
        key === 'cultures:read-model:v1'
          ? {
              cachedAt: '2099-09-10T00:10:00.000Z',
              items: [
                {
                  id: 202,
                  classification: '축제',
                  endDate: '2099-09-12T00:00:00.000Z',
                  guName: '서울 중구',
                  isFree: '무료',
                  lat: 37.56,
                  lng: 126.98,
                  mainImage: '/event.jpg',
                  place: '서울광장',
                  startDate: '2099-09-10T00:00:00.000Z',
                  title: '공개 행사',
                  useFee: '무료',
                },
              ],
              revisions: { '202': 'revision-202' },
            }
          : null,
      put: async () => undefined,
    },
  });

  assert.deepEqual(lookup, { status: 'not-found' });
});

test('일시적 상세 부재 metadata는 검색에서 제외하고 원래 URL을 유지한다', () => {
  const metadata = createUnavailableCultureMetadata(101);
  const title =
    metadata.title && typeof metadata.title === 'object' && 'absolute' in metadata.title
      ? metadata.title.absolute
      : metadata.title;

  assert.equal(metadata.alternates?.canonical, getCultureCanonicalUrl(101));
  assert.equal(
    metadata.robots && typeof metadata.robots === 'object' && 'index' in metadata.robots
      ? metadata.robots.index
      : undefined,
    false
  );
  assert.match(String(title), /일시적으로 불러올 수 없습니다/);
});

test('두 상세 경로는 unavailable은 재시도 경계로, 실제 미존재만 404로 보낸다', async () => {
  const routeFiles = [
    '../src/app/cultures/[id]/page.tsx',
    '../src/app/map/[id]/page.tsx',
    '../src/app/cultures/[id]/error.tsx',
    '../src/app/map/[id]/error.tsx',
    '../src/components/CultureDetail/CultureDetailError.tsx',
  ];
  const sources = await Promise.all(
    routeFiles.map(path => readFile(fileURLToPath(new URL(path, import.meta.url)), 'utf8'))
  );

  for (const source of sources.slice(0, 2)) {
    assert.ok(source.includes("lookup.status === 'unavailable'"));
    assert.ok(source.includes("throw new Error('Culture detail is temporarily unavailable')"));
    assert.ok(source.includes("lookup.status === 'not-found'"));
    assert.ok(source.includes('notFound()'));
    assert.ok(source.includes('createUnavailableCultureMetadata'));
  }
  assert.ok(sources[2].includes('CultureDetailError'));
  assert.ok(sources[3].includes('CultureDetailError'));
  assert.ok(sources[4].includes("ariaLabel='다시 시도'"));
  assert.ok(sources[4].includes('role=\'alert\''));
});

test('상세 콘텐츠와 오류 fallback은 레이아웃의 main 랜드마크를 중첩하지 않는다', async () => {
  const [view, errorFallback] = await Promise.all([
    readFile(fileURLToPath(new URL('../src/components/CultureDetail/CultureDetailView.tsx', import.meta.url)), 'utf8'),
    readFile(fileURLToPath(new URL('../src/components/CultureDetail/CultureDetailError.tsx', import.meta.url)), 'utf8'),
  ]);

  assert.doesNotMatch(view, /<\/?main\b/);
  assert.doesNotMatch(errorFallback, /<\/?main\b/);
});
