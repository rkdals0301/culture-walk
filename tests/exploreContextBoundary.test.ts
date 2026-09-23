import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

const collectSourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
};

test('global client context is explicitly scoped to exploration state', async () => {
  const exploreContext = await readFile(path.join(projectRoot, 'src/context/ExploreContext.tsx'), 'utf8');

  assert.match(exploreContext, /interface ExploreContextValue/);
  assert.match(exploreContext, /searchQuery/);
  assert.match(exploreContext, /mapCategory/);
  assert.match(exploreContext, /currentLocation/);
  assert.doesNotMatch(exploreContext, /favorites?|recentlyViewed|notifications?|userProfile|account|authToken/i);
  assert.doesNotMatch(exploreContext, /cultures:\s|selectedCulture|cultureDetails/);
});

test('legacy generic CultureContext names do not return to production source', async () => {
  const sourceFiles = await collectSourceFiles(path.join(projectRoot, 'src'));
  const sources = await Promise.all(sourceFiles.map(file => readFile(file, 'utf8')));

  for (const source of sources) {
    assert.doesNotMatch(source, /@\/context\/CultureContext|useCultureContext|CultureProvider/);
  }
});
