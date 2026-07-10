ALTER TABLE cultures ADD COLUMN source_key TEXT;

CREATE UNIQUE INDEX cultures_source_key_unique ON cultures(source_key);
