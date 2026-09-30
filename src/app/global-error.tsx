'use client';

import { useEffect } from 'react';

import AppErrorFallback from '@/components/Common/AppErrorFallback';
import { reportClientError } from '@/client/reportClientError';
import '@/styles/globals.scss';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    reportClientError('boundary', 'global', error);
  }, [error]);

  return (
    <html lang='ko'>
      <body className='min-h-dvh font-pretendard'>
        <main className='min-h-dvh w-full'>
          <AppErrorFallback fullScreen retry={retry} />
        </main>
      </body>
    </html>
  );
}
