/* Service worker do Visualizador LAS (modelo). O `vite build` preenche a versão e a lista de todos os arquivos do site (com o nome que
 * ganham no build) e grava o resultado como `sw.js` na pasta do site. Serve para o programa abrir sem internet depois da primeira
 * visita. Nada é enviado: o service worker só guarda no computador os arquivos do próprio site.
 *
 * Atualização: uma versão nova instala em segundo plano e só assume quando todas as abas do programa forem fechadas (sem skipWaiting), para que
 * uma aba aberta nunca misture arquivos de versões diferentes. Enquanto houver internet, a página principal vem sempre da rede. */
const VERSAO = 'ce5497c761f9';
const CACHE = 'vlas-' + VERSAO;
const ARQUIVOS = ["./","assets/index-BM3-SUDK.js","assets/index-D2Zq9bNW.css","assets/laz-reader-Bd1tFZG4.js","assets/laz-reader-Qvqrds-4.js","assets/loader.worker-BhjB5rpB.js","assets/refine.worker-CAFlWtzL.js","icon-192.png","icon-512.png","index.html","laz-perf.js","laz-perf.wasm","manifest.webmanifest","visualizador-las.ico"];

/* Cada arquivo é guardado por conta própria: uma falha passageira da rede num arquivo secundário (um ícone, por exemplo) não impede a
 * instalação. A página principal é obrigatória; sem ela a instalação é recusada e o navegador tenta de novo na próxima visita. */
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(async (c) => {
    const r = await Promise.allSettled(ARQUIVOS.map((a) => c.add(a)));
    const essencial = ARQUIVOS.map((a, i) => ({ a, ok: r[i].status === 'fulfilled' })).filter((x) => x.a === './' || x.a === 'index.html');
    if (essencial.some((x) => !x.ok)) throw new Error('Não foi possível guardar a página principal.');
  }));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((nomes) => Promise.all(nomes.filter((n) => n.startsWith('vlas-') && n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {                                                 // página: rede primeiro (versão nova), cache se estiver sem internet
    e.respondWith(fetch(req).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./'))));
    return;
  }
  e.respondWith(                                                                 // demais arquivos: cache primeiro; o que faltar vem da rede e fica guardado
    caches.match(req).then((r) => r || fetch(req).then((resp) => {
      if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
      return resp;
    })),
  );
});
