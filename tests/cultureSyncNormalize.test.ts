import { NewCultureRow } from '@/db/schema';
import { createTourApiSourceKey } from '@/services/cultureIdentity';
import { mapTourApiFestivalToCulture } from '@/services/cultureService';
import { deduplicateCultureRows, normalizeAndValidateCultureRows } from '@/services/cultureSyncNormalize';
import { STAGING_COLUMNS, toStagingValues } from '@/services/cultureSyncTypes';

import assert from 'node:assert/strict';
import test from 'node:test';

const createRow = (overrides: Partial<NewCultureRow> = {}): NewCultureRow => ({
  sourceKey: 'tourapi:2786391',
  title: '서울 문화 행사',
  startDate: '2026-07-10T00:00:00.000Z',
  endDate: '2026-07-11T00:00:00.000Z',
  place: '서울광장',
  guName: '중구',
  organizationName: '서울시청',
  lat: 126.978,
  lng: 37.5665,
  registrationDate: '2026-07-01',
  ...overrides,
});

test('TourAPI source key uses the stable content id', () => {
  assert.equal(createTourApiSourceKey(' 2786391 '), 'tourapi:2786391');
  assert.throws(() => createTourApiSourceKey('invalid-id'));
});

test('normalization rejects missing or legacy source keys', () => {
  const rows = Array.from({ length: 5 }, (_, index) =>
    createRow({ sourceKey: `tourapi:${index + 1}` })
  );

  assert.throws(
    () =>
      normalizeAndValidateCultureRows(
        [...rows, createRow({ sourceKey: 'culture:legacy' })],
        new Date('2026-07-10T00:00:00.000Z')
      ),
    /유효하지 않은 TourAPI source key/
  );
});

test('TourAPI festival fields map to the culture schema', () => {
  const row = mapTourApiFestivalToCulture({
    contentid: '2786391',
    contenttypeid: '15',
    title: '광안리 드론 공연',
    addr1: '부산광역시 수영구 광안해변로 219',
    eventstartdate: '20260710',
    eventenddate: '20261231',
    firstimage: 'http://tong.visitkorea.or.kr/example.jpg',
    mapx: '129.1186',
    mapy: '35.1532',
    modifiedtime: '20260701120000',
    intro: {
      eventplace: '광안리 해변 일원',
      sponsor1: '부산광역시 수영구',
      usetimefestival: '무료',
    },
  });

  assert.equal(row.sourceKey, 'tourapi:2786391');
  assert.equal(row.guName, '부산 수영구');
  assert.equal(row.classification, '공연');
  assert.equal(row.place, '광안리 해변 일원');
  assert.equal(row.isFree, '무료');
  assert.equal(row.mainImage, 'https://tong.visitkorea.or.kr/example.jpg');
  assert.equal(row.lat, 35.1532);
  assert.equal(row.lng, 129.1186);
  assert.equal(row.startDate, '2026-07-10T00:00:00.000Z');
  assert.equal(row.endDate, '2026-12-31T00:00:00.000Z');
});

test('normalization swaps coordinates and preserves an official source key', () => {
  const rows = Array.from({ length: 5 }, (_, index) => createRow({ title: `서울 문화 행사 ${index}` }));
  rows[0].sourceKey = 'tourapi:1';
  const result = normalizeAndValidateCultureRows(rows, new Date('2026-07-10T00:00:00.000Z'));

  assert.equal(result.rows.length, 5);
  assert.equal(result.swappedCoordinateCount, 5);
  assert.equal(result.rows[0]?.lat, 37.5665);
  assert.equal(result.rows[0]?.lng, 126.978);
  assert.equal(result.rows[0]?.sourceKey, 'tourapi:1');
});

test('normalization excludes implausible dates and missing required fields', () => {
  const validRows = Array.from({ length: 5 }, (_, index) => createRow({ title: `정상 행사 ${index}` }));
  const result = normalizeAndValidateCultureRows(
    [...validRows, createRow({ endDate: '2626-08-08T00:00:00.000Z' }), createRow({ title: null })],
    new Date('2026-07-10T00:00:00.000Z')
  );

  assert.equal(result.rows.length, 5);
  assert.equal(result.invalidDateCount, 1);
  assert.equal(result.missingRequiredFieldCount, 1);
});

test('deduplication keeps the most recently registered event', () => {
  const older = createRow({ registrationDate: '2026-06-01' });
  const newer = createRow({ sourceKey: older.sourceKey, registrationDate: '2026-07-01', useFee: '무료' });

  const result = deduplicateCultureRows([older, newer]);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.useFee, '무료');
});

test('staging values stay aligned with staging columns', () => {
  const row = createRow({ sourceKey: 'tourapi:123', title: '컬럼 정렬 테스트' });
  const values = toStagingValues(row);

  assert.equal(values.length, STAGING_COLUMNS.length);
  assert.equal(values[STAGING_COLUMNS.indexOf('source_key')], 'tourapi:123');
  assert.equal(values[STAGING_COLUMNS.indexOf('title')], '컬럼 정렬 테스트');
});
