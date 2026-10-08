import axios from 'axios';

/**
 * PITCH Centralized API Client
 * Authoritative source: docs/PITCH_API_FINAL.md Section 1, 2, 23 & docs/PITCH_TECHNICAL_FINALIZATION.md
 *
 * Rules:
 * 1. Base URL defaults to /api/v1 (or VITE_API_BASE_URL).
 * 2. withCredentials: true ensures HttpOnly cookies (including refreshToken) are handled automatically.
 * 3. Short-lived accessToken is kept safely in memory — NEVER stored in localStorage.
 * 4. Automatic 401 interceptor coordinates with backend /auth/refresh to refresh session transparently.
 */

const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory access token storage
let inMemoryAccessToken = null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token || null;
};

export const getAccessToken = () => inMemoryAccessToken;

// Request Interceptor: Attach in-memory JWT bearer token if available
api.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency lock for refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle 401s and execute refresh rotation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If no response (network error) or request has already retried, reject immediately
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/register');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue parallel requests until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint. The HttpOnly cookie is sent automatically by browser.
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data?.data?.accessToken;

        if (newAccessToken) {
          setAccessToken(newAccessToken);
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          throw new Error('Refresh response did not contain access token');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);

        // Notify application that session has expired
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('pitch:session-expired', {
              detail: { error: refreshError },
            })
          );
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
