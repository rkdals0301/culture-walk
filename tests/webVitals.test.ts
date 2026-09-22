import assert from 'node:assert/strict';
import test from 'node:test';

import { parseWebVitalPayload } from '../src/server/webVitals';

test('web vital payload accepts bounded Core Web Vitals data', () => {
  const result = parseWebVitalPayload({
    id: 'v4-123',
    name: 'LCP',
    value: 1820.4,
    delta: 1820.4,
    rating: 'good',
    navigationType: 'navigate',
    pathname: '/map',
  });

  assert.equal(result?.name, 'LCP');
  assert.equal(result?.pathname, '/map');
});

test('web vital payload rejects unknown metrics and non-route paths', () => {
  assert.equal(
    parseWebVitalPayload({
      id: 'x',
      name: 'custom',
      value: 1,
      delta: 1,
      rating: 'good',
      navigationType: 'navigate',
      pathname: '/map',
    }),
    null
  );
  assert.equal(
    parseWebVitalPayload({
      id: 'x',
      name: 'CLS',
      value: 0.01,
      delta: 0.01,
      rating: 'good',
      navigationType: 'navigate',
      pathname: 'https://example.com',
    }),
    null
  );
});
