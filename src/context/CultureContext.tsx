'use client';

import { CultureCategoryKey } from '@/utils/cultureCategory';
import {
  type LocationStatus,
  type MapCameraState,
  type MapSortMode,
  normalizeMapCameraState,
} from '@/utils/exploreState';
import { GeoPoint, LocationRequestError, requestCurrentLocation } from '@/utils/geo';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface CultureContextValue {
  searchQuery: string;
  mapCategory: CultureCategoryKey;
  mapRegion: string;
  mapFreeOnly: boolean;
  currentLocation: GeoPoint | null;
  mapSortMode: MapSortMode;
  locationStatus: LocationStatus;
  locationError: LocationRequestError | null;
  mapListScrollTop: number;
  mapCamera: MapCameraState | null;
  setSearchQuery: (query: string) => void;
  setMapCategory: (category: CultureCategoryKey) => void;
  setMapRegion: (region: string) => void;
  setMapFreeOnly: (freeOnly: boolean) => void;
  setCurrentLocation: (location: GeoPoint | null) => void;
  setMapSortMode: (mode: MapSortMode) => void;
  requestLocation: () => Promise<GeoPoint | null>;
  cancelLocation: () => void;
  setMapListScrollTop: (scrollTop: number) => void;
  setMapCamera: (camera: MapCameraState | null) => void;
  resetMapFilters: () => void;
}

const CultureContext = createContext<CultureContextValue | undefined>(undefined);

export const CultureProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchQuery, setSearchQueryState] = useState('');
  const [mapCategory, setMapCategory] = useState<CultureCategoryKey>('all');
  const [mapRegion, setMapRegion] = useState('all');
  const [mapFreeOnly, setMapFreeOnly] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [mapSortMode, setMapSortMode] = useState<MapSortMode>('date');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationError, setLocationError] = useState<LocationRequestError | null>(null);
  const [mapListScrollTop, setMapListScrollTopState] = useState(0);
  const [mapCamera, setMapCameraState] = useState<MapCameraState | null>(null);

  const locationRequestRef = useRef<{
    controller: AbortController;
    promise: Promise<GeoPoint | null>;
  } | null>(null);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const updateCurrentLocation = useCallback((location: GeoPoint | null) => {
    setCurrentLocation(location);
    if (location) {
      setLocationStatus('success');
      setLocationError(null);
    } else {
      setLocationStatus('idle');
      setLocationError(null);
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<GeoPoint | null> => {
    if (currentLocation) {
      setLocationStatus('success');
      setLocationError(null);
      return currentLocation;
    }

    if (locationRequestRef.current) {
      return locationRequestRef.current.promise;
    }

    const controller = new AbortController();
    setLocationStatus('requesting');
    setLocationError(null);

    const promise = (async () => {
      try {
        const location = await requestCurrentLocation({ signal: controller.signal });
        updateCurrentLocation(location);
        return location;
      } catch (error) {
        const normalizedError =
          error instanceof LocationRequestError ? error : new LocationRequestError('unavailable', error);
        setLocationError(normalizedError);
        setLocationStatus(normalizedError.status);
        throw normalizedError;
      } finally {
        if (locationRequestRef.current?.controller === controller) {
          locationRequestRef.current = null;
        }
      }
    })();

    locationRequestRef.current = { controller, promise };
    return promise;
  }, [currentLocation, updateCurrentLocation]);

  const cancelLocation = useCallback(() => {
    const request = locationRequestRef.current;
    if (!request) {
      return;
    }

    setLocationStatus('cancelled');
    setLocationError(new LocationRequestError('cancelled'));
    request.controller.abort();
  }, []);

  const setMapListScrollTop = useCallback((scrollTop: number) => {
    setMapListScrollTopState(Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0);
  }, []);

  const setMapCamera = useCallback((camera: MapCameraState | null) => {
    const normalized = normalizeMapCameraState(camera);
    setMapCameraState(current => {
      if (
        current?.lat === normalized?.lat &&
        current?.lng === normalized?.lng &&
        current?.level === normalized?.level
      ) {
        return current;
      }
      return normalized;
    });
  }, []);

  const resetMapFilters = useCallback(() => {
    setSearchQueryState('');
    setMapCategory('all');
    setMapRegion('all');
    setMapFreeOnly(false);
    setMapSortMode('date');
    setMapListScrollTopState(0);
    updateCurrentLocation(null);
  }, [updateCurrentLocation]);

  const value = useMemo(
    () => ({
      searchQuery,
      mapCategory,
      mapRegion,
      mapFreeOnly,
      currentLocation,
      mapSortMode,
      locationStatus,
      locationError,
      mapListScrollTop,
      mapCamera,
      setSearchQuery,
      setMapCategory,
      setMapRegion,
      setMapFreeOnly,
      setCurrentLocation: updateCurrentLocation,
      setMapSortMode,
      requestLocation,
      cancelLocation,
      setMapListScrollTop,
      setMapCamera,
      resetMapFilters,
    }),
    [
      searchQuery,
      mapCategory,
      mapRegion,
      mapFreeOnly,
      currentLocation,
      mapSortMode,
      locationStatus,
      locationError,
      mapListScrollTop,
      mapCamera,
      setSearchQuery,
      updateCurrentLocation,
      setMapSortMode,
      requestLocation,
      cancelLocation,
      setMapListScrollTop,
      setMapCamera,
      resetMapFilters,
    ]
  );

  return <CultureContext.Provider value={value}>{children}</CultureContext.Provider>;
};

export const useCultureContext = () => {
  const context = useContext(CultureContext);
  if (!context) {
    throw new Error('useCultureContext must be used within a CultureProvider');
  }

  return context;
};
