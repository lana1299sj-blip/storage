/* 收納記錄 Service Worker
   ★ 每次更新 index.html / manifest.json / sw.js 後，請把下面的版本號 +1（例如 v1 → v2），手機才會抓到新版 ★ */
const CACHE_NAME = 'stash-v8';
const PRECACHE = ['./', './index.html', './manifest.json'];

// 這些網域一律直接走網路（Network-Only）：Supabase 與 Google 登入相關
const NETWORK_ONLY_HOSTS = ['supabase.co', 'supabase.in', 'google.com', 'googleapis.com', 'gstatic.com', 'googleusercontent.com'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('stash-') && k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                                   // 寫入類請求不處理
  if (NETWORK_ONLY_HOSTS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) return;  // 不快取，直接走網路
  if (url.origin !== self.location.origin) return;                    // 其他跨網域（CDN 等）也直接走網路
  if (req.mode === 'navigate') {                                      // 開啟 App／登入後導回：一律回 index.html（忽略 ?code= 等參數）
    e.respondWith(caches.match('./index.html').then(r => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));        // 本地靜態檔：快取優先
});
