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

export type SongCreate = {
    title: string;
    artist?: string;
    audio_url: string;
    is_public: boolean;
};
