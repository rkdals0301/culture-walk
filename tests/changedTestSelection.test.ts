import assert from 'node:assert/strict';
import test from 'node:test';
import { selectChangedTests } from '../scripts/changed-test-selection.mjs';

const files = ['src/utils/value.ts', 'src/services/list.ts', 'tests/list.test.ts', 'tests/view.test.ts', 'tests/other.test.ts'];
const sources = new Map([
  ['src/services/list.ts', "import { value } from '@/utils/value';"],
  ['tests/list.test.ts', "import { list } from '../src/services/list';"],
  ['tests/view.test.ts', "readProjectFile('../src/services/list.ts');"],
]);
const select = (changedFiles: string[], overrideFiles = files, overrideSources = sources) =>
  selectChangedTests({ files: overrideFiles, changedFiles, sources: overrideSources });

test('changed source selects transitive importers and source-contract tests without unrelated tests', () => {
  const result = select(['src/utils/value.ts']);
  assert.equal(result.fullSuite, false);
  assert.deepEqual(result.tests, ['tests/list.test.ts', 'tests/view.test.ts']);
});

test('new tests run directly and deleted tests or unrecognized inputs use the full suite', () => {
  assert.deepEqual(select(['tests/list.test.ts']).tests, ['tests/list.test.ts']);
  assert.equal(select(['tests/deleted.test.ts']).fullSuite, true);
  assert.equal(select(['src/uncovered.ts']).fullSuite, true);
});

test('shared configuration and test helper changes always use the full suite', () => {
  for (const file of ['package.json', 'tsconfig.json', 'tests/helpers/sqliteD1.ts', '.github/workflows/ci.yml']) {
    assert.deepEqual(select([file]).tests, files.filter(file => file.startsWith('tests/')).sort());
    assert.equal(select([file]).fullSuite, true);
  }
});

test('documentation-only changes need no tests, and cyclic dependencies terminate', () => {
  assert.deepEqual(select(['README.md']).tests, []);
  const cyclic = new Map(sources);
  cyclic.set('src/utils/value.ts', "import '../services/list';");
  assert.deepEqual(select(['src/utils/value.ts'], files, cyclic).tests, ['tests/list.test.ts', 'tests/view.test.ts']);
});

test('deleted source references are still included in affected tests', () => {
  const remaining = files.filter(file => file !== 'src/utils/value.ts');
  assert.deepEqual(select(['src/utils/value.ts'], remaining).tests, ['tests/list.test.ts', 'tests/view.test.ts']);
});
