CREATE TABLE IF NOT EXISTS cultures (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  source_key TEXT,
  classification TEXT,
  date TEXT,
  end_date TEXT,
  etc_description TEXT,
  gu_name TEXT,
  homepage_detail_address TEXT,
  is_free TEXT,
  lat REAL,
  lng REAL,
  main_image TEXT,
  homepage_address TEXT,
  organization_name TEXT,
  place TEXT,
  performer_information TEXT,
  program_introduction TEXT,
  registration_date TEXT,
  start_date TEXT,
  theme_classification TEXT,
  register TEXT,
  title TEXT,
  use_fee TEXT,
  use_target TEXT,
  is_active INTEGER DEFAULT 1 NOT NULL,
  last_seen_at TEXT,
  deactivated_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS cultures_start_date_idx ON cultures(start_date);
CREATE INDEX IF NOT EXISTS cultures_end_date_idx ON cultures(end_date);
CREATE UNIQUE INDEX IF NOT EXISTS cultures_source_key_idx ON cultures(source_key);
CREATE INDEX IF NOT EXISTS cultures_active_end_date_idx ON cultures(is_active, end_date);

CREATE TABLE IF NOT EXISTS initialize_sync_locks (
  name TEXT PRIMARY KEY,
  acquired_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS culture_sync_staging (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  source_key TEXT NOT NULL,
  classification TEXT,
  date TEXT,
  end_date TEXT,
  etc_description TEXT,
  gu_name TEXT,
  homepage_detail_address TEXT,
  is_free TEXT,
  lat REAL,
  lng REAL,
  main_image TEXT,
  homepage_address TEXT,
  organization_name TEXT,
  place TEXT,
  performer_information TEXT,
  program_introduction TEXT,
  registration_date TEXT,
  start_date TEXT,
  theme_classification TEXT,
  register TEXT,
  title TEXT,
  use_fee TEXT,
  use_target TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS culture_sync_staging_source_key_idx ON culture_sync_staging(source_key);

CREATE TABLE IF NOT EXISTS culture_sync_runs (
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

CREATE INDEX IF NOT EXISTS culture_sync_runs_started_at_idx ON culture_sync_runs(started_at);
