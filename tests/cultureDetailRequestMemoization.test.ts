import assert from 'node:assert/strict';
import test from 'node:test';

import type { FormattedCultureDetailLookup } from '../src/server/cultureDetailSeo';
import { createCachedCultureDetailLookupById } from '../src/server/cultureDetailSeo';

test('a repeated culture lookup for the same ID loads runtime dependencies once per request', async () => {
  const cacheBinding = {
    get: async () => null,
    put: async () => undefined,
  };
  let dependencyLoads = 0;
  let cacheReads = 0;
  const requestCache = (load: (id: number) => Promise<FormattedCultureDetailLookup>) => {
    const resultsById = new Map<number, Promise<FormattedCultureDetailLookup>>();
    return (id: number) => {
      const existing = resultsById.get(id);
      if (existing) return existing;

      const result = load(id);
      resultsById.set(id, result);
      return result;
    };
  };
  const lookup = createCachedCultureDetailLookupById(async () => {
    dependencyLoads += 1;
    return {
      cache: {
        ...cacheBinding,
        get: async () => {
          cacheReads += 1;
          return null;
        },
      },
    };
  }, requestCache);

  const first = lookup(101);
  const second = lookup(101);
  await Promise.all([first, second]);

  assert.equal(first, second);
  assert.equal(dependencyLoads, 1);
  assert.equal(cacheReads, 4);
});
