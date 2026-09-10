import { useCultureContext } from '@/context/CultureContext';

import { useEffect } from 'react';

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
