import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development the FastAPI backend runs separately (`fastapi dev` in backend/).
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
