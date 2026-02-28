import { useEffect, useState } from "react";
import { fetchPublicSongs } from "../services/api";
import SongItem from "../components/SongItem";
import { isNetworkError } from "../utils/error";
import type { PaginatedSongs } from "../types/song";

const PAGE_SIZE = 10;

export default function Home() {
  const [songs, setSongs] = useState<PaginatedSongs | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasSongs = (songs?.items?.length ?? 0) > 0;

  async function loadSongs() {
    setLoadError(null);
    setLoading(true);
    try {
      const data = await fetchPublicSongs(
        PAGE_SIZE,
        offset,
        searchSubmitted || undefined
      );
      console.log("Home /songs response", data);
      setSongs(data);
      setTotal(data.total);
    } catch (err) {
      if (isNetworkError(err)) {
        setLoadError("Unable to connect to the server. Please run the backend (port 8000) and reload the page.");
      } else {
        setLoadError("Unable to load the song list. Please try again later.");
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

  const scrollMainToTop = () => {
    const el = document.querySelector("main");
    if (el && "scrollTo" in el) {
      (el as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div>
      <h1 className="page-title">Public Songs</h1>

      <form onSubmit={handleSearchSubmit} className="search-bar">
        <div className="search-input-wrap">
          <input
            type="search"
            className="input-field"
            placeholder="Search tracks by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search public tracks"
          />
        </div>
        <div className="search-actions">
          <button type="submit" className="btn-primary">
            Search
          </button>
          {searchSubmitted && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setSearchQuery(""); setSearchSubmitted(""); setOffset(0); }}
            >
              Clear filters
            </button>
          )}
        </div>
      </form>

      {loadError && (
        <div className="error-banner">
          <span style={{ flex: 1 }}>{loadError}</span>
          <button type="button" onClick={() => loadSongs()} className="btn-primary" style={{ padding: "6px 14px", fontSize: 13 }}>
            Try again
          </button>
        </div>
      )}

      {loading && !songs && (
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

      {!loadError && songs && (
        <div
          key={songs.offset}
          className={`song-table-wrap ${loading ? "is-fetching" : ""}`}
        >
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
                disablePlay={false}
                showDownload={true}
              />
            ))}
          </ul>
          {!hasSongs && !loading && (
            <p style={{ padding: "24px 18px", color: "var(--text-muted)", fontSize: 14 }}>
              No public songs.
            </p>
          )}
        </div>
      )}

      {!loading && loadError && (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No data. Please fix the connection error and click Try again.</p>
      )}

      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="pagination-btn btn-secondary"
          disabled={loading || offset === 0}
          onClick={() => {
            setOffset(Math.max(0, offset - PAGE_SIZE));
            scrollMainToTop();
          }}
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
          disabled={loading || offset + PAGE_SIZE >= total}
          onClick={() => {
            setOffset(offset + PAGE_SIZE);
            scrollMainToTop();
          }}
          style={{ padding: "8px 16px", fontSize: 14 }}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
