import { create } from "zustand";
import { useAudioStore } from "./audio.store";

type User = {
  id: number;
  email: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  token: localStorage.getItem("token"),
  user: null,

  login: (token: string) => {
    localStorage.setItem("token", token);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });

    // Dừng nhạc và reset audio state khi logout
    try {
      useAudioStore.getState().stop();
    } catch {
      // tránh crash nếu store chưa được khởi tạo
    }
  },
}));
