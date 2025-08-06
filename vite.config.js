import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
    // Load environment variables for the current mode
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        server: {
            proxy: {
                // Proxy only when running dev and point to local backend without /api duplication
                '/api': env.VITE_API_URL && env.VITE_API_URL.includes('localhost')
                    ? env.VITE_API_URL.replace(/\/api$/, '')  // remove trailing /api if present
                    : null,
            }
        },
        resolve: {
            dedupe: ['react', 'react-dom'],
        },
    };
});
