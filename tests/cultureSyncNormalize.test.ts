import assert from 'node:assert/strict';
import test from 'node:test';

import { NewCultureRow } from '@/db/schema';
import { createCultureSourceKey } from '@/services/cultureIdentity';
import { deduplicateCultureRows, normalizeAndValidateCultureRows } from '@/services/cultureSyncNormalize';
import { STAGING_COLUMNS, toStagingValues } from '@/services/cultureSyncTypes';

const createRow = (overrides: Partial<NewCultureRow> = {}): NewCultureRow => ({
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

test('source key trims fields and stays deterministic', () => {
  const base = createRow();
  const padded = createRow({ title: `  ${base.title}  `, place: ` ${base.place} ` });

  assert.equal(createCultureSourceKey(base), createCultureSourceKey(padded));
});

test('normalization swaps Seoul coordinates and assigns a source key', () => {
  const rows = Array.from({ length: 5 }, (_, index) => createRow({ title: `서울 문화 행사 ${index}` }));
  const result = normalizeAndValidateCultureRows(rows, new Date('2026-07-10T00:00:00.000Z'));

  assert.equal(result.rows.length, 5);
  assert.equal(result.swappedCoordinateCount, 5);
  assert.equal(result.rows[0]?.lat, 37.5665);
  assert.equal(result.rows[0]?.lng, 126.978);
  assert.match(result.rows[0]?.sourceKey ?? '', /^culture:/);
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
  const older = createRow({ sourceKey: createCultureSourceKey(createRow()), registrationDate: '2026-06-01' });
  const newer = createRow({ sourceKey: older.sourceKey, registrationDate: '2026-07-01', useFee: '무료' });

  const result = deduplicateCultureRows([older, newer]);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.useFee, '무료');
});

test('staging values stay aligned with staging columns', () => {
  const row = createRow({ sourceKey: 'culture:test', title: '컬럼 정렬 테스트' });
  const values = toStagingValues(row);

  assert.equal(values.length, STAGING_COLUMNS.length);
  assert.equal(values[STAGING_COLUMNS.indexOf('source_key')], 'culture:test');
  assert.equal(values[STAGING_COLUMNS.indexOf('title')], '컬럼 정렬 테스트');
});
