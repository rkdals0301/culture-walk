import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('public list routes use the KV-first D1 read-through service', async () => {
  const sources = await Promise.all([
    readProjectFile('../src/app/api/cultures/route.ts'),
    readProjectFile('../src/app/api/cultures/feed/route.ts'),
    readProjectFile('../src/app/api/cultures/viewport/route.ts'),
  ]);

  for (const source of sources) {
    assert.match(source, /getCulturePublicListSnapshot/);
    assert.doesNotMatch(source, /getDb\(|@\/db\/client|@\/db\/schema/);
  }
});

test('map detail client reuses the server-provided detail instead of immediately refetching it', async () => {
  const detailClient = await readProjectFile('../src/components/Map/MapDetailSheetClient.tsx');

  assert.doesNotMatch(detailClient, /useCultureById|loadCultureById|\/api\/cultures\//);
  assert.match(detailClient, /initialCulture\.id === cultureId/);
});

test('Cloudflare Images binding is enabled for OpenNext image optimization', async () => {
  const wrangler = await readProjectFile('../wrangler.jsonc');

  assert.match(wrangler, /"images"\s*:\s*\{[\s\S]*?"binding"\s*:\s*"IMAGES"/);
});
