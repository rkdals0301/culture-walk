import { hasD1DailyRowReadLimitError } from '@/server/sqliteError';

import assert from 'node:assert/strict';
import test from 'node:test';

test('detects the D1 daily row read limit through a wrapped database error', () => {
  const error = new Error('Failed query', {
    cause: new Error("D1_ERROR: Your account has exceeded D1's free tier daily row read limit."),
  });

  assert.equal(hasD1DailyRowReadLimitError(error), true);
});

test('does not classify unrelated database errors as a D1 daily row read limit', () => {
  assert.equal(hasD1DailyRowReadLimitError(new Error('database is temporarily unavailable')), false);
});
