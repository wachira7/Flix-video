import { create } from 'zustand';
import { secureStorage } from '../lib/secure-storage';

interface User {
  id: number;
  email: string;
  username: string;
  role: 'user' | 'admin';
  avatarUrl?: string | null;
  planType?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: async (user, accessToken, refreshToken) => {
    await Promise.all([
      secureStorage.setToken(accessToken),
      secureStorage.setRefreshToken(refreshToken),
      secureStorage.setUser(user),
    ]);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await secureStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  initialize: async () => {
    const user = await secureStorage.getUser<User>();
    const token = await secureStorage.getToken();
    set({ user, isAuthenticated: !!user && !!token, isLoading: false });
  },
}));
