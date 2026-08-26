import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/iwego/',
  plugins: [vue()],
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
