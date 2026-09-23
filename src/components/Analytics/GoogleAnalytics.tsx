'use client';

import { useEffect, useRef } from 'react';

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
  const initializedMeasurementIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!measurementId) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      ((...args: unknown[]) => {
        window.dataLayer.push(args);
      });

    if (initializedMeasurementIdRef.current !== measurementId) {
      window.gtag('js', new Date());
      window.gtag('config', measurementId, { send_page_view: false });
      initializedMeasurementIdRef.current = measurementId;
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
    <Script
      id='google-analytics-loader'
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy='afterInteractive'
    />
  );
};

export default GoogleAnalytics;
