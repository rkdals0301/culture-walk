import { writeCultureSyncHealthMetadataCache, type CultureCacheBinding } from '@/cache/kv';
import { getPublicHealthReport } from '@/server/publicHealth';
import { shouldRunScheduledSync } from '@/services/cultureSyncSchedule';

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const createCache = (seed: Record<string, unknown> = {}) => {
  const store = new Map(Object.entries(seed));
  const cache: CultureCacheBinding = {
    get: async key => store.get(key) ?? null,
    put: async (key, value) => {
      store.set(key, JSON.parse(value));
    },
  };

  return { cache, store };
};

const snapshot = {
  cachedAt: '2026-09-30T11:00:00.000Z',
  items: [
    {
      id: 101,
      classification: '축제',
      endDate: '2099-09-12T00:00:00.000Z',
      guName: '서울 중구',
      isFree: '무료',
      lat: 37.56,
      lng: 126.98,
      mainImage: 'https://example.com/event.jpg',
      place: '서울광장',
      startDate: '2099-09-10T00:00:00.000Z',
      title: '현재 공개 행사',
      useFee: '무료',
    },
  ],
  revisions: { '101': 'revision-101' },
};

test('health는 metadata가 남아도 실제 read model KV가 없으면 사용 불가로 응답한다', async () => {
  const { cache } = createCache({
    'cultures:read-model-meta:v1': {
      cachedAt: snapshot.cachedAt,
      itemCount: 1,
      serializedBytes: 1024,
    },
  });

  const report = await getPublicHealthReport({ cache }, new Date('2026-09-30T12:00:00.000Z'));

  assert.equal(report.httpStatus, 503);
  assert.equal(report.body.status, 'unavailable');
  assert.equal(report.body.readModel.available, false);
});

test('read model 재게시 시각을 TourAPI 동기화 성공 시각으로 오인하지 않는다', async () => {
  const { cache } = createCache({
    'cultures:read-model:v1': snapshot,
    'cultures:read-model-meta:v1': {
      cachedAt: snapshot.cachedAt,
      itemCount: snapshot.items.length,
      serializedBytes: 1024,
    },
  });
  await writeCultureSyncHealthMetadataCache({ completedAt: '2026-09-27T12:00:00.000Z' }, cache);

  const report = await getPublicHealthReport({ cache }, new Date('2026-09-30T12:00:00.000Z'));
  const latestSync = report.body.latestSync;

  assert.equal(latestSync?.completedAt, '2026-09-27T12:00:00.000Z');
  assert.equal(latestSync?.ageHours, 72);
  assert.equal(report.body.status, 'degraded');
  assert.equal(report.body.reason, 'sync-stale');
  assert.equal(shouldRunScheduledSync(report.body), true);
});

test('성공한 TourAPI snapshot 처리 뒤에만 복구 cron용 sync freshness를 기록한다', async () => {
  const syncServicePath = fileURLToPath(new URL('../src/services/cultureSyncService.ts', import.meta.url));
  const source = await readFile(syncServicePath, 'utf8');
  const applyIndex = source.indexOf('await reconcileCulturesViaStaging(');
  const completedIndex = source.indexOf('await completeCultureSyncRun(');
  const healthWriteIndex = source.indexOf('writeCultureSyncHealthMetadataCache(');
  const returnIndex = source.indexOf('return result;', healthWriteIndex);

  assert.ok(applyIndex >= 0 && completedIndex > applyIndex);
  assert.ok(healthWriteIndex > completedIndex && returnIndex > healthWriteIndex);
  assert.match(source.slice(healthWriteIndex, returnIndex), /syncHealthPublished/);
});
