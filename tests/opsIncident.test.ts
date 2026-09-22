import assert from 'node:assert/strict';
import test from 'node:test';

import { buildIncidentBody, INCIDENT_TITLE } from '../scripts/sync-production-incident.mjs';

test('ops incident summary includes current production failures', () => {
  const body = buildIncidentBody({
    runUrl: 'https://github.com/example/repo/actions/runs/123',
    report: {
      generatedAt: '2026-09-22T00:00:00.000Z',
      status: 'failed',
      failures: ['health: unavailable', 'feed: HTTP 500'],
      warnings: ['sitemap: slow'],
    },
  });

  assert.equal(INCIDENT_TITLE, '[Ops] Culture Walk production health incident');
  assert.match(body, /health: unavailable/);
  assert.match(body, /feed: HTTP 500/);
  assert.match(body, /sitemap: slow/);
  assert.match(body, /actions\/runs\/123/);
});
