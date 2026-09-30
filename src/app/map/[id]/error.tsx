'use client';

import { useEffect } from 'react';

import CultureDetailError from '@/components/CultureDetail/CultureDetailError';
import { reportClientError } from '@/client/reportClientError';

export default function MapCultureError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    reportClientError('boundary', 'map-detail', error);
  }, [error]);

  return <CultureDetailError retry={retry} backHref='/map' backLabel='지도로 돌아가기' />;
}
