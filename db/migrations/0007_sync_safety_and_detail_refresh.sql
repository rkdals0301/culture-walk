ALTER TABLE cultures ADD COLUMN missing_snapshot_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cultures ADD COLUMN detail_refresh_requested_at TEXT;
ALTER TABLE cultures ADD COLUMN detail_refresh_priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cultures ADD COLUMN detail_sync_fail_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cultures ADD COLUMN detail_next_retry_at TEXT;
ALTER TABLE cultures ADD COLUMN detail_last_error TEXT;

CREATE INDEX IF NOT EXISTS cultures_detail_refresh_idx
ON cultures(is_active, detail_refresh_priority, detail_refresh_requested_at);
