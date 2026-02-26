export interface Song {
  id: number;
  title: string;
  artist: string | null;
  audio_url: string;
  is_public: boolean;
  owner_id: number;
  created_at: string;
}

export interface PaginatedSongs {
  items: Song[];
  total: number;
  limit: number;
  offset: number;
}

export type SongCreate = {
  title: string;
  artist?: string;
  audio_url: string;
  is_public: boolean;
  /** S3 object_key from getUploadUrl — backend needs it for s3_key (NOT NULL). */
  object_key?: string;
  /** SHA256 hash of the audio file (hex, 64 chars) for deduplication. */
  file_hash?: string;
};
