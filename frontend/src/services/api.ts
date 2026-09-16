import axios from 'axios';

export const API_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';
export const API_ORIGIN = API_URL.startsWith('http') ? API_URL.replace(/\/api\/v1\/?$/, '') : window.location.origin;
export const STORAGE_BASE_URL = `${API_ORIGIN}/storage`;
export const SOCKET_URL = API_ORIGIN;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Safely extracts human readable error messages even from Axios blob error responses
 */
export async function extractErrorMessage(err: any, fallback = 'Operation failed'): Promise<string> {
  if (!err) return fallback;
  if (err.response?.data instanceof Blob) {
    try {
      const text = await err.response.data.text();
      const parsed = JSON.parse(text);
      return parsed.message || fallback;
    } catch {
      return fallback;
    }
  }
  return err.response?.data?.message || err.message || fallback;
}

// Request interceptor for Bearer token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Allow browser/Axios to automatically set multipart/form-data with boundary
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  return Promise.reject(error);
});
