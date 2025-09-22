import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/pwa/',
  build: {
    outDir: 'pwa',
    emptyOutDir: true,
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true, // Set to true to enable PWA in development mode for testing A2HS
      },
      manifest: {
        name: 'Planiha Eh Tudo',
        short_name: 'Planiha',
        description: 'Planilha Eh tudo',
        theme_color: '#3B82F6',
        background_color: '#F9FAFB',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: './pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: './pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: './pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
        share_target: {
          action: './',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'file', // Use a generic name for files
                accept: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
              },
            ],
          },
        },
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,vue}'],
      },
    }),
  ],
})
