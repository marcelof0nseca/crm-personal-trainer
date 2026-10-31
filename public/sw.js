// Só guarda a casca da aplicação (ficheiros com hash e ícones). Nunca dados: pedidos ao
// Supabase, a páginas públicas e tudo o que não seja GET da própria origem passam ao lado.
const CACHE = 'ptmanager-casca-v1';
const CASCA = ['/favicon.png', '/icon-512.png', '/apple-touch-icon.png', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Os ficheiros com hash nunca mudam de conteúdo; o resto vem sempre da rede.
  if (!url.pathname.startsWith('/assets/') && !CASCA.includes(url.pathname)) return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
    if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); }
    return res;
  })));
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = {}; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'PTMANAGER', { body: d.texto || '', icon: '/icon-512.png' }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow('/?aluno=1'));
});
