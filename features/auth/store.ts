import { create } from "zustand";
import * as authApi from "@/services/auth";
import { getSavedUser, getToken, removeToken, saveUser, setForceLogoutHandler } from "@/services/helper";
import type { User } from "@/services/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const token = await getToken();
      if (token) {
        try {
          const user = await authApi.getMe();
          await saveUser(user);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          await removeToken();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authApi.login(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Login failed";
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authApi.register(email, password, name);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Registration failed";
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  deleteAccount: async () => {
    await authApi.deleteAccount();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

setForceLogoutHandler(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, error: null });
});
