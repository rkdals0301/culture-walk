CREATE INDEX IF NOT EXISTS cultures_map_viewport_idx
ON cultures(is_active, end_date, lat, lng);
