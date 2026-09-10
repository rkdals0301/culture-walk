import { expect, test as base, type Page } from '@playwright/test';

const APP_ORIGIN = 'http://127.0.0.1:3005';

const installKakaoMapsMock = async (page: Page) => {
  await page.addInitScript(() => {
    const listenerStore = new WeakMap<object, globalThis.Map<string, Set<() => void>>>();

    const getListeners = (target: object, type: string) => {
      let targetListeners = listenerStore.get(target);
      if (!targetListeners) {
        targetListeners = new globalThis.Map();
        listenerStore.set(target, targetListeners);
      }

      let listeners = targetListeners.get(type);
      if (!listeners) {
        listeners = new Set();
        targetListeners.set(type, listeners);
      }
      return listeners;
    };

    const emit = (target: object, type: string) => {
      const targetListeners = listenerStore.get(target);
      targetListeners?.get(type)?.forEach(listener => listener());
    };

    class MockLatLng {
      constructor(
        private readonly lat: number,
        private readonly lng: number
      ) {}

      getLat() {
        return this.lat;
      }

      getLng() {
        return this.lng;
      }
    }

    class MockLatLngBounds {
      private readonly points: MockLatLng[] = [];

      extend(position: MockLatLng) {
        this.points.push(position);
      }

      getSouthWest() {
        if (this.points.length === 0) return new MockLatLng(33, 124);
        return new MockLatLng(
          Math.min(...this.points.map(point => point.getLat())),
          Math.min(...this.points.map(point => point.getLng()))
        );
      }

      getNorthEast() {
        if (this.points.length === 0) return new MockLatLng(39.8, 132);
        return new MockLatLng(
          Math.max(...this.points.map(point => point.getLat())),
          Math.max(...this.points.map(point => point.getLng()))
        );
      }
    }

    class MockMap {
      readonly container: HTMLElement;
      private center: MockLatLng;
      private level: number;
      private bounds = new MockLatLngBounds();

      constructor(container: HTMLElement, options: { center: MockLatLng; level: number }) {
        this.container = container;
        this.center = options.center;
        this.level = options.level;
      }

      getLevel() {
        return this.level;
      }

      getBounds() {
        return this.bounds;
      }

      setLevel(level: number) {
        this.level = level;
        queueMicrotask(() => emit(this, 'idle'));
      }

      setCenter(position: MockLatLng) {
        this.center = position;
        queueMicrotask(() => emit(this, 'idle'));
      }

      setBounds(bounds: MockLatLngBounds) {
        this.bounds = bounds;
        queueMicrotask(() => emit(this, 'idle'));
      }

      panTo(position: MockLatLng) {
        this.center = position;
        queueMicrotask(() => emit(this, 'idle'));
      }

      setDraggable() {}

      setZoomable() {}

      relayout() {}
    }

    class MockSize {
      constructor(
        readonly width: number,
        readonly height: number
      ) {}
    }

    class MockMarkerImage {
      constructor(
        readonly src: string,
        readonly size: MockSize
      ) {}
    }

    class MockMarker {
      private map: MockMap | null = null;
      private element: HTMLButtonElement | null = null;
      private readonly title: string;

      constructor(options: { map?: MockMap | null; title?: string }) {
        this.title = options.title ?? '지도 마커';
        if (options.map) this.setMap(options.map);
      }

      setMap(map: MockMap | null) {
        this.element?.remove();
        this.element = null;
        this.map = map;
        if (!map) return;

        const marker = document.createElement('button');
        marker.type = 'button';
        marker.className = 'e2e-kakao-marker';
        marker.dataset.title = this.title;
        marker.setAttribute('aria-label', this.title);
        marker.textContent = this.title;
        marker.style.position = 'absolute';
        marker.style.left = '50%';
        marker.style.top = '50%';
        marker.style.zIndex = '2';
        marker.addEventListener('click', () => emit(this, 'click'));
        map.container.appendChild(marker);
        this.element = marker;
      }
    }

    class MockCustomOverlay {
      private map: MockMap | null = null;
      private element: HTMLElement | null = null;
      private readonly content: HTMLElement | string;

      constructor(options: { map?: MockMap | null; content: HTMLElement | string }) {
        this.content = options.content;
        if (options.map) this.setMap(options.map);
      }

      setMap(map: MockMap | null) {
        this.element?.remove();
        this.element = null;
        this.map = map;
        if (!map) return;

        if (typeof this.content === 'string') {
          const wrapper = document.createElement('div');
          wrapper.innerHTML = this.content;
          this.element = wrapper;
        } else {
          this.element = this.content;
        }

        this.element.style.position = 'absolute';
        this.element.style.left = '55%';
        this.element.style.top = '50%';
        this.element.style.zIndex = '3';
        map.container.appendChild(this.element);
      }
    }

    class MockMarkerClusterer {
      private readonly map: MockMap;
      private markers: MockMarker[] = [];

      constructor(options: { map: MockMap }) {
        this.map = options.map;
      }

      addMarkers(markers: MockMarker[]) {
        this.clear();
        this.markers = [...markers];
        this.markers.forEach(marker => marker.setMap(this.map));
      }

      clear() {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
      }

      setMap(map: MockMap | null) {
        this.markers.forEach(marker => marker.setMap(map));
      }
    }

    const event = {
      addListener(target: object, type: string, handler: () => void) {
        getListeners(target, type).add(handler);
        if (target instanceof MockMap && type === 'idle') {
          window.setTimeout(handler, 0);
        }
      },
      removeListener(target: object, type: string, handler: () => void) {
        listenerStore.get(target)?.get(type)?.delete(handler);
      },
    };

    (window as unknown as { kakao: unknown }).kakao = {
      maps: {
        LatLng: MockLatLng,
        LatLngBounds: MockLatLngBounds,
        Map: MockMap,
        Size: MockSize,
        MarkerImage: MockMarkerImage,
        Marker: MockMarker,
        CustomOverlay: MockCustomOverlay,
        MarkerClusterer: MockMarkerClusterer,
        event,
        load(callback: () => void) {
          queueMicrotask(callback);
        },
      },
    };
  });
};

type AppFixtures = {
  appDiagnostics: void;
};

export const test = base.extend<AppFixtures>({
  appDiagnostics: [
    async ({ page }, use) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      const requestFailures: string[] = [];

      await installKakaoMapsMock(page);

      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('requestfailed', request => {
        const failure = request.failure();
        if (!failure) return;
        if (failure.errorText.includes('ERR_ABORTED') || failure.errorText.includes('NS_BINDING_ABORTED')) return;

        const url = new URL(request.url());
        if (url.origin === APP_ORIGIN) requestFailures.push(`${request.method()} ${url.pathname}: ${failure.errorText}`);
      });

      await use();

      expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([]);
      expect(consoleErrors, `Unexpected console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
      expect(requestFailures, `Unexpected same-origin request failures:\n${requestFailures.join('\n')}`).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
