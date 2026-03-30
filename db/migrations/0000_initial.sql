CREATE TABLE IF NOT EXISTS cultures (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
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

CREATE INDEX IF NOT EXISTS cultures_start_date_idx ON cultures(start_date);
CREATE INDEX IF NOT EXISTS cultures_end_date_idx ON cultures(end_date);
