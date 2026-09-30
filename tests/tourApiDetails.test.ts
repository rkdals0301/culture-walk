import {
  classifyTourApiFee,
  createTourApiDetailSummary,
  extractTourApiUrl,
  normalizeTourApiDetails,
  normalizeTourApiText,
  parseStoredTourApiDetails,
} from '@/services/tourApiDetails';
import type { CultureTourApiDetailsRow } from '@/db/schema';
import type { TourApiFestivalDetails } from '@/types/culture';

import assert from 'node:assert/strict';
import test from 'node:test';

const details: TourApiFestivalDetails = {
  common: {
    overview: '<p>대표 행사<br>상세 소개</p>',
    homepage: '<a href="https://festival.example.com/home">홈페이지</a>',
    telname: '안내처',
    tel: '02-1234-5678',
  },
  intro: {
    agelimit: '전체 관람가',
    bookingplace: '온라인 예매 https://ticket.example.com/reserve',
    discountinfofestival: '지역 주민 20% 할인',
    eventplace: '문화광장',
    placeinfo: '지하철 1번 출구',
    playtime: '매일 19:00',
    program: '개막 공연',
    spendtimefestival: '약 90분',
    sponsor1: '문화재단',
    sponsor1tel: '02-1111-2222',
    subevent: '체험 행사',
    usetimefestival: '성인 10,000원, 어린이 무료',
  },
  info: [{ infoname: '준비물', infotext: '편한 신발' }],
  images: [
    {
      imgname: '행사 전경',
      originimgurl: 'http://tong.visitkorea.or.kr/image.jpg',
      smallimageurl: 'http://tong.visitkorea.or.kr/thumb.jpg',
    },
  ],
  complete: true,
};

test('TourAPI HTML text and links are normalized safely', () => {
  assert.equal(normalizeTourApiText('<p>첫 줄<br>둘째 줄</p>'), '첫 줄\n둘째 줄');
  assert.equal(
    extractTourApiUrl('<a href="https://example.com/path?a=1&amp;b=2">링크</a>'),
    'https://example.com/path?a=1&b=2'
  );
});

test('TourAPI detail fields retain their original meaning', () => {
  const normalized = normalizeTourApiDetails(details);

  assert.equal(normalized.overview, '대표 행사\n상세 소개');
  assert.equal(normalized.eventTime, '매일 19:00');
  assert.equal(normalized.duration, '약 90분');
  assert.equal(normalized.bookingUrl, 'https://ticket.example.com/reserve');
  assert.equal(normalized.discountInformation, '지역 주민 20% 할인');
  assert.equal(normalized.eventHomepage, 'https://festival.example.com/home');
  assert.equal(normalized.additionalInformation[0]?.name, '준비물');
  assert.equal(normalized.additionalImages[0]?.url, 'https://tong.visitkorea.or.kr/image.jpg');
  assert.equal(classifyTourApiFee(normalized.useFee), '부분 무료');
});

test('fee classification distinguishes free admission, mixed prices, and paid admission', () => {
  assert.equal(classifyTourApiFee('입장료 무료'), '무료');
  assert.equal(classifyTourApiFee('성인 5,000원, 어린이 무료'), '부분 무료');
  assert.equal(classifyTourApiFee('입장료 5,000원'), '유료');
  assert.equal(classifyTourApiFee('입장료 확인 필요'), '요금 확인');
});

test('detail summary stores searchable fee and link fields on the culture row', () => {
  const summary = createTourApiDetailSummary(details);

  assert.equal(summary.isFree, '부분 무료');
  assert.equal(summary.homepageAddress, 'https://festival.example.com/home');
  assert.equal(summary.homepageDetailAddress, 'https://ticket.example.com/reserve');
  assert.equal(summary.performerInformation, '매일 19:00');
  assert.equal(summary.useTarget, '전체 관람가');
});

test('organization names remove repeated sponsor entries while preserving co-organizers', () => {
  const normalized = normalizeTourApiDetails({
    common: {},
    intro: {
      sponsor1: '부산광역시',
      sponsor2: '부산광역시, 부산광역시생활체육문화센터',
    },
    info: [],
    images: [],
    complete: true,
  });

  assert.equal(normalized.organizationName, '부산광역시 · 부산광역시생활체육문화센터');
});

test('stored TourAPI JSON with invalid shapes degrades to safe detail defaults', () => {
  const row: CultureTourApiDetailsRow = {
    sourceKey: 'tourapi:101',
    sourceModifiedAt: null,
    commonJson: JSON.stringify({ overview: 42, tel: '02-1234-5678' }),
    introJson: JSON.stringify({ eventplace: '문화광장', program: 42 }),
    infoJson: JSON.stringify({ infoname: '배열이어야 하는 값' }),
    imagesJson: JSON.stringify([null, 42, { imgname: '포스터', originimgurl: 42 }]),
    isComplete: true,
    syncedAt: '2026-09-30T00:00:00.000Z',
  };

  const parsed = parseStoredTourApiDetails(row);

  assert.deepEqual(parsed.common, { tel: '02-1234-5678' });
  assert.deepEqual(parsed.intro, { eventplace: '문화광장' });
  assert.deepEqual(parsed.info, []);
  assert.deepEqual(parsed.images, [{ imgname: '포스터' }]);
  assert.doesNotThrow(() => normalizeTourApiDetails(parsed));
});
