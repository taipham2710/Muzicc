import { useEffect, useState } from "react";
import { fetchPublicSongs } from "../services/api";
import SongItem from "../components/SongItem";
import { isNetworkError } from "../utils/error";
import type { Song } from "../types/song";

const PAGE_SIZE = 20;

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadSongs() {
    setLoadError(null);
    setLoading(true);
    try {
      const data = await fetchPublicSongs(PAGE_SIZE, offset, searchSubmitted || undefined);
      setSongs(data.items);
      setTotal(data.total);
    } catch (err) {
      if (isNetworkError(err)) {
        setLoadError("Không thể kết nối server. Hãy chạy backend (port 8000) rồi tải lại trang.");
      } else {
        setLoadError("Không tải được danh sách bài hát. Thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSongs();
  }, [offset, searchSubmitted]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchSubmitted(searchQuery);
    setOffset(0);
  }

  return (
    <div>
      <h1 className="page-title">Public Songs</h1>

      <form onSubmit={handleSearchSubmit} className="search-bar">
        <div className="search-input-wrap">
          <input
            type="search"
            className="input-field"
            placeholder="Tìm theo tên bài hát..."
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

      {loadError && (
        <div className="error-banner">
          <span style={{ flex: 1 }}>{loadError}</span>
          <button type="button" onClick={() => loadSongs()} className="btn-primary" style={{ padding: "6px 14px", fontSize: 13 }}>
            Thử lại
          </button>
        </div>
      )}

      {loading && (
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
      )}

      {!loading && !loadError && (
        <div className="song-table-wrap">
          <div className="song-table-header" role="row">
            <span style={{ gridColumn: 1 }}>Play</span>
            <span style={{ gridColumn: 2 }}>Title</span>
            <span style={{ gridColumn: 3 }}>Artist</span>
            <span style={{ gridColumn: 4 }}>Status</span>
            <span style={{ gridColumn: 5 }} />
          </div>
          <ul className="song-list">
            {songs.map((song) => (
              <SongItem
                key={song.id}
                song={song}
                queue={songs}
                disablePlay={loading}
              />
            ))}
          </ul>
        </div>
      )}

      {!loading && loadError && (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Chưa có dữ liệu. Sửa lỗi kết nối rồi bấm Thử lại.</p>
      )}

      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="pagination-btn btn-secondary"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          style={{ padding: "8px 16px", fontSize: 14 }}
        >
          ◀ Prev
        </button>
        <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Page {offset / PAGE_SIZE + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </span>
        <button
          type="button"
          className="pagination-btn btn-secondary"
          disabled={offset + PAGE_SIZE >= total}
          onClick={() => setOffset(offset + PAGE_SIZE)}
          style={{ padding: "8px 16px", fontSize: 14 }}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
