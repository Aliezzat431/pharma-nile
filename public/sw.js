/**
 * PharmaNile Service Worker — Offline-First PWA
 * Caches Next.js app shell so the POS terminal works even if the dev server is unreachable.
 */

const CACHE_NAME = 'pharmanile-v1';

// App-shell assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/pos',
  '/manifest.json',
];

// Install: pre-cache the shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache failed (some assets may not exist yet):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: prune old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network-first for API & Supabase calls, Cache-first for everything else
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always go to network for Supabase API calls and Next.js API routes
  const isApiCall =
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/_next/static/webpack');

  if (isApiCall) {
    // Network-only for API: don't interfere
    return;
  }

  // For Next.js static assets and pages: Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);

      const networkFetch = fetch(request)
        .then((response) => {
          // Cache successful GET responses
          if (
            response.ok &&
            request.method === 'GET' &&
            !url.pathname.startsWith('/_next/webpack')
          ) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => null);

      // Return cached immediately, update in background
      if (cached) {
        networkFetch; // fire & forget background update
        return cached;
      }

      // Nothing cached — wait for network
      const netResponse = await networkFetch;
      if (netResponse) return netResponse;

      // Both failed — return offline fallback for navigation requests
      if (request.mode === 'navigate') {
        const fallback = await cache.match('/pos');
        if (fallback) return fallback;
        // Last resort — basic offline page
        return new Response(
          `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>PharmaNile — وضع عدم الاتصال</title>
  <style>
    body { font-family: 'Cairo', sans-serif; background: #0a0a0a; color: #fff;
           display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    h1 { color: #D4AF37; font-size: 1.5rem; }
    p  { color: #6b7280; margin-top: 0.5rem; }
    a  { color: #00CED1; margin-top: 1.5rem; display: inline-block; }
  </style>
</head>
<body>
  <div>
    <h1>📴 وضع عدم الاتصال</h1>
    <p>لا يوجد اتصال بالإنترنت ولم يتم تحميل هذه الصفحة مسبقاً.</p>
    <a href="/pos">الذهاب لنقطة البيع</a>
  </div>
</body>
</html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }

      return new Response('Offline', { status: 503 });
    })
  );
});
