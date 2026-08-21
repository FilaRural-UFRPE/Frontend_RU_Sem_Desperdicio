import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({
      registerType: 'autoUpdate',
      
      manifest: {
        name: 'RU-Sem-Desperdicio',
        short_name: 'smartru',
        description: 'App de agendamento de refeições e monitoramento de filas',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',

        icons: [
          {
            src: '/public/favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/public/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      workbox: {
        runtimeCaching: [
          {
            urlPattern: '/^https:\/\/semdesperdicio\.smartru\.com\.br\/api\/.*/i',

            handler: 'NetworkFirst',

            options: {
              cacheName: 'smartru-api-cache',

              networkTimeoutSeconds: 5,

              cacheableResponse: {
                statuses: [0, 200]
              },

              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ],
});
