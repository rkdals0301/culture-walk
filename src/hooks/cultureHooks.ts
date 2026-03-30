import { setCulture, setCultures } from '@/slices/culturesSlice';
import { Culture } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';
import { formatCultureData } from '@/utils/cultureUtils';
import useApiError from '@/hooks/useApiError';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

export const useCultures = (enabled: boolean = true) => {
  const dispatch = useDispatch();
  const { handleError } = useApiError();
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    if (!enabled) {
      setIsLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }

    const fetchCultures = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get('/api/cultures');
        const formattedCultures = formatCultureData(response.data);

        if (!active) {
          return;
        }

        dispatch(setCultures(formattedCultures));
      } catch (caughtError) {
        if (!active) {
          return;
        }

        const normalizedError = caughtError instanceof Error ? caughtError : new Error('문화 목록 조회에 실패했습니다.');
        setError(normalizedError);
        handleError(caughtError);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void fetchCultures();

    return () => {
      active = false;
    };
  }, [dispatch, enabled, handleError]);

  return {
    isLoading,
    error,
    isError: error !== null,
  };
};

export const useCultureById = (id: number) => {
  const dispatch = useDispatch();
  const { handleError } = useApiError();
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    if (!id) {
      setIsLoading(false);
      setError(null);
      dispatch(setCulture(null));
      return () => {
        active = false;
      };
    }

    const fetchCulture = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get(`/api/cultures/${id}`);
        const formattedCulture = formatCultureData([response.data])[0];

        if (!active) {
          return;
        }

        dispatch(setCulture(formattedCulture));
      } catch (caughtError) {
        if (!active) {
          return;
        }

        const normalizedError = caughtError instanceof Error ? caughtError : new Error('문화 상세 조회에 실패했습니다.');
        setError(normalizedError);
        handleError(caughtError);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void fetchCulture();

    return () => {
      active = false;
    };
  }, [dispatch, handleError, id]);

  return {
    isLoading,
    error,
    isError: error !== null,
  };
};
