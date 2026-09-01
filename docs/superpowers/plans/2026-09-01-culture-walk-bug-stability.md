# Culture Walk Bug Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the existing Culture Walk visual direction while fixing map loading, route error separation, exploration state restoration, geolocation failure handling, operational-data resilience, and accessibility behavior.

**Architecture:** Keep the existing map/list/detail components and semantic tokens. Extract the Kakao SDK lifecycle and geolocation lifecycle into small client-safe utilities, keep exploration state in the existing CultureProvider so route transitions do not discard it, and make the map route shell explicit on valid map pages so a dynamic not-found page is not wrapped by the map workspace. Add only the minimum status controls required to recover from failures.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Kakao Maps JavaScript SDK, Node test runner through `tsx`, in-app Browser validation.

**Spec:** `C:/Users/User/.codex/attachments/6f251bc0-9b69-40de-92c4-bd3d34fbe120/pasted-text.txt`

## Global Constraints

- Current layout and Visual Direction must be kept wherever the bug fix does not require a structural change.
- Do not redesign colors, typography, radius, shadow, spacing, or create a new design system.
- Do not remove existing functionality or create a demo page.
- Fix root causes in state management and lifecycle code rather than masking symptoms with CSS.
- Verify actual browser behavior at 375, 390, 768, 1024, 1280, and 1440 widths in Light and Dark mode.
- Do not commit, push, or deploy.

---

### Task 1: Add pure route and exploration-state regression coverage

**Files:**
- Modify: `tests/mapRoute.test.ts`
- Create: `src/utils/exploreState.ts`
- Test: `tests/exploreState.test.ts`

**Interfaces:**
- `src/utils/exploreState.ts` produces `MapSortMode`, `LocationStatus`, `MapFilterState`, `getMapFilterSignature`, and `getLocationStatus`.
- Route parsing must return `null` for `/map`, non-numeric IDs, zero, decimals, suffixes, and nested paths.

- [ ] **Step 1: Write failing tests for strict route parsing and state signatures**

```ts
test('rejects malformed map detail paths', () => {
  assert.equal(getMapDetailId('/map/999999'), 999999);
  assert.equal(getMapDetailId('/map/0'), null);
  assert.equal(getMapDetailId('/map/12-extra'), null);
  assert.equal(getMapDetailId('/map/12/extra'), null);
});

test('changes the filter signature when any persisted exploration condition changes', () => {
  const base = { searchQuery: '', mapCategory: 'all', mapRegion: 'all', mapFreeOnly: false, sortMode: 'date' as const };
  assert.notEqual(getMapFilterSignature(base), getMapFilterSignature({ ...base, searchQuery: '공연' }));
  assert.notEqual(getMapFilterSignature(base), getMapFilterSignature({ ...base, sortMode: 'distance' }));
});
```

- [ ] **Step 2: Run the focused tests and verify they fail for the missing helper behavior**

Run: `npm test -- tests/mapRoute.test.ts tests/exploreState.test.ts`

Expected: FAIL because the new state helper is not defined and malformed IDs are not fully rejected.

- [ ] **Step 3: Implement only the route/state helpers needed by later tasks**

```ts
export type MapSortMode = 'date' | 'distance';
export type LocationStatus = 'idle' | 'requesting' | 'success' | 'permission-denied' | 'timeout' | 'unavailable' | 'cancelled';

export const getMapFilterSignature = (state: MapFilterState) =>
  [state.searchQuery.trim(), state.mapCategory, state.mapRegion, state.mapFreeOnly ? 'free' : 'all', state.sortMode].join(':');
```

- [ ] **Step 4: Run the focused tests and confirm they pass**

Run: `npm test -- tests/mapRoute.test.ts tests/exploreState.test.ts`

Expected: PASS with no failures.

---

### Task 2: Make Kakao Maps SDK loading single-flight, diagnosable, and retryable

**Files:**
- Create: `src/utils/kakaoMapsSdk.ts`
- Modify: `src/components/Map/MapView.tsx`
- Test: `tests/kakaoMapsSdk.test.ts`

**Interfaces:**
- `loadKakaoMapsSdk(appKey: string, options?: { timeoutMs?: number }): Promise<void>` resolves only after `window.kakao.maps.load` completes.
- `resetKakaoMapsSdk()` clears only a failed loader state so a subsequent retry can replace a failed script.
- `KakaoMapsSdkError` exposes `code: 'missing-key' | 'invalid-key' | 'network' | 'timeout' | 'sdk-error'`.

- [ ] **Step 1: Write failing tests for key validation, single-flight loading, timeout, and retry cleanup**

