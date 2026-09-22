import { logEvent } from '@/server/structuredLog';
import { parseWebVitalPayload } from '@/server/webVitals';

const MAX_BODY_BYTES = 2_048;

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length === 0 || body.length > MAX_BODY_BYTES) {
    return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const metric = parseWebVitalPayload(parsed);
  if (!metric) {
    return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  logEvent('info', 'performance.web_vital', { ...metric });
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
