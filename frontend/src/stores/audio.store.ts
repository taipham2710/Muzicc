import { create } from "zustand";
import type { Song } from "../types/song";

type AudioState = {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number; // 0-100
  duration: number; // seconds
  currentTime: number; // seconds
  /** Danh sách bài đang phát (từ Home hoặc MyMusic). Dùng để auto next. */
  queue: Song[];
  /** Index của currentSong trong queue */
  currentIndex: number;

  // Actions
  /** Play một bài. Nếu truyền queue thì khi hết bài sẽ auto play bài tiếp theo trong queue. */
  play: (song: Song, queue?: Song[]) => void;
  pause: () => void;
  /** Gọi khi bài hiện tại kết thúc: play bài tiếp trong queue hoặc stop. */
  playNext: () => void;
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
  queue: [],
  currentIndex: -1,

  play: (song: Song, queue?: Song[]) => {
    const { currentSong } = get();
    const list = queue && queue.length > 0 ? queue : [song];
    const index = list.findIndex((s) => s.id === song.id);
    const idx = index >= 0 ? index : 0;

    if (currentSong?.id !== song.id) {
      set({
        currentSong: song,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
        queue: list,
        currentIndex: idx,
      });
    } else {
      set({ isPlaying: true, queue: list, currentIndex: idx });
    }
  },

  pause: () => {
    set({ isPlaying: false });
  },

  playNext: () => {
    const { queue, currentIndex } = get();
    const nextIndex = currentIndex + 1;
    if (queue.length > 0 && nextIndex < queue.length) {
      const nextSong = queue[nextIndex];
      set({
        currentSong: nextSong,
        currentIndex: nextIndex,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
      });
    } else {
      get().stop();
    }
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
      queue: [],
      currentIndex: -1,
    });
  },
}));
