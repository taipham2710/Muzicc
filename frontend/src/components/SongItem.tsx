import type { Song } from "../types/song";
import { useAudioStore } from "../stores/audio.store";

type Props = {
  song: Song;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function SongItem({
  song,
  showActions = false,
  onEdit,
  onDelete,
}: Props) {
  const { currentSong, isPlaying, play, pause } = useAudioStore();
  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  function handlePlayPause() {
    if (isCurrentSong && isPlaying) {
      // Đang play bài này -> pause
      pause();
    } else {
      // Chưa play hoặc đang pause -> play bài này
      play(song);
    }
  }

  return (
    <li style={{ marginBottom: 12 }}>
      <strong>{song.title}</strong> – {song.artist ?? "Unknown"} (
      {song.is_public ? "public" : "private"})

      <div style={{ marginTop: 4 }}>
        <button onClick={handlePlayPause}>
          {isCurrentlyPlaying ? "⏸ Pause" : "▶️ Play"}
        </button>

        {showActions && (
          <>
            <button onClick={onEdit}>✏️</button>
            <button onClick={onDelete}>🗑</button>
          </>
        )}
      </div>
    </li>
  );
}
