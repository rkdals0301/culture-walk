import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { inspectClientBundle } from '../scripts/check-client-bundle-budget.mjs';

test('client bundle budget measures app chunks and shared library chunks independently', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'culture-bundle-'));
  try {
    const appRoot = path.join(root, 'app');
    await mkdir(path.join(appRoot, 'map'), { recursive: true });
    await mkdir(path.join(root, 'chunks'), { recursive: true });
    await mkdir(path.join(root, 'map'), { recursive: true });
    await writeFile(path.join(appRoot, 'layout.js'), 'x'.repeat(40));
    await writeFile(path.join(appRoot, 'map', 'page.js'), 'x'.repeat(60));
    await writeFile(path.join(root, 'chunks', 'framework.js'), 'x'.repeat(80));
    await writeFile(path.join(root, 'chunks', 'vendor.js'), 'x'.repeat(90));
    await writeFile(path.join(root, 'map', 'page.js'), 'x'.repeat(120));

    const result = await inspectClientBundle({
      root: appRoot,
      maxChunkBytes: 64,
      maxTotalBytes: 128,
      maxEmittedChunkBytes: 128,
      maxEmittedTotalBytes: 400,
    });
    assert.equal(result.totalBytes, 100);
    assert.equal(result.largest.bytes, 60);
    assert.equal(result.emittedTotalBytes, 390);
    assert.equal(result.largestEmitted.bytes, 120);
    assert.equal(result.ok, true);

    const appTooTight = await inspectClientBundle({ root: appRoot, maxChunkBytes: 50, maxTotalBytes: 128 });
    assert.equal(appTooTight.ok, false);

    const emittedChunkTooTight = await inspectClientBundle({
      root: appRoot,
      maxChunkBytes: 64,
      maxTotalBytes: 128,
      maxEmittedChunkBytes: 110,
      maxEmittedTotalBytes: 400,
    });
    assert.equal(emittedChunkTooTight.ok, false);

    const emittedTotalTooTight = await inspectClientBundle({
      root: appRoot,
      maxChunkBytes: 64,
      maxTotalBytes: 128,
      maxEmittedChunkBytes: 128,
      maxEmittedTotalBytes: 300,
    });
    assert.equal(emittedTotalTooTight.ok, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
