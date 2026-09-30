import { getRuntimeDeps } from '@/server/cloudflare';
import { isDeclaredRequestBodyTooLarge, readBoundedRequestBody } from '@/server/boundedRequestBody';
import { logEvent } from '@/server/structuredLog';
import { isTelemetryRequestRateLimited } from '@/server/telemetryRateLimit';
import { parseClientErrorTelemetry } from '@/utils/clientErrorTelemetry';

const MAX_CLIENT_ERROR_BODY_BYTES = 1_024;

const noStoreHeaders = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
  if (isDeclaredRequestBodyTooLarge(request, MAX_CLIENT_ERROR_BODY_BYTES)) {
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

  const bodyResult = await readBoundedRequestBody(request, MAX_CLIENT_ERROR_BODY_BYTES);
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

  const telemetry = parseClientErrorTelemetry(parsed);
  if (!telemetry) return new Response(null, { status: 400, headers: noStoreHeaders });

  logEvent('error', 'client.error', { ...telemetry });
  return new Response(null, { status: 204, headers: noStoreHeaders });
}
