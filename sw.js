// Service worker del Inventario de barra.
// Guarda la app en el teléfono para que abra sin señal.
// Al publicar una versión nueva de la app, sube el número de VERSION:
// así los teléfonos ven el aviso "Hay una versión nueva".
const VERSION = 'pinv-1.0.0';
const FUENTES = 'pinv-fuentes';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS.map((u) => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k !== FUENTES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // La planilla (script.google.com) nunca pasa por aquí: siempre va a internet.
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      e.respondWith(caches.match('./index.html').then((r) => r || fetch(req)));
      return;
    }
    e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
    return;
  }

  // Tipografías de Google: se guardan la primera vez y se actualizan en segundo plano.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FUENTES).then(async (c) => {
      const guardada = await c.match(req);
      const red = fetch(req).then((r) => {
        if (r.ok || r.type === 'opaque') c.put(req, r.clone());
        return r;
      }).catch(() => guardada);
      return guardada || red;
    }));
  }
});
