import { logEvent } from './structuredLog';

export const PUBLIC_REQUEST_SLOW_MS = 750;

const SAFE_REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,96}$/;

export type RequestCorrelationSource = 'cf-ray' | 'x-request-id' | 'generated';

export interface RequestCorrelation {
  requestId: string;
  source: RequestCorrelationSource;
}

const readSafeHeader = (request: Request, name: string) => {
  const value = request.headers.get(name)?.trim();
  return value && SAFE_REQUEST_ID_PATTERN.test(value) ? value : null;
};

export const resolveRequestCorrelation = (request: Request): RequestCorrelation => {
  const cfRay = readSafeHeader(request, 'cf-ray');
  if (cfRay) return { requestId: cfRay, source: 'cf-ray' };

  const supplied = readSafeHeader(request, 'x-request-id');
  if (supplied) return { requestId: supplied, source: 'x-request-id' };

  return { requestId: crypto.randomUUID(), source: 'generated' };
};

export const classifyPublicRequestObservation = (
  status: number,
  durationMs: number
): 'warn' | 'error' | null => {
  if (status >= 500) return 'error';
  if (durationMs >= PUBLIC_REQUEST_SLOW_MS) return 'warn';
  return null;
};

export const logPublicRequestObservation = (options: {
  correlation: RequestCorrelation;
  route: string;
  status: number;
  durationMs: number;
  dataSource?: string | null;
}) => {
  const level = classifyPublicRequestObservation(options.status, options.durationMs);
  if (!level) return;

  logEvent(level, 'http.public_request.observed', {
    requestId: options.correlation.requestId,
    requestIdSource: options.correlation.source,
    route: options.route,
    status: options.status,
    durationMs: Math.round(options.durationMs * 10) / 10,
    dataSource: options.dataSource ?? null,
    slowThresholdMs: PUBLIC_REQUEST_SLOW_MS,
  });
};
