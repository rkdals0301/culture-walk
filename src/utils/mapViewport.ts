import type { CultureMapBounds } from '@/types/culture';

/**
 * Kakao map levels increase as the camera zooms out. At and above this level
 * the map represents a country-wide view better with server-side grid counts
 * than with individual event rows.
 */
export const MAP_CLUSTER_LEVEL = 10;
export const MAP_CLUSTER_GRID_SIZE = 0.25;
export const MAP_PREFETCH_PADDING_RATIO = 0.25;

export type MapDataMode = 'clusters' | 'items';

export const getMapDataMode = (level: number): MapDataMode =>
  Number.isFinite(level) && level >= MAP_CLUSTER_LEVEL ? 'clusters' : 'items';

export const expandMapBounds = (
  bounds: CultureMapBounds,
  paddingRatio = MAP_PREFETCH_PADDING_RATIO
): CultureMapBounds => {
  const latSpan = Math.max(bounds.neLat - bounds.swLat, 0.01);
  const lngSpan = Math.max(bounds.neLng - bounds.swLng, 0.01);
  const latPadding = latSpan * paddingRatio;
  const lngPadding = lngSpan * paddingRatio;

  return {
    swLat: Math.max(-90, bounds.swLat - latPadding),
    swLng: Math.max(-180, bounds.swLng - lngPadding),
    neLat: Math.min(90, bounds.neLat + latPadding),
    neLng: Math.min(180, bounds.neLng + lngPadding),
  };
};

export const isBoundsWithin = (inner: CultureMapBounds, outer: CultureMapBounds) =>
  inner.swLat >= outer.swLat && inner.swLng >= outer.swLng && inner.neLat <= outer.neLat && inner.neLng <= outer.neLng;

export const isCoordinateWithinBounds = (lat: number, lng: number, bounds: CultureMapBounds) =>
  lat >= bounds.swLat && lat <= bounds.neLat && lng >= bounds.swLng && lng <= bounds.neLng;
