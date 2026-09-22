import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('read model publication logs size and stage timings for capacity monitoring', async () => {
  const source = await readProjectFile('../src/services/cultureList.ts');

  assert.match(source, /serializedBytes: readModel\.serializedBytes/);
  assert.match(source, /bytesPerItem:/);
  assert.match(source, /queryDurationMs/);
  assert.match(source, /publishDurationMs/);
  assert.match(source, /durationMs:/);
});
