import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPublicSongs } from "../services/api";
import SongItem from "../components/SongItem";
import { isNetworkError } from "../utils/error";
import type { Song } from "../types/song";

const LANDING_SONGS_LIMIT = 10;

export default function Landing() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadSongs() {
    setLoadError(null);
    setLoading(true);
    try {
      const data = await fetchPublicSongs(LANDING_SONGS_LIMIT, 0);
      setSongs(data.items);
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
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      {/* INTRO */}
      <section style={{ marginBottom: 32 }}>
        <h1 className="page-title" style={{ marginBottom: 12 }}>Muzicc</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 8px 0" }}>
          Đây là ứng dụng web nhằm phục vụ sở thích nghe nhạc <b style={{ color: "var(--text)" }}>không quảng cáo</b>.
        </p>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 20px 0" }}>
          Bạn hãy tạo tài khoản để có thể trải nghiệm đầy đủ tính năng.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/login">
            <button type="button" className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>
              Sign in
            </button>
          </Link>
          <Link to="/register">
            <button type="button" className="btn-secondary" style={{ padding: "10px 20px", fontSize: 14 }}>
              Sign up
            </button>
          </Link>
        </div>
      </section>

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid var(--border)" }} />

      {/* PUBLIC SONGS - nghe thử không cần tài khoản */}
      <section>
        <h2 className="page-title" style={{ fontSize: "1.2rem", marginBottom: 16 }}>
          Nghe thử — Public songs
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
          Chọn bài bên dưới để nghe thử (không cần đăng nhập).
        </p>

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
                <div style={{ width: "40%", height: 12, borderRadius: 4, background: "#333", marginBottom: 6 }} />
                <div style={{ width: "25%", height: 10, borderRadius: 4, background: "#222" }} />
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
            {songs.length === 0 && (
              <p style={{ padding: "24px 18px", color: "var(--text-muted)", fontSize: 14 }}>
                Chưa có bài hát công khai. Đăng ký tài khoản và upload bài của bạn nhé.
              </p>
            )}
          </div>
        )}

        {!loading && loadError && (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Chưa có dữ liệu. Sửa lỗi kết nối rồi bấm Thử lại.</p>
        )}
      </section>
    </div>
  );
}
