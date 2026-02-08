import { useEffect, useState } from "react";
import { fetchMySongs } from "../services/api";
import type { Song } from "../types/song";
import Pagination from "../components/Pagination";

export default function MyMusic() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSongs();
  }, [offset]);

  async function loadSongs() {
    try {
      setLoading(true);
      const data = await fetchMySongs(limit, offset);
      setSongs(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>My Music</h1>

      <button>➕ Upload more</button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {songs.map((song) => (
            <li key={song.id}>
              {song.title} – {song.artist ?? "Unknown"} (
              {song.is_public ? "public" : "private"})
              <button>✏️</button>
              <button>🗑</button>
            </li>
          ))}
        </ul>
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
