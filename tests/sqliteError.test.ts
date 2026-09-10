import { hasD1DailyRowReadLimitError, hasD1DailyRowWriteLimitError } from '@/server/sqliteError';

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

test('detects the D1 daily row write limit through a wrapped database error', () => {
  const error = new Error('Failed query', {
    cause: new Error("D1_ERROR: Your account has exceeded D1's free tier daily row write limit."),
  });

  assert.equal(hasD1DailyRowWriteLimitError(error), true);
});

test('does not confuse D1 read and write quota errors', () => {
  const readError = new Error("D1_ERROR: Your account has exceeded D1's free tier daily row read limit.");
  const writeError = new Error("D1_ERROR: Your account has exceeded D1's free tier daily row write limit.");

  assert.equal(hasD1DailyRowReadLimitError(writeError), false);
  assert.equal(hasD1DailyRowWriteLimitError(readError), false);
});
