import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
} as const;

export const secureStorage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },
  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
  },
  async getUser<T>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async setUser(user: unknown): Promise<void> {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },
  async clear(): Promise<void> {
    await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)));
  },
};
