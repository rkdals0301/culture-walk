export const WEB_VITAL_NAMES = ['TTFB', 'FCP', 'LCP', 'CLS', 'INP', 'FID'] as const;

export type WebVitalName = (typeof WEB_VITAL_NAMES)[number];

export interface WebVitalPayload {
  id: string;
  name: WebVitalName;
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
  pathname: string;
}

const RATINGS = new Set<WebVitalPayload['rating']>(['good', 'needs-improvement', 'poor']);
const NAMES = new Set<string>(WEB_VITAL_NAMES);

const boundedString = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.length > 0 && value.length <= maxLength ? value : null;

export const parseWebVitalPayload = (value: unknown): WebVitalPayload | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;

  const id = boundedString(candidate.id, 128);
  const name = boundedString(candidate.name, 8);
  const navigationType = boundedString(candidate.navigationType, 32);
  const pathname = boundedString(candidate.pathname, 256);
  const rating = boundedString(candidate.rating, 24);
  const metricValue = candidate.value;
  const delta = candidate.delta;

  if (
    !id ||
    !name ||
    !NAMES.has(name) ||
    !navigationType ||
    !pathname ||
    !pathname.startsWith('/') ||
    !rating ||
    !RATINGS.has(rating as WebVitalPayload['rating']) ||
    typeof metricValue !== 'number' ||
    !Number.isFinite(metricValue) ||
    metricValue < 0 ||
    typeof delta !== 'number' ||
    !Number.isFinite(delta)
  ) {
    return null;
  }

  return {
    id,
    name: name as WebVitalName,
    value: metricValue,
    delta,
    rating: rating as WebVitalPayload['rating'],
    navigationType,
    pathname,
  };
};
