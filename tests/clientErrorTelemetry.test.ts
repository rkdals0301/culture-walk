import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getClientErrorType,
  normalizeClientErrorRoute,
  parseClientErrorTelemetry,
} from '../src/utils/clientErrorTelemetry';

test('client error telemetry groups dynamic routes and omits raw message or stack fields', () => {
  const telemetry = parseClientErrorTelemetry({
    source: 'boundary',
    scope: 'culture-detail',
    errorType: 'TypeError',
    pathname: '/cultures/12345',
    message: 'contains private user data',
    stack: 'private stack trace',
  });

  assert.deepEqual(telemetry, {
    source: 'boundary',
    scope: 'culture-detail',
    errorType: 'TypeError',
    route: '/cultures/[id]',
  });
  assert.equal(normalizeClientErrorRoute('/map/876?token=secret'), 'other');
});

test('client error telemetry only accepts bounded route and error categories', () => {
  assert.equal(
    parseClientErrorTelemetry({
      source: 'unhandled_rejection',
      scope: 'app',
      errorType: 'Error',
      pathname: '/',
    }),
    null
  );
  assert.equal(
    parseClientErrorTelemetry({
      source: 'boundary',
      scope: 'app',
      errorType: 'SensitiveErrorName',
      pathname: '/',
    }),
    null
  );
  assert.equal(
    parseClientErrorTelemetry({
      source: 'boundary',
      scope: 'app',
      errorType: 'Error',
      pathname: `/${'x'.repeat(256)}`,
    }),
    null
  );
  assert.equal(getClientErrorType(new TypeError('private message')), 'TypeError');
  assert.equal(getClientErrorType('private message'), 'Other');
});
