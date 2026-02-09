import type { Song } from "../types/song";
import { useAudioStore } from "../stores/audio.store";

type Props = {
  song: Song;
  /** Danh sách bài (từ Home/MyMusic) để auto play bài tiếp theo khi hết bài. */
  queue?: Song[];
  /** Disable nút play trong các state loading / không có audio. */
  disablePlay?: boolean;
  /** Disable các action như edit/delete khi đang request. */
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
  const { currentSong, isPlaying, play, pause } = useAudioStore();
  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  function handlePlayPause() {
    if (disablePlay || !song.audio_url) {
      return;
    }

    if (isCurrentSong && isPlaying) {
      pause();
    } else {
      play(song, queue);
    }
  }

  return (
    <li style={{ marginBottom: 12 }}>
      <strong>{song.title}</strong> – {song.artist ?? "Unknown"} (
      {song.is_public ? "public" : "private"})

      <div style={{ marginTop: 4 }}>
        <button
          onClick={handlePlayPause}
          disabled={disablePlay || !song.audio_url}
        >
          {isCurrentlyPlaying ? "⏸ Pause" : "▶️ Play"}
        </button>

        {showActions && (
          <>
            <button onClick={onEdit} disabled={disableActions}>
              ✏️
            </button>
            <button onClick={onDelete} disabled={disableActions}>
              🗑
            </button>
          </>
        )}
      </div>
    </li>
  );
}
