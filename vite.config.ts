import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MAZO - Mazo Virtual para Truco',
        short_name: 'MAZO',
        description: 'Mazo virtual compartido para jugar al Truco presencialmente sin cartas físicas.',
        theme_color: '#0c2317',
        background_color: '#0c2317',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3000
  }
});
