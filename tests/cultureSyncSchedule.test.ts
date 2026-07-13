import {
  RECOVERY_FRESHNESS_HOURS,
  shouldRunScheduledSync,
} from '../src/services/cultureSyncSchedule';

import assert from 'node:assert/strict';
import test from 'node:test';

test('최근 기본 동기화가 성공했으면 복구 동기화를 건너뛴다', () => {
  assert.equal(
    shouldRunScheduledSync({ latestSync: { status: 'success', ageHours: RECOVERY_FRESHNESS_HOURS } }),
    false
  );
});

test('최근 성공 동기화가 오래됐으면 복구 동기화를 실행한다', () => {
  assert.equal(
    shouldRunScheduledSync({ latestSync: { status: 'success', ageHours: RECOVERY_FRESHNESS_HOURS + 0.1 } }),
    true
  );
});

test('최신 동기화가 실패 또는 고착 상태면 복구 동기화를 실행한다', () => {
  assert.equal(shouldRunScheduledSync({ latestSync: { status: 'failed', ageHours: 0.5 } }), true);
  assert.equal(shouldRunScheduledSync({ latestSync: { status: 'running', ageHours: null } }), true);
  assert.equal(shouldRunScheduledSync(null), true);
});
