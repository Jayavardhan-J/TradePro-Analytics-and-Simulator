// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Catch any request starting with /api
      '/api': {
        target: 'http://localhost:8080', // Your backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
});