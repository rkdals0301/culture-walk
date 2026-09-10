import {
  DETAIL_REFRESH_CRON,
  getCultureScheduledJob,
  RECOVERY_FRESHNESS_HOURS,
  SYNC_CRON,
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

test('D1 일일 읽기 한도가 소진된 동안에는 snapshot 재시도를 건너뛴다', () => {
  assert.equal(shouldRunScheduledSync({ reason: 'd1-daily-row-read-limit', latestSync: null }), false);
});

test('등록된 cron만 snapshot과 detail refresh 작업으로 분류한다', () => {
  assert.equal(getCultureScheduledJob(SYNC_CRON), 'snapshot');
  assert.equal(getCultureScheduledJob(DETAIL_REFRESH_CRON), 'detail-refresh');
  assert.equal(getCultureScheduledJob('* * * * *'), 'unknown');
});
