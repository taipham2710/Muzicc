-- Add file_hash column (SHA256 hex, 64 chars) and index for fast lookup.
ALTER TABLE songs
ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64);

-- Index on file_hash to speed up deduplication lookups.
CREATE INDEX IF NOT EXISTS ix_songs_file_hash ON songs (file_hash);

DROP INDEX ix_songs_s3_key;
CREATE INDEX ix_songs_s3_key ON songs (s3_key);
