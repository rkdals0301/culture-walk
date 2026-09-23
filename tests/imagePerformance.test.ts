import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('feed reserves high fetch priority for one LCP image while keeping two above-fold posters eager', async () => {
  const results = await readProjectFile('../src/components/Feed/FeedResults.tsx');
  const card = await readProjectFile('../src/components/Feed/FeedCultureCard.tsx');

  assert.match(results, /isAboveFold=\{index < 2\}/);
  assert.match(results, /isLcpCandidate=\{index === 0\}/);
  assert.match(card, /loading=\{isAboveFold \? 'eager' : 'lazy'\}/);
  assert.match(card, /fetchPriority=\{isLcpCandidate \? 'high' : 'auto'\}/);
  assert.match(card, /priority=\{isLcpCandidate\}/);
});

test('map detail poster does not render a second blurred copy of the same source image', async () => {
  const shared = await readProjectFile('../src/components/Map/MapDetailShared.tsx');

  assert.doesNotMatch(shared, /sizes='120px'/);
  assert.doesNotMatch(shared, /blur-xl/);
});
