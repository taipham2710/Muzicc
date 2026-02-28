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
          "Unable to connect to the server. Please run the backend (port 8000) and reload the page."
        );
      } else {
        setLoadError("Unable to load the song list. Please try again later.");
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
            Music library without ads
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
            Listen to high-quality songs now, then register an account to create a private playlist and upload your tracks.
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
                placeholder="Search tracks by name..."
                aria-label="Search public tracks"
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
                Search
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
                Try for free
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
                Sign in
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
          Try — Public songs
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            marginBottom: 20,
          }}
        >
          These are the latest {LANDING_SONGS_LIMIT} songs. Click
          the play button to listen to them in the player below.
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
              Try again
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
              <span style={{ gridColumn: 5 }}>Download</span>
            </div>
            <ul className="song-list">
              {(songs?.items ?? []).map((song) => (
                <SongItem
                  key={song.id}
                  song={song}
                  queue={songs?.items ?? []}
                  disablePlay={loading}
                  showDownload={true}
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
                No public songs. Register an account and upload your tracks.
              </p>
            )}
          </div>
        )}

        {!loading && loadError && (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            No data. Please fix the connection error and click Try again.
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
          Muzicc – Your music library
        </h3>
        <p style={{ margin: "0 0 8px" }}>
          We understand how it feels: you download more and more music, but when you need it, you can't remember where it is, what you're using, and what you can play right away.
        </p>
        <p style={{ margin: "0 0 8px" }}>
          Muzicc was born from that need. A single place to upload, manage, and play back your entire personal music library – simple, fast, and clean.
        </p>
        <p style={{ margin: 0 }}>
          We're not trying to replace big platforms. Muzicc just focuses on one thing: helping your music always be ready when you need it.
        </p>
      </section>

      {/* Contact information section is in a different color area, centered content */}
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
            Contact Information
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
              <strong>Address:</strong> Ho Chi Minh City, Viet Nam
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
