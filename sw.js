// Change le numéro de version pour forcer la mise à jour de tous les fichiers.
const V = 'lecture-v1';
const CORE = [
  './', 'index.html', 'manifest.json', 'css/style.css',
  'js/app.js', 'js/store.js', 'js/images.js', 'js/render.js', 'js/ui.js', 'js/exercices.js', 'js/reglages.js',
  'data/mots.json', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache d'abord, mise à jour en arrière-plan (les changements apparaissent au lancement suivant).
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(V).then(async c => {
      const hit = await c.match(e.request);
      const reseau = fetch(e.request)
        .then(r => {
          if (r && r.ok && new URL(e.request.url).origin === location.origin) c.put(e.request, r.clone());
          return r;
        })
        .catch(() => hit);
      return hit || reseau;
    })
  );
});
