import { toCultureContentRow } from '@/services/cultureD1Repository';

import assert from 'node:assert/strict';
import test from 'node:test';

test('D1 culture content rows normalize scalar values before domain mapping', () => {
  const row = toCultureContentRow({
    id: '42',
    lat: '37.5665',
    lng: 126.978,
    title: 123,
    startDate: '2026-09-10T00:00:00.000Z',
    endDate: '2026-09-12T00:00:00.000Z',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-10T00:00:00.000Z',
  });

  assert.equal(row?.id, 42);
  assert.equal(row?.lat, 37.5665);
  assert.equal(row?.lng, 126.978);
  assert.equal(row?.title, '123');
  assert.equal(row?.sourceKey, null);
});

test('D1 culture content rows reject missing identity and audit timestamps', () => {
  assert.equal(
    toCultureContentRow({
      id: 'not-a-number',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-10T00:00:00.000Z',
    }),
    null
  );
  assert.equal(
    toCultureContentRow({
      id: 42,
      createdAt: '2026-09-01T00:00:00.000Z',
    }),
    null
  );
});
