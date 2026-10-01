import type { CultureCacheBinding } from '@/server/runtimeTypes';
import { runCultureScheduledEvent } from '@/server/cultureScheduledJobs';
import { queryCultureListFromD1 } from '@/services/cultureListRepository';
import { DETAIL_REFRESH_CRON, SYNC_CRON } from '@/services/cultureSyncSchedule';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

import { createSqliteD1, sqliteTestOptions } from './helpers/sqliteD1';

import assert from 'node:assert/strict';
import test from 'node:test';

const event = { cron: SYNC_CRON, scheduledTime: Date.now() };

const createFixture = async (options: {
  staleSource?: boolean; staleContent?: boolean; failedWrites?: boolean; sourceAgeHours?: number; completeDetails?: boolean;
} = {}) => {
  const fixture = await createSqliteD1();
  const now = Date.now();
  const completedAt = new Date(now - (options.sourceAgeHours ?? (options.staleSource ? 48 : 0.5)) * 3_600_000).toISOString();
  const startedAt = new Date(Date.parse(completedAt) - 60_000).toISOString();
  const endDate = new Date(now + 86_400_000).toISOString();
  fixture.database.prepare(`
    INSERT INTO cultures (id, source_key, title, classification, place, lat, lng, start_date, end_date, is_free, use_fee)
    VALUES (42, 'tourapi:42', '현재 행사', '축제', '서울광장', 37.56, 126.98, ?, ?, '무료', '무료')
  `).run(getKoreaDateStartIso(), endDate);
  fixture.database.prepare(`
    INSERT INTO culture_sync_runs (trigger, status, started_at, completed_at)
    VALUES ('cron', 'success', ?, ?)
  `).run(startedAt, completedAt);
  if (options.completeDetails) {
    fixture.database.exec("INSERT INTO culture_tour_api_details (source_key, is_complete) VALUES ('tourapi:42', 1)");
  }

  const expected = await queryCultureListFromD1(fixture.d1);
  const model = {
    cachedAt: new Date(now).toISOString(),
    items: expected.items.map(item => ({ ...item, title: options.staleContent ? '오래된 행사명' : item.title })),
    revisions: expected.revisions,
  };
  const values = new Map<string, unknown>([
    ['cultures:read-model:v1', JSON.parse(JSON.stringify(model))],
    ['cultures:sync-health:v1', { completedAt }],
  ]);
  const writes: string[] = [];
  const cache: CultureCacheBinding = {
    get: async key => values.get(key) ?? null,
    put: async (key, value) => {
      if (options.failedWrites) throw new Error('temporary KV publication failure');
      writes.push(key);
      values.set(key, JSON.parse(value));
    },
  };
  return { ...fixture, cache, values, writes, completedAt };
};

