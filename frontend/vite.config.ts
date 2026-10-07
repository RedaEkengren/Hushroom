import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { prerenderHead } from './vite-prerender-head'

// scripts/deploy-prod.sh builds into dist.new and swaps it in atomically. The
// build script is a chain (tsc && vite build && prerender), so `npm run build --
// --outDir X` would attach the flag to the LAST command instead of vite. An env
// var is the only thing that reaches every step reliably.
const OUT_DIR = process.env.VITE_BUILD_OUT_DIR || 'dist'

// https://vitejs.dev/config/
export default defineConfig({
  // prerenderHead writes one static index.html per marketing route after the
  // bundle is emitted (level 1). See vite-prerender-head.ts.
  plugins: [react(), prerenderHead()],
  server: {
    // 5174 (not Vite's default 5173) so the dev server has a deterministic
    // port on machines where other Vite projects already own 5173.
    // strictPort: fail loudly instead of silently shifting to another port
    // (playwright.config.ts + docs assume 5174).
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3010',
        ws: true,
        changeOrigin: true,
      },
      // nginx proxies /health to the backend on prod; mirror it so e2e + curl work locally
      '/health': {
        target: 'http://localhost:3010',
        changeOrigin: true,
      },
    }
  },
  build: {
    outDir: OUT_DIR,
    rollupOptions: {
      output: {
        // Split heavy, rarely-changing vendor code into its own long-lived
        // cacheable chunks so an app-code deploy doesn't invalidate them.
        // NOTE: livekit-client is still imported statically by
        // useLiveKitVoice.ts, so this chunk is fetched on first load —
        // it just caches independently. True lazy-loading of LiveKit
        // needs the hook to `await import('livekit-client')` (future work).
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-livekit': ['livekit-client'],
          'vendor-crypto': ['tweetnacl', 'tweetnacl-util'],
        },
      },
    },
  },
})
