export interface GeoPoint {
  lat: number;
  lng: number;
}

export type LocationRequestStatus = 'permission-denied' | 'timeout' | 'unavailable' | 'cancelled';

const LOCATION_ERROR_MESSAGES: Record<LocationRequestStatus, string> = {
  'permission-denied': '위치 권한이 거부되었습니다.',
  timeout: '위치 확인 시간이 초과되었습니다.',
  unavailable: '현재 위치 정보를 사용할 수 없습니다.',
  cancelled: '위치 확인을 취소했습니다.',
};

export class LocationRequestError extends Error {
  readonly status: LocationRequestStatus;

  constructor(status: LocationRequestStatus, cause?: unknown) {
    super(LOCATION_ERROR_MESSAGES[status], { cause });
    this.name = 'LocationRequestError';
    this.status = status;
  }
}

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const calculateDistanceMeters = (from: GeoPoint, to: GeoPoint) => {
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)));
};

export const formatDistance = (distanceMeters: number) => {
  if (distanceMeters < 1000) {
    return `${Math.max(10, Math.round(distanceMeters / 10) * 10)}m`;
  }

  const distanceKilometers = distanceMeters / 1000;
  return distanceKilometers < 10 ? `${distanceKilometers.toFixed(1)}km` : `${Math.round(distanceKilometers)}km`;
};

const DEFAULT_LOCATION_TIMEOUT_MS = 7000;

const getLocationTimeoutMs = (timeoutMs?: number) =>
  typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0
    ? timeoutMs
    : DEFAULT_LOCATION_TIMEOUT_MS;

const getStatusFromPositionError = (error: unknown): LocationRequestStatus => {
  if (error instanceof LocationRequestError) {
    return error.status;
  }

  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  if (code === 1) return 'permission-denied';
  if (code === 3) return 'timeout';
  return 'unavailable';
};

const getCurrentPosition = (options: PositionOptions, timeoutMs: number, signal?: AbortSignal) =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      signal?.removeEventListener('abort', handleAbort);
    };

    const settle = <T>(callback: (value: T) => void, value: T) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      callback(value);
    };

    const handleAbort = () => {
      settle(reject, new LocationRequestError('cancelled'));
    };

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener('abort', handleAbort, { once: true });
    timeoutId = setTimeout(() => {
      settle(reject, new LocationRequestError('timeout'));
    }, timeoutMs);

    try {
      navigator.geolocation.getCurrentPosition(
        position => settle(resolve, position),
        error => settle(reject, new LocationRequestError(getStatusFromPositionError(error), error)),
        options
      );
    } catch (error) {
      settle(reject, new LocationRequestError(getStatusFromPositionError(error), error));
    }
  });

interface RequestCurrentLocationOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export const requestCurrentLocation = async ({ timeoutMs, signal }: RequestCurrentLocationOptions = {}): Promise<GeoPoint> => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new LocationRequestError('unavailable', new Error('UNSUPPORTED_GEOLOCATION'));
  }

  const requestTimeoutMs = getLocationTimeoutMs(timeoutMs);
  const deadline = Date.now() + requestTimeoutMs;
  const getAttemptTimeout = () => Math.max(1, deadline - Date.now());
  let position: GeolocationPosition;

  try {
    position = await getCurrentPosition(
      {
        enableHighAccuracy: true,
        timeout: getAttemptTimeout(),
        maximumAge: 0,
      },
      getAttemptTimeout(),
      signal
    );
  } catch (error) {
    const status = getStatusFromPositionError(error);
    if (status === 'permission-denied' || status === 'cancelled') {
      throw error instanceof LocationRequestError ? error : new LocationRequestError(status, error);
    }

    position = await getCurrentPosition(
      {
        enableHighAccuracy: false,
        timeout: getAttemptTimeout(),
        maximumAge: 120000,
      },
      getAttemptTimeout(),
      signal
    );
  }

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
};

export const getGeolocationStatus = (error: unknown): LocationRequestStatus => getStatusFromPositionError(error);

export const getGeolocationErrorMessage = (error: unknown) => {
  if (error instanceof LocationRequestError) {
    if (error.status === 'cancelled') {
      return '위치 확인을 취소했습니다.';
    }

    if (error.status === 'permission-denied') {
      return '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
    }

    if (error.status === 'timeout') {
      return '위치 확인 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    }

    return '현재 위치 정보를 사용할 수 없습니다.';
  }

  if (error instanceof Error && error.message === 'UNSUPPORTED_GEOLOCATION') {
    return '브라우저가 위치 정보 기능을 지원하지 않습니다.';
  }

  const geolocationError = error as GeolocationPositionError;
  switch (geolocationError?.code) {
    case 1:
      return '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
    case 2:
      return '현재 위치 정보를 사용할 수 없습니다.';
    case 3:
      return '위치 확인 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    default:
      return '현재 위치를 확인하지 못했습니다.';
  }
};
