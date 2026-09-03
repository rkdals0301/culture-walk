import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const shellPath = fileURLToPath(new URL('../src/components/Map/MapShell.tsx', import.meta.url));
const viewPath = fileURLToPath(new URL('../src/components/Map/MapView.tsx', import.meta.url));
const layoutPath = fileURLToPath(new URL('../src/app/layout.tsx', import.meta.url));
const contextPath = fileURLToPath(new URL('../src/context/CultureContext.tsx', import.meta.url));
const apiErrorPath = fileURLToPath(new URL('../src/hooks/useApiError.ts', import.meta.url));
const toastPath = fileURLToPath(new URL('../src/components/Toast/ToastContainer.tsx', import.meta.url));
const stylesPath = fileURLToPath(new URL('../src/styles/globals.scss', import.meta.url));

test('모바일 지도는 피드 링크와 지도 컨트롤 사이에 안전한 세로 간격을 확보한다', async () => {
  const [shell, view, styles] = await Promise.all([
    readFile(shellPath, 'utf8'),
    readFile(viewPath, 'utf8'),
    readFile(stylesPath, 'utf8'),
  ]);

  assert.match(shell, /safe-area-map-feed-link/);
  assert.doesNotMatch(shell, /absolute right-4 top-20/);
  assert.match(view, /map-controls-safe absolute z-20/);
  assert.match(styles, /\.safe-area-map-feed-link\s*\{[\s\S]*?top:\s*calc\(5rem \+ env\(safe-area-inset-top, 0px\)\);/);
  assert.match(
    styles,
    /\.map-controls-safe\s*\{[\s\S]*?top:\s*calc\(5rem \+ 2\.25rem \+ 1rem \+ env\(safe-area-inset-top, 0px\)\);/
  );
  assert.match(
    styles,
    /@media \(min-width: 1024px\) \{[\s\S]*?\.map-controls-safe\s*\{[\s\S]*?top:\s*auto;[\s\S]*?bottom:/
  );
});

test('지도 API 인라인 오류는 피드 링크 아래의 별도 레인에 표시된다', async () => {
  const styles = await readFile(stylesPath, 'utf8');

  assert.match(
    styles,
    /\.map-inline-status\s*\{[\s\S]*?top:\s*calc\(5rem \+ 2\.25rem \+ 3rem \+ env\(safe-area-inset-top, 0px\)\);/
  );
  assert.match(styles, /\.map-inline-status\s*\{[\s\S]*?right:\s*calc\(5rem \+ env\(safe-area-inset-right, 0px\)\);/);
});

test('문화 목록 자동 로드는 이미 실패한 요청을 마운트된 소비자가 다시 시작하지 않는다', async () => {
  const source = await readFile(contextPath, 'utf8');

  assert.match(source, /if \(!force && culturesError\) \{\s*return;\s*\}/);
});

test('동일 API 오류 토스트는 중복 표시를 막는 식별자를 사용한다', async () => {
  const source = await readFile(apiErrorPath, 'utf8');

  assert.match(source, /toast\.error\([\s\S]*?toastId:\s*getApiErrorToastId/);
});

test('오류 알림은 토스 스타일의 안전 영역 플로팅 표면으로 표시된다', async () => {
  const [toastSource, styles] = await Promise.all([readFile(toastPath, 'utf8'), readFile(stylesPath, 'utf8')]);

  assert.match(toastSource, /className='culture-toast-container'/);
  assert.match(toastSource, /toastClassName='culture-toast'/);
  assert.match(toastSource, /bodyClassName='culture-toast-body'/);
  assert.match(toastSource, /progressClassName='culture-toast-progress'/);
  assert.match(
    styles,
    /\.Toastify__toast-container\.culture-toast-container\s*\{[\s\S]*?top:\s*calc\(var\(--map-header-height\) \+ 0\.75rem \+ env\(safe-area-inset-top, 0px\)\);/
  );
  assert.match(
    styles,
    /\.Toastify__toast-container\.culture-toast-container\s*\{[\s\S]*?right:\s*calc\(7\.5rem \+ env\(safe-area-inset-right, 0px\)\);[\s\S]*?width:\s*min\(22rem, calc\(100vw - 8\.25rem\)\);/
  );
  assert.match(styles, /\.Toastify__toast\.culture-toast\s*\{[\s\S]*?border-radius:\s*1\.125rem;[\s\S]*?box-shadow:/);
  assert.match(styles, /\.Toastify__toast--error\.culture-toast[\s\S]*?border-color:/);
  assert.match(styles, /\.Toastify__progress-bar\.culture-toast-progress[\s\S]*?height:\s*0\.125rem;/);
});

test('초기 API 오류 알림 호스트는 지연 로딩 없이 즉시 등록된다', async () => {
  const source = await readFile(layoutPath, 'utf8');

  assert.match(source, /import CustomToastContainer from '@\/components\/Toast\/ToastContainer';/);
  assert.doesNotMatch(source, /dynamic\(\(\) => import\('@\/components\/Toast\/ToastContainer'\)\)/);
});

test('초기 API 오류보다 토스트 호스트가 먼저 마운트된다', async () => {
  const source = await readFile(layoutPath, 'utf8');
  const toastHostPosition = source.indexOf('<CustomToastContainer />');
  const cultureProviderPosition = source.indexOf('<CultureProvider>');

  assert.ok(toastHostPosition >= 0);
  assert.ok(cultureProviderPosition >= 0);
  assert.ok(toastHostPosition < cultureProviderPosition);
});

test('API 오류 토스트는 오류 상태 반영 이후에 한 번 표시된다', async () => {
  const source = await readFile(contextPath, 'utf8');

  assert.match(source, /pendingCulturesErrorRef/);
  assert.match(source, /pendingCultureErrorRef/);
  assert.match(
    source,
    /useEffect\(\(\) => \{[\s\S]*?const error = pendingCulturesErrorRef\.current \?\? culturesError;[\s\S]*?handleError\(error\);/
  );
  assert.match(
    source,
    /useEffect\(\(\) => \{[\s\S]*?const error = pendingCultureErrorRef\.current \?\? cultureError;[\s\S]*?handleError\(error\);/
  );
  assert.doesNotMatch(source, /setCulturesError\(normalizedError\);\s*handleError\(caughtError\);/);
  assert.doesNotMatch(source, /setCultureError\(normalizedError\);\s*handleError\(caughtError\);/);
});
