CREATE TABLE culture_tour_api_details (
  source_key TEXT PRIMARY KEY NOT NULL,
  source_modified_at TEXT,
  common_json TEXT DEFAULT '{}' NOT NULL,
  intro_json TEXT DEFAULT '{}' NOT NULL,
  info_json TEXT DEFAULT '[]' NOT NULL,
  images_json TEXT DEFAULT '[]' NOT NULL,
  is_complete INTEGER DEFAULT 0 NOT NULL,
  synced_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
