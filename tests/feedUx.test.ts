import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('feed empty state separates clearing the search query from resetting other filters', async () => {
  const results = await readProjectFile('../src/components/Feed/FeedResults.tsx');

  assert.match(results, /검색 결과가 없습니다/);
  assert.match(results, /검색어만 지우기/);
  assert.match(results, /hasNonSearchFilters/);
  assert.match(results, /aria-live='polite'/);
  assert.match(results, /min-h-11/);
});
