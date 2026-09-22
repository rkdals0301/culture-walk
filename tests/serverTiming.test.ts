import assert from 'node:assert/strict';
import test from 'node:test';

import { createServerTimingHeader, withServerTiming } from '../src/server/serverTiming';

test('server timing serializes bounded duration metrics safely', () => {
  assert.equal(
    createServerTimingHeader([
      { name: 'read model', durationMs: 12.345, description: 'kv-read-model' },
      { name: 'total', durationMs: 20 },
    ]),
    'read-model;dur=12.3;desc="kv-read-model", total;dur=20'
  );
});

test('server timing preserves existing cache headers', () => {
  const headers = withServerTiming(
    { 'Cache-Control': 'public, max-age=60' },
    [{ name: 'total', durationMs: 8.8 }]
  );

  assert.equal(headers['Cache-Control'], 'public, max-age=60');
  assert.equal(headers['Server-Timing'], 'total;dur=8.8');
});
