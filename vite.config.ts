import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { prerender } from './scripts/prerender.mjs';

// https://vitejs.dev/config/
export default defineConfig(({mode}) => ({
  plugins: [
    react(),
    { name:'trucardo-static-seo', apply:'build', closeBundle:{ order:'pre', sequential:true,
      handler:()=>{const env=loadEnv(mode,process.cwd(),'VITE_');return prerender(env.VITE_SITE_URL || process.env.VITE_SITE_URL || 'https://trucardo.sytes.net',env.VITE_GOOGLE_SITE_VERIFICATION || process.env.VITE_GOOGLE_SITE_VERIFICATION || '');} } },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-trucardo.jpg'],
      workbox: { navigateFallbackAllowlist:[/^\/$/, /^\/r\/[A-Za-z0-9]{4}\/?$/], globPatterns:['**/*.{js,css,html,svg,png,jpg,webmanifest}'] },
      manifest: {
        name: 'TRUCARDO - Truco online con amigos',
        short_name: 'TRUCARDO',
        description: 'Creá una mesa, compartí el QR y jugá al Truco con amigos desde el celular.',
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
}));
