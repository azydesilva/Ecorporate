// Serve the service worker at /sw.js without placing it in the public folder
// Important: Keep the path as /sw.js to retain root scope

export const dynamic = 'force-static'

export async function GET() {
    // The service worker script content
    const sw = `// Simple service worker for cache busting and update prompts
// Increment CACHE_VERSION on each deployment to invalidate old caches
const CACHE_VERSION = '151';
const APP_CACHE = \`app-cache-${'${CACHE_VERSION}'}\`;

self.addEventListener('install', (event) => {
    // Skip waiting so the new SW can move to waiting state immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Clear old caches
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.map((key) => {
                    if (key !== APP_CACHE) {
                        return caches.delete(key);
                    }
                })
            );
            // Take control of uncontrolled clients immediately
            await self.clients.claim();
        })()
    );
});

// Basic fetch handler: cache-first for static assets, network-first for documents
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle GET
    if (request.method !== 'GET') return;

    // Network-first for navigation/doc requests
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            (async () => {
                try {
                    const response = await fetch(request);
                    return response;
                } catch (err) {
                    const cache = await caches.open(APP_CACHE);
                    const cached = await cache.match('/');
                    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
                }
            })()
        );
        return;
    }

    // Cache-first for static assets (scripts, styles, images)
    if (url.origin === self.location.origin) {
        const isStatic = /\.(?:js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|svg|ico|webp)$/i.test(url.pathname);
        if (isStatic) {
            event.respondWith(
                (async () => {
                    const cache = await caches.open(APP_CACHE);
                    const cached = await cache.match(request);
                    if (cached) return cached;
                    const response = await fetch(request);
                    // Only cache successful, basic responses
                    if (response && response.ok && response.type === 'basic') {
                        cache.put(request, response.clone());
                    }
                    return response;
                })()
            );
        }
    }
});

// Listen for messages from the app to trigger skipWaiting
self.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
`;

    return new Response(sw, {
        headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            // Avoid long-term caching so updates are detected
            'Cache-Control': 'no-store, must-revalidate',
        },
    })
}


