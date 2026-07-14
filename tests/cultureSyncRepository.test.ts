import { NewCultureRow } from '@/db/schema';
import { createCultureContentDifferenceSql, reconcileCulturesViaStaging } from '@/services/cultureSyncRepository';
import { D1Binding, D1Statement } from '@/services/cultureSyncTypes';

import assert from 'node:assert/strict';
import test from 'node:test';

const createRows = (): NewCultureRow[] =>
  Array.from({ length: 5 }, (_, index) => ({
    sourceKey: `culture:${index}`,
    title: `문화 행사 ${index}`,
    startDate: '2026-07-13T00:00:00.000Z',
    endDate: '2026-07-14T00:00:00.000Z',
    place: '서울광장',
    guName: '중구',
    organizationName: '서울시청',
    lat: 37.5665,
    lng: 126.978,
  }));

test('content comparison is null-safe and excludes the source key', () => {
  const sql = createCultureContentDifferenceSql('existing', 'incoming');

  assert.match(sql, /existing\.title IS NOT incoming\.title/);
  assert.match(sql, /existing\.lat IS NOT incoming\.lat/);
  assert.doesNotMatch(sql, /source_key/);
  assert.doesNotMatch(sql, /!=|<>/);
});

test('snapshot updates only changed or inactive rows and reports actual changes', async () => {
  const preparedQueries: string[] = [];
  let appliedQueries: string[] = [];
  const batchSizes: number[] = [];

  const createStatement = (query: string): D1Statement => ({
    bind: () => createStatement(query),
    run: async () => ({}),
    all: async () => ({
      results: query.includes('AS staged')
        ? [
            {
              staged: 5,
              current_active: 5,
              matched: 4,
              updated: 1,
              reactivated: 1,
              deactivated: 1,
            },
          ]
        : [],
    }),
  });

  const d1: D1Binding = {
    prepare: query => {
      preparedQueries.push(query);
      return createStatement(query);
    },
    batch: async statements => {
      batchSizes.push(statements.length);
      appliedQueries = preparedQueries.slice(-statements.length);
      return statements.map(() => ({}));
    },
  };

  const stats = await reconcileCulturesViaStaging(d1, createRows(), 'test-run');
  const updateQuery = appliedQueries.find(query => query.includes('UPDATE cultures AS live')) ?? '';
  const deactivateQuery = appliedQueries.find(query => query.includes('SET is_active = 0,')) ?? '';
  const insertQuery = appliedQueries.find(query => query.includes('INSERT INTO cultures')) ?? '';

  assert.deepEqual(stats, {
    inserted: 1,
    updated: 1,
    reactivated: 1,
    deactivated: 1,
    staged: 5,
    skipped: 0,
  });
  assert.match(updateQuery, /live\.is_active = 0/);
  assert.match(updateQuery, /live\.title IS NOT staging\.title/);
  assert.match(updateQuery, /AND \(\s*live\.is_active = 0\s*OR EXISTS/);
  assert.match(updateQuery, /staging\.sync_run_key = \?1/);
  assert.match(insertQuery, /staging\.sync_run_key = \?1/);
  assert.match(deactivateQuery, /deactivated_at = CURRENT_TIMESTAMP/);
  assert.match(deactivateQuery, /staging\.sync_run_key = \?1/);
  assert.doesNotMatch(deactivateQuery, /COALESCE/);
  assert.deepEqual(batchSizes, [1, 4]);
});
