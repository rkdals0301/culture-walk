import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('모바일 검색창 및 폼 컨트롤은 iOS 사파리 자동 확대를 방지하기 위해 모바일에서 최소 16px(text-base)을 유지한다', () => {
  const mapSearchField = readFileSync(
    resolve(__dirname, '../src/components/Map/MapSearchField.tsx'),
    'utf-8'
  );
  assert.match(
    mapSearchField,
    /text-base/,
    'MapSearchField input must include text-base on mobile'
  );
  assert.match(
    mapSearchField,
    /\.blur\(\)/,
    'MapSearchField form submit must blur input to dismiss keyboard'
  );

  const feedHeader = readFileSync(
    resolve(__dirname, '../src/components/Feed/FeedHeader.tsx'),
    'utf-8'
  );
  assert.match(
    feedHeader,
    /text-base/,
    'FeedHeader input must include text-base on mobile'
  );
  assert.match(
    feedHeader,
    /\.blur\(\)/,
    'FeedHeader form submit must blur input to dismiss keyboard'
  );

  const componentsScss = readFileSync(
    resolve(__dirname, '../src/styles/_components.scss'),
    'utf-8'
  );
  assert.match(
    componentsScss,
    /font-size:\s*16px;/,
    '_components.scss must have mobile 16px safeguard for form controls'
  );
});
