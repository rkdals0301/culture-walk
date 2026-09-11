import type { Culture } from '@/types/culture';
import { formatCultureData } from '@/utils/cultureUtils';
import { serializeJsonLd } from '@/utils/jsonLd';

import assert from 'node:assert/strict';
import test from 'node:test';

test('formatCultureData preserves detailed overview, images, and extra fields for detail view', () => {
  const sampleCulture: Culture = {
    id: 9999,
    classification: '전시/미술',
    themeClassification: '미술',
    title: '트렌디 현대미술전',
    date: '2026-09-10 ~ 2026-10-15',
    startDate: new Date('2026-09-10T00:00:00Z'),
    endDate: new Date('2026-10-15T00:00:00Z'),
    register: '관리자',
    guName: '종로구',
    place: '국립현대미술관 서울관',
    address: '서울특별시 종로구 삼청로 30',
    isFree: '무료',
    useFee: '전시 무료 관람',
    useTarget: '전연령 관람 가능',
    organizationName: '국립현대미술관',
    mainImage: 'https://example.com/poster.jpg',
    homepageAddress: 'https://example.com',
    homepageDetailAddress: 'https://example.com/booking',
    lat: 37.5786,
    lng: 126.9806,
    etcDescription: '',
    performerInformation: '',
    registrationDate: '2026-09-10',
    overview: '현대미술의 정수를 보여주는 특별 기획전입니다.',
    eventTime: '10:00 - 18:00',
    duration: '2시간',
    programIntroduction: '1부: 동시대 설치미술\n2부: 미디어 아트',
    placeInformation: '경복궁 맞은편',
    bookingPlace: '현장 선착순 및 온라인 사전예약',
    contact: '02-3701-9500',
    festivalGrade: '',
    discountInformation: '',
    additionalInformation: [
      { name: '주차안내', text: '지하주차장 이용 가능' },
      { name: '관람시간', text: '10:00 - 18:00' },
    ],
    additionalImages: [
      { url: 'https://example.com/img1.jpg', thumbnailUrl: 'https://example.com/thumb1.jpg', name: '전시장 전경 1' },
      { url: 'https://example.com/img2.jpg', thumbnailUrl: 'https://example.com/thumb2.jpg', name: '전시장 전경 2' },
    ],
  };

  const [formatted] = formatCultureData([sampleCulture]);

  assert.equal(formatted.id, 9999);
  assert.equal(formatted.title, '트렌디 현대미술전');
  assert.equal(formatted.displayPrice, '무료');
  assert.equal(formatted.displayDate, '2026-09-10 ~ 2026-10-15');
  assert.equal(formatted.overview, '현대미술의 정수를 보여주는 특별 기획전입니다.');
  assert.equal(formatted.programIntroduction, '1부: 동시대 설치미술\n2부: 미디어 아트');
  assert.equal(formatted.contact, '02-3701-9500');
  assert.equal(formatted.additionalInformation?.length, 2);
  assert.equal(formatted.additionalImages?.length, 2);
});

test('Event JSON-LD schema serialization escapes unsafe characters correctly', () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: '공연 <script>alert("hack")</script> & 전시',
    location: {
      '@type': 'Place',
      name: '예술의전당',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  };

  const serialized = serializeJsonLd(jsonLd);

  assert.doesNotMatch(serialized, /<script>/i);
  assert.match(serialized, /\\u003cscript\\u003e/);
  assert.match(serialized, /\\u0026/);

  const parsed = JSON.parse(serialized);
  assert.equal(parsed.name, '공연 <script>alert("hack")</script> & 전시');
  assert.equal(parsed.offers.price, '0');
});
