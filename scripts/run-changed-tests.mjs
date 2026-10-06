import { spawn, execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { selectChangedTests } from './changed-test-selection.mjs';

const args = process.argv.slice(2);
let base = 'HEAD';
let listOnly = false;
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--base' && args[index + 1]) base = args[++index];
  else if (args[index] === '--list') listOnly = true;
  else throw new Error(`Unknown or incomplete option: ${args[index]}`);
}
const gitPaths = args => execFileSync('git', ['-c', 'core.safecrlf=false', ...args], {
  encoding: 'utf8', windowsHide: true,
}).split('\0').filter(Boolean);
// Resolve the ref first; a missing base must fail rather than silently skip tests.
execFileSync('git', ['rev-parse', '--verify', `${base}^{commit}`], { stdio: 'ignore', windowsHide: true });
const files = gitPaths(['ls-files', '-z', '--cached', '--others', '--exclude-standard']);
const changedFiles = [...new Set([
  ...gitPaths(['diff', '--name-only', '-z', base, '--']),
  ...gitPaths(['ls-files', '-z', '--others', '--exclude-standard']),
])];
const sources = new Map(await Promise.all(files.filter(file => /\.(?:tsx?|m?js)$/.test(file)).map(async file => {
  try { return [file, await readFile(file, 'utf8')]; }
  catch (error) { if (error.code === 'ENOENT') return [file, '']; throw error; }
})));
const selection = selectChangedTests({ files, changedFiles, sources });
console.log(`[test:changed] ${selection.tests.length} test files. ${selection.reason}`);
if (listOnly) console.log(selection.tests.join('\n'));
if (!listOnly && selection.tests.length) {
  const cli = createRequire(import.meta.url).resolve('tsx/cli');
  const child = spawn(process.execPath, [cli, '--test', ...selection.tests], { stdio: 'inherit', windowsHide: true });
  child.on('error', error => { console.error(error); process.exitCode = 1; });
  child.on('close', code => { process.exitCode = code ?? 1; });
}
