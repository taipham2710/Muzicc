import { useEffect, useState } from "react";
import {
  fetchMySongs,
  createSong,
  updateSong,
} from "../services/api";
import Pagination from "../components/Pagination";
import type { Song } from "../types/song";

export default function MyMusic() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  // create
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editPublic, setEditPublic] = useState(true);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await createSong({
      title,
      artist,
      is_public: isPublic,
      audio_url: "https://example.com/audio.mp3", // tạm
    });

    setTitle("");
    setArtist("");
    setIsPublic(true);
    setShowForm(false);

    loadSongs();
  }

  return (
    <div>
      <h1>My Music</h1>

      <button onClick={() => setShowForm((v) => !v)}>
        + Upload more
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div>
            <label>Title</label>
            <br />
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label>Artist</label>
            <br />
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>

          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public
          </label>

          <div>
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {songs.map((song) => (
            <li key={song.id}>
              {editingId === song.id ? (
                <>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <input
                    value={editArtist}
                    onChange={(e) => setEditArtist(e.target.value)}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={editPublic}
                      onChange={(e) => setEditPublic(e.target.checked)}
                    />
                    Public
                  </label>

                  <button
                    onClick={async () => {
                      await updateSong(song.id, {
                        title: editTitle,
                        artist: editArtist,
                        is_public: editPublic,
                      });
                      setEditingId(null);
                      loadSongs();
                    }}
                  >
                    Save
                  </button>

                  <button onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {song.title} – {song.artist ?? "Unknown"} (
                  {song.is_public ? "public" : "private"})
                  <button
                    onClick={() => {
                      setEditingId(song.id);
                      setEditTitle(song.title);
                      setEditArtist(song.artist ?? "");
                      setEditPublic(song.is_public);
                    }}
                  >
                    ✏️
                  </button>
                  <button>🗑</button>
                </>
              )}
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
