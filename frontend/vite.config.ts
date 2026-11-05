import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // With `pnpm dev` the FastAPI backend runs separately (`fastapi dev` in backend/).
    // `vercel dev` routes /api to the backend service itself, so this proxy isn't used there.
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
