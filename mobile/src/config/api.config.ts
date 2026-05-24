import axios from 'axios';
import { secureStorage } from '../lib/secure-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await secureStorage.getRefreshToken();
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        await secureStorage.setToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        await secureStorage.clear();
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
