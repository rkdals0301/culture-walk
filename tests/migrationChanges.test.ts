import assert from 'node:assert/strict';
import test from 'node:test';

import { validateMigrationChangeLines } from '../scripts/check-migration-changes.mjs';

test('migration history guard allows newly added SQL files', () => {
  const changes = validateMigrationChangeLines([
    'A\tdb/migrations/0009_add_index.sql',
  ]);

  assert.equal(changes.length, 1);
  assert.equal(changes[0]?.status, 'A');
});

test('migration history guard rejects edits to existing SQL files', () => {
  assert.throws(
    () =>
      validateMigrationChangeLines([
        'M\tdb/migrations/0008_add_detail_cache.sql',
      ]),
    /applied migration SQL is immutable/
  );
});

test('migration history guard rejects deletion and rename of SQL files', () => {
  assert.throws(
    () =>
      validateMigrationChangeLines([
        'D\tdb/migrations/0007_old.sql',
      ]),
    /applied migration SQL is immutable/
  );

  assert.throws(
    () =>
      validateMigrationChangeLines([
        'R100\tdb/migrations/0007_old.sql\tdb/migrations/0009_new.sql',
      ]),
    /applied migration SQL is immutable/
  );
});

test('migration history guard ignores non-SQL changes', () => {
  const changes = validateMigrationChangeLines([
    'M\tREADME.md',
    'A\tdb/migrations/README.md',
  ]);

  assert.equal(changes.length, 0);
});
