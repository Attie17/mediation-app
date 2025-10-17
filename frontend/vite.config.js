import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setupTests.js',
    globals: true
  }
})
