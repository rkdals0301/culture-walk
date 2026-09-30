import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('app and root-layout failures show a localized, retryable error boundary', async () => {
  const [appError, globalError, fallback, detailError, mapError] = await Promise.all([
    readProjectFile('../src/app/error.tsx'),
    readProjectFile('../src/app/global-error.tsx'),
    readProjectFile('../src/components/Common/AppErrorFallback.tsx'),
    readProjectFile('../src/app/cultures/[id]/error.tsx'),
    readProjectFile('../src/app/map/[id]/error.tsx'),
  ]);

  assert.match(appError, /'use client'/);
  assert.match(appError, /AppErrorFallback/);
  assert.match(globalError, /@\/styles\/globals\.scss/);
  assert.match(globalError, /<html lang='ko'>[\s\S]*<body[^>]*>[\s\S]*<\/body>[\s\S]*<\/html>/);
  assert.match(globalError, /AppErrorFallback/);
  assert.match(fallback, /role='alert'/);
  assert.match(fallback, /ariaLabel='다시 시도'/);
  assert.match(fallback, /페이지를 표시할 수 없습니다/);
  assert.doesNotMatch(fallback, /error\.message/);
  assert.doesNotMatch(fallback, /reportClientError/);

  for (const source of [appError, globalError, detailError, mapError]) {
    assert.match(source, /reportClientError/);
  }
  assert.match(appError, /'boundary', 'app'/);
  assert.match(globalError, /'boundary', 'global'/);
  assert.match(detailError, /culture-detail/);
  assert.match(mapError, /map-detail/);
});

test('404 홈 이동은 두 화면 모두 중첩 버튼 없는 단일 링크다', async () => {
  const [rootNotFound, mapNotFound] = await Promise.all([
    readProjectFile('../src/app/not-found.tsx'),
    readProjectFile('../src/app/map/[id]/not-found.tsx'),
  ]);

  for (const source of [rootNotFound, mapNotFound]) {
    assert.doesNotMatch(source, /import Button|<Button\b/);
    assert.match(source, /<Link[\s\S]*?aria-label='홈으로'[\s\S]*?>\s*홈으로\s*<\/Link>/);
  }
});