```ts
test('rejects a missing or malformed app key before adding a script', async () => {
  await assert.rejects(() => loadKakaoMapsSdk('', { timeoutMs: 1 }), (error: unknown) => {
    return error instanceof KakaoMapsSdkError && error.code === 'missing-key';
  });
});

test('shares one pending SDK promise for concurrent callers', async () => {
  const first = loadKakaoMapsSdk('a'.repeat(32), { timeoutMs: 50 });
  const second = loadKakaoMapsSdk('a'.repeat(32), { timeoutMs: 50 });
  assert.strictEqual(first, second);
});

test('classifies a script timeout and removes the failed script before retry', async () => {
  await assert.rejects(() => loadKakaoMapsSdk('a'.repeat(32), { timeoutMs: 1 }), { code: 'timeout' });
  resetKakaoMapsSdk();
  assert.equal(document.getElementById(KAKAO_MAPS_SCRIPT_ID), null);
});
```

- [ ] **Step 2: Run the focused test and verify the loader tests fail**

Run: `npm test -- tests/kakaoMapsSdk.test.ts`

Expected: FAIL because the shared loader and error class do not exist.

- [ ] **Step 3: Implement the smallest single-flight loader**

```ts
let sdkPromise: Promise<void> | null = null;

export const loadKakaoMapsSdk = (appKey: string, options: LoaderOptions = {}) => {
  if (!appKey.trim()) return Promise.reject(new KakaoMapsSdkError('missing-key'));
  if (!isValidAppKey(appKey)) return Promise.reject(new KakaoMapsSdkError('invalid-key'));
  if (!sdkPromise) sdkPromise = loadScriptAndMaps(appKey, options).catch(error => {
    sdkPromise = null;
    throw error;
  });
  return sdkPromise;
};
```

The script must be inserted only once, attach listeners to an existing pending script, reject on `error`, reject on a bounded timer, wait for `maps.load`, and remove the failed script inside `resetKakaoMapsSdk()`.

- [ ] **Step 4: Replace the component-local loader with the shared loader**

`MapView` must store the typed SDK error, increment a retry nonce from a retry button, and keep map/list cleanup in the existing effect cleanup. It must not call the loader from more than one effect or append a second script.

- [ ] **Step 5: Run focused tests and typecheck the changed surface**

Run: `npm test -- tests/kakaoMapsSdk.test.ts tests/mapRoute.test.ts tests/exploreState.test.ts` and `npm run typecheck`

Expected: PASS.

---

### Task 3: Separate map status from API status and provide a non-blocking fallback

**Files:**
- Create: `src/components/Map/MapStatus.tsx`
- Modify: `src/components/Map/MapView.tsx`
- Modify: `src/components/Map/MapDashboard.tsx`
- Modify: `src/components/Map/MapShell.tsx`

**Interfaces:**
- `MapStatus` accepts `kind`, `message`, `detail`, `onRetry`, and `onContinueWithList`.
- Map SDK failure renders `data-status='map-error'` and `role='alert'`; API failure renders `data-status='api-error'`; a route not-found never renders either status.

- [ ] **Step 1: Add a failing component-level contract test for map recovery callbacks**

