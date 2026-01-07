import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    
    // 🚀 PERFORMANCE: Service Worker para cache de assets estáticos
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'manifest.json'],
      manifest: false, // Já temos manifest.json existente
      workbox: {
        // Cache de assets estáticos (JS, CSS, fonts)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // Cache de imagens
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 dias
              }
            }
          },
          {
            // Cache de fonts do Google ou outros CDNs
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 ano
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Alias /utils to the utils directory (for absolute imports)
      '/utils': fileURLToPath(new URL('./utils', import.meta.url)),
    },
  },
})