import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const MIGRATIONS_DIR = path.resolve('db/migrations');
const MIGRATION_NAME_PATTERN = /^(\d{4})_[a-z0-9][a-z0-9_-]*\.sql$/;

// These two files predate the current numbering rule and are already applied
// in production. Keep the historical names stable, but never allow another
// migration to reuse the same prefix.
const LEGACY_DUPLICATE_GROUPS = new Map([
  [
    '0001',
    new Set([
      '0001_add_source_key_and_upsert_index.sql',
      '0001_sync_tables.sql',
    ]),
  ],
]);

const fail = message => {
  throw new Error('[migrations] ' + message);
};

const sameSet = (left, right) =>
  left.size === right.size && [...left].every(value => right.has(value));

export const validateMigrationNames = names => {
  const sqlNames = [...names].filter(name => name.endsWith('.sql')).sort();
  if (sqlNames.length === 0) fail('no SQL migrations found');

  const grouped = new Map();
  for (const name of sqlNames) {
    const match = MIGRATION_NAME_PATTERN.exec(name);
    if (!match) {
      fail("invalid migration filename '" + name + "'; expected NNNN_description.sql");
    }

    const prefix = match[1];
    const group = grouped.get(prefix) ?? new Set();
    group.add(name);
    grouped.set(prefix, group);
  }

  for (const [prefix, group] of grouped) {
    if (group.size <= 1) continue;

    const legacyGroup = LEGACY_DUPLICATE_GROUPS.get(prefix);
    if (!legacyGroup || !sameSet(group, legacyGroup)) {
      fail('migration prefix ' + prefix + ' is duplicated by: ' + [...group].join(', '));
    }
  }

  const prefixes = [...grouped.keys()].map(Number).sort((a, b) => a - b);
  for (let index = 0; index < prefixes.length; index += 1) {
    if (prefixes[index] !== index) {
      fail(
        'migration sequence must be contiguous; expected ' +
          String(index).padStart(4, '0') +
          ' but found ' +
          String(prefixes[index]).padStart(4, '0')
      );
    }
  }

  return {
    migrationCount: sqlNames.length,
    latestPrefix: String(prefixes.at(-1)).padStart(4, '0'),
  };
};

const run = async () => {
  const names = await readdir(MIGRATIONS_DIR);
  const result = validateMigrationNames(names);
  const nextPrefix = String(Number(result.latestPrefix) + 1).padStart(4, '0');
  console.log(
    '[migrations] ok: ' +
      result.migrationCount +
      ' files, latest prefix ' +
      result.latestPrefix +
      '; next migration should be ' +
      nextPrefix +
      '_*.sql'
  );
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
