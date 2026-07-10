ALTER TABLE cultures ADD COLUMN source_key TEXT;
ALTER TABLE cultures ADD COLUMN is_active INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE cultures ADD COLUMN last_seen_at TEXT;
ALTER TABLE cultures ADD COLUMN deactivated_at TEXT;

UPDATE cultures
SET source_key = 'culture:'
  || trim(COALESCE(title, '')) || char(31)
  || COALESCE(start_date, '') || char(31)
  || COALESCE(end_date, '') || char(31)
  || trim(COALESCE(place, '')) || char(31)
  || trim(COALESCE(gu_name, '')) || char(31)
  || trim(COALESCE(organization_name, '')),
    last_seen_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

CREATE UNIQUE INDEX cultures_source_key_idx ON cultures(source_key);
CREATE INDEX cultures_active_end_date_idx ON cultures(is_active, end_date);

ALTER TABLE culture_sync_staging ADD COLUMN source_key TEXT;

DELETE FROM culture_sync_staging;

CREATE UNIQUE INDEX culture_sync_staging_source_key_idx ON culture_sync_staging(source_key);

CREATE TABLE culture_sync_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  trigger TEXT NOT NULL,
  status TEXT NOT NULL,
  fetched_count INTEGER DEFAULT 0 NOT NULL,
  normalized_count INTEGER DEFAULT 0 NOT NULL,
  staged_count INTEGER DEFAULT 0 NOT NULL,
  inserted_count INTEGER DEFAULT 0 NOT NULL,
  updated_count INTEGER DEFAULT 0 NOT NULL,
  reactivated_count INTEGER DEFAULT 0 NOT NULL,
  deactivated_count INTEGER DEFAULT 0 NOT NULL,
  skipped_count INTEGER DEFAULT 0 NOT NULL,
  error_message TEXT,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completed_at TEXT
);

CREATE INDEX culture_sync_runs_started_at_idx ON culture_sync_runs(started_at);
