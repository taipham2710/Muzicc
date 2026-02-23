-- Add S3 metadata columns to songs (run once on existing DB).
-- New DBs get these via create_all() from the model.
-- PostgreSQL 9.6+: ADD COLUMN IF NOT EXISTS

ALTER TABLE songs ADD COLUMN IF NOT EXISTS s3_key VARCHAR(512);
ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_url VARCHAR(2048);

CREATE UNIQUE INDEX IF NOT EXISTS ix_songs_s3_key ON songs (s3_key);

-- After backfill (no NULL s3_key for new rows), enforce NOT NULL:
-- ALTER TABLE songs ALTER COLUMN s3_key SET NOT NULL;

-- Performance: ordering and filtering
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_owner_id ON songs (owner_id);
