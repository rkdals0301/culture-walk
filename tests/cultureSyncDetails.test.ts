import { refreshStaleCachedTourApiDetails } from '@/services/cultureSyncDetails';
import { D1Binding, D1Statement } from '@/services/cultureSyncTypes';

import assert from 'node:assert/strict';
import test from 'node:test';

const staleRow = {
  culture_id: 42,
  source_key: 'tourapi:123',
  registration_date: '2026-07-01T00:00:00.000Z',
  detail_sync_fail_count: 2,
};

test('partial detail responses preserve stored data and schedule a retry', async () => {
  const originalFetch = globalThis.fetch;
  const executed: Array<{ query: string; values: unknown[] }> = [];
  const batches: D1Statement[][] = [];

  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => {
      executed.push({ query, values });
      return {};
    },
    all: async () => {
      executed.push({ query, values });
      return query.includes('SELECT cultures.id AS culture_id') ? { results: [staleRow] } : { results: [] };
    },
  });

  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => {
      batches.push(statements);
      return statements.map(() => ({}));
    },
  };

  globalThis.fetch = (async input => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url);
    if (url.pathname.endsWith('/detailIntro2')) {
      return Response.json({
        response: {
          header: { resultCode: '9999', resultMsg: 'temporary failure' },
          body: { items: { item: [] }, totalCount: 0 },
        },
      });
    }

    return Response.json({
      response: {
        header: { resultCode: '0000', resultMsg: 'OK' },
        body: { items: { item: [{}] }, totalCount: 1 },
      },
    });
  }) as typeof fetch;

  try {
    const refreshed = await refreshStaleCachedTourApiDetails(
      { baseUrl: 'https://apis.data.go.kr/B551011/KorService2', serviceKey: 'key' },
      d1
    );

    assert.equal(refreshed, 0);
    assert.equal(batches.length, 0);

    const retryUpdate = executed.find(call => call.query.includes('detail_sync_fail_count = ?'));
    assert.equal(retryUpdate?.values[0], 3);
    assert.match(String(retryUpdate?.values[2]), /일부 조회로 저장하지 않습니다/);
    assert.equal(retryUpdate?.values[3], 'tourapi:123');
    assert.ok(!executed.some(call => call.query.includes('INSERT INTO culture_tour_api_details')));
    assert.ok(!executed.some(call => call.query.includes('homepage_detail_address = ?')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
