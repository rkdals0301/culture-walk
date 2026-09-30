'use client';

import { useEffect } from 'react';

import AppErrorFallback from '@/components/Common/AppErrorFallback';
import { reportClientError } from '@/client/reportClientError';

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    reportClientError('boundary', 'app', error);
  }, [error]);

  return <AppErrorFallback retry={retry} />;
}
