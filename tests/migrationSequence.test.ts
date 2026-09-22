import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import test from 'node:test';

import { validateMigrationNames } from '../scripts/check-migrations.mjs';

test('existing migrations satisfy the guarded sequence including the historical 0001 pair', async () => {
  const names = await readdir(new URL('../db/migrations/', import.meta.url));
  const result = validateMigrationNames(names);

  assert.equal(result.latestPrefix, '0008');
  assert.ok(result.migrationCount >= 10);
});

test('future duplicate migration prefixes are rejected', () => {
  assert.throws(
    () =>
      validateMigrationNames([
        '0000_initial.sql',
        '0001_add_source_key_and_upsert_index.sql',
        '0001_sync_tables.sql',
        '0002_snapshot_sync.sql',
        '0002_duplicate.sql',
      ]),
    /prefix 0002 is duplicated/
  );
});

test('migration sequence gaps are rejected', () => {
  assert.throws(
    () =>
      validateMigrationNames([
        '0000_initial.sql',
        '0001_add_source_key_and_upsert_index.sql',
        '0001_sync_tables.sql',
        '0003_skipped.sql',
      ]),
    /expected 0002 but found 0003/
  );
});
