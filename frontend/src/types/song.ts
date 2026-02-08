export interface Song {
  id: number;
  title: string;
  artist: string | null;
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
