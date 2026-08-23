import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            tailwindcss(),
            VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['logo.svg'],
                manifest: {
                    name: 'Expense Tracker',
                    short_name: 'Expenses',
                    theme_color: '#0f766e',
                    background_color: '#f4f7f6',
                    display: 'standalone',
                    start_url: '/',
                    icons: [
                        {
                            src: '/logo.svg',
                            sizes: '512x512',
                            type: 'image/svg+xml',
                            purpose: 'any maskable',
                        },
                    ],
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif,woff2}'],
                    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
                    runtimeCaching: [
                        {
                            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'google-fonts-cache',
                                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            },
                        },
                    ],
                },
            }),
        ],
        server: {
            proxy: env.VITE_API_URL && env.VITE_API_URL.includes('localhost')
                ? {
                    '/api': {
                        target: env.VITE_API_URL.replace(/\/api$/, ''),
                        changeOrigin: true,
                        secure: false,
                    }
                }
                : undefined,
        },
        resolve: {
            dedupe: ['react', 'react-dom'],
            alias: {
                '@': path.resolve(__dirname, './src'),
            }
        },
        build: {
            outDir: 'dist',
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit'],
                        'vendor-shared': ['src/context/alertContext.js'],
                        'vendor-charts': ['apexcharts', 'react-apexcharts'],
                        'vendor-xlsx': ['xlsx'],
                    },
                },
            },
        },
    };
});
