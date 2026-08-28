import { serializeJsonLd } from '@/utils/jsonLd';

import assert from 'node:assert/strict';
import test from 'node:test';

test('JSON-LD escapes script-breaking characters and preserves the payload', () => {
  const payload = {
    name: '</script><script>alert(1)</script>&',
    description: '첫 줄\u2028둘째 줄\u2029마지막 줄',
  };

  const serialized = serializeJsonLd(payload);

  assert.doesNotMatch(serialized, /<|>|&/);
  assert.doesNotMatch(serialized, /<\/script/i);
  assert.match(serialized, /\\u003c\/script\\u003e/);
  assert.match(serialized, /\\u0026/);
  assert.match(serialized, /\\u2028/);
  assert.match(serialized, /\\u2029/);
  assert.deepEqual(JSON.parse(serialized), payload);
});