test('fresh public health cannot suppress synchronization when the D1 source run is stale', sqliteTestOptions, async () => {
  const fixture = await createFixture({ staleSource: true });
  const originalFetch = globalThis.fetch;
  let snapshotRequests = 0;
  globalThis.fetch = (async input => {
    const url = new URL(String(input));
    const snapshot = url.pathname.endsWith('/searchFestival2');
    if (snapshot) snapshotRequests += 1;
    const date = getKoreaDateStartIso().slice(0, 10).replaceAll('-', '');
    const items = snapshot
      ? Array.from({ length: 5 }, (_, index) => ({
          contentid: String(index + 1), title: `행사 ${index + 1}`, eventstartdate: date, eventenddate: date,
          mapx: '126.98', mapy: '37.56',
        }))
      : [{ contentid: url.searchParams.get('contentId') }];
    return Response.json({ response: {
      header: { resultCode: '0000' }, body: { items: { item: items }, totalCount: items.length },
    } });
  }) as typeof fetch;
  try {
    await runCultureScheduledEvent(event, { DB: fixture.d1, CULTURE_CACHE: fixture.cache, TOUR_API_KEY: 'test' }, {});
    assert.equal(snapshotRequests, 1);
    assert.equal(fixture.database.prepare('SELECT COUNT(*) AS count FROM culture_sync_runs').get()?.count, 2);
    assert.equal(fixture.database.prepare('SELECT status FROM culture_sync_runs ORDER BY id DESC LIMIT 1').get()?.status, 'success');
    assert.equal(fixture.database.prepare('SELECT COUNT(*) AS count FROM initialize_sync_locks').get()?.count, 0);
    // The existing hourly cron also repairs a later outage. No new cron or
    // additional source calls are needed during normal daily operation.
    fixture.database.exec("UPDATE culture_sync_runs SET completed_at = datetime('now', '-27 hours') WHERE id = 2");
    await runCultureScheduledEvent({ ...event, cron: DETAIL_REFRESH_CRON },
      { DB: fixture.d1, CULTURE_CACHE: fixture.cache, TOUR_API_KEY: 'test' }, {});
    assert.equal(snapshotRequests, 2);
    fixture.database.exec("UPDATE culture_sync_runs SET status = 'failed', completed_at = CURRENT_TIMESTAMP WHERE id = 3");
    await runCultureScheduledEvent({ ...event, cron: DETAIL_REFRESH_CRON },
      { DB: fixture.d1, CULTURE_CACHE: fixture.cache, TOUR_API_KEY: 'test' }, {});
    assert.equal(snapshotRequests, 3);
    assert.equal(fixture.database.prepare('SELECT status FROM culture_sync_runs ORDER BY id DESC LIMIT 1').get()?.status, 'success');
  } finally {
    globalThis.fetch = originalFetch;
    fixture.database.close();
  }
});

test('a fresh D1 sync repairs different public content even when the cache timestamp is fresh', sqliteTestOptions, async () => {
  const fixture = await createFixture({ staleContent: true });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error('Cache-only recovery must not call TourAPI'); }) as typeof fetch;
  const purges: string[][] = [];
  try {
    await runCultureScheduledEvent(event, { DB: fixture.d1, CULTURE_CACHE: fixture.cache, TOUR_API_KEY: 'test' }, {
      cache: { purge: async options => { purges.push(options.tags); return { success: true }; } },
    });
    const model = fixture.values.get('cultures:read-model:v1') as { items: Array<{ title: string }> };
    assert.equal(model.items[0].title, '현재 행사');
    assert.ok(fixture.writes.includes('cultures:read-model:v1'));
    assert.equal(fixture.database.prepare('SELECT COUNT(*) AS count FROM culture_sync_runs').get()?.count, 1);
    assert.equal(fixture.database.prepare('SELECT missing_snapshot_count FROM cultures').get()?.missing_snapshot_count, 0);
    assert.equal(purges.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    fixture.database.close();
  }
});

test('matching fresh public data needs no external calls or KV rewrites', sqliteTestOptions, async () => {
  const fixture = await createFixture();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error('Fresh synchronization must not call TourAPI'); }) as typeof fetch;
  try {
    await runCultureScheduledEvent(event, { DB: fixture.d1, CULTURE_CACHE: fixture.cache, TOUR_API_KEY: 'test' }, {});
    assert.deepEqual(fixture.writes, []);
    assert.equal(fixture.database.prepare('SELECT COUNT(*) AS count FROM culture_sync_runs').get()?.count, 1);
  } finally {
    globalThis.fetch = originalFetch;
    fixture.database.close();
  }
});

test('failed cache recovery stays visible and preserves D1 data and synchronization history', sqliteTestOptions, async () => {
  const fixture = await createFixture({ staleContent: true, failedWrites: true });
  try {
    await assert.rejects(() => runCultureScheduledEvent(event,
      { DB: fixture.d1, CULTURE_CACHE: fixture.cache, TOUR_API_KEY: 'test' }, {}), /read model/);
    assert.equal(fixture.database.prepare('SELECT COUNT(*) AS count FROM culture_sync_runs').get()?.count, 1);
    assert.equal(fixture.database.prepare('SELECT title, missing_snapshot_count FROM cultures').get()?.title, '현재 행사');
    assert.equal(fixture.database.prepare('SELECT missing_snapshot_count FROM cultures').get()?.missing_snapshot_count, 0);
    assert.equal(fixture.database.prepare('SELECT COUNT(*) AS count FROM initialize_sync_locks').get()?.count, 0);
  } finally {
    fixture.database.close();
  }
});

