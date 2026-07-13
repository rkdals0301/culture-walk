export interface GeoPoint {
  lat: number;
  lng: number;
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

const getCurrentPosition = (options: PositionOptions) =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

export const requestCurrentLocation = async (): Promise<GeoPoint> => {
  if (!navigator.geolocation) {
    throw new Error('UNSUPPORTED_GEOLOCATION');
  }

  let position: GeolocationPosition;

  try {
    position = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 7000,
      maximumAge: 0,
    });
  } catch (error) {
    const geolocationError = error as GeolocationPositionError;
    if (geolocationError.code === 1) {
      throw error;
    }

    position = await getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 7000,
      maximumAge: 120000,
    });
  }

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
};

export const getGeolocationErrorMessage = (error: unknown) => {
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
