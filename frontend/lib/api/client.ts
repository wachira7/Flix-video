// frontend/lib/api/client.ts

import axios from 'axios';
import { toast } from 'sonner';
import { getToken } from '@/lib/auth';
import { endDemo } from '@/lib/demo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // A one-click demo ran out: clear it and offer a fresh one
    if (status === 401 && data?.demo_ended && typeof window !== 'undefined') {
      endDemo();
      window.location.href = '/demo?ended=1';
      return new Promise(() => {}); // the page is navigating away
    }

    // Demo accounts can't pay, post publicly or change sign-in details
    if (status === 403 && data?.demo && typeof window !== 'undefined') {
      toast(data.error || "That isn't available in the demo.", {
        action: { label: 'Create account', onClick: () => { endDemo(); window.location.href = '/signup'; } },
      });
    }

    if (status === 401) {
      console.error('Unauthorized access');
    }
    return Promise.reject(error);
  }
);