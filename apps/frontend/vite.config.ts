import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'url';

// Fix for __dirname not available in ES module context
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load .env from repo root (two levels up from apps/frontend)
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');

  return {
    // Point Vite root to repo root where index.html and src/ actually live
    root: path.resolve(__dirname, '../..'),
    publicDir: path.resolve(__dirname, '../../public'),

    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw-custom.ts',
        registerType: 'autoUpdate',
        injectManifest: {
          injectionPoint: undefined
        },
        devOptions: {
          enabled: true,
          type: 'module'
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Legis - Jurisprudence, Simplified.',
          short_name: 'Legis',
          description: 'AI-driven legal intelligence platform for Indian citizens. Document scanner, case tracker, court directory with offline support.',
          theme_color: '#1B4FD8',
          background_color: '#FFFFFF',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          categories: ['legal', 'productivity', 'utilities'],
          lang: 'en-IN',
          dir: 'ltr',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' },
            { src: '/icon-72.png',  sizes: '72x72',   type: 'image/png' }
          ],
          shortcuts: [
            { name: 'Scan Document', short_name: 'Scan',   url: '/scan',   icons: [{ src: '/icon-scan.png',   sizes: '96x96' }] },
            { name: 'Case Status',   short_name: 'Status', url: '/status', icons: [{ src: '/icon-status.png', sizes: '96x96' }] },
            { name: 'Find Lawyer',   short_name: 'Help',   url: '/lawyers', icons: [{ src: '/icon-help.png',   sizes: '96x96' }] }
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
                expiration: { maxEntries: 50, maxAgeSeconds: 604800 }
              }
            },
            {
              urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'gemini-cache',
                expiration: { maxEntries: 20, maxAgeSeconds: 300 }
              }
            },
            {
              urlPattern: /^http:\/\/localhost:8000\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'scraper-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 1800 }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 }
              }
            },
            // Never serve stale legal/case data from cache
            {
              urlPattern: /\/api\/(court-updates|daily-quote|case-status)\//,
              handler: 'NetworkOnly',
            }
          ]
        }
      })
    ],

    resolve: {
      // @ alias now points to repo root src/ (../../src from apps/frontend)
      alias: { '@': path.resolve(__dirname, '../../src') }
    },

    build: {
      // Output dist to repo root, not inside apps/frontend
      outDir: path.resolve(__dirname, '../../dist'),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('framer-motion') || id.includes('lucide-react')) {
                return 'vendor-ui';
              }
              return 'vendor';
            }
          }
        }
      }
    },

    server: {
      host: '127.0.0.1',   // Force IPv4, fixes localhost/IPv6 mismatch on Windows
      port: 5173,
      strictPort: true,     // Crash loudly if port is taken instead of silently moving
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',  // Proxy all /api calls to Express backend
          changeOrigin: true,
        }
      }
    }
  };
});