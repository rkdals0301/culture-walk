import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('ops page reuses public health logic and stays out of search indexing', async () => {
  const [page, robots] = await Promise.all([
    readProjectFile('../src/app/ops/page.tsx'),
    readProjectFile('../public/robots.txt'),
  ]);

  assert.match(page, /getPublicHealthReport/);
  assert.match(page, /index:\s*false/);
  assert.match(page, /follow:\s*false/);
  assert.match(page, /read model 크기/);
  assert.match(page, /용량 budget/);
  assert.doesNotMatch(page, /SYNC_TOKEN|TOUR_API_KEY|process\.env/);
  assert.match(robots, /Disallow: \/ops/);
});
