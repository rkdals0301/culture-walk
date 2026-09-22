'use client';

import { useReportWebVitals } from 'next/web-vitals';

const SAMPLE_RATE = 0.25;
let sampleDecision: boolean | null = null;

type ReportWebVitalsCallback = Parameters<typeof useReportWebVitals>[0];

const shouldSample = () => {
  if (sampleDecision === null) {
    sampleDecision = Math.random() < SAMPLE_RATE;
  }
  return sampleDecision;
};

const reportWebVital: ReportWebVitalsCallback = metric => {
  if (!shouldSample()) return;

  const body = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
    pathname: window.location.pathname,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', new Blob([body], { type: 'application/json' }));
    return;
  }

  void fetch('/api/vitals', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  });
};

const WebVitalsReporter = () => {
  useReportWebVitals(reportWebVital);
  return null;
};

export default WebVitalsReporter;
