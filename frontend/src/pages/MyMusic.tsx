import { useEffect, useState } from "react";
import {
  fetchMySongs,
  createSong,
  updateSong,
  deleteSong,
  getUploadUrl,
  uploadToS3,
} from "../services/api";
import Pagination from "../components/Pagination";
import SongItem from "../components/SongItem";
import { useToastStore } from "../stores/toast.store";
import { isNetworkError } from "../utils/error";
import type { PaginatedSongs } from "../types/song";

export default function MyMusic() {
  const showToast = useToastStore((state) => state.show);
  const [songs, setSongs] = useState<PaginatedSongs | null>(null);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState("");
  const [loading, setLoading] = useState(true);

  // create
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [uploadedObjectKey, setUploadedObjectKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editPublic, setEditPublic] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadSongs();
  }, [offset, searchSubmitted]);

  async function loadSongs() {
    setLoadError(null);
    try {
      setLoading(true);
      const data = await fetchMySongs(
        limit,
        offset,
        searchSubmitted || undefined
      );
      console.log("MyMusic /songs/me response", data);
      setSongs(data);
      setTotal(data.total);
    } catch (err) {
      if (isNetworkError(err)) {
        setLoadError("Không thể kết nối server. Hãy chạy backend (port 8000) rồi tải lại trang.");
      } else {
        setLoadError("Không tải được danh sách. Thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      showToast("Please select an audio file", "error");
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      showToast("File size must be less than 20MB", "error");
      return;
    }

    setAudioFile(file);
    setUploadProgress(null);
    setUploadedAudioUrl(null);
    setUploadedObjectKey(null);

    // Auto upload khi chọn file
    try {
      setIsUploading(true);
      const { upload_url, public_url, object_key } = await getUploadUrl(
        file.name,
        file.type
      );

      await uploadToS3(file, upload_url, (progress) => {
        setUploadProgress(progress);
      });

      setUploadedAudioUrl(public_url);
      setUploadedObjectKey(object_key);
      showToast("Audio uploaded successfully", "success");
    } catch (err) {
      console.error("Upload failed:", err);
      showToast("Failed to upload audio. Please try again.", "error");
      setAudioFile(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading || isUploading) return;

    if (!uploadedAudioUrl) {
      showToast("Please upload an audio file first", "error");
      return;
    }

    try {
      await createSong({
        title,
        artist,
        is_public: isPublic,
        audio_url: uploadedAudioUrl,
        object_key: uploadedObjectKey ?? undefined,
      });

      showToast("Song created successfully", "success");
      setTitle("");
      setArtist("");
      setIsPublic(true);
      setAudioFile(null);
      setUploadedAudioUrl(null);
      setUploadedObjectKey(null);
      setUploadProgress(null);
      setShowForm(false);

      loadSongs();
    } catch (err) {
      console.error("Create song failed:", err);
      showToast("Failed to create song. Please try again.", "error");
    }
  }

  const formLabelStyle = { display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 };
  const formInputStyle = {
    width: "100%",
    maxWidth: 360,
    padding: "10px 12px",
    marginBottom: 16,
    fontSize: 15,
    border: "1px solid #333",
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    color: "#fff",
    boxSizing: "border-box" as const,
  };

  const modalOverlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1100,
    padding: 24,
  };
  const modalCard: React.CSSProperties = {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    width: "100%",
    maxWidth: 420,
    maxHeight: "90vh",
    overflowY: "auto",
    padding: 24,
  };

  return (
    <div>
      <h1 className="page-title">My Music</h1>

      {loadError && (
        <div className="error-banner">
          <span style={{ flex: 1 }}>{loadError}</span>
          <button type="button" onClick={() => loadSongs()} className="btn-primary" style={{ padding: "6px 14px", fontSize: 13 }}>
            Thử lại
          </button>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); setSearchSubmitted(searchQuery); setOffset(0); }} className="search-bar">
        <div className="search-input-wrap">
          <input
            type="search"
            className="input-field"
            placeholder="Tìm theo tên bài hát hoặc nghệ sĩ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Tìm bài hát"
          />
        </div>
        <div className="search-actions">
          <button type="submit" className="btn-primary">
            Tìm kiếm
          </button>
          {searchSubmitted && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setSearchQuery(""); setSearchSubmitted(""); setOffset(0); }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </form>

      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="btn-primary"
        style={{ padding: "10px 18px", fontSize: 14 }}
      >
        + Upload more
      </button>

      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
          style={modalOverlay}
          onClick={() => {
            if (!isUploading) {
              setShowForm(false);
              setAudioFile(null);
              setUploadedAudioUrl(null);
              setUploadedObjectKey(null);
              setUploadProgress(null);
            }
          }}
        >
          <div
            style={modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="upload-modal-title" style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600, color: "var(--text)" }}>
              Thêm bài hát
            </h2>
            <form onSubmit={handleSubmit}>
              <label style={formLabelStyle}>Title (bắt buộc)</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                className="input-field"
                style={formInputStyle}
                placeholder="Tên bài hát"
              />

              <label style={formLabelStyle}>Artist (tùy chọn)</label>
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                disabled={isUploading}
                className="input-field"
                style={formInputStyle}
                placeholder="Ca sĩ"
              />

              <label style={formLabelStyle}>
                Audio File <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(bắt buộc)</span>
              </label>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  style={{ fontSize: 14 }}
                />
                {audioFile && !uploadedAudioUrl && !isUploading && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                    Đã chọn: {audioFile.name}
                  </div>
                )}
                {isUploading && uploadProgress !== null && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        width: "100%",
                        height: 8,
                        backgroundColor: "var(--border)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${uploadProgress}%`,
                          height: "100%",
                          backgroundColor: "var(--primary)",
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      Đang tải lên... {uploadProgress}%
                    </div>
                  </div>
                )}
                {uploadedAudioUrl && !isUploading && (
                  <div style={{ fontSize: 12, color: "var(--primary)", marginTop: 6 }}>
                    ✓ Đã tải audio lên
                  </div>
                )}
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={isUploading}
                />
                <span style={{ fontSize: 14 }}>Public</span>
              </label>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  type="submit"
                  disabled={isUploading || !uploadedAudioUrl || loading}
                  className="btn-primary"
                  style={{ padding: "10px 20px", fontSize: 14 }}
                >
                  {isUploading ? "Đang tải..." : "Tạo bài hát"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setAudioFile(null);
                    setUploadedAudioUrl(null);
                    setUploadedObjectKey(null);
                    setUploadProgress(null);
                  }}
                  disabled={isUploading}
                  className="btn-secondary"
                  style={{ padding: "10px 20px", fontSize: 14 }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingId !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          style={modalOverlay}
          onClick={() => {
            if (savingId === null) setEditingId(null);
          }}
        >
          <div
            style={modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-modal-title" style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600, color: "var(--text)" }}>
              Chỉnh sửa bài hát
            </h2>
            <label style={formLabelStyle}>Title</label>
            <input
              className="input-field"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Tên bài hát"
              style={{ ...formInputStyle, marginBottom: 16 }}
            />
            <label style={formLabelStyle}>Artist</label>
            <input
              className="input-field"
              value={editArtist}
              onChange={(e) => setEditArtist(e.target.value)}
              placeholder="Ca sĩ"
              style={{ ...formInputStyle, marginBottom: 16 }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={editPublic}
                onChange={(e) => setEditPublic(e.target.checked)}
              />
              <span style={{ fontSize: 14 }}>Public</span>
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setSavingId(editingId);
                    await updateSong(editingId, {
                      title: editTitle,
                      artist: editArtist,
                      is_public: editPublic,
                    });
                    showToast("Đã cập nhật bài hát", "success");
                    setEditingId(null);
                    loadSongs();
                  } catch (err) {
                    console.error("Update song failed:", err);
                    showToast("Cập nhật thất bại. Thử lại sau.", "error");
                  } finally {
                    setSavingId(null);
                  }
                }}
                disabled={savingId === editingId}
                className="btn-primary"
                style={{ padding: "10px 20px", fontSize: 14 }}
              >
                {savingId === editingId ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                disabled={savingId === editingId}
                className="btn-secondary"
                style={{ padding: "10px 20px", fontSize: 14 }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !loadError ? (
        <ul className="song-list">
          {Array.from({ length: 5 }).map((_, idx) => (
            <li key={idx} style={{ marginBottom: 12 }}>
              <div
                style={{
                  width: "40%",
                  height: 12,
                  borderRadius: 4,
                  background: "#333",
                  marginBottom: 6,
                }}
              />
              <div
                style={{
                  width: "25%",
                  height: 10,
                  borderRadius: 4,
                  background: "#222",
                }}
              />
            </li>
          ))}
        </ul>
      ) : !loadError ? (
        <div className="song-table-wrap">
          <div className="song-table-header" role="row">
            <span style={{ gridColumn: 1 }}>Play</span>
            <span style={{ gridColumn: 2 }}>Title</span>
            <span style={{ gridColumn: 3 }}>Artist</span>
            <span style={{ gridColumn: 4 }}>Status</span>
            <span style={{ gridColumn: 5 }}>Thao tác</span>
          </div>
          <ul className="song-list">
            {(songs?.items ?? []).map((song) => (
              <SongItem
                key={song.id}
                song={song}
                queue={songs?.items ?? []}
                disablePlay={loading}
                disableActions={
                  savingId === song.id || deletingId === song.id
                }
                showActions={true}
                onEdit={() => {
                  setEditingId(song.id);
                  setEditTitle(song.title ?? "");
                  setEditArtist(song.artist ?? "");
                  setEditPublic(song.is_public);
                }}
                onDelete={async () => {
                  const ok = window.confirm(
                    `Delete "${song.title}"? This action cannot be undone.`
                  );
                  if (!ok) return;

                  try {
                    setDeletingId(song.id);
                    await deleteSong(song.id);
                    showToast("Song deleted successfully", "success");
                    loadSongs();
                  } catch (err) {
                    console.error("Delete song failed:", err);
                    showToast("Failed to delete song. Please try again.", "error");
                  } finally {
                    setDeletingId(null);
                  }
                }}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && loadError && (
        <p style={{ color: "#666", fontSize: 14, marginTop: 8 }}>
          Chưa có dữ liệu. Sửa lỗi kết nối rồi bấm Thử lại.
        </p>
      )}

      <Pagination
        total={total}
        limit={limit}
        offset={offset}
        onChange={setOffset}
      />
    </div>
  );
}
