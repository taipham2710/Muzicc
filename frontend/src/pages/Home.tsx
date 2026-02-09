import { useEffect, useState } from "react";
import { fetchPublicSongs } from "../services/api";
import SongItem from "../components/SongItem";
import type { Song } from "../types/song";

const PAGE_SIZE = 20;

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadSongs() {
    setLoading(true);
    try {
      const data = await fetchPublicSongs(PAGE_SIZE, offset);
      setSongs(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load songs", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSongs();
  }, [offset]);

  return (
    <div>
      <h1>Public Songs</h1>

      {loading && (
        <ul>
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

      {!loading && (
        <ul>
          {songs.map((song) => (
            <SongItem
              key={song.id}
              song={song}
              queue={songs}
              disablePlay={loading}
            />
          ))}
        </ul>
      )}

      {/* Pagination */}
      <div style={{ marginTop: 16 }}>
        <button
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
        >
          ◀ Prev
        </button>

        <span style={{ margin: "0 12px" }}>
          Page {offset / PAGE_SIZE + 1} /{" "}
          {Math.ceil(total / PAGE_SIZE)}
        </span>

        <button
          disabled={offset + PAGE_SIZE >= total}
          onClick={() => setOffset(offset + PAGE_SIZE)}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
