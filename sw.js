/* OsteoStudio 3 – service worker per l'uso offline.
   Memorizza solo i file dell'app: i dati dei pazienti restano nel database locale dell'iPad. */
const CACHE = 'osteostudio-v3.4.0';
const ASSETS = ['./', './index.html', './app.css', './js/pdf.js', './js/body.js', './js/consent.js', './js/app.js',
  './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* Prima la copia salvata (apertura immediata anche offline); se c'è rete, aggiorna in background
   così la nuova versione è pronta alla prossima apertura. */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.mode === 'navigate' ? './index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const update = fetch(req, { cache: 'no-cache' })
      .then((res) => { if (res.ok) cache.put(key, res.clone()); return res; })
      .catch(() => null);
    if (cached) { event.waitUntil(update); return cached; }
    return (await update) || new Response('OsteoStudio non è ancora disponibile offline: aprila una volta con la connessione attiva.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