Use a lightweight DOM assertion around the status markup so the test verifies that both `다시 시도` and `목록으로 계속 보기` are present and have button roles.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm test -- tests/mapStatus.test.ts`

Expected: FAIL because `MapStatus` does not exist.

- [ ] **Step 3: Implement the minimal status component without introducing new layout primitives**

The component must use the existing `status-callout` classes and should not hide the list. `onContinueWithList` dispatches a small local event or calls a shell callback consumed by `MapDashboard` to open the existing mobile list surface.

- [ ] **Step 4: Connect `MapView` error codes to user-facing recovery**

Missing key, invalid key, network, timeout, and SDK errors must have distinct explanatory text. Retry resets the failed loader state and starts one new attempt. When the map is unavailable, list/search/filter/detail remain mounted through the sibling dashboard.

- [ ] **Step 5: Keep API errors visible only as API errors**

The existing list error and map overlay must use API-specific status markers and messages. Fix `useApiError` response parsing to read both `{ error }` and `{ message }` without changing the existing toast surface.

- [ ] **Step 6: Run focused tests and verify the map fallback in the browser**

Run: `npm test -- tests/mapStatus.test.ts`.

Browser flow: `/map` → simulate a failed loader through the browser test harness → assert the list remains usable → click `다시 시도` → assert the status returns to loading.

---

### Task 4: Keep Not Found outside the map workspace

**Files:**
- Modify: `src/app/map/layout.tsx`
- Modify: `src/app/map/page.tsx`
- Modify: `src/app/map/[id]/page.tsx`
- Modify: `src/app/map/[id]/not-found.tsx`

**Interfaces:**
- `src/app/map/layout.tsx` returns route children without unconditionally mounting `MapShell`.
- Valid `/map` and valid `/map/[id]` pages explicitly render `MapShell`.
- `/map/[id]/not-found.tsx` renders only the existing not-found content, so the map SDK and map API are not initialized for an invalid event.

- [ ] **Step 1: Add a route smoke assertion for invalid ID content**

The browser assertion must verify that `/map/999999` contains `페이지를 찾을 수 없습니다.` and does not contain `전국 문화행사 지도` map-region content or `지도 연결` map-error content.

- [ ] **Step 2: Run the smoke assertion against the current app and record the failure**

Expected: FAIL because the current `map/layout.tsx` wraps the not-found page in `MapShell`.

- [ ] **Step 3: Move the shell wrapper into only the valid map page and valid detail page**

Keep all metadata and server data loading intact. The detail page returns `<MapShell>{structuredDataAndDetail}</MapShell>` only after strict ID and active-row validation; `notFound()` remains the server route for missing rows.

- [ ] **Step 4: Verify route behavior in the browser**

Check `/map`, `/map/<valid-id>`, `/map/999999`, `/map/not-a-number`, and `/map/12-extra`. Confirm no framework overlay and no map/list request surface on the not-found page.

---

### Task 5: Persist exploration state across responsive route transitions

**Files:**
- Modify: `src/context/CultureContext.tsx`
- Modify: `src/components/Map/MapControls.tsx`
- Modify: `src/components/Map/MapDashboard.tsx`
- Modify: `src/components/Header/SearchView.tsx`
- Modify: `src/components/Header/SearchResultsOverlay.tsx`
- Modify: `src/components/Header/Header.tsx`
- Modify: `src/components/Header/CultureList.tsx`

**Interfaces:**
- `CultureProvider` owns `mapSortMode`, `locationStatus`, `locationError`, `requestLocation`, `cancelLocation`, and the last map-list scroll position.
- `MapDashboard` keeps the existing search/filter controls but reads and writes persisted state from the provider.
- `SearchView` initializes its local input from `searchQuery` and does not clear the global search on mount.

- [ ] **Step 1: Add failing state tests for search/filter/sort restoration**

```ts
test('does not reset an existing search query when the search view mounts', () => {
  const state = createExploreState({ searchQuery: '공연', mapCategory: '공연', mapRegion: '종로구', mapFreeOnly: true });
  assert.equal(state.searchQuery, '공연');
  assert.equal(state.mapCategory, '공연');
  assert.equal(state.mapRegion, '종로구');
  assert.equal(state.mapFreeOnly, true);
});
```

- [ ] **Step 2: Run the focused state tests and confirm they fail**

Run: `npm test -- tests/exploreState.test.ts`

Expected: FAIL until provider state and search initialization are connected.

- [ ] **Step 3: Move sort and location request state into `CultureProvider`**

The provider must deduplicate concurrent requests and expose a cancellation path. MapDashboard and MapFindMyLocationControl must use the same request lifecycle instead of starting separate browser requests.

- [ ] **Step 4: Restore the mobile list after detail close and browser Back**

Track the previous detail-route boolean in `MapDashboard`. When the route transitions from detail to `/map`, set the existing list sheet visible. Honor `?list=open` once, then replace it with `/map` without clearing search/filter/sort/location state.

- [ ] **Step 5: Preserve list scroll position without resetting it during detail navigation**

Add an optional scroll callback to `CultureList`; `MapDashboard` stores the last position in the provider and passes it back when the list remounts. Filter changes may intentionally scroll to the top; route-only transitions must not.

- [ ] **Step 6: Preserve filters from the global search overlay**

Use the provider’s filtered map collection in `SearchResultsOverlay` and remove the unconditional `setMapCategory('all')` / `setMapFreeOnly(false)` calls when selecting a result.

- [ ] **Step 7: Make search overlay history deterministic**

Keep the current overlay history entry behavior, but await the `popstate` completion before navigating to a selected event. Closing the detail must return to `/map?list=open`, so browser Back and explicit close converge on the same restoration path.

- [ ] **Step 8: Run focused tests and browser interaction checks**

Browser flow: mobile `/map` → open results → search → category filter → select event → detail → close → assert search/filter/result count remain → repeat with browser Back.

---

### Task 6: Make geolocation cancellable and classify every terminal state

**Files:**
- Modify: `src/utils/geo.ts`
- Modify: `src/components/Map/MapFindMyLocationControl.tsx`
- Modify: `src/components/Map/MapDashboard.tsx`
- Modify: `tests/geo.test.ts`

**Interfaces:**
- `requestCurrentLocation(options?: { timeoutMs?: number; signal?: AbortSignal }): Promise<GeoPoint>`.
- `LocationRequestError` carries `status` from `permission-denied`, `timeout`, `unavailable`, or `cancelled`.
- Existing distance functions and Korean error messages remain compatible.

- [ ] **Step 1: Add failing tests for geolocation error classification and cancellation**

```ts
test('maps aborts to the cancelled location status', () => {
  const controller = new AbortController();
  controller.abort();
  assert.equal(getGeolocationStatus(new LocationRequestError('cancelled')), 'cancelled');
});

