import { create } from "zustand";

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
    },
}));
