import assert from 'node:assert/strict';
import test from 'node:test';
import * as timing from '@/server/serverTiming';

test('worker timing preserves route timing and streams the existing response body', async () => {
  const append = (timing as Record<string, unknown>).withWorkerResponseTiming as
    ((request: Request, response: Response, durationMs: number) => Response);
  assert.equal(typeof append, 'function');
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('첫 화면')); controller.close(); } });
  const response = new Response(stream, { headers: { 'Content-Type': 'text/html', 'Server-Timing': 'read-model;dur=20', 'Cache-Control': 'public, max-age=60' } });
  const result = append(new Request('https://culturewalk.gangmin.dev/'), response, 41.23);
  assert.equal(result.body, stream);
  assert.equal(result.headers.get('Server-Timing'), 'read-model;dur=20, worker-response;dur=41.2');
  assert.equal(result.headers.get('Cache-Control'), 'public, max-age=60');
  assert.equal(await result.text(), '첫 화면');
});

test('worker timing avoids adding diagnostics to immutable assets and writes', () => {
  const append = (timing as Record<string, unknown>).withWorkerResponseTiming as
    ((request: Request, response: Response, durationMs: number) => Response);
  assert.equal(typeof append, 'function');
  const response = new Response('asset');
  assert.equal(append(new Request('https://culturewalk.gangmin.dev/_next/static/app.js'), response, 1), response);
  assert.equal(append(new Request('https://culturewalk.gangmin.dev/api/initialize', { method: 'POST' }), response, 1), response);
});
