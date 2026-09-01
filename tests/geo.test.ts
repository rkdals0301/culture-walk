import {
  calculateDistanceMeters,
  formatDistance,
  getGeolocationStatus,
  LocationRequestError,
  requestCurrentLocation,
} from '../src/utils/geo';

import assert from 'node:assert/strict';
import test from 'node:test';

test('동일한 좌표의 거리는 0이다', () => {
  const point = { lat: 37.5665, lng: 126.978 };
  assert.equal(calculateDistanceMeters(point, point), 0);
});

test('서울시청과 경복궁 사이 거리를 계산한다', () => {
  const cityHall = { lat: 37.5665, lng: 126.978 };
  const gyeongbokgung = { lat: 37.5796, lng: 126.977 };
  const distance = calculateDistanceMeters(cityHall, gyeongbokgung);

  assert.ok(distance > 1400 && distance < 1600);
  assert.equal(formatDistance(distance), '1.5km');
});

test('1km 미만 거리를 10m 단위로 표시한다', () => {
  assert.equal(formatDistance(347), '350m');
});

test('위치 요청 취소를 cancelled 상태로 분류한다', () => {
  assert.equal(getGeolocationStatus(new LocationRequestError('cancelled')), 'cancelled');
});

test('권한 거부 뒤에는 저정확도 위치 요청을 재시도하지 않는다', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let calls = 0;

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      geolocation: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
          calls += 1;
          error({ code: 1, message: 'permission denied' } as GeolocationPositionError);
        },
      },
    },
  });

  try {
    await assert.rejects(
      () => requestCurrentLocation({ timeoutMs: 5 }),
      (error: unknown) => error instanceof LocationRequestError && error.status === 'permission-denied'
    );
    assert.equal(calls, 1);
  } finally {
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', originalNavigator);
    } else {
      Reflect.deleteProperty(globalThis, 'navigator');
    }
  }
});
