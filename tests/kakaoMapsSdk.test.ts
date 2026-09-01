import {
  KAKAO_MAPS_SCRIPT_ID,
  KakaoMapsSdkError,
  loadKakaoMapsSdk,
  resetKakaoMapsSdk,
} from '@/utils/kakaoMapsSdk';

import assert from 'node:assert/strict';
import test from 'node:test';

interface FakeScript {
  id: string;
  src: string;
  async: boolean;
  defer: boolean;
  remove: () => void;
  addEventListener: (type: string, listener: () => void, options?: { once?: boolean }) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  emit: (type: string) => void;
}

const createFakeDom = () => {
  let script: FakeScript | null = null;
  const listeners = new Map<string, Set<() => void>>();
  const fakeScript: FakeScript = {
    id: KAKAO_MAPS_SCRIPT_ID,
    src: '',
    async: false,
    defer: false,
    remove: () => {
      script = null;
    },
    addEventListener: (type, listener) => {
      const typeListeners = listeners.get(type) ?? new Set<() => void>();
      typeListeners.add(listener);
      listeners.set(type, typeListeners);
    },
    removeEventListener: (type, listener) => {
      listeners.get(type)?.delete(listener);
    },
    emit: type => {
      listeners.get(type)?.forEach(listener => listener());
    },
  };

  script = null;
  const fakeDocument = {
    getElementById: (id: string) => (id === KAKAO_MAPS_SCRIPT_ID ? script : null),
    createElement: () => fakeScript,
    head: {
      appendChild: (node: FakeScript) => {
        script = node;
      },
    },
  } as unknown as Document;
  const fakeWindow = {
    clearTimeout: globalThis.clearTimeout,
    kakao: undefined as { maps?: { load: (callback: () => void) => void } } | undefined,
    setTimeout: globalThis.setTimeout,
  };

  Object.defineProperty(globalThis, 'document', { configurable: true, value: fakeDocument });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeWindow });

  return {
    fakeScript,
    getScript: () => script,
    fakeWindow,
  };
};

const clearFakeDom = () => {
  resetKakaoMapsSdk();
  Reflect.deleteProperty(globalThis, 'document');
  Reflect.deleteProperty(globalThis, 'window');
};

test('missing and malformed app keys fail before loading a script', async () => {
  await assert.rejects(() => loadKakaoMapsSdk('', { timeoutMs: 5 }), (error: unknown) => {
    return error instanceof KakaoMapsSdkError && error.code === 'missing-key';
  });

  await assert.rejects(() => loadKakaoMapsSdk('not-a-kakao-key', { timeoutMs: 5 }), (error: unknown) => {
    return error instanceof KakaoMapsSdkError && error.code === 'invalid-key';
  });
});

test('concurrent callers share one pending SDK promise', async () => {
  const { fakeScript, fakeWindow, getScript } = createFakeDom();
  const appKey = 'a'.repeat(32);

  const first = loadKakaoMapsSdk(appKey, { timeoutMs: 50 });
  const second = loadKakaoMapsSdk(appKey, { timeoutMs: 50 });

  assert.strictEqual(first, second);
  assert.ok(getScript());
  fakeWindow.kakao = { maps: { load: callback => callback() } };
  fakeScript.emit('load');
  await Promise.all([first, second]);
  clearFakeDom();
});

test('network failures are surfaced and retry cleanup removes the failed script', async () => {
  const { fakeScript, getScript } = createFakeDom();
  const request = loadKakaoMapsSdk('b'.repeat(32), { timeoutMs: 50 });
  fakeScript.emit('error');

  await assert.rejects(request, (error: unknown) => {
    return error instanceof KakaoMapsSdkError && error.code === 'network';
  });

  resetKakaoMapsSdk();
  assert.equal(getScript(), null);
  clearFakeDom();
});

test('SDK timeout is bounded', async () => {
  createFakeDom();
  await assert.rejects(() => loadKakaoMapsSdk('c'.repeat(32), { timeoutMs: 5 }), (error: unknown) => {
    return error instanceof KakaoMapsSdkError && error.code === 'timeout';
  });
  clearFakeDom();
});
