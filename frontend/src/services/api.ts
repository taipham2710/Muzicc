import axios from "axios";
import type { PaginatedSongs, Song, SongCreate } from "../types/song";
import { useAuthStore } from "../stores/auth.store";
import { useToastStore } from "../stores/toast.store";

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

// Global response handling: auth guard + basic network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status as number | undefined;
    const hasResponse = !!error?.response;

    if (status === 401) {
      // Auto logout khi token hết hạn / không hợp lệ
      try {
        useAuthStore.getState().logout();
      } catch {
        // ignore
      }

      // Điều hướng về trang login (hard redirect để clear state hoàn toàn)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // Network error (timeout, no connection) hoặc server error (5xx)
    // Chỉ toast cho các lỗi này, không toast cho 4xx (trừ 401 đã xử lý)
    if (!hasResponse || (status && status >= 500)) {
      try {
        const message =
          status && status >= 500
            ? "Server error. Please try again later."
            : "Network error. Please check your connection.";
        useToastStore.getState().show(message, "error");
      } catch {
        // ignore nếu store chưa sẵn sàng
      }
    }

    return Promise.reject(error);
  }
);

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
