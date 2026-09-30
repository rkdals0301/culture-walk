import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseWebVitalPayload,
} from '../src/server/webVitals';
import { isDeclaredRequestBodyTooLarge, readBoundedRequestBody } from '../src/server/boundedRequestBody';

test('web vital payload accepts bounded Core Web Vitals data', () => {
  const result = parseWebVitalPayload({
    id: 'v4-123',
    name: 'LCP',
    value: 1820.4,
    delta: 1820.4,
    rating: 'good',
    navigationType: 'navigate',
    pathname: '/map',
  });

  assert.equal(result?.name, 'LCP');
  assert.equal(result?.pathname, '/map');
});

test('web vital payload rejects unknown metrics and non-route paths', () => {
  assert.equal(
    parseWebVitalPayload({
      id: 'x',
      name: 'custom',
      value: 1,
      delta: 1,
      rating: 'good',
      navigationType: 'navigate',
      pathname: '/map',
    }),
    null
  );
  assert.equal(
    parseWebVitalPayload({
      id: 'x',
      name: 'CLS',
      value: 0.01,
      delta: 0.01,
      rating: 'good',
      navigationType: 'navigate',
      pathname: 'https://example.com',
    }),
    null
  );
});

test('web vital body limit counts streamed UTF-8 bytes and cancels an oversized stream', async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('가가'));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request('https://culturewalk.example/api/vitals', {
    method: 'POST',
    body: stream,
    duplex: 'half',
  } as RequestInit);

  const result = await readBoundedRequestBody(request, 3);

  assert.deepEqual(result, { status: 'too-large' });
  assert.equal(cancelled, true);
});

test('web vital body reader accepts bytes at the limit and rejects invalid UTF-8', async () => {
  const acceptedRequest = new Request('https://culturewalk.example/api/vitals', {
    method: 'POST',
    body: '가',
  });
  assert.deepEqual(await readBoundedRequestBody(acceptedRequest, 3), { status: 'ok', text: '가' });

  const invalidRequest = new Request('https://culturewalk.example/api/vitals', {
    method: 'POST',
    body: new Uint8Array([0xc3, 0x28]),
  });
  assert.deepEqual(await readBoundedRequestBody(invalidRequest, 2), { status: 'invalid' });
});

test('declared oversized web vital bodies are rejected without consuming a stream', () => {
  const request = {
    headers: new Headers({ 'content-length': '2049' }),
    body: null,
  } as Request;

  assert.equal(isDeclaredRequestBodyTooLarge(request, 2048), true);
});
