import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/jobs': 'http://localhost:5000',
      '/recruiters': 'http://localhost:5000',
      '/lookup': 'http://localhost:5000',
      '/outreach': 'http://localhost:5000',
    }
  }
})