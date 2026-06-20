import axios from 'axios';
import { getAccessToken } from '../auth/useAuth';

export const apiClient = axios.create({ baseURL: '/' });

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
