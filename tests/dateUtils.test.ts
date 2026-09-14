import assert from 'node:assert/strict';
import test from 'node:test';

import { getKoreaDateStartIso, toDateOrNull } from '@/utils/dateUtils';

test('Korea date changes at 15:00 UTC', () => {
  assert.equal(getKoreaDateStartIso(new Date('2026-07-09T14:59:59.999Z')), '2026-07-09T00:00:00.000Z');
  assert.equal(getKoreaDateStartIso(new Date('2026-07-09T15:00:00.000Z')), '2026-07-10T00:00:00.000Z');
});

test('invalid dates stay invalid instead of silently becoming now', () => {
  assert.equal(toDateOrNull('not-a-date'), null);
  assert.equal(toDateOrNull(''), null);
  assert.equal(toDateOrNull('2026-09-14T00:00:00.000Z')?.toISOString(), '2026-09-14T00:00:00.000Z');
});
