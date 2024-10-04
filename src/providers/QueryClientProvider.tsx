'use client';

import useApiError from '@/hooks/useApiError';

import React, { useMemo } from 'react';

import { QueryCache, QueryClient, QueryClientProvider as ReactQueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const QueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  const { handleError } = useApiError(); // 에러 핸들러 가져오기

  // QueryClient 인스턴스 생성
  const queryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        mutations: {
          onError: handleError,
        },
      },
      queryCache: new QueryCache({
        onError: handleError,
      }),
    });
  }, [handleError]);

  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </ReactQueryClientProvider>
  );
};

export default QueryClientProvider;
