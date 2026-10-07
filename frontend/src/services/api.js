import axios from 'axios';

/**
 * Centralized Axios instance for the PITCH API.
 *
 * In development, Vite's proxy forwards /api to the backend.
 * In production, use the VITE_API_URL env var.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Response Interceptor ---
// On 401, a future phase will attempt token refresh here.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Future: handle 401 → refresh token → retry
    return Promise.reject(error);
  }
);

export default api;
