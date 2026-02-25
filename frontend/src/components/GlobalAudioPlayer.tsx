import { useEffect, useRef, useState } from "react";
import { useAudioStore } from "../stores/audio.store";

export default function GlobalAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(1);
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
    playNext,
    play,
  } = useAudioStore();

  // Sync volume to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  // Update src when currentSong changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong) {
      setCurrentTime(0);
      setProgress(0);
      setDuration(0);
      audio.src = currentSong.audio_url;
      audio.load();
    } else {
      audio.src = "";
    }
  }, [currentSong, setCurrentTime, setProgress, setDuration]);

  // Sync play/pause with store
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch((err) => {
          if (err.name !== "AbortError") console.error("Play failed:", err);
          pause();
        });
      }
    };

    audio.addEventListener("canplay", handleCanPlay);
    if (audio.readyState >= 2 && isPlaying) {
      audio.play().catch((err) => {
        if (err.name !== "AbortError") console.error("Play failed:", err);
        pause();
      });
    } else if (!isPlaying) {
      audio.pause();
    }

    return () => audio.removeEventListener("canplay", handleCanPlay);
  }, [isPlaying, currentSong, pause]);

  // Time & ended & error
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleDurationChange = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    const handleEnded = () => playNext();
    const handleError = () => pause();

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [setCurrentTime, setDuration, playNext, pause]);

  // Sync time/progress from audio element while playing (backup for throttled timeupdate)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong || !isPlaying) return;

    const tick = () => {
      const a = audioRef.current;
      if (!a) return;
      const t = a.currentTime;
      const d = a.duration;
      if (Number.isFinite(t)) setCurrentTime(t);
      if (Number.isFinite(d) && d > 0) setDuration(d);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [currentSong, isPlaying, setCurrentTime, setDuration]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * audio.duration;
    if (Number.isFinite(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (s: number): string => {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!currentSong) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--bg-elevated)",
        borderTop: "1px solid var(--border)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        zIndex: 1000,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ flex: "0 0 220px", minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
          {currentSong.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {currentSong.artist ?? "Unknown"}
        </div>
      </div>

      <button
        type="button"
        onClick={() => (isPlaying ? pause() : play(currentSong))}
        className="play-btn-circle"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          backgroundColor: "var(--primary)",
          color: "#fff",
          cursor: "pointer",
          fontSize: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", width: 36 }}>
          {formatTime(currentTime)}
        </span>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          onClick={handleSeek}
          style={{
            flex: 1,
            height: 6,
            backgroundColor: "var(--border)",
            borderRadius: 3,
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "var(--primary)",
              borderRadius: 3,
              transition: "width 0.1s",
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)", width: 36 }}>
          {formatTime(duration)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 120px" }}>
        <span style={{ fontSize: 14 }} title="Volume">🔊</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ width: 80, accentColor: "var(--primary)" }}
        />
      </div>

      <audio ref={audioRef} />
    </div>
  );
}
