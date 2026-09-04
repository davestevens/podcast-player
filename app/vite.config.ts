import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this project site from /test/ (davestevens.github.io/test/),
// not a custom domain -- base must match so asset paths and the PWA manifest
// scope/start_url resolve correctly once deployed.
const base = '/test/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Podcast Player',
        short_name: 'Podcasts',
        description: 'A simple, minimalistic podcast player.',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#0b0b0d',
        theme_color: '#0b0b0d',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App-shell precaching only; downloaded episode audio is handled
        // explicitly via IndexedDB (Phase 4), not generic SW runtime caching.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
