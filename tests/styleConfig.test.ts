import assert from 'node:assert/strict';
import test from 'node:test';

import tailwindConfig from '../tailwind.config';

test('프로젝트에서 사용하는 세밀한 shadow와 size 토큰을 Tailwind에 등록한다', () => {
  assert.equal(tailwindConfig.theme.extend.spacing?.['4.5'], '1.125rem');
  assert.ok(tailwindConfig.theme.extend.boxShadow?.xs);
  assert.ok(tailwindConfig.theme.extend.boxShadow?.['2xs']);
});
