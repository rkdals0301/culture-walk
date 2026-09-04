import type { CultureListItem } from '@/types/culture';
import { createCultureDetailSignature, formatCultureData } from '@/utils/cultureUtils';

import assert from 'node:assert/strict';
import test from 'node:test';

test('unknown list prices use a clear verification label', () => {
  const [culture] = formatCultureData([
    {
      id: 1,
      classification: '축제',
      endDate: new Date('2026-08-02T00:00:00.000Z'),
      guName: '서울 중구',
      isFree: '정보 없음',
      lat: 37.5665,
      lng: 126.978,
      mainImage: '',
      place: '서울광장',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      title: '문화행사',
      useFee: '요금 정보 확인 필요',
    },
  ]);

  assert.equal(culture?.displayPrice, '요금 정보 확인');
});

test('missing display fields do not create separator-only place text', () => {
  const [culture] = formatCultureData([
    {
      id: 2,
      classification: '',
      endDate: new Date('2026-08-02T00:00:00.000Z'),
      guName: '',
      isFree: '',
      lat: 37.5665,
      lng: 126.978,
      mainImage: '',
      place: '',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      title: '정보가 일부 없는 행사',
      useFee: '',
    } as CultureListItem,
  ]);

  assert.equal(culture?.displayPlace, '');
  assert.equal(culture?.displayPrice, '정보 없음');
});

test('detail signature changes when asynchronous enrichment arrives', () => {
  const baseCulture = {
    id: 3,
    title: '상세 정보가 늦게 도착하는 행사',
    mainImage: 'https://example.com/event.jpg',
  };

  assert.notEqual(
    createCultureDetailSignature(baseCulture),
    createCultureDetailSignature({
      ...baseCulture,
      programIntroduction: '메인 프로그램 안내',
      organizationName: '문화재단',
    })
  );
});
