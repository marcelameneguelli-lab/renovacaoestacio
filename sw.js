// Service Worker — Sistema de Renovação de Matrícula (Estácio Volta Redonda)
// Objetivo: permitir "Instalar app" e funcionar como PWA.
// IMPORTANTE: nunca armazena em cache as chamadas ao Google Apps Script —
// os dados de alunos/acionamentos precisam estar sempre atualizados.
// Só o "esqueleto" do app (HTML, ícones, manifest) fica em cache, como
// respaldo para quando não há internet.

const CACHE_NAME = 'renovacao-estacio-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Só intercepta requisições do MESMO domínio (o app em si: HTML, ícones,
  // manifest). Chamadas para script.google.com (outro domínio) passam
  // direto para a rede, sem cache — os dados precisam ser sempre os
  // mais recentes.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return resposta;
      })
      .catch(() => caches.match(event.request))
  );
});
