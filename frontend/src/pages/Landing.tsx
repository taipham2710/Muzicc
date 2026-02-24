import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPublicSongs } from "../services/api";
import SongItem from "../components/SongItem";
import { isNetworkError } from "../utils/error";
import type { PaginatedSongs } from "../types/song";

const LANDING_SONGS_LIMIT = 10;

export default function Landing() {
  const [songs, setSongs] = useState<PaginatedSongs | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  async function loadSongs(q?: string) {
    setLoadError(null);
    setLoading(true);
    try {
      const data = await fetchPublicSongs(
        LANDING_SONGS_LIMIT,
        0,
        q && q.trim() ? q.trim() : undefined
      );
      console.log("Landing /songs response", data);
      setSongs(data);
    } catch (err) {
      if (isNetworkError(err)) {
        setLoadError(
          "Không thể kết nối server. Hãy chạy backend (port 8000) rồi tải lại trang."
        );
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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadSongs(searchQuery);
  }

  return (
    <div style={{ width: "100%" }}>
      {/* HERO với background image */}
      <section
        style={{
          position: "relative",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          minHeight: "85vh",
          marginBottom: 40,
          backgroundImage:
            'linear-gradient(115deg, rgba(0,0,0,0.72), rgba(0,0,0,0.35)), url("/image.png")',
          backgroundSize: "cover",
          backgroundPosition: "center center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            padding: "40px 32px 56px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 14,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.75)",
              marginBottom: 12,
            }}
          >
            Muzicc • Music Library
          </p>
          <h1
            style={{
              fontSize: "2.4rem",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.03em",
              margin: "0 0 12px 0",
            }}
          >
            Thư viện nhạc không quảng cáo
          </h1>
          <p
            style={{
              fontSize: 16,
              maxWidth: 640,
              margin: "0 auto 28px",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            Nghe thử ngay những bản nhạc chất lượng cao, sau đó đăng ký tài
            khoản để tạo playlist riêng và upload track của bạn.
          </p>

          {/* SEARCH HERO */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                maxWidth: 520,
                backgroundColor: "rgba(0,0,0,0.55)",
                borderRadius: 999,
                padding: 4,
                border: "1px solid rgba(255,255,255,0.16)",
                backdropFilter: "blur(10px)",
              }}
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tracks theo tên..."
                aria-label="Tìm bài hát public"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "#fff",
                  padding: "10px 16px",
                  fontSize: 15,
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{
                  borderRadius: 999,
                  padding: "10px 20px",
                  fontSize: 14,
                  whiteSpace: "nowrap",
                }}
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* CTA buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link to="/register">
              <button
                type="button"
                className="btn-primary"
                style={{ padding: "10px 20px", fontSize: 14 }}
              >
                Dùng thử miễn phí
              </button>
            </Link>
            <Link to="/login">
              <button
                type="button"
                className="btn-secondary"
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  borderColor: "rgba(188, 181, 206, 0.6)",
                  color: "#fff",
                }}
              >
                Đăng nhập
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Các section dùng chung maxWidth & padding để cùng kích thước */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
      {/* PUBLIC SONGS - nghe thử không cần tài khoản */}
      <section>
        <h2
          className="page-title"
          style={{ fontSize: "1.25rem", marginBottom: 12 }}
        >
          Nghe thử — Public songs
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            marginBottom: 20,
          }}
        >
          Đây là {LANDING_SONGS_LIMIT} bài nhạc mới nhất. Bấm
          nút play để nghe thử ngay ở thanh player bên dưới.
        </p>

        {loadError && (
          <div className="error-banner">
            <span style={{ flex: 1 }}>{loadError}</span>
            <button
              type="button"
              onClick={() => loadSongs(searchQuery)}
              className="btn-primary"
              style={{ padding: "6px 14px", fontSize: 13 }}
            >
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
              {(songs?.items ?? []).map((song) => (
                <SongItem
                  key={song.id}
                  song={song}
                  queue={songs?.items ?? []}
                  disablePlay={loading}
                />
              ))}
            </ul>
            {(songs?.items?.length ?? 0) === 0 && (
              <p
                style={{
                  padding: "24px 18px",
                  color: "var(--text-muted)",
                  fontSize: 14,
                }}
              >
                Chưa có bài hát công khai. Đăng ký tài khoản và upload bài của
                bạn nhé.
              </p>
            )}
          </div>
        )}

        {!loading && loadError && (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Chưa có dữ liệu. Sửa lỗi kết nối rồi bấm Thử lại.
          </p>
        )}
      </section>

      {/* GIỚI THIỆU — nằm ngoài, cùng kích thước với Nghe thử & Thông tin liên hệ */}
      <section
        style={{
          marginTop: 32,
          fontSize: 14,
          color: "var(--text-secondary)",
          lineHeight: 1.8,
        }}
      >
        <h3
          style={{
            fontSize: "1.25rem",
            marginBottom: 12,
            color: "var(--text)",
            fontWeight: 600,
          }}
        >
          Muzicc – Thư viện nhạc của riêng bạn
        </h3>
        <p style={{ margin: "0 0 8px" }}>
          Chúng tôi hiểu cảm giác đó: nhạc tải về ngày càng nhiều, nhưng khi
          cần lại không nhớ bài nào ở đâu, bài nào đang dùng, và bài nào có thể
          phát ngay.
        </p>
        <p style={{ margin: "0 0 8px" }}>
          Muzicc ra đời từ chính nhu cầu đó. Một nơi duy nhất để bạn upload,
          quản lý và phát lại toàn bộ thư viện nhạc cá nhân – đơn giản, nhanh và
          gọn.
        </p>
        <p style={{ margin: 0 }}>
          Không cố gắng thay thế các nền tảng lớn. Muzicc chỉ tập trung làm một
          việc: giúp âm nhạc của bạn luôn sẵn sàng khi bạn cần.
        </p>
      </section>

      {/* Chỉ Thông tin liên hệ nằm trong vùng màu khác, nội dung căn giữa */}
      <section style={{ marginTop: 24 }}>
        <div
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderTop: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "28px 24px 24px",
          }}
        >
          <h4
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontWeight: 600,
              color: "var(--text)",
              fontSize: "1.25rem",
              textAlign: "center",
            }}
          >
            Thông tin liên hệ
          </h4>
          <div
            style={{
              textAlign: "center",
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.9,
            }}
          >
            <p style={{ margin: "0 0 6px" }}>
              <strong>Email:</strong> taipham.dev@gmail.com
            </p>
            <p style={{ margin: "0 0 6px" }}>
              <strong>Phone number:</strong> 0703423072
            </p>
            <p style={{ margin: 0 }}>
              <strong>Địa chỉ:</strong> Ho Chi Minh City, Viet Nam
            </p>
          </div>
          <div
            style={{
              marginTop: 20,
              paddingTop: 12,
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <span>
              © {new Date().getFullYear()} Muzicc. All rights reserved.
            </span>
            <span>Made for personal learning &amp; portfolio.</span>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
