import { NewCultureRow } from '@/db/schema';
import { createCultureContentDifferenceSql, reconcileCulturesViaStaging } from '@/services/cultureSyncRepository';
import { D1Binding, D1Statement } from '@/services/cultureSyncTypes';

import assert from 'node:assert/strict';
import test from 'node:test';

const createRows = (count = 5): NewCultureRow[] =>
  Array.from({ length: count }, (_, index) => ({
    sourceKey: `tourapi:${index}`,
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
  assert.doesNotMatch(sql, /is_free|use_fee|homepage_address|program_introduction/);
  assert.doesNotMatch(sql, /!=|<>/);
});

test('snapshot updates only changed or inactive rows and reports actual changes', async () => {
  const preparedQueries: string[] = [];
  let appliedQueries: string[] = [];
  const batchSizes: number[] = [];
  const lifecycleEvents: string[] = [];

  const createStatement = (query: string): D1Statement => ({
    bind: () => createStatement(query),
    run: async () => ({}),
    all: async () => ({
      results: query.includes('AS staged')
        ? [
            {
              staged: 5,
              current_source_active: 5,
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
      lifecycleEvents.push('batch');
      batchSizes.push(statements.length);
      appliedQueries = preparedQueries.slice(-statements.length);
      return statements.map(() => ({}));
    },
  };

  const stats = await reconcileCulturesViaStaging(d1, createRows(), 'test-run', {
    beforeEach: async () => {
      lifecycleEvents.push('beforeEach');
      return true;
    },
    beforeApply: async () => {
      lifecycleEvents.push('beforeApply');
    },
  });
  const updateQuery = appliedQueries.find(query => query.includes('UPDATE cultures AS live')) ?? '';
  const deactivateQuery = appliedQueries.find(query => query.includes('SET missing_snapshot_count = missing_snapshot_count + 1,')) ?? '';
  const legacyDeactivateQuery = appliedQueries.find(
    query => query.includes('UPDATE cultures') && query.includes('SET is_active = 0,')
  ) ?? '';
  const legacyRemoveQuery = appliedQueries.find(
    query => query.includes('DELETE FROM cultures') && query.includes('source_key NOT LIKE')
  ) ?? '';
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
  assert.match(updateQuery, /AND \(\s*live\.is_active = 0\s*OR live\.missing_snapshot_count <> 0\s*OR EXISTS/);
  assert.match(updateQuery, /staging\.sync_run_key = \?1/);
  assert.match(insertQuery, /staging\.sync_run_key = \?1/);
  assert.match(deactivateQuery, /is_active = CASE WHEN missing_snapshot_count \+ 1 >= 2 THEN 0 ELSE 1 END/);
  assert.match(deactivateQuery, /deactivated_at = CASE WHEN missing_snapshot_count \+ 1 >= 2 THEN CURRENT_TIMESTAMP/);
  assert.match(deactivateQuery, /staging\.sync_run_key = \?1/);
  assert.doesNotMatch(deactivateQuery, /COALESCE/);
  assert.match(legacyDeactivateQuery, /deactivated_at = CURRENT_TIMESTAMP/);
  assert.match(legacyDeactivateQuery, /source_key IS NULL OR source_key NOT LIKE 'tourapi:%'/);
  assert.match(legacyRemoveQuery, /WHERE is_active = 0/);
  assert.match(legacyRemoveQuery, /source_key IS NULL OR source_key NOT LIKE 'tourapi:%'/);
  assert.ok(appliedQueries.indexOf(legacyDeactivateQuery) < appliedQueries.indexOf(legacyRemoveQuery));
  assert.deepEqual(batchSizes, [1, 6]);
  assert.deepEqual(lifecycleEvents, ['beforeEach', 'batch', 'beforeApply', 'batch']);
  assert.ok(appliedQueries.some(query => query.includes("source_key NOT LIKE 'tourapi:%'")));
});

test('already-ended active events do not block a smaller valid seasonal snapshot', async () => {
  const preparedQueries: string[] = [];
  let applied = false;
  let currentActiveDateBound: unknown;

  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, [...values, ...nextValues]),
    run: async () => ({}),
    all: async () => {
      if (query.includes('AS current_source_active')) {
        currentActiveDateBound = values[1];
        return {
          results: [
            {
              staged: 8,
              current_source_active: 10,
              matched: 0,
              updated: 0,
              reactivated: 0,
              deactivated: 0,
            },
          ],
        };
      }
      return { results: [] };
    },
  });
  const d1: D1Binding = {
    prepare: query => {
      preparedQueries.push(query);
      return createStatement(query);
    },
    batch: async statements => {
      if (statements.length === 6) applied = true;
      return statements.map(() => ({}));
    },
  };

  const result = await reconcileCulturesViaStaging(d1, createRows(8), 'seasonal-run');
  const statsQuery = preparedQueries.find(query => query.includes('AS current_source_active')) ?? '';
  const baselineQuery = statsQuery.split('AS current_source_active')[0] ?? '';

  assert.match(baselineQuery, /end_date\s*>=\s*\?/);
  assert.equal(typeof currentActiveDateBound, 'string');
  assert.equal(result.staged, 8);
  assert.equal(applied, true);
});

test('snapshot 보호는 현재 유효 행사의 실제 급감을 계속 차단한다', async () => {
  let applyReached = false;
  const createStatement = (query: string): D1Statement => ({
    bind: () => createStatement(query),
    run: async () => ({}),
    all: async () => ({
      results: query.includes('AS current_source_active')
        ? [{ staged: 6, current_source_active: 10, matched: 0, updated: 0, reactivated: 0, deactivated: 0 }]
        : [],
    }),
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => {
      if (statements.length === 6) applyReached = true;
      return statements.map(() => ({}));
    },
  };

  await assert.rejects(
    reconcileCulturesViaStaging(d1, createRows(6), 'truncated-run'),
    /스냅샷 건수가 기존 활성 데이터 대비 급감했습니다/
  );
  assert.equal(applyReached, false);
});
