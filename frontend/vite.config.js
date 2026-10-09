import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "http" ? [] : [mkcert()])],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        ws: true,
      },
    },
  },
}))
