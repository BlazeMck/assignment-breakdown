import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      // Forward API calls to the Express backend during development.
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    // Ensure proper routing for SPA
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{browser: 'chromium'}]
    }
  }
})