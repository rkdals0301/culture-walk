import path from 'node:path';

const isUnitTest = file => /^tests\/.*\.test\.ts$/.test(file);
const isDocumentation = file => /\.md$/.test(file) || file.startsWith('.impeccable/');
const isGlobalInput = file =>
  /^(package(?:-lock)?\.json|tsconfig\.json|next\.config\.mjs|eslint\.config\.mjs|playwright.*\.ts)$/.test(file) ||
  file.startsWith('.github/') || file.startsWith('tests/helpers/') ||
  /^scripts\/(?:run-changed-tests|changed-test-selection)\.mjs$/.test(file);

// Include source-file reads in architecture tests as well as ordinary imports.
const referencePattern = /['"]((?:@\/|\.\.?\/)[^'"\r\n]+)['"]/g;

export const selectChangedTests = ({ files, changedFiles, sources }) => {
  const tests = files.filter(isUnitTest).sort();
  const changes = changedFiles.filter(file => !isDocumentation(file));
  const all = reason => ({ tests, reason, fullSuite: true });
  if (!changes.length) return { tests: [], reason: 'No test inputs changed.', fullSuite: false };
  if (changes.some(isGlobalInput)) return all('Shared configuration or test infrastructure changed.');

  const knownFiles = new Set([...files, ...changes]);
  const importers = new Map();
  for (const [file, source] of sources) {
    for (const match of source.matchAll(referencePattern)) {
      const reference = match[1];
      const base = reference.startsWith('@/')
        ? `src/${reference.slice(2)}`
        : path.posix.normalize(path.posix.join(path.posix.dirname(file), reference));
      const dependency = [base, ...['.ts', '.tsx', '.mjs', '.js', '/index.ts', '/index.tsx'].map(ext => base + ext)]
        .find(candidate => knownFiles.has(candidate));
      if (!dependency) continue;
      if (!importers.has(dependency)) importers.set(dependency, new Set());
      importers.get(dependency).add(file);
    }
  }

  const selected = new Set();
  for (const change of changes) {
    const visited = new Set();
    const queue = [change];
    let covered = false;
    while (queue.length) {
      const file = queue.pop();
      if (visited.has(file)) continue;
      visited.add(file);
      if (isUnitTest(file) && files.includes(file)) {
        selected.add(file);
        covered = true;
      }
      queue.push(...(importers.get(file) ?? []));
    }
    if (!covered) return all(`No reliable test dependency was found for ${change}.`);
  }
  return { tests: [...selected].sort(), reason: 'Changed tests and their transitive dependants.', fullSuite: false };
};
