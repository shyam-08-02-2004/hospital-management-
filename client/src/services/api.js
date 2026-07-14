import axios from 'axios';

/**
 * Shared axios instance. Base URL relies on Vite's dev proxy (/api -> :5000)
 * so no CORS config is needed locally; set VITE_API_URL in production builds
 * if the API is hosted on a different origin than the frontend.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // send refresh-token cookie
});

// Request interceptor: attach access token once auth module is wired up.
api.interceptors.request.use((config) => {
  const token = localStorageSafeGet('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        if (data.success && data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token expired or invalid, log out user
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

function localStorageSafeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export default api;
