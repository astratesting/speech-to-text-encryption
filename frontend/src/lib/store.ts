import { create } from "zustand";
import Cookies from "js-cookie";

interface AuthState {
  token: string | null;
  user: { id: number; email: string; full_name?: string } | null;
  setToken: (token: string) => void;
  setUser: (user: AuthState["user"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: Cookies.get("token") ?? null,
  user: null,
  setToken: (token) => {
    Cookies.set("token", token, { expires: 1, sameSite: "strict" });
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    Cookies.remove("token");
    set({ token: null, user: null });
  },
}));
