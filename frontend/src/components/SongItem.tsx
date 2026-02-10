import type { Song } from "../types/song";
import { useAudioStore } from "../stores/audio.store";

type Props = {
  song: Song;
  queue?: Song[];
  disablePlay?: boolean;
  disableActions?: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function SongItem({
  song,
  queue,
  disablePlay = false,
  disableActions = false,
  showActions = false,
  onEdit,
  onDelete,
}: Props) {
  const { currentSong, isPlaying, progress, play, pause } = useAudioStore();
  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  function handlePlayPause() {
    if (disablePlay || !song.audio_url) return;
    if (isCurrentSong && isPlaying) {
      pause();
    } else {
      play(song, queue);
    }
  }

  return (
    <li
      className="song-item-card"
      style={{
        listStyle: "none",
        padding: "14px 18px",
        backgroundColor: isCurrentSong ? "var(--bg-card)" : "transparent",
        border: isCurrentSong ? "1px solid var(--border)" : "1px solid transparent",
      }}
    >
      <div className="song-cell-play">
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={disablePlay || !song.audio_url}
          className="play-btn-circle"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "none",
            backgroundColor: isCurrentSong ? "var(--primary)" : "var(--bg-surface)",
            color: "#fff",
            cursor: disablePlay || !song.audio_url ? "not-allowed" : "pointer",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isCurrentlyPlaying ? "⏸" : "▶"}
        </button>
      </div>

      <div className="song-cell-title" style={{ fontWeight: 600, fontSize: 15, color: isCurrentSong ? "var(--primary)" : "var(--text)" }}>
        {song.title}
      </div>

      <div className="song-cell-artist" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
        {song.artist ?? "Unknown"}
      </div>

      <div className="song-cell-status">
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: song.is_public ? "rgba(34, 197, 94, 0.2)" : "rgba(251, 191, 36, 0.2)",
            color: song.is_public ? "#4ade80" : "#fbbf24",
          }}
        >
          {song.is_public ? "public" : "private"}
        </span>
      </div>

      <div className="song-cell-actions" style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        {showActions ? (
          <>
            <button
              type="button"
              onClick={onEdit}
              disabled={disableActions}
              className="action-btn"
              style={actionButtonStyle}
              title="Edit"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={disableActions}
              className="action-btn"
              style={actionButtonStyle}
              title="Delete"
            >
              🗑
            </button>
          </>
        ) : null}
      </div>

      {isCurrentSong && (
        <div className="song-row-progress" style={{ marginTop: 8, height: 4, backgroundColor: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "var(--primary)", transition: "width 0.15s ease-out" }} />
        </div>
      )}
    </li>
  );
}

const actionButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "none",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "var(--bg-surface)",
  color: "var(--text)",
  cursor: "pointer",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
