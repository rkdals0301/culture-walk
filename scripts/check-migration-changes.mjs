import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const MIGRATION_PREFIX = 'db/migrations/';
const ZERO_SHA_PATTERN = /^0+$/;

const fail = message => {
  throw new Error('[migration-history] ' + message);
};

const isMigrationSql = value =>
  typeof value === 'string' &&
  value.startsWith(MIGRATION_PREFIX) &&
  value.endsWith('.sql');

export const validateMigrationChangeLines = lines => {
  const changes = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const fields = line.split('\t');
    const status = fields[0] ?? '';
    const paths = fields.slice(1).filter(isMigrationSql);
    if (paths.length === 0) continue;

    changes.push({ status, paths });

    if (status !== 'A') {
      fail(
        'applied migration SQL is immutable; only new files may be added. ' +
          status +
          ' ' +
          paths.join(' -> ')
      );
    }
  }

  return changes;
};

export const getMigrationChangeLines = baseSha => {
  if (!baseSha || ZERO_SHA_PATTERN.test(baseSha)) return [];

  const result = spawnSync(
    'git',
    ['diff', '--name-status', baseSha + '..HEAD', '--', 'db/migrations'],
    { encoding: 'utf8' }
  );

  if (result.status !== 0) {
    fail(
      'git diff failed for base ' +
        baseSha +
        ': ' +
        (result.stderr || result.stdout || 'unknown error').trim()
    );
  }

  return result.stdout.split(/\r?\n/);
};

const run = () => {
  const baseSha = String(process.env.MIGRATION_BASE_SHA || '').trim();
  if (!baseSha || ZERO_SHA_PATTERN.test(baseSha)) {
    console.log('[migration-history] skipped: no comparable base SHA');
    return;
  }

  const changes = validateMigrationChangeLines(getMigrationChangeLines(baseSha));
  const additions = changes.filter(change => change.status === 'A').length;
  console.log(
    '[migration-history] ok: historical SQL unchanged; new migration files=' +
      additions
  );
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    run();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
