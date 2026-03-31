'use client';

import useApiError from '@/hooks/useApiError';
import { FormattedCulture } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';
import { formatCultureData } from '@/utils/cultureUtils';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface CultureContextValue {
  culture: FormattedCulture | null;
  cultures: FormattedCulture[];
  filteredCultures: FormattedCulture[];
  searchQuery: string;
  isCulturesLoading: boolean;
  culturesError: Error | null;
  isCultureLoading: boolean;
  cultureError: Error | null;
  setSearchQuery: (query: string) => void;
  loadCultures: (options?: { force?: boolean }) => Promise<void>;
  loadCultureById: (id: number) => Promise<void>;
}

const CultureContext = createContext<CultureContextValue | undefined>(undefined);

export const CultureProvider = ({ children }: { children: React.ReactNode }) => {
  const { handleError } = useApiError();

  const [culture, setCultureState] = useState<FormattedCulture | null>(null);
  const [cultures, setCulturesState] = useState<FormattedCulture[]>([]);
  const [searchQuery, setSearchQueryState] = useState('');
  const [isCulturesLoading, setIsCulturesLoading] = useState(false);
  const [culturesError, setCulturesError] = useState<Error | null>(null);
  const [isCultureLoading, setIsCultureLoading] = useState(false);
  const [cultureError, setCultureError] = useState<Error | null>(null);

  const culturesInFlightRef = useRef<Promise<void> | null>(null);
  const cultureRequestVersionRef = useRef(0);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
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

    return cultures.filter(cultureItem => cultureItem.title.toLowerCase().includes(query));
  }, [cultures, searchQuery]);

  const value = useMemo(
    () => ({
      culture,
      cultures,
      filteredCultures,
      searchQuery,
      isCulturesLoading,
      culturesError,
      isCultureLoading,
      cultureError,
      setSearchQuery,
      loadCultures,
      loadCultureById,
    }),
    [
      culture,
      cultures,
      filteredCultures,
      searchQuery,
      isCulturesLoading,
      culturesError,
      isCultureLoading,
      cultureError,
      setSearchQuery,
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
