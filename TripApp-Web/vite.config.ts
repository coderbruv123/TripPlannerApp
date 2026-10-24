import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Bind every local interface so the site opens on http://localhost:5173,
// http://127.0.0.1:5173 and from a phone on the LAN, all on the same port
// the backend's CORS policy expects.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
})
