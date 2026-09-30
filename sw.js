/* OsteoStudio – service worker per l'uso offline.
   Memorizza solo i file dell'app (pagina, icone, manifest): i dati dei pazienti
   restano nel database locale dell'iPad e non passano mai di qui. */
const CACHE = 'osteostudio-v2.1.1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Offline prima di tutto: apre subito la copia salvata e, se c'è rete,
    // scarica in background l'eventuale nuova versione per la prossima apertura.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('./index.html');
      const update = fetch(request, { cache: 'no-store' })
        .then((response) => { if (response.ok) cache.put('./index.html', response.clone()); return response; })
        .catch(() => null);
      if (cached) { event.waitUntil(update); return cached; }
      return (await update) || new Response('OsteoStudio non è ancora disponibile offline: aprilo una volta con la connessione attiva.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })());
    return;
  }

  event.respondWith(caches.match(request, { ignoreSearch: true }).then((hit) => hit || fetch(request)));
});
