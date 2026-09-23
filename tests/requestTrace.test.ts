import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyPublicRequestObservation,
  PUBLIC_REQUEST_SLOW_MS,
  resolveRequestCorrelation,
} from '../src/server/requestTrace';

test('request correlation prefers Cloudflare Ray ID in production traffic', () => {
  const request = new Request('https://example.test', {
    headers: {
      'cf-ray': '9abc123def456-NRT',
      'x-request-id': 'client-request',
    },
  });

  assert.deepEqual(resolveRequestCorrelation(request), {
    requestId: '9abc123def456-NRT',
    source: 'cf-ray',
  });
});

test('request correlation accepts a safe caller ID when CF-Ray is unavailable', () => {
  const request = new Request('https://example.test', {
    headers: { 'x-request-id': 'smoke:feed.1' },
  });

  assert.deepEqual(resolveRequestCorrelation(request), {
    requestId: 'smoke:feed.1',
    source: 'x-request-id',
  });
});

test('request correlation generates an ID when supplied values are unsafe', () => {
  const request = new Request('https://example.test', {
    headers: { 'x-request-id': 'bad value with spaces' },
  });
  const correlation = resolveRequestCorrelation(request);

  assert.equal(correlation.source, 'generated');
  assert.match(
    correlation.requestId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
});

test('public request observations log only slow or server-error requests', () => {
  assert.equal(classifyPublicRequestObservation(200, PUBLIC_REQUEST_SLOW_MS - 1), null);
  assert.equal(classifyPublicRequestObservation(200, PUBLIC_REQUEST_SLOW_MS), 'warn');
  assert.equal(classifyPublicRequestObservation(503, 10), 'error');
});
