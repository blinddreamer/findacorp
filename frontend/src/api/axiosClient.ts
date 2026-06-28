import axios from 'axios';
import { getAccessToken } from '../auth/useAuth';

// All backend calls go under /api so they never collide with the SPA's own routes
// (e.g. /search/corps, /inbox). nginx (prod) and the Vite dev proxy strip the /api
// prefix before forwarding to the api-gateway.
export const apiClient = axios.create({ baseURL: '/api' });

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
