// Guarda os arquivos do app no celular para abrir mais rápido (e abrir a tela mesmo sem internet).
const V = 'medicacoes-v1';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/favicon.svg'];

self.addEventListener('install', e => {
  // Guarda cada arquivo separadamente: se algum faltar no GitHub, os outros continuam funcionando.
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(ARQUIVOS.map(a => c.add(a).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Tenta a rede primeiro (para você sempre receber a versão nova); se demorar mais de 2,5 s ou estiver sem internet, usa o que está guardado.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    const rede = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; });
    const guardado = await c.match(e.request);
    if (!guardado) return rede;
    const limite = new Promise(res => setTimeout(() => res(guardado), 2500));
    return Promise.race([rede, limite]).catch(() => guardado);
  })());
});
