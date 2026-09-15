import { authorizeSyncRequest, isLoopbackHostname } from '@/server/syncAuth';

import assert from 'node:assert/strict';
import test from 'node:test';

test('sync auth permits tokenless loopback development requests only', () => {
  assert.deepEqual(
    authorizeSyncRequest({ hostname: 'localhost', production: false }),
    { authorized: true }
  );
  assert.deepEqual(
    authorizeSyncRequest({ hostname: '127.0.0.1', production: false }),
    { authorized: true }
  );
  assert.equal(isLoopbackHostname('[::1]'), true);
  assert.equal(isLoopbackHostname('culturewalk.gangmin.dev'), false);
});

test('sync auth fails closed when a non-loopback request has no configured token', () => {
  assert.deepEqual(
    authorizeSyncRequest({ hostname: 'culturewalk.gangmin.dev', production: false }),
    {
      authorized: false,
      status: 503,
      message: 'SYNC_TOKEN is required outside loopback development requests',
    }
  );
  assert.deepEqual(
    authorizeSyncRequest({ hostname: 'localhost', production: true }),
    {
      authorized: false,
      status: 503,
      message: 'SYNC_TOKEN is required outside loopback development requests',
    }
  );
});

test('sync auth compares the configured token exactly', () => {
  const options = {
    expectedToken: 'secret-token',
    hostname: 'culturewalk.gangmin.dev',
    production: true,
  };

  assert.deepEqual(authorizeSyncRequest({ ...options, providedToken: 'secret-token' }), { authorized: true });
  assert.deepEqual(authorizeSyncRequest({ ...options, providedToken: 'secret-token ' }), {
    authorized: false,
    status: 401,
    message: 'Unauthorized',
  });
  assert.deepEqual(authorizeSyncRequest({ ...options, providedToken: null }), {
    authorized: false,
    status: 401,
    message: 'Unauthorized',
  });
});

test('sync auth supports unicode tokens without falling back to string equality', () => {
  const options = {
    expectedToken: '문화산책-🔐-token',
    hostname: 'culturewalk.gangmin.dev',
    production: true,
  };

  assert.deepEqual(authorizeSyncRequest({ ...options, providedToken: options.expectedToken }), { authorized: true });
  assert.deepEqual(authorizeSyncRequest({ ...options, providedToken: '문화산책-🔐-token-x' }).authorized, false);
});
