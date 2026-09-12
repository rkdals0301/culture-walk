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

test('MapDashboard delegates desktop panel presentation to a dedicated component', async () => {
  const [dashboard, desktop] = await Promise.all([
    readProjectFile('../src/components/Map/MapDashboard.tsx'),
    readProjectFile('../src/components/Map/MapDesktopDashboard.tsx'),
  ]);

  assert.match(dashboard, /MapDesktopDashboard/);
  assert.doesNotMatch(dashboard, /문화행사 빠른 검색|목록 접고 전체 지도 보기/);
  assert.match(desktop, /문화행사 빠른 검색/);
  assert.match(desktop, /목록 접고 전체 지도 보기/);
});

test('MapDashboard delegates mobile bottom-sheet presentation to a dedicated component', async () => {
  const [dashboard, mobile] = await Promise.all([
    readProjectFile('../src/components/Map/MapDashboard.tsx'),
    readProjectFile('../src/components/Map/MapMobileDashboard.tsx'),
  ]);

  assert.match(dashboard, /MapMobileDashboard/);
  assert.doesNotMatch(dashboard, /map-mobile-filters|행사 목록 접고 지도 보기/);
  assert.match(mobile, /map-mobile-filters/);
  assert.match(mobile, /행사 목록 접고 지도 보기/);
});

