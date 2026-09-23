import assert from 'node:assert/strict';
import test from 'node:test';

import type { NewCultureRow } from '@/db/schema';
import { buildCultureSnapshotQualityReport } from '@/services/cultureDataQuality';

const row = (overrides: Partial<NewCultureRow> = {}): NewCultureRow => ({
  sourceKey: 'tourapi:100',
  title: '문화 행사',
  startDate: '2026-09-01T00:00:00.000Z',
  endDate: '2026-09-30T00:00:00.000Z',
  lat: 37.5,
  lng: 127,
  mainImage: 'https://example.com/poster.jpg',
  place: '서울광장',
  isFree: '유료',
  useFee: '10,000원',
  ...overrides,
});

test('snapshot quality report summarizes missing content and normalization failures without extra IO', () => {
  const normalizedRows = [
    row({ sourceKey: 'tourapi:100' }),
    row({
      sourceKey: 'tourapi:101',
      mainImage: null,
      place: null,
      isFree: '정보 없음',
      useFee: '요금 정보 확인 필요',
    }),
    row({ sourceKey: 'tourapi:101', registrationDate: '2026-09-02T00:00:00.000Z' }),
  ];
  const deduplicatedRows = [normalizedRows[0], normalizedRows[1]];

  const report = buildCultureSnapshotQualityReport({
    fetchedCount: 5,
    normalizedRows,
    deduplicatedRows,
    invalidCoordinateCount: 1,
    invalidDateCount: 1,
    missingRequiredFieldCount: 0,
  });

  assert.equal(report.fetchedCount, 5);
  assert.equal(report.normalizedCount, 3);
  assert.equal(report.publishedCandidateCount, 2);
  assert.equal(report.duplicateCount, 1);
  assert.equal(report.missingImageCount, 1);
  assert.equal(report.missingImageRatio, 0.5);
  assert.equal(report.missingPlaceCount, 1);
  assert.equal(report.unknownFeeCount, 1);
  assert.ok(report.warnings.includes('missing-image-ratio-high'));
  assert.ok(report.warnings.includes('invalid-coordinates-present'));
  assert.ok(report.warnings.includes('invalid-dates-present'));
  assert.ok(report.warnings.includes('duplicates-present'));
});

test('snapshot quality report stays quiet for complete source data', () => {
  const rows = [row({ sourceKey: 'tourapi:200' }), row({ sourceKey: 'tourapi:201' })];
  const report = buildCultureSnapshotQualityReport({
    fetchedCount: 2,
    normalizedRows: rows,
    deduplicatedRows: rows,
    invalidCoordinateCount: 0,
    invalidDateCount: 0,
    missingRequiredFieldCount: 0,
  });

  assert.deepEqual(report.warnings, []);
  assert.equal(report.missingImageRatio, 0);
  assert.equal(report.missingPlaceRatio, 0);
  assert.equal(report.unknownFeeRatio, 0);
});
