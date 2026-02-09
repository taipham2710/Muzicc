import { create } from "zustand";

type ToastType = "success" | "error";

export type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastState = {
  toasts: Toast[];
  show: (message: string, type?: ToastType) => void;
  remove: (id: number) => void;
};

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  show: (message: string, type: ToastType = "success") => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Tự động ẩn sau 3 giây
    window.setTimeout(() => {
      get().remove(id);
    }, 3000);
  },

  remove: (id: number) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
