import assert from 'node:assert/strict';
import test from 'node:test';
import { readCultureReadModelCache, writeCultureReadModelCache, type CultureCacheBinding } from '@/cache/kv';

const item = (title: string) => ({
  id: 101, title, classification: '축제', guName: '서울 중구', isFree: '무료',
  mainImage: '', place: '서울광장', useFee: '무료', lat: 37.56, lng: 126.98,
  startDate: new Date('2099-09-10T00:00:00Z'), endDate: new Date('2099-09-12T00:00:00Z'),
});
const model = (title: string) => ({ cachedAt: '2099-09-10T00:10:00Z', items: [item(title)], revisions: {} });

test('simultaneous cold reads share one KV request and one parsed result', async () => {
  let reads = 0;
  const cache: CultureCacheBinding = {
    get: async () => { reads += 1; return model('공유 행사'); }, put: async () => undefined,
  };
  const results = await Promise.all(Array.from({ length: 20 }, () => readCultureReadModelCache(cache)));
  assert.equal(reads, 1);
  assert.ok(results[0]);
  assert.ok(results.every(value => value === results[0]));
});

test('different KV bindings never share an in-flight read', async () => {
  const binding = (title: string): CultureCacheBinding => ({
    get: async () => model(title), put: async () => undefined,
  });
  const [first, second] = await Promise.all([
    readCultureReadModelCache(binding('첫 행사')), readCultureReadModelCache(binding('둘째 행사')),
  ]);
  assert.equal(first?.items[0].title, '첫 행사');
  assert.equal(second?.items[0].title, '둘째 행사');
});

test('a slow old KV read cannot replace a newly published snapshot', async () => {
  let finishRead!: (value: unknown) => void;
  let readStarted!: () => void;
  const started = new Promise<void>(resolve => { readStarted = resolve; });
  const cache: CultureCacheBinding = {
    get: () => { readStarted(); return new Promise(resolve => { finishRead = resolve; }); },
    put: async () => undefined,
  };
  const pending = readCultureReadModelCache(cache);
  await started;
  await writeCultureReadModelCache([item('새 행사')], { '101': 'new' }, cache);
  finishRead(model('이전 행사'));
  assert.equal((await pending)?.items[0].title, '새 행사');
  assert.equal((await readCultureReadModelCache(cache))?.revisions?.['101'], 'new');
});

test('a missing read model is retried on the next request', async () => {
  let available = false;
  const cache: CultureCacheBinding = {
    get: async key => available && key === 'cultures:read-model:v1' ? model('복구 행사') : null,
    put: async () => undefined,
  };
  assert.equal(await readCultureReadModelCache(cache), null);
  available = true;
  assert.equal((await readCultureReadModelCache(cache))?.items[0].title, '복구 행사');
});

test('publication serializes the large payload once and measures the actual stored UTF-8 bytes', async () => {
  let serializations = 0;
  const writes = new Map<string, string>();
  const cache: CultureCacheBinding = {
    get: async () => null, put: async (key, value) => { writes.set(key, value); },
  };
  const record = { ...item('문화산책'), toJSON: () => { serializations += 1; return item('문화산책'); } };
  const publication = await writeCultureReadModelCache([record], {}, cache);
  assert.equal(serializations, 1);
  const stored = writes.get('cultures:read-model:v1');
  assert.ok(stored);
  assert.equal(publication.serializedBytes, Buffer.byteLength(stored));
  assert.equal(JSON.parse(writes.get('cultures:read-model-meta:v1')!).serializedBytes, publication.serializedBytes);
});
