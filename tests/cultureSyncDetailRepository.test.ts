import {
  hasStaleCachedTourApiDetails,
  readStaleCultureDetailRows,
  requestCultureDetailRefresh,
} from '@/services/cultureSyncDetailRepository';
import { refreshStaleCachedTourApiDetails } from '@/services/cultureSyncDetails';

import { createSqliteD1, sqliteTestOptions } from './helpers/sqliteD1';

import assert from 'node:assert/strict';
import test from 'node:test';

test('detail retry selection accepts elapsed ISO timestamps and blocks future retries', sqliteTestOptions, async () => {
  const { database, d1 } = await createSqliteD1();
  try {
    const now = Date.now();
    const insert = database.prepare('INSERT INTO cultures (source_key, detail_next_retry_at) VALUES (?, ?)');
    insert.run('tourapi:elapsed', new Date(now - 60_000).toISOString());
    insert.run('tourapi:future', new Date(now + 60_000).toISOString());
    insert.run('tourapi:sqlite-format', new Date(now - 60_000).toISOString().slice(0, 19).replace('T', ' '));

    assert.equal(await hasStaleCachedTourApiDetails(d1), true);
    const rows = await readStaleCultureDetailRows(d1);
    assert.deepEqual(rows.map(row => row.sourceKey).sort(), ['tourapi:elapsed', 'tourapi:sqlite-format']);

    database.exec("UPDATE cultures SET is_active = 0 WHERE source_key != 'tourapi:future'");
    assert.equal(await hasStaleCachedTourApiDetails(d1), false);
  } finally {
    database.close();
  }
});

test('detail refresh requests honor retry time and retain the existing request cooldown', sqliteTestOptions, async () => {
  const { database, d1 } = await createSqliteD1();
  try {
    const insert = database.prepare('INSERT INTO cultures (source_key, detail_next_retry_at) VALUES (?, ?)');
    insert.run('tourapi:elapsed', new Date(Date.now() - 60_000).toISOString());
    insert.run('tourapi:future', new Date(Date.now() + 60_000).toISOString());

    await requestCultureDetailRefresh(d1, 'tourapi:elapsed');
    await requestCultureDetailRefresh(d1, 'tourapi:future');
    const read = database.prepare('SELECT detail_refresh_priority, detail_refresh_requested_at FROM cultures WHERE source_key = ?');
    assert.equal(read.get('tourapi:elapsed')?.detail_refresh_priority, 1);
    assert.equal(read.get('tourapi:future')?.detail_refresh_priority, 0);

    database.exec("UPDATE cultures SET detail_refresh_priority = 0 WHERE source_key = 'tourapi:elapsed'");
    await requestCultureDetailRefresh(d1, 'tourapi:elapsed');
    assert.equal(read.get('tourapi:elapsed')?.detail_refresh_priority, 0);
  } finally {
    database.close();
  }
});

test('an empty mandatory upstream detail preserves the existing detail and fee in SQLite', sqliteTestOptions, async () => {
  const { database, d1 } = await createSqliteD1();
  const originalFetch = globalThis.fetch;
  database.exec(`
    INSERT INTO cultures (source_key, use_fee, detail_refresh_requested_at)
    VALUES ('tourapi:123', '기존 요금', CURRENT_TIMESTAMP);
    INSERT INTO culture_tour_api_details (source_key, common_json, is_complete)
    VALUES ('tourapi:123', '{"overview":"기존 상세 설명"}', 1);
  `);
  globalThis.fetch = (async input => {
    const empty = new URL(String(input)).pathname.endsWith('/detailCommon2');
    return Response.json({ response: {
      header: { resultCode: '0000' },
      body: { items: { item: empty ? [] : [{ contentid: '123' }] }, totalCount: empty ? 0 : 1 },
    } });
  }) as typeof fetch;
  try {
    const result = await refreshStaleCachedTourApiDetails(
      { baseUrl: 'https://tourapi.example', serviceKey: 'test' }, d1
    );
    assert.equal(result.refreshed, 0);
    assert.equal(database.prepare('SELECT use_fee FROM cultures').get()?.use_fee, '기존 요금');
    assert.equal(database.prepare('SELECT common_json FROM culture_tour_api_details').get()?.common_json, '{"overview":"기존 상세 설명"}');
    assert.equal(database.prepare('SELECT detail_sync_fail_count FROM cultures').get()?.detail_sync_fail_count, 1);
  } finally {
    globalThis.fetch = originalFetch;
    database.close();
  }
});
