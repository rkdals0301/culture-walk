'use client';

import { useCultureContext } from '@/context/CultureContext';
import type { MapSortMode } from '@/utils/exploreState';
import { getGeolocationErrorMessage, LocationRequestError } from '@/utils/geo';

import { useCallback } from 'react';
import { toast } from 'react-toastify';

const showLocationError = (error: unknown) => {
  if (error instanceof LocationRequestError && error.status === 'cancelled') {
    toast.info(getGeolocationErrorMessage(error));
    return;
  }
  toast.error(getGeolocationErrorMessage(error));
};

export const useExploreLocationControls = () => {
  const {
    cancelLocation,
    currentLocation,
    locationStatus,
    mapSortMode,
    requestLocation,
    setCurrentLocation,
    setMapSortMode,
  } = useCultureContext();

  const requestLocationWithFeedback = useCallback(async () => {
    try {
      return await requestLocation();
    } catch (error) {
      showLocationError(error);
      return null;
    }
  }, [requestLocation]);

  const toggleLocation = useCallback(async () => {
    if (locationStatus === 'requesting') {
      cancelLocation();
      return;
    }
    if (currentLocation) {
      setCurrentLocation(null);
      if (mapSortMode === 'distance') setMapSortMode('date');
      return;
    }
    await requestLocationWithFeedback();
  }, [cancelLocation, currentLocation, locationStatus, mapSortMode, requestLocationWithFeedback, setCurrentLocation, setMapSortMode]);

  const changeSortMode = useCallback(async (nextMode: MapSortMode) => {
    if (nextMode === 'date') {
      setMapSortMode('date');
      return;
    }
    if (currentLocation) {
      setMapSortMode('distance');
      return;
    }
    const location = await requestLocationWithFeedback();
    if (location) setMapSortMode('distance');
  }, [currentLocation, requestLocationWithFeedback, setMapSortMode]);

  return {
    changeSortMode,
    currentLocation,
    isLocating: locationStatus === 'requesting',
    requestLocationWithFeedback,
    toggleLocation,
  };
};
