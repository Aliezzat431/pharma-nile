/**
 * PharmaNile Service Worker — Offline-First PWA
 * Caches Next.js app shell so the POS terminal works even if the dev server is unreachable.
 */

const CACHE_NAME = 'pharmanile-v1';

const PRECACHE_URLS = [
  '/',
  '/pos',
  '/inventory',
  '/shortages',
  '/customers',
  '/settings',
  '/financials',
  '/returns',
  '/debts',
  '/orders',
  '/companies',
  '/sadqah',
  '/transfers',
  '/staff',
  '/invoices',
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

const DB_NAME = 'Pharmanile_SW_Sync';
const STORE_NAME = 'mutations';

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    };
  });
}

async function queueMutation(request) {
  const db = await openSyncDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const headers = {};
  request.headers.forEach((val, key) => { headers[key] = val; });
  const body = await request.clone().text();

  tx.objectStore(STORE_NAME).add({
    url: request.url,
    method: request.method,
    headers,
    body,
    timestamp: Date.now()
  });
}

async function flushMutations() {
  const db = await openSyncDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const mutations = await new Promise(res => {
    const req = store.getAll();
    req.onsuccess = () => res(req.result);
  });

  if (mutations.length === 0) return 0;
  let successCount = 0;

  for (const mut of mutations) {
    try {
      const resp = await fetch(mut.url, {
        method: mut.method,
        headers: mut.headers,
        body: mut.body
      });
      if (resp.ok || resp.status >= 400) {
        // If success or unrecoverable client error, remove from queue
        const delTx = db.transaction(STORE_NAME, 'readwrite');
        delTx.objectStore(STORE_NAME).delete(mut.id);
        successCount++;
      }
    } catch (e) {
      console.error('[SW Sync] Mutation failed to replay:', e);
      break; 
    }
  }
  return successCount;
}

// Fetch: Network-first for API & Supabase calls, Cache-first for everything else
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Intercept explicit sync trigger
  if (url.pathname === '/api/__trigger_sync') {
    event.respondWith(
      flushMutations().then(count => new Response(JSON.stringify({ synced: count }), { status: 200 }))
    );
    return;
  }

  // Intercept Supabase API calls
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    if (request.method === 'GET') {
      event.respondWith(
        fetch(request).then((response) => {
          const clone = response.clone();
          caches.open('pharmanile-api-cache').then((cache) => cache.put(request, clone));
          return response;
        }).catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        })
      );
      return;
    } else if (request.method !== 'OPTIONS' && request.method !== 'HEAD') {
      // POST, PATCH, DELETE mutations
      event.respondWith(
        fetch(request.clone()).catch(async (error) => {
          await queueMutation(request);
          // Auto-generate a fake response to trick the frontend
          const bodyText = await request.clone().text();
          let fakeData = [];
          try {
            const parsed = JSON.parse(bodyText);
            fakeData = Array.isArray(parsed) ? parsed : [parsed];
            fakeData = fakeData.map(item => ({ ...item, id: `offline-${Date.now()}` }));
          } catch(e) {}
          
          return new Response(JSON.stringify(fakeData), {
            status: 201, 
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
      return;
    }
  }
  const isNextStatic = 
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/_next/static/webpack');

  if (isNextStatic) {
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
