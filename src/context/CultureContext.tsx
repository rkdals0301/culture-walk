'use client';

import useApiError from '@/hooks/useApiError';
import { FormattedCulture } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';
import { CultureCategoryKey, isFreeCulture, matchesCultureCategory } from '@/utils/cultureCategory';
import { formatCultureData } from '@/utils/cultureUtils';
import type { LocationStatus, MapSortMode } from '@/utils/exploreState';
import { GeoPoint, LocationRequestError, requestCurrentLocation } from '@/utils/geo';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface CultureContextValue {
  culture: FormattedCulture | null;
  cultures: FormattedCulture[];
  filteredCultures: FormattedCulture[];
  mapCultures: FormattedCulture[];
  searchQuery: string;
  mapCategory: CultureCategoryKey;
  mapRegion: string;
  mapFreeOnly: boolean;
  currentLocation: GeoPoint | null;
  mapSortMode: MapSortMode;
  locationStatus: LocationStatus;
  locationError: LocationRequestError | null;
  mapListScrollTop: number;
  isCulturesLoading: boolean;
  culturesError: Error | null;
  isCultureLoading: boolean;
  cultureError: Error | null;
  setSearchQuery: (query: string) => void;
  setMapCategory: (category: CultureCategoryKey) => void;
  setMapRegion: (region: string) => void;
  setMapFreeOnly: (freeOnly: boolean) => void;
  setCurrentLocation: (location: GeoPoint | null) => void;
  setMapSortMode: (mode: MapSortMode) => void;
  requestLocation: () => Promise<GeoPoint | null>;
  cancelLocation: () => void;
  setMapListScrollTop: (scrollTop: number) => void;
  resetMapFilters: () => void;
  loadCultures: (options?: { force?: boolean }) => Promise<void>;
  loadCultureById: (id: number) => Promise<void>;
}

const CultureContext = createContext<CultureContextValue | undefined>(undefined);

export const CultureProvider = ({ children }: { children: React.ReactNode }) => {
  const { handleError } = useApiError();

  const [culture, setCultureState] = useState<FormattedCulture | null>(null);
  const [cultures, setCulturesState] = useState<FormattedCulture[]>([]);
  const [searchQuery, setSearchQueryState] = useState('');
  const [mapCategory, setMapCategory] = useState<CultureCategoryKey>('all');
  const [mapRegion, setMapRegion] = useState('all');
  const [mapFreeOnly, setMapFreeOnly] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [mapSortMode, setMapSortMode] = useState<MapSortMode>('date');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationError, setLocationError] = useState<LocationRequestError | null>(null);
  const [mapListScrollTop, setMapListScrollTopState] = useState(0);
  const [isCulturesLoading, setIsCulturesLoading] = useState(false);
  const [culturesError, setCulturesError] = useState<Error | null>(null);
  const [isCultureLoading, setIsCultureLoading] = useState(false);
  const [cultureError, setCultureError] = useState<Error | null>(null);

  const culturesInFlightRef = useRef<Promise<void> | null>(null);
  const cultureRequestVersionRef = useRef(0);
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

  const loadCultures = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force ?? false;

      if (!force && cultures.length > 0) {
        setCulturesError(null);
        return;
      }

      if (culturesInFlightRef.current) {
        await culturesInFlightRef.current;
        return;
      }

      setIsCulturesLoading(true);
      setCulturesError(null);

      culturesInFlightRef.current = (async () => {
        try {
          const response = await axiosInstance.get('/api/cultures');
          const formattedCultures = formatCultureData(response.data);
          setCulturesState(formattedCultures);
        } catch (caughtError) {
          const normalizedError = caughtError instanceof Error ? caughtError : new Error('문화 목록 조회에 실패했습니다.');
          setCulturesError(normalizedError);
          handleError(caughtError);
        } finally {
          setIsCulturesLoading(false);
          culturesInFlightRef.current = null;
        }
      })();

      await culturesInFlightRef.current;
    },
    [cultures.length, handleError]
  );

  const loadCultureById = useCallback(
    async (id: number) => {
      const requestVersion = cultureRequestVersionRef.current + 1;
      cultureRequestVersionRef.current = requestVersion;

      if (!id || Number.isNaN(id)) {
        setCultureState(null);
        setIsCultureLoading(false);
        setCultureError(null);
        return;
      }

      setIsCultureLoading(true);
      setCultureError(null);

      try {
        const response = await axiosInstance.get(`/api/cultures/${id}`);
        const formattedCulture = formatCultureData([response.data])[0] ?? null;

        if (cultureRequestVersionRef.current !== requestVersion) {
          return;
        }

        setCultureState(formattedCulture);
      } catch (caughtError) {
        if (cultureRequestVersionRef.current !== requestVersion) {
          return;
        }

        const normalizedError = caughtError instanceof Error ? caughtError : new Error('문화 상세 조회에 실패했습니다.');
        setCultureError(normalizedError);
        handleError(caughtError);
      } finally {
        if (cultureRequestVersionRef.current === requestVersion) {
          setIsCultureLoading(false);
        }
      }
    },
    [handleError]
  );

  const filteredCultures = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return cultures;
    }

    return cultures.filter(cultureItem =>
      [cultureItem.title, cultureItem.guName, cultureItem.place].some(
        value => typeof value === 'string' && value.toLowerCase().includes(query)
      )
    );
  }, [cultures, searchQuery]);

  const mapCultures = useMemo(
    () =>
      filteredCultures.filter(
        cultureItem =>
          matchesCultureCategory(cultureItem.classification, mapCategory) &&
          (mapRegion === 'all' || (cultureItem.guName ?? '').split(/\s+/)[0] === mapRegion) &&
          (!mapFreeOnly || isFreeCulture(cultureItem))
      ),
    [filteredCultures, mapCategory, mapFreeOnly, mapRegion]
  );

  const resetMapFilters = useCallback(() => {
    setSearchQueryState('');
    setMapCategory('all');
    setMapRegion('all');
    setMapFreeOnly(false);
    setMapSortMode('date');
    setMapListScrollTopState(0);
  }, []);

  const value = useMemo(
    () => ({
      culture,
      cultures,
      filteredCultures,
      mapCultures,
      searchQuery,
      mapCategory,
      mapRegion,
       mapFreeOnly,
       currentLocation,
       mapSortMode,
       locationStatus,
       locationError,
       mapListScrollTop,
      isCulturesLoading,
      culturesError,
      isCultureLoading,
      cultureError,
      setSearchQuery,
      setMapCategory,
       setMapRegion,
       setMapFreeOnly,
       setCurrentLocation: updateCurrentLocation,
       setMapSortMode,
       requestLocation,
       cancelLocation,
       setMapListScrollTop,
      resetMapFilters,
      loadCultures,
      loadCultureById,
    }),
    [
      culture,
      cultures,
      filteredCultures,
      mapCultures,
      searchQuery,
      mapCategory,
      mapRegion,
       mapFreeOnly,
       currentLocation,
       mapSortMode,
       locationStatus,
       locationError,
       mapListScrollTop,
      isCulturesLoading,
      culturesError,
      isCultureLoading,
       cultureError,
       setSearchQuery,
       updateCurrentLocation,
       setMapSortMode,
       requestLocation,
       cancelLocation,
       setMapListScrollTop,
       resetMapFilters,
      loadCultures,
      loadCultureById,
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
