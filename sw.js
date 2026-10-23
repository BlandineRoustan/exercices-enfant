// Nom du cache : le changer vide l'ancien cache (utile si un fichier y est resté coincé).
const V = 'lecture-v5';
const CORE = [
  './', 'index.html', 'manifest.json', 'css/style.css',
  'js/app.js', 'js/store.js', 'js/images.js', 'js/render.js', 'js/ui.js', 'js/exercices.js', 'js/maths.js',
  'js/logique.js', 'js/progression.js', 'js/reglages.js',
  'data/mots.json', 'icons/icon-192.png', 'icons/icon-512.png'
];
const DELAI = 3000; // au-delà, on sert la version en cache (réseau lent)

// "reload" : on ignore le cache HTTP du navigateur (GitHub Pages garde les fichiers 10 min)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
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

// Code et données : réseau d'abord (toujours la dernière version), cache si hors-ligne ou trop lent.
// Images et icônes : cache d'abord (elles changent rarement), mises à jour en arrière-plan.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const image = /\/(images|icons)\//.test(url.pathname);
  e.respondWith(caches.open(V).then(async c => {
    const reseau = fetch(e.request, { cache: 'no-cache' }).then(r => {
      if (r && r.ok) c.put(e.request, r.clone());
      return r;
    });
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (image && hit) { reseau.catch(() => {}); return hit; }
    if (!hit) return reseau;
    const lent = new Promise(ok => setTimeout(() => ok(hit), DELAI));
    return Promise.race([reseau.catch(() => hit), lent]);
  }));
});
