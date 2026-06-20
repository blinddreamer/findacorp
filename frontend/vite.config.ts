import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8080',
      '/profiles': 'http://localhost:8080',
      '/search': 'http://localhost:8080',
      '/inbox': 'http://localhost:8080',
    },
  },
});
