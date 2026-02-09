import { useEffect, useState } from "react";
import {
  fetchMySongs,
  createSong,
  updateSong,
  deleteSong,
} from "../services/api";
import Pagination from "../components/Pagination";
import SongItem from "../components/SongItem";
import { useToastStore } from "../stores/toast.store";
import type { Song } from "../types/song";

export default function MyMusic() {
  const showToast = useToastStore((state) => state.show);
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
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
      console.error("Load songs failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    try {
      await createSong({
        title,
        artist,
        is_public: isPublic,
        audio_url: "https://example.com/audio.mp3", // placeholder
      });

      showToast("Song created successfully", "success");
      setTitle("");
      setArtist("");
      setIsPublic(true);
      setShowForm(false);

      loadSongs();
    } catch (err) {
      console.error("Create song failed:", err);
      showToast("Failed to create song. Please try again.", "error");
    }
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
      ) : (
        <ul>
          {songs.map((song) =>
            editingId === song.id ? (
              <li key={song.id}>
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
                    try {
                      setSavingId(song.id);
                      await updateSong(song.id, {
                        title: editTitle,
                        artist: editArtist,
                        is_public: editPublic,
                      });
                      showToast("Song updated successfully", "success");
                      setEditingId(null);
                      loadSongs();
                    } catch (err) {
                      console.error("Update song failed:", err);
                      showToast("Failed to update song. Please try again.", "error");
                    } finally {
                      setSavingId(null);
                    }
                  }}
                  disabled={savingId === song.id}
                >
                  Save
                </button>

                <button
                  onClick={() => setEditingId(null)}
                  disabled={savingId === song.id}
                >
                  Cancel
                </button>
              </li>
            ) : (
              <SongItem
                key={song.id}
                song={song}
                queue={songs}
                disablePlay={loading}
                disableActions={
                  savingId === song.id || deletingId === song.id
                }
                showActions={true}
                onEdit={() => {
                  setEditingId(song.id);
                  setEditTitle(song.title);
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
            )
          )}
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
