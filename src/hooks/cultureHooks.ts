import { useCultureContext } from '@/context/CultureContext';

import { useEffect } from 'react';

export const useCultures = (enabled: boolean = true) => {
  const { cultures, isCulturesLoading, culturesError, loadCultures } = useCultureContext();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void loadCultures();
  }, [enabled, loadCultures]);

  return {
    isLoading: enabled ? isCulturesLoading && cultures.length === 0 : false,
    isRefreshing: enabled ? isCulturesLoading && cultures.length > 0 : false,
    error: enabled ? culturesError : null,
    isError: enabled ? culturesError !== null : false,
  };
};

export const useCultureById = (id: number) => {
  const { isCultureLoading, cultureError, loadCultureById } = useCultureContext();

  useEffect(() => {
    void loadCultureById(id);
  }, [id, loadCultureById]);

  return {
    isLoading: Boolean(id) && isCultureLoading,
    error: id ? cultureError : null,
    isError: id ? cultureError !== null : false,
  };
};
