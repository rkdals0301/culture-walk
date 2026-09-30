import { logEvent } from '@/server/structuredLog';
import { getRuntimeDeps } from '@/server/cloudflare';
import { isDeclaredRequestBodyTooLarge, readBoundedRequestBody } from '@/server/boundedRequestBody';
import { isTelemetryRequestRateLimited } from '@/server/telemetryRateLimit';
import { MAX_WEB_VITAL_BODY_BYTES, parseWebVitalPayload } from '@/server/webVitals';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
  if (isDeclaredRequestBodyTooLarge(request, MAX_WEB_VITAL_BODY_BYTES)) {
    return new Response(null, { status: 413, headers: noStoreHeaders });
  }

  const { telemetryRateLimiter } = await getRuntimeDeps();
  const rateLimitKey = request.headers.get('CF-Connecting-IP')?.trim() || 'unknown';
  if (await isTelemetryRequestRateLimited(telemetryRateLimiter, rateLimitKey)) {
    return new Response(null, {
      status: 429,
      headers: { ...noStoreHeaders, 'Retry-After': '60' },
    });
  }

  const bodyResult = await readBoundedRequestBody(request, MAX_WEB_VITAL_BODY_BYTES);
  if (bodyResult.status === 'too-large') {
    return new Response(null, { status: 413, headers: noStoreHeaders });
  }
  if (bodyResult.status !== 'ok' || bodyResult.text.length === 0) {
    return new Response(null, { status: 400, headers: noStoreHeaders });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyResult.text);
  } catch {
    return new Response(null, { status: 400, headers: noStoreHeaders });
  }

  const metric = parseWebVitalPayload(parsed);
  if (!metric) {
    return new Response(null, { status: 400, headers: noStoreHeaders });
  }

  logEvent('info', 'performance.web_vital', { ...metric });
  return new Response(null, { status: 204, headers: noStoreHeaders });
}