test('feed and map navigation memory stays outside the global reactive culture context', async () => {
  const [context, feed, mapView] = await Promise.all([
    readProjectFile('../src/context/CultureContext.tsx'),
    readProjectFile('../src/components/Feed/FeedView.tsx'),
    readProjectFile('../src/components/Map/MapView.tsx'),
  ]);

  assert.doesNotMatch(context, /useState\([^\n]*ScrollTop|useState<[^>]*MapCameraState/);
  assert.match(feed, /exploreNavigationMemory/);
  assert.match(mapView, /exploreNavigationMemory/);
});

test('feed and map reuse one shared location and distance-sort controller', async () => {
  const [feed, mapController, mapLocationControl] = await Promise.all([
    readProjectFile('../src/components/Feed/FeedView.tsx'),
    readProjectFile('../src/hooks/useMapDashboardController.ts'),
    readProjectFile('../src/components/Map/MapFindMyLocationControl.tsx'),
  ]);

  assert.match(feed, /useExploreLocationControls/);
  assert.match(mapController, /useExploreLocationControls/);
  assert.match(mapLocationControl, /useExploreLocationControls/);
});

test('MapDetailSheetClient owns lifecycle state while detail presentation lives in a separate component', async () => {
  const source = await readProjectFile('../src/components/Map/MapDetailSheetClient.tsx');

  assert.match(source, /MapDetailSheetContent/);
  assert.match(source, /MapDetailSheetFooter/);
  assert.match(source, /MapDetailFallback/);
  assert.doesNotMatch(source, /GoogleAdSlot|CultureDetailFacts|next\/image|getCulturePriceTone/);
});

test('culture detail presentation delegates gallery state and shared derived fields to dedicated modules', async () => {
  const [detailView, facts, gallery, mapDetailShared, mapDetailSheet] = await Promise.all([
    readProjectFile('../src/components/CultureDetail/CultureDetailView.tsx'),
    readProjectFile('../src/components/CultureDetail/CultureDetailFacts.tsx'),
    readProjectFile('../src/components/CultureDetail/CultureDetailGallery.tsx'),
    readProjectFile('../src/components/Map/MapDetailShared.tsx'),
    readProjectFile('../src/components/Map/MapDetailSheetContent.tsx'),
  ]);

  assert.match(detailView, /CultureDetailGallery/);
  assert.match(detailView, /CultureDetailFacts/);
  assert.match(detailView, /getCultureDetailViewModel/);
  assert.doesNotMatch(detailView, /handlePrevImage|handleNextImage|isLightboxOpen|copiedAddress|handleCopyAddress/);
  assert.match(facts, /handleCopyAddress/);
  assert.match(facts, /contactSegments/);
  assert.match(gallery, /handlePrevImage/);
  assert.match(gallery, /isLightboxOpen/);
  assert.match(mapDetailShared, /getCultureDetailViewModel/);
  assert.match(mapDetailSheet, /getCultureDetailViewModel/);
});

test('culture list and detail presentation use distinct formatted types', async () => {
  const [types, feed, detail, mapData] = await Promise.all([
    readProjectFile('../src/types/culture.ts'),
    readProjectFile('../src/components/Feed/FeedView.tsx'),
    readProjectFile('../src/components/CultureDetail/CultureDetailView.tsx'),
    readProjectFile('../src/hooks/useCultureMapData.ts'),
  ]);

  assert.match(types, /FormattedCultureListItem = CultureListItem & CultureDisplayFields/);
  assert.match(types, /FormattedCultureDetail = Culture & CultureDisplayFields/);
  assert.doesNotMatch(types, /Partial<Culture>/);
  assert.match(feed, /FormattedCultureListItem/);
  assert.match(mapData, /FormattedCultureListItem/);
  assert.match(detail, /FormattedCultureDetail/);
});

test('D1 culture projections and row mapping live in one repository module', async () => {
  const [repository, readModel, syncDetails, cultureList] = await Promise.all([
    readProjectFile('../src/services/cultureD1Repository.ts'),
    readProjectFile('../src/services/cultureReadModel.ts'),
    readProjectFile('../src/services/cultureSyncDetails.ts'),
    readProjectFile('../src/services/cultureList.ts'),
  ]);

  assert.match(repository, /CULTURE_CONTENT_SELECT/);
  assert.match(repository, /CULTURE_DETAIL_SELECT/);
  assert.match(repository, /toCultureTourApiDetailsRow/);
  assert.match(repository, /toCultureListItem/);
  assert.match(readModel, /cultureD1Repository/);
  assert.match(syncDetails, /cultureD1Repository/);
  assert.match(cultureList, /toCultureListItem/);
  assert.doesNotMatch(readModel, /cultures\.homepage_detail_address AS/);
  assert.doesNotMatch(syncDetails, /details\.common_json AS/);
});

test('culture sync repository delegates staging IO and snapshot mutation to dedicated modules', async () => {
  const [repository, staging, snapshot] = await Promise.all([
    readProjectFile('../src/services/cultureSyncRepository.ts'),
    readProjectFile('../src/services/cultureSyncStaging.ts'),
    readProjectFile('../src/services/cultureSyncSnapshot.ts'),
  ]);

  assert.match(repository, /stageCultureRows/);
  assert.match(repository, /readCultureSnapshotStats/);
  assert.match(repository, /applyCultureSnapshot/);
  assert.doesNotMatch(repository, /INSERT INTO culture_sync_staging|UPDATE cultures AS live|DELETE FROM cultures/);
  assert.match(staging, /retryInsertStagingStatementGroup/);
  assert.match(snapshot, /UPDATE cultures AS live/);
  assert.match(snapshot, /DELETE FROM cultures/);
});

test('detail refresh returns touched ids instead of mutating an array owned by its caller', async () => {
  const [details, scheduledJobs] = await Promise.all([
    readProjectFile('../src/services/cultureSyncDetails.ts'),
    readProjectFile('../src/server/cultureScheduledJobs.ts'),
  ]);

  assert.doesNotMatch(details, /refreshedCultureIds\?:\s*number\[\]/);
  assert.match(details, /return \{ refreshed, refreshedCultureIds \};/);
  assert.match(scheduledJobs, /const \{ refreshed, refreshedCultureIds \} = await refreshStaleCachedTourApiDetails/);
});

test('worker entrypoint delegates scheduled and edge-cache behavior to typed server modules', async () => {
  const [worker, edgeCache, scheduledJobs] = await Promise.all([
    readProjectFile('../worker.js'),
    readProjectFile('../src/server/cultureEdgeCache.ts'),
    readProjectFile('../src/server/cultureScheduledJobs.ts'),
  ]);

  assert.match(worker, /runCultureScheduledEvent/);
  assert.match(worker, /purgeCultureEdgeCache/);
  assert.match(worker, /withSitemapEdgeCache/);
  assert.doesNotMatch(worker, /refreshStaleCachedTourApiDetails|acquireInitializeLock|hasD1DailyRowWriteLimitError/);
  assert.match(edgeCache, /ctx\.cache\.purge/);
  assert.match(scheduledJobs, /refreshStaleCachedTourApiDetails/);
  assert.ok(worker.split(/\r?\n/).length < 60);
});

test('map data hook delegates bounded client cache and viewport projection to a pure utility', async () => {
  const source = await readProjectFile('../src/hooks/useCultureMapData.ts');

  assert.match(source, /cultureMapClientCache/);
  assert.match(source, /normalizeCultureMapResponse/);
  assert.match(source, /selectCultureMapViewport/);
  assert.doesNotMatch(source, /new Map<string, CultureMapCacheEntry>|getBoundsArea|isBoundsWithin|isCoordinateWithinBounds/);
});

test('feed hook delegates TTL and bounded LRU behavior to a dedicated client cache', async () => {
  const [hook, cache] = await Promise.all([
    readProjectFile('../src/hooks/useCultureFeed.ts'),
    readProjectFile('../src/utils/cultureFeedClientCache.ts'),
  ]);

  assert.match(hook, /cultureFeedClientCache/);
  assert.doesNotMatch(hook, /new Map<string, FeedCacheEntry>|CACHE_TTL_MS|feedMemoryCache/);
  assert.match(cache, /DEFAULT_MAX_ENTRIES/);
  assert.match(cache, /entries\.delete\(key\);\s*entries\.set\(key, entry\)/);
  assert.match(cache, /while \(entries\.size > maxEntries\)/);
});

test('unused theme, skeleton, and map location wrappers stay out of the production surface', async () => {
  const [packageJson, mapControls] = await Promise.all([
    readProjectFile('../package.json'),
    readProjectFile('../src/components/Map/MapControls.tsx'),
  ]);

  assert.doesNotMatch(packageJson, /next-themes|react-loading-skeleton/);
  assert.doesNotMatch(mapControls, /MapLocationControl|LocationToggle/);
});

test('information styles keep the entrypoint small and delegate base/editorial layers to partials', async () => {
  const source = await readProjectFile('../src/styles/_information.scss');

  assert.match(source, /@use '.\/information-base';/);
  assert.match(source, /@use '.\/information-editorial';/);
  assert.match(source, /@include information-base\.styles;/);
  assert.match(source, /@include information-editorial\.styles;/);
  assert.ok(source.split(/\r?\n/).length < 20);
});
