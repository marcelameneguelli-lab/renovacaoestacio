// RenovaVR · Service Worker
// Página e arquivos do sistema: busca SEMPRE a versão mais nova na internet e
// só usa a cópia guardada quando estiver sem conexão. Assim toda publicação
// nova chega aos computadores sem precisar limpar nada.
// O servidor (script.google.com) nunca passa por aqui.
//
// Todos os caminhos são calculados a partir do escopo deste arquivo, então o
// mesmo código funciona numa subpasta (GitHub Pages: /renovacaoestacio/) e na
// raiz do domínio (Cloudflare Workers: /).
const CACHE = 'renovavr-v3';
const BASE = new URL('./', self.location).href;            // pasta onde o app está publicado
const PAGINA = [BASE, new URL('index.html', BASE).href];  // "/" e "/index.html" (ou a subpasta)

self.addEventListener('install', function(e) {
  // Guarda a página inicial para abrir sem internet. Falha aqui não impede a instalação.
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c) {
        return Promise.all(PAGINA.concat([new URL('manifest.json', BASE).href]).map(function(u) {
          return fetch(u, { cache: 'no-store' })
            .then(function(r) { if (r.ok) return c.put(u, r); })
            .catch(function() {});
        }));
      })
      .catch(function() {})
      .then(function() { return self.skipWaiting(); })
  );
});

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
  if (!url.href.startsWith(BASE)) return;           // fora da pasta do app: não interfere
  e.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(function(resp) {
        if (resp && resp.ok && !resp.redirected) {
          var copia = resp.clone();
          caches.open(CACHE).then(function(c) { c.put(req, copia); }).catch(function() {});
        }
        return resp;
      })
      .catch(function() {
        // Sem internet: a cópia guardada deste endereço; para abrir o app, a página inicial
        return caches.match(req, { ignoreSearch: true }).then(function(r) {
          if (r) return r;
          if (req.mode !== 'navigate') return Response.error();
          return caches.match(PAGINA[0]).then(function(p) { return p || caches.match(PAGINA[1]); })
            .then(function(p) { return p || Response.error(); });
        });
      })
  );
});
