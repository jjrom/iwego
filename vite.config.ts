import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    // maplibre-gl builds its worker URL at runtime (`new URL(...)` on a
    // string it computes on the fly), so Vite's static asset analysis can't
    // detect and bundle it automatically. Copy it next to the built JS
    // ourselves so the browser can fetch it at the relative path the
    // library expects: <chunk-dir>/maplibre-gl-worker.mjs.
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs',
          dest: 'assets',
          rename: { stripBase: true },
        },
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
