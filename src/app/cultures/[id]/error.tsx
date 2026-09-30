'use client';

import { useEffect } from 'react';

import CultureDetailError from '@/components/CultureDetail/CultureDetailError';
import { reportClientError } from '@/client/reportClientError';

export default function CultureError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    reportClientError('boundary', 'culture-detail', error);
  }, [error]);

  return <CultureDetailError retry={retry} backHref='/' backLabel='행사 목록으로' />;
}
