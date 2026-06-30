import axios from 'axios';
import { getAccessToken, refreshAccessToken } from '../auth/useAuth';

// All backend calls go under /api so they never collide with the SPA's own routes
// (e.g. /search/corps, /inbox). nginx (prod) and the Vite dev proxy strip the /api
// prefix before forwarding to the api-gateway.
export const apiClient = axios.create({ baseURL: '/api' });

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401 (access token expired), try once to refresh the token and replay the
// request. If the refresh fails, the session is cleared and the error propagates.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status === 401 && original && !original._retry && localStorage.getItem('refreshToken')) {
      original._retry = true;
      if (await refreshAccessToken()) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${getAccessToken()}`;
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  },
);
