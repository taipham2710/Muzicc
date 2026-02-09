import axios from "axios";
import type { PaginatedSongs, Song, SongCreate } from "../types/song";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    // BẮT BUỘC: đảm bảo headers tồn tại
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ---------- PUBLIC ----------
export async function fetchPublicSongs(
  limit: number,
  offset: number
): Promise<PaginatedSongs> {
  const res = await api.get("/songs", {
    params: { limit, offset },
  });
  return res.data;
}

// ---------- AUTH ----------
export async function fetchMySongs(
  limit: number,
  offset: number
): Promise<PaginatedSongs> {
  const res = await api.get("/songs/me", {
    params: { limit, offset },
  });
  return res.data;
}

export async function createSong(
  payload: SongCreate
): Promise<Song> {
  const res = await api.post("/songs", payload);
  return res.data;
}

export async function updateSong(
  songId: number,
  payload: {
    title?: string;
    artist?: string;
    is_public?: boolean;
  }
): Promise<Song> {
  const res = await api.put(`/songs/${songId}`, payload);
  return res.data;
}

export async function deleteSong(songId: number): Promise<void> {
  await api.delete(`/songs/${songId}`);
}
