ALTER TABLE initialize_sync_locks ADD COLUMN owner_token TEXT NOT NULL DEFAULT '';

ALTER TABLE culture_sync_staging ADD COLUMN sync_run_key TEXT NOT NULL DEFAULT 'legacy';

DROP INDEX IF EXISTS culture_sync_staging_source_key_idx;

CREATE UNIQUE INDEX culture_sync_staging_run_source_key_idx
ON culture_sync_staging(sync_run_key, source_key);

CREATE INDEX culture_sync_staging_run_key_idx ON culture_sync_staging(sync_run_key);

DELETE FROM culture_sync_staging;
