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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isCurrentlyPlaying ? (
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
            </svg>
          ) : (
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <polygon
                points="7,5 19,12 7,19"
                fill="currentColor"
              />
            </svg>
          )}
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
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M15.728 4.272a2.5 2.5 0 0 1 3.536 3.536l-9.193 9.193a2 2 0 0 1-.94.53l-3.51.877a.75.75 0 0 1-.91-.91l.877-3.51a2 2 0 0 1 .53-.94l9.193-9.193Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={disableActions}
              className="action-btn"
              style={actionButtonStyle}
              title="Delete"
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M9 3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V5h4a1 1 0 1 1 0 2h-1.1l-1.01 11.116A2.5 2.5 0 0 1 14.4 20.5H9.6a2.5 2.5 0 0 1-2.49-2.384L6.1 7H5a1 1 0 1 1 0-2h4V3.5ZM8.11 7l.9 10h5.98l.9-10H8.11Z"
                  fill="currentColor"
                />
              </svg>
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
