import { useEffect, useRef } from "react";
import { useAudioStore } from "../stores/audio.store";

export default function GlobalAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    setProgress,
    setDuration,
    setCurrentTime,
    pause,
    stop,
    play,
  } = useAudioStore();

  // Update src khi currentSong thay đổi
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong) {
      // Reset state khi đổi bài
      setCurrentTime(0);
      setProgress(0);
      setDuration(0);

      // Set src và load
      audio.src = currentSong.audio_url;
      audio.load();
    } else {
      audio.src = "";
    }
  }, [currentSong, setCurrentTime, setProgress, setDuration]);

  // Sync audio element với store state - chỉ play khi audio đã sẵn sàng
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch((err) => {
          // Chỉ log lỗi nếu không phải AbortError (do user action)
          if (err.name !== "AbortError") {
            console.error("Play failed:", err);
          }
          pause();
        });
      }
    };

    const handleLoadStart = () => {
      // Pause khi đang load bài mới
      if (audio.readyState < 2) {
        audio.pause();
      }
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadstart", handleLoadStart);

    // Nếu audio đã sẵn sàng, play ngay
    if (audio.readyState >= 2 && isPlaying) {
      audio.play().catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Play failed:", err);
        }
        pause();
      });
    } else if (!isPlaying) {
      audio.pause();
    }

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadstart", handleLoadStart);
    };
  }, [isPlaying, currentSong, pause]);

  // Event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      stop();
    };

    const handleError = (e: Event) => {
      const audio = e.target as HTMLAudioElement;
      if (audio.error) {
        // Chỉ log nếu không phải lỗi do không có source (URL placeholder)
        if (audio.error.code !== audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          console.error("Audio playback error:", audio.error);
        }
      }
      pause();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [setCurrentTime, setDuration, stop, pause]);

  // Seek khi user click vào progress bar
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * audio.duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentSong) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#1a1a1a",
        borderTop: "1px solid #333",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        zIndex: 1000,
      }}
    >
      {/* Song Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "bold", fontSize: 14 }}>
          {currentSong.title}
        </div>
        <div style={{ fontSize: 12, color: "#999" }}>
          {currentSong.artist ?? "Unknown"}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => {
            if (isPlaying) {
              pause();
            } else {
              play(currentSong);
            }
          }}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {isPlaying ? "⏸ Pause" : "▶️ Play"}
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ flex: 2, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "#999",
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <div
            onClick={handleSeek}
            style={{
              flex: 1,
              height: 4,
              backgroundColor: "#333",
              borderRadius: 2,
              cursor: "pointer",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                backgroundColor: "#1db954",
                borderRadius: 2,
                transition: "width 0.1s",
              }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  );
}
