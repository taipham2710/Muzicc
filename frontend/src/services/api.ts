import axios from "axios";
import type { PaginatedSongs } from "../types/song";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});



export async function fetchPublicSongs(
  limit: number,
  offset: number
): Promise<PaginatedSongs> {
  const res = await api.get("/songs", {
    params: { limit, offset },
  });
  return res.data;
}