test('a busy synchronization lock protects cache recovery and source collection', sqliteTestOptions, async () => {
  const fixture = await createFixture({ staleContent: true });
  fixture.database.exec(`INSERT INTO initialize_sync_locks (name, owner_token, expires_at)
    VALUES ('initialize-sync-lock', 'another-owner', datetime('now', '+30 minutes'))`);
  try {
    await runCultureScheduledEvent(event, { DB: fixture.d1, CULTURE_CACHE: fixture.cache, TOUR_API_KEY: 'test' }, {});
    assert.deepEqual(fixture.writes, []);
    assert.equal(fixture.database.prepare('SELECT owner_token FROM initialize_sync_locks').get()?.owner_token, 'another-owner');
  } finally {
    fixture.database.close();
  }
});

test('healthy hourly maintenance keeps daily collection and avoids lock writes', sqliteTestOptions, async () => {
  const fixture = await createFixture({ sourceAgeHours: 6, completeDetails: true });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error('Hourly maintenance must not recollect a fresh daily source'); }) as typeof fetch;
  const changesBefore = fixture.database.prepare('SELECT total_changes() AS count').get()?.count;
  try {
    await runCultureScheduledEvent({ ...event, cron: DETAIL_REFRESH_CRON },
      { DB: fixture.d1, CULTURE_CACHE: fixture.cache, TOUR_API_KEY: 'test' }, {});
    assert.equal(fixture.database.prepare('SELECT total_changes() AS count').get()?.count, changesBefore);
    assert.deepEqual(fixture.writes, []);
  } finally {
    globalThis.fetch = originalFetch;
    fixture.database.close();
  }
});

test('hourly maintenance recovers cache-only failures without incrementing source-miss counters', sqliteTestOptions, async () => {
  const fixture = await createFixture({ sourceAgeHours: 6, staleContent: true, completeDetails: true });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error('Cache recovery must not recollect the source'); }) as typeof fetch;
  try {
    await runCultureScheduledEvent({ ...event, cron: DETAIL_REFRESH_CRON },
      { DB: fixture.d1, CULTURE_CACHE: fixture.cache, TOUR_API_KEY: 'test' }, {});
    const model = fixture.values.get('cultures:read-model:v1') as { items: Array<{ title: string }> };
    assert.equal(model.items[0].title, '현재 행사');
    assert.equal(fixture.database.prepare('SELECT COUNT(*) AS count FROM culture_sync_runs').get()?.count, 1);
    assert.equal(fixture.database.prepare('SELECT missing_snapshot_count FROM cultures').get()?.missing_snapshot_count, 0);
  } finally {
    globalThis.fetch = originalFetch;
    fixture.database.close();
  }
});

test('a missing public read model is rebuilt without recollecting a successful source', sqliteTestOptions, async () => {
  const fixture = await createFixture();
  fixture.values.delete('cultures:read-model:v1');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error('A KV miss must not recollect a successful source'); }) as typeof fetch;
  try {
    await runCultureScheduledEvent(event,
      { DB: fixture.d1, CULTURE_CACHE: fixture.cache, TOUR_API_KEY: 'test' }, {});
    assert.ok(fixture.values.has('cultures:read-model:v1'));
    assert.equal(fixture.database.prepare('SELECT COUNT(*) AS count FROM culture_sync_runs').get()?.count, 1);
    assert.equal(fixture.database.prepare('SELECT missing_snapshot_count FROM cultures').get()?.missing_snapshot_count, 0);
  } finally {
    globalThis.fetch = originalFetch;
    fixture.database.close();
  }
});
