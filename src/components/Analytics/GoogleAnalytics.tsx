'use client';

import { useEffect } from 'react';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

interface GoogleAnalyticsProps {
  measurementId?: string;
}

const GoogleAnalytics = ({ measurementId }: GoogleAnalyticsProps) => {
  const pathname = usePathname();

  useEffect(() => {
    if (!measurementId || typeof window.gtag !== 'function') {
      return;
    }

    const query = window.location.search.replace(/^\?/, '');
    const pagePath = query ? `${pathname}?${query}` : pathname;

    window.gtag('config', measurementId, {
      page_path: pagePath,
      page_location: window.location.href,
    });
  }, [measurementId, pathname]);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy='afterInteractive'
      />
      <Script
        id='google-analytics'
        strategy='afterInteractive'
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${measurementId}', { send_page_view: false });
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;
