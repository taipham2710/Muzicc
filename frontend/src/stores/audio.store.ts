import { create } from "zustand";
import type { Song } from "../types/song";

type AudioState = {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number; // 0-100
  duration: number; // seconds
  currentTime: number; // seconds

  // Actions
  play: (song: Song) => void;
  pause: () => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  stop: () => void;
};

export const useAudioStore = create<AudioState>()((set, get) => ({
  currentSong: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  currentTime: 0,

  play: (song: Song) => {
    const { currentSong } = get();
    // Nếu đang play bài khác, switch sang bài mới
    if (currentSong?.id !== song.id) {
      set({ currentSong: song, isPlaying: true, progress: 0, currentTime: 0 });
    } else {
      // Cùng bài, chỉ toggle play/pause
      set({ isPlaying: true });
    }
  },

  pause: () => {
    set({ isPlaying: false });
  },

  setProgress: (progress: number) => {
    set({ progress });
  },

  setDuration: (duration: number) => {
    set({ duration });
  },

  setCurrentTime: (currentTime: number) => {
    const { duration } = get();
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    set({ currentTime, progress });
  },

  stop: () => {
    set({
      currentSong: null,
      isPlaying: false,
      progress: 0,
      currentTime: 0,
      duration: 0,
    });
  },
}));
