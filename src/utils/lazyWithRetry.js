import { lazy } from 'react';

const CHUNK_RELOAD_KEY = 'et_chunk_reload';

/**
 * Lazy-load a route/module with retries — helps after Netlify deploys when a stale
 * service worker or cached index.html points at missing chunk files.
 */
export function lazyWithRetry(importFn, { retries = 3, delayMs = 800 } = {}) {
    return lazy(async () => {
        let lastError;

        for (let attempt = 0; attempt <= retries; attempt += 1) {
            try {
                return await importFn();
            } catch (err) {
                lastError = err;
                const isChunkError =
                    err?.message?.includes('Failed to fetch dynamically imported module') ||
                    err?.message?.includes('Importing a module script failed') ||
                    err?.message?.includes('error loading dynamically imported module') ||
                    err?.name === 'ChunkLoadError';

                if (!isChunkError || attempt >= retries) break;
                await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
            }
        }

        const isChunkError =
            lastError?.message?.includes('Failed to fetch dynamically imported module') ||
            lastError?.message?.includes('Importing a module script failed') ||
            lastError?.message?.includes('error loading dynamically imported module') ||
            lastError?.name === 'ChunkLoadError';

        if (isChunkError && typeof sessionStorage !== 'undefined') {
            const reloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY);
            if (!reloaded) {
                sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
                window.location.reload();
                return new Promise(() => {});
            }
            sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        }

        throw lastError;
    });
}

export function clearChunkReloadFlag() {
    try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {
        /* ignore */
    }
}
