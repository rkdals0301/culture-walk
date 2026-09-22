import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { inspectClientBundle } from '../scripts/check-client-bundle-budget.mjs';

test('client bundle budget measures total and largest app chunks', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'culture-bundle-'));
  try {
    await mkdir(path.join(root, 'map'), { recursive: true });
    await writeFile(path.join(root, 'layout.js'), 'x'.repeat(40));
    await writeFile(path.join(root, 'map', 'page.js'), 'x'.repeat(60));

    const result = await inspectClientBundle({ root, maxChunkBytes: 64, maxTotalBytes: 128 });
    assert.equal(result.totalBytes, 100);
    assert.equal(result.largest.bytes, 60);
    assert.equal(result.ok, true);

    const tooTight = await inspectClientBundle({ root, maxChunkBytes: 50, maxTotalBytes: 128 });
    assert.equal(tooTight.ok, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
