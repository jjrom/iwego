import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    // maplibre-gl loads its worker chunk (and the chunk's own "shared" code
    // chunk) via a URL it builds at runtime (`new URL(...)` on a string it
    // computes on the fly), so Vite's static asset analysis can't detect and
    // bundle either file automatically. Copy them next to the built JS
    // ourselves so the browser can fetch them at the relative path the
    // library expects: <chunk-dir>/maplibre-gl-{worker,shared}.mjs.
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs',
          dest: 'assets',
          rename: { stripBase: true },
        },
        {
          src: 'node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs',
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
