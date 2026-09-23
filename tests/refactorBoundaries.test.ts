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
  assert.doesNotMatch(source, /useExploreContext|useMapExploreUrlSync|usePathname|useRouter|LocationRequestError|toast\./);
});

test('map list focus restoration uses virtualized row mount signals instead of DOM polling', async () => {
  const [controller, list] = await Promise.all([
    readProjectFile('../src/hooks/useMapDashboardController.ts'),
    readProjectFile('../src/components/Header/CultureList.tsx'),
  ]);

  assert.doesNotMatch(controller, /querySelector|setTimeout\(|attempts\s*>?=\s*120|cw:open-map-search/);
  assert.match(controller, /handleFocusCultureHandled/);
  assert.match(list, /focusCultureId/);
  assert.match(list, /onFocusCultureHandled/);
  assert.match(list, /scrollToIndex\(focusIndex/);
  assert.match(list, /document\.activeElement === element/);
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

test('desktop and mobile map dashboards receive one grouped view model instead of duplicated prop surfaces', async () => {
  const [dashboard, desktop, mobile, model] = await Promise.all([
    readProjectFile('../src/components/Map/MapDashboard.tsx'),
    readProjectFile('../src/components/Map/MapDesktopDashboard.tsx'),
    readProjectFile('../src/components/Map/MapMobileDashboard.tsx'),
    readProjectFile('../src/components/Map/mapDashboardModel.ts'),
  ]);

  assert.match(dashboard, /const model: MapDashboardViewModel/);
  assert.match(dashboard, /<MapDesktopDashboard\s+model=\{model\}/);
  assert.match(dashboard, /<MapMobileDashboard\s+model=\{model\}/);
  assert.match(desktop, /model: MapDashboardViewModel/);
  assert.match(mobile, /model: MapDashboardViewModel/);
  assert.match(model, /filters:/);
  assert.match(model, /list:/);
  assert.match(model, /actions:/);
});

test('feed and map navigation memory stays outside the global reactive explore context', async () => {
  const [context, feed, feedViewport, mapView] = await Promise.all([
    readProjectFile('../src/context/ExploreContext.tsx'),
    readProjectFile('../src/components/Feed/FeedView.tsx'),
    readProjectFile('../src/hooks/useFeedViewportBehavior.ts'),
    readProjectFile('../src/components/Map/MapView.tsx'),
  ]);

  assert.doesNotMatch(context, /useState\([^\n]*ScrollTop|useState<[^>]*MapCameraState/);
  assert.match(feed, /useFeedViewportBehavior/);
  assert.match(feedViewport, /exploreNavigationMemory/);
  assert.match(mapView, /exploreNavigationMemory/);
});

test('FeedView delegates scroll restoration, search focus, and infinite loading to a viewport hook', async () => {
  const [feed, viewportHook] = await Promise.all([
    readProjectFile('../src/components/Feed/FeedView.tsx'),
    readProjectFile('../src/hooks/useFeedViewportBehavior.ts'),
  ]);

  assert.match(feed, /useFeedViewportBehavior/);
  assert.doesNotMatch(feed, /IntersectionObserver|cw:focus-feed-search|getFeedScrollTop|setFeedScrollTop/);
  assert.match(viewportHook, /IntersectionObserver/);
  assert.match(viewportHook, /cw:focus-feed-search/);
  assert.match(viewportHook, /getFeedScrollTop/);
  assert.match(viewportHook, /setFeedScrollTop/);
});

test('FeedView delegates loading, empty, error, and result-grid presentation to FeedResults', async () => {
  const [feed, results] = await Promise.all([
    readProjectFile('../src/components/Feed/FeedView.tsx'),
    readProjectFile('../src/components/Feed/FeedResults.tsx'),
  ]);

  assert.match(feed, /FeedResults/);
  assert.doesNotMatch(feed, /CalendarX|조건에 맞는 행사가 없습니다|FeedCultureCard|FeedSkeleton/);
  assert.match(results, /CalendarX/);
  assert.match(results, /조건에 맞는 행사가 없습니다/);
  assert.match(results, /FeedCultureCard/);
  assert.match(results, /FeedSkeleton/);
});

test('feed cards and detail view share one culture timing status helper', async () => {
  const [card, detail] = await Promise.all([
    readProjectFile('../src/components/Feed/FeedCultureCard.tsx'),
    readProjectFile('../src/components/CultureDetail/CultureDetailView.tsx'),
  ]);

  assert.match(card, /getCultureTimingStatus/);
  assert.match(detail, /getCultureTimingStatus/);
  assert.doesNotMatch(card, /const getDDayText/);
  assert.doesNotMatch(detail, /const getDDayText/);
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

test('map detail sheet delegates image rail and information sections to dedicated components', async () => {
  const [content, imageRail, sections] = await Promise.all([
    readProjectFile('../src/components/Map/MapDetailSheetContent.tsx'),
    readProjectFile('../src/components/Map/MapDetailImageRail.tsx'),
    readProjectFile('../src/components/Map/MapDetailInformationSections.tsx'),
  ]);

  assert.match(content, /MapDetailImageRail/);
  assert.match(content, /MapDetailInformationSections/);
  assert.doesNotMatch(content, /failedAdditionalImages\[image\.url\]|<details open|이용 안내/);
  assert.match(imageRail, /failedAdditionalImages\[image\.url\]/);
  assert.match(sections, /<details open/);
  assert.match(sections, /이용 안내/);
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

test('culture detail view delegates header, actions, and content sections to dedicated components', async () => {
  const [detailView, header, actions, sections] = await Promise.all([
    readProjectFile('../src/components/CultureDetail/CultureDetailView.tsx'),
    readProjectFile('../src/components/CultureDetail/CultureDetailHeader.tsx'),
    readProjectFile('../src/components/CultureDetail/CultureDetailActions.tsx'),
    readProjectFile('../src/components/CultureDetail/CultureDetailSections.tsx'),
  ]);

  assert.match(detailView, /CultureDetailHeader/);
  assert.match(detailView, /CultureDetailDesktopActions/);
  assert.match(detailView, /CultureDetailMobileActions/);
  assert.match(detailView, /CultureDetailSections/);
  assert.doesNotMatch(detailView, /navigator\.share|router\.back|map\.kakao\.com|map\.naver\.com|<details open/);
  assert.match(header, /navigator\.share/);
  assert.match(actions, /createCultureMapExploreUrl/);
  assert.match(sections, /map\.kakao\.com/);
  assert.match(sections, /<details open/);
});

test('culture list and detail presentation use distinct formatted types', async () => {
  const [types, feed, detail, mapData] = await Promise.all([
    readProjectFile('../src/types/culture.ts'),
    readProjectFile('../src/components/Feed/FeedView.tsx'),
    readProjectFile('../src/components/CultureDetail/CultureDetailView.tsx'),
    readProjectFile('../src/hooks/useCultureMapData.ts'),
  ]);

  assert.match(types, /FormattedCultureListItem = CultureListItemDto & CultureDisplayFields/);
  assert.match(types, /FormattedCultureDetail = Culture & CultureDisplayFields/);
  assert.doesNotMatch(types, /Partial<Culture>/);
  assert.match(feed, /FormattedCultureListItem/);
  assert.match(mapData, /FormattedCultureListItem/);
  assert.match(detail, /FormattedCultureDetail/);
});

test('D1 culture projections and row mapping live in repository modules', async () => {
  const [repository, readModel, syncDetailRepository, detailPublisher, cultureList, cultureListRepository] = await Promise.all([
    readProjectFile('../src/services/cultureD1Repository.ts'),
    readProjectFile('../src/services/cultureReadModel.ts'),
    readProjectFile('../src/services/cultureSyncDetailRepository.ts'),
    readProjectFile('../src/services/cultureDetailReadModelPublisher.ts'),
    readProjectFile('../src/services/cultureList.ts'),
    readProjectFile('../src/services/cultureListRepository.ts'),
  ]);

  assert.match(repository, /CULTURE_CONTENT_SELECT/);
  assert.match(repository, /CULTURE_DETAIL_SELECT/);
  assert.match(repository, /toCultureTourApiDetailsRow/);
  assert.match(repository, /toCultureListItem/);
  assert.doesNotMatch(repository, /as unknown as/);
  assert.match(readModel, /cultureD1Repository/);
  assert.match(syncDetailRepository, /cultureD1Repository/);
  assert.match(detailPublisher, /cultureD1Repository/);
  assert.match(cultureList, /queryCultureListFromD1/);
  assert.match(cultureListRepository, /toCultureListItem/);
  assert.doesNotMatch(readModel, /cultures\.homepage_detail_address AS/);
  assert.doesNotMatch(syncDetailRepository, /cultures\.homepage_detail_address AS/);
  assert.doesNotMatch(detailPublisher, /details\.common_json AS/);
});

test('culture service keeps TourAPI normalization separate from domain row mapping', async () => {
  const [service, tourApiMapper, domainMapper] = await Promise.all([
    readProjectFile('../src/services/cultureService.ts'),
    readProjectFile('../src/services/cultureTourApiMapper.ts'),
    readProjectFile('../src/services/cultureDomainMapper.ts'),
  ]);

  assert.match(service, /cultureTourApiMapper/);
  assert.match(service, /cultureDomainMapper/);
  assert.ok(service.split(/\r?\n/).length < 20);
  assert.match(tourApiMapper, /mapTourApiFestivalToCulture/);
  assert.match(tourApiMapper, /normalizeCultureCoordinates/);
  assert.doesNotMatch(tourApiMapper, /mapCultureRowToCulture/);
  assert.match(domainMapper, /mapCultureRowToCulture/);
  assert.match(domainMapper, /mapCultureListItemToCulture/);
  assert.doesNotMatch(domainMapper, /createTourApiSourceKey/);
});

test('culture list service delegates D1 querying and revision hashing to a repository', async () => {
  const [service, repository] = await Promise.all([
    readProjectFile('../src/services/cultureList.ts'),
    readProjectFile('../src/services/cultureListRepository.ts'),
  ]);

  assert.match(service, /queryCultureListFromD1/);
  assert.match(service, /cultureListRepository/);
  assert.doesNotMatch(service, /SELECT id, classification|Math\.imul/);
  assert.match(repository, /SELECT cultures\.id AS id, cultures\.classification AS classification/);
  assert.match(repository, /Math\.imul/);
  assert.match(repository, /createCultureListItemRevision/);
});

test('local culture reads never fall through to the production public API', async () => {
  const service = await readProjectFile('../src/services/cultureList.ts');

  assert.doesNotMatch(service, /culturewalk\.gangmin\.dev\/api\/cultures/);
  assert.doesNotMatch(service, /Local dev proxy fallback/);
  assert.doesNotMatch(service, /fetch\(`\$\{prodUrl\}\/api\/cultures`\)/);
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
  assert.match(scheduledJobs, /const result = await refreshStaleCachedTourApiDetails/);
  assert.match(scheduledJobs, /result\.refreshedCultureIds/);
});

test('manual and scheduled sync paths share one initialize-lock lifecycle helper', async () => {
  const [lock, initializeRoute, scheduledJobs] = await Promise.all([
    readProjectFile('../src/services/cultureSyncLock.ts'),
    readProjectFile('../src/app/api/initialize/route.ts'),
    readProjectFile('../src/server/cultureScheduledJobs.ts'),
  ]);

  assert.match(lock, /runWithInitializeLock/);
  assert.match(initializeRoute, /runWithInitializeLock/);
  assert.match(scheduledJobs, /runWithInitializeLock/);
  assert.doesNotMatch(initializeRoute, /acquireInitializeLock|startInitializeLockHeartbeat|releaseInitializeLock/);
  assert.doesNotMatch(scheduledJobs, /acquireInitializeLock|startInitializeLockHeartbeat|releaseInitializeLock/);
});

test('culture detail sync delegates D1 persistence and read-model publishing to dedicated modules', async () => {
  const [syncDetails, repository, publisher] = await Promise.all([
    readProjectFile('../src/services/cultureSyncDetails.ts'),
    readProjectFile('../src/services/cultureSyncDetailRepository.ts'),
    readProjectFile('../src/services/cultureDetailReadModelPublisher.ts'),
  ]);

  assert.match(syncDetails, /readStaleCultureDetailRows/);
  assert.match(syncDetails, /persistCultureDetailRefreshSuccess/);
  assert.match(syncDetails, /persistCultureDetailRefreshFailure/);
  assert.match(syncDetails, /publishCurrentCultureDetailReadModels/);
  assert.doesNotMatch(syncDetails, /INSERT INTO culture_tour_api_details|UPDATE cultures SET\s*homepage_detail_address|SELECT .*CULTURE_DETAIL_SELECT/);
  assert.match(repository, /INSERT INTO culture_tour_api_details/);
  assert.match(repository, /detail_sync_fail_count = \?/);
  assert.match(publisher, /CULTURE_DETAIL_SELECT/);
  assert.match(publisher, /writeCultureDetailCache/);
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

test('feed hook delegates request params, cache keys, and page merging to pure client helpers', async () => {
  const [hook, requestHelpers] = await Promise.all([
    readProjectFile('../src/hooks/useCultureFeed.ts'),
    readProjectFile('../src/utils/cultureFeedClientRequest.ts'),
  ]);

  assert.match(hook, /createCultureFeedRequestParams/);
  assert.match(hook, /createCultureFeedClientCacheKey/);
  assert.match(hook, /mergeCultureFeedItems/);
  assert.doesNotMatch(hook, /existingIds|params: Record<string, string \| number>|toFixed\(4\)/);
  assert.match(requestHelpers, /createCultureFeedClientFilters/);
  assert.match(requestHelpers, /createCultureFeedRequestParams/);
  assert.match(requestHelpers, /mergeCultureFeedItems/);
});

test('feed cache restoration starts a fresh request session before reading cached data', async () => {
  const hook = await readProjectFile('../src/hooks/useCultureFeed.ts');

  assert.match(hook, /startCultureFeedRequestSession/);
  const sessionIndex = hook.indexOf('startCultureFeedRequestSession(');
  const cacheReadIndex = hook.indexOf('cultureFeedClientCache.read(filterKey)');
  assert.ok(sessionIndex >= 0 && cacheReadIndex >= 0 && sessionIndex < cacheReadIndex);
  assert.match(hook, /if \(cachedEntry\)[\s\S]*?controller\.abort\(\)/);
});

test('map navigation uses one URL builder for root and detail exploration routes', async () => {
  const [routeUtils, mapView, controller, floatingButton] = await Promise.all([
    readProjectFile('../src/utils/mapRoute.ts'),
    readProjectFile('../src/components/Map/MapView.tsx'),
    readProjectFile('../src/hooks/useMapDashboardController.ts'),
    readProjectFile('../src/components/Feed/FloatingMapButton.tsx'),
  ]);

  assert.match(routeUtils, /createMapExploreUrl/);
  assert.match(routeUtils, /serializeMapExploreStateToSearch/);
  assert.match(mapView, /createMapExploreUrl/);
  assert.match(controller, /createMapExploreUrl/);
  assert.match(floatingButton, /createMapExploreUrl/);
  assert.doesNotMatch(mapView, /serializeMapExploreStateToSearch/);
  assert.doesNotMatch(controller, /serializeMapExploreStateToSearch/);
  assert.doesNotMatch(floatingButton, /serializeMapExploreStateToSearch/);
});

test('culture utils facade separates detail-domain helpers from list display formatting', async () => {
  const [facade, detailUtils, displayUtils] = await Promise.all([
    readProjectFile('../src/utils/cultureUtils.ts'),
    readProjectFile('../src/utils/cultureDetailUtils.ts'),
    readProjectFile('../src/utils/cultureDisplayUtils.ts'),
  ]);

  assert.ok(facade.split(/\r?\n/).length < 10);
  assert.match(facade, /cultureDetailUtils/);
  assert.match(facade, /cultureDisplayUtils/);
  assert.match(detailUtils, /splitCultureContact/);
  assert.match(detailUtils, /createCultureDetailSignature/);
  assert.doesNotMatch(detailUtils, /formatCultureData/);
  assert.match(displayUtils, /formatCultureData/);
  assert.match(displayUtils, /getCulturePriceTone/);
  assert.doesNotMatch(displayUtils, /splitCultureContact|createCultureDetailSignature/);
});

test('unused theme, skeleton, and map location wrappers stay out of the production surface', async () => {
  const [packageJson, mapControls] = await Promise.all([
    readProjectFile('../package.json'),
    readProjectFile('../src/components/Map/MapControls.tsx'),
  ]);

  assert.doesNotMatch(packageJson, /next-themes|react-loading-skeleton/);
  assert.doesNotMatch(mapControls, /MapLocationControl|LocationToggle/);
});

test('client data loading avoids heavyweight single-purpose runtime dependencies', async () => {
  const [packageJson, feed, mapData, loader, displayUtils] = await Promise.all([
    readProjectFile('../package.json'),
    readProjectFile('../src/hooks/useCultureFeed.ts'),
    readProjectFile('../src/hooks/useCultureMapData.ts'),
    readProjectFile('../src/components/Loader/Loader.tsx'),
    readProjectFile('../src/utils/cultureDisplayUtils.ts'),
  ]);

  assert.doesNotMatch(packageJson, /"axios"|"react-spinners"|"date-fns"/);
  assert.match(feed, /getJson/);
  assert.match(mapData, /getJson/);
  assert.doesNotMatch(loader, /react-spinners|ClipLoader/);
  assert.doesNotMatch(displayUtils, /date-fns/);
});

test('runtime security, service worker cleanup, and cron observability stay explicit', async () => {
  const [nextConfig, layout, serviceWorker, cron, structuredLog, syncAuth, initializeRoute] = await Promise.all([
    readProjectFile('../next.config.mjs'),
    readProjectFile('../src/app/layout.tsx'),
    readProjectFile('../public/sw.js'),
    readProjectFile('../src/server/cultureScheduledJobs.ts'),
    readProjectFile('../src/server/structuredLog.ts'),
    readProjectFile('../src/server/syncAuth.ts'),
    readProjectFile('../src/app/api/initialize/route.ts'),
  ]);

  assert.match(nextConfig, /Strict-Transport-Security/);
  assert.match(nextConfig, /Content-Security-Policy/);
  assert.match(nextConfig, /frame-ancestors 'self'/);
  assert.doesNotMatch(layout, /ServiceWorkerRegistration/);
  assert.match(serviceWorker, /self\.registration\.unregister\(\)/);
  assert.doesNotMatch(serviceWorker, /addEventListener\('fetch'/);
  assert.match(cron, /culture\.snapshot\.completed/);
  assert.match(cron, /culture\.detail_refresh\.completed/);
  assert.match(structuredLog, /JSON\.stringify\(payload\)/);
  assert.match(syncAuth, /TOKEN_ENCODER/);
  assert.doesNotMatch(syncAuth, /providedToken === expectedToken/);
  assert.match(initializeRoute, /NO_STORE_CACHE_HEADERS/);
});

test('interactive filters expose semantic toggle buttons and touch-sized controls', async () => {
  const [category, filters, mobileDashboard, iconButton] = await Promise.all([
    readProjectFile('../src/components/Common/filters/CategoryChips.tsx'),
    readProjectFile('../src/components/Common/filters/ToggleControls.tsx'),
    readProjectFile('../src/components/Map/MapMobileDashboard.tsx'),
    readProjectFile('../src/components/Common/IconButton.tsx'),
  ]);

  assert.match(category, /role='group'/);
  assert.match(category, /aria-pressed={isSelected}/);
  assert.doesNotMatch(category, /role='tab'|aria-selected/);
  assert.match(filters, /min-h-11/);
  assert.match(mobileDashboard, /<button[\s\S]*aria-label='행사 목록 접고 지도 보기'/);
  assert.doesNotMatch(mobileDashboard, /role='button'[\s\S]*tabIndex={0}/);
  assert.match(iconButton, /aria-hidden='true'/);
});

test('information styles keep the entrypoint small and delegate base/editorial layers to partials', async () => {
  const source = await readProjectFile('../src/styles/_information.scss');

  assert.match(source, /@use '.\/information-base';/);
  assert.match(source, /@use '.\/information-editorial';/);
  assert.match(source, /@include information-base\.styles;/);
  assert.match(source, /@include information-editorial\.styles;/);
  assert.ok(source.split(/\r?\n/).length < 20);
});

test('root layout delegates metadata, structured data, and theme bootstrap configuration', async () => {
  const [layout, config] = await Promise.all([
    readProjectFile('../src/app/layout.tsx'),
    readProjectFile('../src/app/rootLayoutConfig.ts'),
  ]);

  assert.match(layout, /rootLayoutConfig/);
  assert.doesNotMatch(layout, /GOOGLE_SITE_VERIFICATION|NAVER_SITE_VERIFICATION|BRAND_ASSET_VERSION|@graph/);
  assert.match(config, /rootMetadata/);
  assert.match(config, /rootViewport/);
  assert.match(config, /WEBSITE_STRUCTURED_DATA/);
  assert.doesNotMatch(config, /THEME_INITIALIZER_SCRIPT/);
  assert.match(layout, /src='\/assets\/scripts\/theme-initializer\.js'/);
  assert.ok(layout.split(/\r?\n/).length < 140);
});

test('culture and map detail pages share one SEO and Event JSON-LD builder', async () => {
  const [culturePage, mapPage, seo, sitemap] = await Promise.all([
    readProjectFile('../src/app/cultures/[id]/page.tsx'),
    readProjectFile('../src/app/map/[id]/page.tsx'),
    readProjectFile('../src/server/cultureDetailSeo.ts'),
    readProjectFile('../src/app/sitemap.ts'),
  ]);

  assert.match(culturePage, /createCultureDetailMetadata/);
  assert.match(culturePage, /createCultureEventStructuredData/);
  assert.match(mapPage, /createCultureDetailMetadata/);
  assert.match(mapPage, /createCultureEventStructuredData/);
  assert.doesNotMatch(culturePage, /EventScheduled|InStock|SITE_URL/);
  assert.doesNotMatch(mapPage, /EventCompleted|parseOfferPrice|SITE_URL/);
  assert.match(seo, /getCultureCanonicalUrl/);
  assert.doesNotMatch(sitemap, /`\$\{SITE_URL\}\/map\/\$\{row\.id\}`/);
});

test('filter controls facade delegates independent control groups to focused modules', async () => {
  const [facade, category, region, toggles, sort] = await Promise.all([
    readProjectFile('../src/components/Common/FilterControls.tsx'),
    readProjectFile('../src/components/Common/filters/CategoryChips.tsx'),
    readProjectFile('../src/components/Common/filters/RegionSelect.tsx'),
    readProjectFile('../src/components/Common/filters/ToggleControls.tsx'),
    readProjectFile('../src/components/Common/filters/SortControl.tsx'),
  ]);

  assert.ok(facade.split(/\r?\n/).length < 20);
  assert.match(facade, /filters\/CategoryChips/);
  assert.match(facade, /filters\/RegionSelect/);
  assert.match(facade, /filters\/ToggleControls/);
  assert.match(facade, /filters\/SortControl/);
  assert.match(category, /CULTURE_CATEGORY_OPTIONS/);
  assert.match(region, /지역 필터/);
  assert.match(toggles, /내 주변/);
  assert.match(sort, /거리순/);
});

test('TourAPI detail facade separates normalization from persistence serialization', async () => {
  const [facade, normalization, storage] = await Promise.all([
    readProjectFile('../src/services/tourApiDetails.ts'),
    readProjectFile('../src/services/tourApiDetailNormalization.ts'),
    readProjectFile('../src/services/tourApiDetailStorage.ts'),
  ]);

  assert.match(facade, /tourApiDetailNormalization/);
  assert.match(facade, /tourApiDetailStorage/);
  assert.doesNotMatch(facade, /JSON\.parse|normalizeTourApiText/);
  assert.match(normalization, /normalizeTourApiDetails/);
  assert.match(normalization, /createTourApiDetailSummary/);
  assert.doesNotMatch(normalization, /CultureTourApiDetailsRow|JSON\.parse/);
  assert.match(storage, /parseStoredTourApiDetails/);
  assert.match(storage, /serializeTourApiDetails/);
  assert.match(storage, /CultureTourApiDetailsRow/);
});
