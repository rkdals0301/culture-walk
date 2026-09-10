import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('MapView delegates Kakao SDK lifecycle, viewport, and marker rendering to dedicated hooks', async () => {
  const source = await readProjectFile('../src/components/Map/MapView.tsx');

  assert.match(source, /useKakaoMapInstance/);
  assert.match(source, /useKakaoMapViewport/);
  assert.match(source, /useKakaoMapMarkers/);
  assert.doesNotMatch(source, /loadKakaoMapsSdk|resetKakaoMapsSdk|new kakaoMaps\.(Map|Marker|CustomOverlay|MarkerClusterer)/);
});

test('MapDashboard keeps navigation and exploration side effects in its controller hook', async () => {
  const source = await readProjectFile('../src/components/Map/MapDashboard.tsx');

  assert.match(source, /useMapDashboardController/);
  assert.doesNotMatch(source, /useCultureContext|useMapExploreUrlSync|usePathname|useRouter|LocationRequestError|toast\./);
});

test('MapDetailSheetClient owns lifecycle state while detail presentation lives in a separate component', async () => {
  const source = await readProjectFile('../src/components/Map/MapDetailSheetClient.tsx');

  assert.match(source, /MapDetailSheetContent/);
  assert.match(source, /MapDetailSheetFooter/);
  assert.match(source, /MapDetailFallback/);
  assert.doesNotMatch(source, /GoogleAdSlot|CultureDetailFacts|next\/image|getCulturePriceTone/);
});

test('detail refresh returns touched ids instead of mutating an array owned by its caller', async () => {
  const [details, worker] = await Promise.all([
    readProjectFile('../src/services/cultureSyncDetails.ts'),
    readProjectFile('../worker.js'),
  ]);

  assert.doesNotMatch(details, /refreshedCultureIds\?:\s*number\[\]/);
  assert.match(details, /return \{ refreshed, refreshedCultureIds \};/);
  assert.match(worker, /const \{ refreshed, refreshedCultureIds \} = await refreshStaleCachedTourApiDetails/);
});
