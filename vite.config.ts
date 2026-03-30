import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Legis - Jurisprudence, Simplified.',
          short_name: 'Legis',
          description: 'Legis is an AI-driven legal intelligence platform designed for absolute accessibility and judicial clarity. Document scanner, case tracker, court directory with Hindi, voice, sign language, offline PWA.',
          theme_color: '#005bbf',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icon-72.png',
              sizes: '72x72',
              type: 'image/png'
            }
          ],
          shortcuts: [
            {
              name: 'Scan Document',
              short_name: 'Scan',
              description: 'Capture and analyze legal document',
              url: '/scan',
              icons: [{ src: '/icon-scan.png', sizes: '96x96' }]
            },
            {
              name: 'Case Status',
              short_name: 'Status',
              description: 'Check case status by CNR',
              url: '/status',
              icons: [{ src: '/icon-status.png', sizes: '96x96' }]
            },
            {
              name: 'AI Legal Help',
              short_name: 'Help',
              description: 'Chat with AI legal assistant',
              url: '/help',
              icons: [{ src: '/icon-help.png', sizes: '96x96' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                },
              }
            },
            {
              urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'gemini-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 5, // 5 min
                },
              }
            },
            {
              urlPattern: /^http:\/\/localhost:8000\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'scraper-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 30, // 30 min
                },
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
