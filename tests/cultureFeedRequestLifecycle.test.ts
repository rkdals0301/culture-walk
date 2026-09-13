import assert from 'node:assert/strict';
import test from 'node:test';

import { startCultureFeedRequestSession } from '../src/utils/cultureFeedRequestLifecycle';

test('피드 요청 세션 전환은 이전 요청을 취소하고 새 활성 controller와 version을 만든다', () => {
  const previousController = new AbortController();

  const session = startCultureFeedRequestSession(7, previousController);

  assert.equal(previousController.signal.aborted, true);
  assert.equal(session.version, 8);
  assert.equal(session.controller.signal.aborted, false);
  assert.notEqual(session.controller, previousController);
});

test('캐시에서 복원하는 요청 세션도 추가 페이지 로딩에 쓸 수 있는 controller를 만든다', () => {
  const session = startCultureFeedRequestSession(0, null);

  assert.equal(session.version, 1);
  assert.equal(session.controller.signal.aborted, false);

  session.controller.abort();
  assert.equal(session.controller.signal.aborted, true);
});
