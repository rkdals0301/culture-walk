import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('production smoke enforces conservative request and edge-hit latency gates', async () => {
  const [script, cdWorkflow, scheduledWorkflow] = await Promise.all([
    readProjectFile('../scripts/production-smoke.mjs'),
    readProjectFile('../.github/workflows/cd.yml'),
    readProjectFile('../.github/workflows/production-smoke.yml'),
  ]);

  assert.match(script, /SMOKE_MAX_REQUEST_TTFB_MS/);
  assert.match(script, /SMOKE_MAX_EDGE_HIT_TTFB_MS/);
  assert.match(script, /SMOKE_MAX_READ_MODEL_BYTES/);
  assert.match(script, /cache HIT TTFB/);
  assert.match(script, /성능 기준을 확인할 Cloudflare cache HIT/);

  for (const workflow of [cdWorkflow, scheduledWorkflow]) {
    assert.match(workflow, /SMOKE_MAX_REQUEST_TTFB_MS:\s*'3000'/);
    assert.match(workflow, /SMOKE_MAX_EDGE_HIT_TTFB_MS:\s*'500'/);
    assert.match(workflow, /SMOKE_MAX_READ_MODEL_BYTES:\s*'2000000'/);
  }
  assert.match(scheduledWorkflow, /cron:\s*'37 \* \* \* \*'/);
  assert.match(scheduledWorkflow, /issues:\s*write/);
  assert.match(scheduledWorkflow, /sync-production-incident\.mjs/);
});