test('does not retry after permission denial', async () => {
  let calls = 0;
  globalThis.navigator = { geolocation: { getCurrentPosition: () => { calls += 1; throw { code: 1 }; } } } as Navigator;
  await assert.rejects(() => requestCurrentLocation({ timeoutMs: 5 }));
  assert.equal(calls, 1);
});
```

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run: `npm test -- tests/geo.test.ts`

Expected: FAIL because cancellation/status helpers are not implemented.

- [ ] **Step 3: Implement one cancellable geolocation request with cleanup**

Use `watchPosition`/`clearWatch` or the existing browser API with a cancellation guard, clear all timers and listeners on every terminal path, keep the low-accuracy fallback only for timeout/unavailable, and never retry permission-denied or cancelled requests.

- [ ] **Step 4: Connect both location controls to the shared provider lifecycle**

While requesting, show the existing control in a disabled/waiting state with a `취소` action. On failure, allow normal date sorting and list exploration to continue. A successful request sets `currentLocation` and enables distance sorting.

- [ ] **Step 5: Run focused tests and browser permission/failure flows**

Verify success, permission denied, cancellation, timeout, unavailable, retry, distance sorting, and date-sort recovery with the browser geolocation API stubbed per scenario.

---

### Task 7: Harden image/data edge cases and keyboard semantics

**Files:**
- Modify: `src/components/Header/CultureItem.tsx`
- Modify: `src/components/Header/CultureList.tsx`
- Modify: `src/components/Map/MapDetailSheetClient.tsx`
- Modify: `src/components/Common/CultureImageFallback.tsx`
- Modify: `src/utils/cultureUtils.ts`

**Interfaces:**
- Missing/failed main and additional images use the existing `CultureImageFallback` and never expose a broken image icon.
- Long title/place/fee values wrap or clamp within current row/detail containers.
- Event rows expose selected state via `aria-current`/`aria-pressed` consistently; sheet close restores the triggering control when it remains connected.

- [ ] **Step 1: Add failing data normalization tests for null and invalid image fields**

```ts
test('formats an event with missing display fields without throwing', () => {
  const [formatted] = formatCultureData([{ id: 1, title: '긴 행사', mainImage: '', place: '', guName: '', isFree: '', startDate: new Date(), endDate: new Date(), classification: '', lat: 37, lng: 127 } as CultureListItem]);
  assert.equal(formatted.displayPrice, '정보 없음');
  assert.equal(formatted.displayPlace, '');
});
```

- [ ] **Step 2: Run the focused tests and confirm the edge-case assertion fails or exposes the current unsafe path**

Run: `npm test -- tests/cultureUtils.test.ts tests/tourApiDetails.test.ts`

- [ ] **Step 3: Add only the guards required for null/empty/invalid operational data**

Do not invent values. Guard image rendering, preserve empty optional fields, and use existing fallback copy (`정보 없음`) only where the current UI already uses it.

- [ ] **Step 4: Add additional-image fallback rendering and preserve focus semantics**

Failed thumbnail URLs should render the existing fallback inside the thumbnail button. Ensure Escape, Tab, Shift+Tab, Enter/Space, `aria-expanded`, `aria-pressed`, and close-focus restoration work for menu, search, detail sheet, and list rows.

- [ ] **Step 5: Run browser edge-case checks**

Use representative long title/place data and a failed image URL. Verify no horizontal overflow, no control overlap, no broken image icon, and correct keyboard focus after closing sheets.

---

### Task 8: Full verification and regression audit

**Files:**
- Modify only files required by the preceding tasks.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run static checks**

Run: `npm run typecheck`, `npm run lint`

Expected: exit code 0 with no new warnings/errors.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: exit code 0. If Windows reports a locked `.open-next` directory, stop only the local development server that owns that directory and rerun the build; do not delete source or environment files.

- [ ] **Step 4: Verify the rendered app at every requested viewport and theme**

Check 375, 390, 768, 1024, 1280, and 1440 in Light and Dark. Capture baseline/failure/recovery/detail/mobile screenshots outside the repository.

- [ ] **Step 5: Re-run every required interaction**

`/map` first load, normal map, map SDK failure, retry, list fallback, search, filter apply/reset, empty results, event selection, detail open/close, mobile result sheet, mobile detail, browser Back, valid direct detail, `/map/999999`, location success/denied/cancelled/timeout, long title/place, and failed image.

- [ ] **Step 6: Inspect final worktree**

Run: `git status --short`, `git diff --check`, and `git diff --stat`.

Expected: only intentional uncommitted source/test/plan changes; no commit, push, deploy, generated build output, environment files, or screenshots inside the repository.
