// sw.js — deixa o Caderno de Aventuras instalável e jogável sem internet.
//
// POR QUE: instalado no celular (PWA), o jogo abre pelo ícone, em tela cheia,
// e precisa funcionar mesmo sem sinal. O save já fica no localStorage; o que
// faltava era guardar os próprios arquivos do jogo.
//
// ESTRATÉGIA: ao instalar, baixa todos os arquivos do jogo para um cache com
// a versão no nome. Cada pedido é respondido do cache na hora e, em paralelo,
// buscado de novo na rede para atualizar o cache ("stale-while-revalidate"):
// abre rápido e offline, e uma versão nova aparece na próxima vez que o jogo
// abrir. As fontes do Google também vão para o cache na primeira vez que
// carregam. O nome do cache leva a versão do jogo (de ../versao.js): subir a
// versão muda o arquivo importado, o navegador instala este worker de novo e
// os caches antigos são apagados.
importScripts('../versao.js');
const CACHE = 'caderno-v' + self.VERSOES.doPrototipo('caderno-de-aventuras').versao;
const FILES = [
  './', './index.html', './style.css', './sketch.js', './world.js', './art.js', './game.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  '../versao.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('caderno-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !font) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    // "?novo", "?seed=7"...: os atalhos da URL usam o mesmo index.html do cache.
    const hit = await c.match(req, { ignoreSearch: url.origin === location.origin });
    const fresh = fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }).catch(() => hit || Response.error());
    return hit || fresh;
  }));
});
