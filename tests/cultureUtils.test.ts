import { formatCultureData } from '@/utils/cultureUtils';

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
