import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const publicReadPaths = [
  '../src/app/api/cultures/route.ts',
  '../src/app/api/cultures/feed/route.ts',
  '../src/app/api/cultures/viewport/route.ts',
  '../src/app/api/cultures/[id]/route.ts',
  '../src/app/map/[id]/page.tsx',
  '../src/app/sitemap.ts',
  '../src/app/api/health/route.ts',
].map(path => fileURLToPath(new URL(path, import.meta.url)));

test('공개 조회 경로는 D1 데이터베이스를 직접 읽지 않는다', async () => {
  const sources = await Promise.all(publicReadPaths.map(path => readFile(path, 'utf8')));

  for (const source of sources) {
    assert.doesNotMatch(source, /@\/db\/client|getDb\(|@\/db\/schema/);
  }
});

test('공개 상세 조회는 요청 시 D1 refresh write를 만들지 않는다', async () => {
  const detailApi = await readFile(publicReadPaths[3], 'utf8');
  const detailPage = await readFile(publicReadPaths[4], 'utf8');

  assert.doesNotMatch(detailApi, /requestCultureDetailRefresh|writeCultureDetailCache|readLegacyCultureDetailCache/);
  assert.doesNotMatch(detailPage, /writeCultureDetailCache|readLegacyCultureDetailCache/);
});

test('공개 health는 KV read model freshness만으로 상태를 판단한다', async () => {
  const health = await readFile(publicReadPaths[6], 'utf8');

  assert.match(health, /readCultureReadModelSnapshot/);
  assert.match(health, /databaseStatus:\s*'not-probed'/);
  assert.doesNotMatch(health, /COUNT\(\*\)|cultureSyncRuns|cultureTourApiDetails/);
});
