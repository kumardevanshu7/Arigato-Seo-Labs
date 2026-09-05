import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/brand-right/**', '**/dist/**', '**/.git/**', '**/firestore.rules'],
    },
    proxy: {
      '/modal-api': {
        target: 'https://devansh-grow--ep-kimi-k3-server.us-west.modal.direct/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/modal-api/, ''),
        secure: true,
      },
    },
  },
})
