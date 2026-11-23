type ServerTimingMetric = {
  name: string;
  durationMs: number;
  description?: string;
};

const normalizeDuration = (value: number) =>
  Number.isFinite(value) && value >= 0 ? Math.round(value * 10) / 10 : 0;

const sanitizeToken = (value: string) => value.replace(/[^a-zA-Z0-9_.-]/g, '-');

const sanitizeDescription = (value: string) => value.replace(/["\\\r\n]/g, ' ').slice(0, 120);

export const createServerTimingHeader = (metrics: readonly ServerTimingMetric[]) =>
  metrics
    .map(metric => {
      const name = sanitizeToken(metric.name);
      const duration = normalizeDuration(metric.durationMs);
      const description = metric.description ? `;desc="${sanitizeDescription(metric.description)}"` : '';
      return `${name};dur=${duration}${description}`;
    })
    .join(', ');

export const withServerTiming = <T extends Record<string, string>>(
  headers: T,
  metrics: readonly ServerTimingMetric[]
): T & { 'Server-Timing': string } => ({
  ...headers,
  'Server-Timing': createServerTimingHeader(metrics),
});

export const withWorkerResponseTiming = (request: Request, response: Response, durationMs: number) => {
  if (!['GET', 'HEAD'].includes(request.method)) return response;
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith('/_next/') || pathname.startsWith('/assets/')) return response;
  const headers = new Headers(response.headers);
  const existing = headers.get('Server-Timing');
  const worker = createServerTimingHeader([{ name: 'worker-response', durationMs }]);
  headers.set('Server-Timing', existing ? `${existing}, ${worker}` : worker);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
