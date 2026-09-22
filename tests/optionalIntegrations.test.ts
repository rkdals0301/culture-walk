import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('Google Analytics resource hint is emitted only when analytics is configured', async () => {
  const layout = await readProjectFile('../src/app/layout.tsx');

  assert.match(
    layout,
    /GA_MEASUREMENT_ID\s*&&\s*<link rel='dns-prefetch' href='https:\/\/www\.google-analytics\.com'/
  );
});
