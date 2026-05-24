import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
const TOKEN_KEY = 'flixvideo_auth_token';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!stored) return;
      const profile = await fetchProfile(stored);
      setToken(stored);
      setUser(profile);
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (authToken: string): Promise<User> => {
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error('Session expired');
    const data = await res.json();
    return {
      id: String(data.id ?? data.user?.id),
      email: data.email ?? data.user?.email,
      name: data.full_name ?? data.username ?? data.user?.full_name ?? '',
      avatar_url: data.avatar_url ?? data.user?.avatar_url,
      role: data.role ?? data.user?.role,
    };
  };

  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.message ?? 'Login failed');
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser({
      id: String(data.user?.id ?? data.id),
      email: data.user?.email ?? email,
      name: data.user?.full_name ?? data.user?.username ?? '',
      avatar_url: data.user?.avatar_url,
      role: data.user?.role,
    });
  };

  const signUp = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.message ?? 'Registration failed');
    // After register, auto sign-in
    await signIn(email, password);
  };

  const signInWithGoogle = async (jwtToken: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, jwtToken);
    setToken(jwtToken);
    const profile = await fetchProfile(jwtToken);
    setUser(profile);
  };

  const signOut = async () => {
    try {
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
