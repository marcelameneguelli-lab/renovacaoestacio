// RenovaVR · Service Worker
// Página e arquivos do sistema: busca SEMPRE a versão mais nova na internet e
// só usa a cópia guardada quando estiver sem conexão. Assim toda publicação
// nova chega aos computadores sem precisar limpar nada.
// O servidor (script.google.com) nunca passa por aqui.
const CACHE = 'renovavr-v2';

self.addEventListener('install', function(e) { self.skipWaiting(); });

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys()
      .then(function(ks) { return Promise.all(ks.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })); })
      .then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // GAS, CDNs: direto na rede
  e.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(function(resp) {
        if (resp && resp.ok) {
          var copia = resp.clone();
          caches.open(CACHE).then(function(c) { c.put(req, copia); }).catch(function() {});
        }
        return resp;
      })
      .catch(function() {
        return caches.match(req).then(function(r) { return r || caches.match('index.html') || caches.match('./'); });
      })
  );
});
