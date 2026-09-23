import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('robots metadata advertises sitemap while keeping APIs and ops diagnostics out of crawl', async () => {
  const robots = await readProjectFile('../src/app/robots.ts');

  assert.match(robots, /sitemap:\s*`\$\{SITE_URL\}\/sitemap\.xml`/);
  assert.match(robots, /disallow:\s*\['\/api\/', '\/ops'\]/);
  assert.match(robots, /host:\s*SITE_URL/);
});

test('sitemap does not claim every culture changed whenever the snapshot cache was republished', async () => {
  const sitemap = await readProjectFile('../src/app/sitemap.ts');

  assert.doesNotMatch(sitemap, /lastModified:\s*parseLastModified\(snapshot\.cachedAt\)/);
  assert.doesNotMatch(sitemap, /const parseLastModified/);
  assert.match(sitemap, /images:\s*\[image\]/);
});
