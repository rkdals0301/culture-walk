import {
  classifyTourApiFee,
  createTourApiDetailSummary,
  extractTourApiUrl,
  normalizeTourApiDetails,
  normalizeTourApiText,
} from '@/services/tourApiDetails';
import { TourApiFestivalDetails } from '@/types/culture';

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
  assert.equal(extractTourApiUrl('<a href="https://example.com/path?a=1&amp;b=2">링크</a>'), 'https://example.com/path?a=1&b=2');
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

test('detail summary stores searchable fee and link fields on the culture row', () => {
  const summary = createTourApiDetailSummary(details);

  assert.equal(summary.isFree, '부분 무료');
  assert.equal(summary.homepageAddress, 'https://festival.example.com/home');
  assert.equal(summary.homepageDetailAddress, 'https://ticket.example.com/reserve');
  assert.equal(summary.performerInformation, '매일 19:00');
  assert.equal(summary.useTarget, '전체 관람가');
});
