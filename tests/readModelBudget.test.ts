import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assessCultureReadModelBudget,
  CULTURE_READ_MODEL_MAX_BYTES,
} from '../src/server/readModelBudget';

test('read-model budget reports healthy usage and projects item capacity', () => {
  const budget = assessCultureReadModelBudget(1_000_000, 250);

  assert.equal(budget.status, 'healthy');
  assert.equal(budget.utilizationPercent, 50);
  assert.equal(budget.bytesRemaining, 1_000_000);
  assert.equal(budget.bytesPerItem, 4_000);
  assert.equal(budget.estimatedItemsAtBudget, 500);
});

test('read-model budget enters watch state at 75 percent', () => {
  const budget = assessCultureReadModelBudget(CULTURE_READ_MODEL_MAX_BYTES * 0.75, 300);

  assert.equal(budget.status, 'watch');
  assert.equal(budget.utilizationPercent, 75);
});

test('read-model budget marks values over the hard ceiling as exceeded', () => {
  const budget = assessCultureReadModelBudget(CULTURE_READ_MODEL_MAX_BYTES + 1, 300);

  assert.equal(budget.status, 'exceeded');
  assert.equal(budget.bytesRemaining, 0);
});

test('read-model budget reports unknown when byte telemetry is unavailable', () => {
  const budget = assessCultureReadModelBudget(null, 300);

  assert.equal(budget.status, 'unknown');
  assert.equal(budget.utilizationPercent, null);
  assert.equal(budget.estimatedItemsAtBudget, null);
});
