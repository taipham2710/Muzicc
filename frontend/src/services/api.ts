import axios from "axios";
import type { PaginatedSongs, Song, SongCreate } from "../types/song";
import { useAuthStore } from "../stores/auth.store";
import { useToastStore } from "../stores/toast.store";

export const api = axios.create({
  // All requests go through the same origin, behind Kubernetes Ingress.
  // Backend routes are mounted under /api/* (see FastAPI main.py).
  baseURL: "/api",
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

// Tránh spam toast lỗi mạng: chỉ show tối đa 1 lần mỗi 4 giây
let lastNetworkToastAt = 0;
const NETWORK_TOAST_COOLDOWN_MS = 4000;

// Global response handling: auth guard + basic network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status as number | undefined;
    const hasResponse = !!error?.response;

    if (status === 401) {
      try {
        useAuthStore.getState().logout();
      } catch {
        // ignore
      }
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // Network error hoặc 5xx: toast nhưng không spam
    if (!hasResponse || (status && status >= 500)) {
      const now = Date.now();
      if (now - lastNetworkToastAt >= NETWORK_TOAST_COOLDOWN_MS) {
        lastNetworkToastAt = now;
        try {
          const message =
            status && status >= 500
              ? "Server error. Please try again later."
              : "Không kết nối được server. Kiểm tra backend (port 8000).";
          useToastStore.getState().show(message, "error");
        } catch {
          // ignore
        }
      }
    }

    return Promise.reject(error);
  }
);

// ---------- PUBLIC ----------
export async function fetchPublicSongs(
  limit: number,
  offset: number,
  q?: string
): Promise<PaginatedSongs> {
  const res = await api.get("/songs", {
    params: { limit, offset, ...(q?.trim() ? { q: q.trim() } : {}) },
  });
  return res.data;
}

// ---------- AUTH ----------
export async function fetchMySongs(
  limit: number,
  offset: number,
  q?: string
): Promise<PaginatedSongs> {
  const res = await api.get("/songs/me", {
    params: { limit, offset, ...(q?.trim() ? { q: q.trim() } : {}) },
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

// ---------- UPLOAD ----------
export interface CheckFileResponse {
  exists: boolean;
  object_key?: string | null;
  file_url?: string | null;
}

export interface UploadUrlResponse {
  upload_url: string | null;
  object_key: string;
  public_url: string;
  already_exists: boolean;
}

export async function checkFile(file_hash: string): Promise<CheckFileResponse> {
  const res = await api.post("/songs/check-file", { file_hash });
  return res.data;
}

export async function getUploadUrl(
  filename: string,
  content_type: string,
  file_hash: string
): Promise<UploadUrlResponse> {
  const res = await api.post("/songs/upload-url", {
    filename,
    content_type,
    file_hash,
  });
  return res.data;
}

/**
 * Upload file lên S3/MinIO bằng presigned URL.
 * @param file File cần upload
 * @param uploadUrl Presigned URL từ getUploadUrl
 * @param onProgress Callback nhận progress (0-100)
 */
export async function uploadToS3(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"));
    });

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
