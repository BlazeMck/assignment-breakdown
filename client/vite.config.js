import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Forward API calls to the Express backend during development.
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{browser: 'chromium'}]
    }
  }
})