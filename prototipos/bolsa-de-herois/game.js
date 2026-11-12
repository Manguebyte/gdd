'use strict';
// Bolsa de Heróis: protótipo do loop inteiro (GDD em BolsaDeHerois.md, Parte 1).
// Título → Mapa da run → Combate tático (bag building no estilo Orléans) → Recompensa → Mapa...
// Tudo é desenhado num canvas de 640×360 "pixels de jogo", ampliado; a interface é
// imediata: cada quadro redesenha tudo e registra as áreas clicáveis (HITS).
// A lógica fica no grid (x, y); só o desenho converte para a tela isométrica.
// Arte: Sprites/IsoCards/ (âncoras em ../iso-cards/sprites.js); sem arte, boneco por código.

const ART = '../../Sprites/IsoCards/';
const SAVE_KEY = 'bolsa-de-herois-save-v1';
const VW = 640, VH = 360;
const TW = 48, TH = 24;                 // losango do tile
const GW = 10, GH = 8;                  // campo de batalha (Parte 1 §10)
const OX = 172, OY = 62;                // origem do tabuleiro na tela
const PX = 442, PW = 194;               // painel do livro, à direita
const FONT = '"Pixelify Sans", monospace';
const META = window.SPRITE_META || {};
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= Utilidades ================= */
const sleep = ms => new Promise(r => setTimeout(r, DEV.has('fast') ? ms / 6 : ms));
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const key = (x, y) => `${x},${y}`;
const expand = counts => Object.entries(counts).flatMap(([t, n]) => Array(n).fill(t));
const tokInfo = t => (t === 'qq' ? ANY : TOKENS[t]);
const isBad = t => !!(TOKENS[t] && TOKENS[t].bad);
const accepts = (req, tok) => !isBad(tok) && (req === 'qq' || req === tok);
const countBy = arr => arr.reduce((o, t) => ((o[t] = (o[t] || 0) + 1), o), {});
function removeOne(arr, t) { const i = arr.indexOf(t); if (i < 0) return false; arr.splice(i, 1); return true; }

/* ================= Arte ================= */
const SPR = { chars: {}, ground: null, props: {} };
function loadImg(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
async function loadArt() {
  const anims = ['se', 'ne', 'parado-se', 'parado-ne', 'ataque-se', 'ataque-ne'];
  await Promise.all([
    ...[...HERO_ORDER, ...Object.keys(ENEMIES)].map(async k => {
      const imgs = await Promise.all(anims.map(n => loadImg(`${ART}personagens/${k}/${n}.png`)));
      if (!imgs[0]) return;
      const o = {}; anims.forEach((n, i) => { o[n] = imgs[i]; });
      SPR.chars[k] = o;
    }),
    (async () => { SPR.ground = await loadImg(`${ART}tiles/floresta/tile_15.png`); })(),
    ...['arvore', 'pedra', 'deco'].map(async n => { SPR.props[n] = await loadImg(`${ART}cenario/floresta/${n}.png`); }),
  ]);
}
const footOf = (path, img) => (META[path] ? META[path][3] : img.height);

/* ================= Canvas e desenho básico ================= */
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let SCALE = 1;
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const m = Math.min(innerWidth * dpr / VW, innerHeight * dpr / VH);
  SCALE = m >= 1 ? Math.floor(m) : m;
  cv.width = Math.round(VW * SCALE); cv.height = Math.round(VH * SCALE);
  cv.style.width = `${cv.width / dpr}px`; cv.style.height = `${cv.height / dpr}px`;
}
addEventListener('resize', resize);
resize();

function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function stroke(x, y, w, h, c) { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
// A Pixelify Sans junta "fi"/"fl" numa ligadura que parece outra letra; um ZWNJ separa.
const noLig = s => String(s).replace(/f([il])/g, 'f‌$1');
function text(s, x, y, o = {}) {
  s = noLig(s);
  ctx.font = `${o.bold ? '600 ' : ''}${o.size || 8}px ${FONT}`;
  ctx.textBaseline = 'top'; ctx.textAlign = o.align || 'left';
  if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(s, x + 0.6, y + 0.6, o.maxW); }
  ctx.fillStyle = o.color || '#fff'; ctx.fillText(s, x, y, o.maxW);
}
function wrap(s, w, size) {
  ctx.font = `${size}px ${FONT}`;
  s = noLig(s);
  const out = []; let line = '';
  for (const word of s.split(' ')) {
    const t = line ? `${line} ${word}` : word;
    if (ctx.measureText(t).width > w && line) { out.push(line); line = word; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
function panel(x, y, w, h, fill = '#141a33') {
  rect(x, y, w, h, '#05070f'); rect(x + 1, y + 1, w - 2, h - 2, '#5a6aa8'); rect(x + 2, y + 2, w - 4, h - 4, fill);
}

/* ---------- Interface imediata: áreas clicáveis do quadro ---------- */
let HITS = [], LAST_HITS = [];
const mouse = { x: -1, y: -1 };
const hit = (x, y, w, h, o) => HITS.push({ x, y, w, h, ...o });
const inside = (h, px, py) => px >= h.x && py >= h.y && px < h.x + h.w && py < h.y + h.h;
const topHit = (px, py, f = () => true) => { for (let i = LAST_HITS.length - 1; i >= 0; i--) if (inside(LAST_HITS[i], px, py) && f(LAST_HITS[i])) return LAST_HITS[i]; return null; };
function button(x, y, w, h, label, onClick, o = {}) {
  const on = o.enabled !== false, over = on && inside({ x, y, w, h }, mouse.x, mouse.y);
  rect(x, y, w, h, '#05070f');
  rect(x + 1, y + 1, w - 2, h - 2, !on ? '#2a2f44' : over ? '#f2c14e' : (o.color || '#3b4f9a'));
  text(label, x + w / 2, y + Math.round((h - (o.size || 8)) / 2), { size: o.size || 8, bold: true, align: 'center', color: !on ? '#777c90' : over ? '#1a1306' : '#fff', maxW: w - 4 });
  if (on) hit(x, y, w, h, { click: onClick });
}
function chip(x, y, t, w = 20, h = 12) {
  const i = tokInfo(t);
  rect(x, y, w, h, '#05070f'); rect(x + 1, y + 1, w - 2, h - 2, i.color);
  rect(x + 1, y + 1, w - 2, 1, i.light);
  text(i.short, x + w / 2, y + 3, { size: 6, bold: true, align: 'center' });
}
function emptySlot(x, y, req, w = 20, h = 12) {
  const i = tokInfo(req);
  rect(x, y, w, h, '#05070f'); rect(x + 1, y + 1, w - 2, h - 2, '#0b0f20');
  stroke(x + 1, y + 1, w - 2, h - 2, i.color);
  text(i.short, x + w / 2, y + 3, { size: 6, align: 'center', color: i.light, shadow: false });
}

/* ================= Estado ================= */
let screen = 'title';     // title | map | battle
let RUN = null;           // a run (salva)
let B = null;             // o combate atual
let MODAL = null;         // { title, lines, options: [{ label, fn, enabled }] }
let drag = null;          // ficha sendo arrastada
let toast = null;

function say(msg) { toast = { msg, t: performance.now() }; }
function showModal(title, options, lines = []) { MODAL = { title, options, lines }; }
const opt = (label, fn, enabled = true) => ({ label, fn, enabled });

/* ================= Save ================= */
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(RUN)); } catch (e) { /* sem storage: segue sem save */ } }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* idem */ } }
function loadSave() {
  try {
    const r = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!r || !Array.isArray(r.heroes) || !r.heroes.every(h => HEROES[h.key])) return null;
    r.heroes.forEach(h => { h.pages = h.pages.filter(p => PAGES[p]); });
    return r;
  } catch (e) { return null; }
}
const hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };

/* ================= Run (Parte 1 §12) ================= */
function newHero(k) {
  const d = HEROES[k];
  return { key: k, hp: d.hp, breath: 0, reserve: 0, bag: expand(d.bag), pages: [...d.pages] };
}
function newRun() {
  RUN = { gold: 0, xp: 0, heroes: HERO_ORDER.map(newHero), map: genMap(), cur: -1, done: true, visited: [] };
  if (DEV.has('rich')) { RUN.gold = 300; RUN.xp = 30; }
  save();
  screen = 'map';
}
function genMap() {
  const map = [], rows = [];
  const byTier = t => Object.keys(ENCOUNTERS).filter(k => ENCOUNTERS[k].tier === t);
  for (let l = 0; l < CONFIG.layers; l++) {
    const last = l === CONFIG.layers - 1, camp = l === CONFIG.layers - 2;
    const n = last || camp ? 1 : 2 + rnd(2), row = [];
    for (let i = 0; i < n; i++) {
      let type = last ? 'boss' : camp ? 'camp' : 'combat';
      if (!last && !camp && l > 0) {
        const r = Math.random();
        type = r < 0.5 ? 'combat' : r < 0.65 ? (l >= 3 ? 'elite' : 'combat') : r < 0.85 ? 'camp' : 'merchant';
      }
      const tier = { combat: 'normal', elite: 'elite', boss: 'boss' }[type];
      const node = { id: map.length, layer: l, idx: i, n, type, next: [], enc: tier ? pick(byTier(tier)) : null };
      map.push(node); row.push(node);
    }
    rows.push(row);
  }
  for (let l = 0; l < rows.length - 1; l++) {
    const a = rows[l], b = rows[l + 1];
    a.forEach((node, i) => {
      const j = a.length === 1 ? 0 : Math.round(i * (b.length - 1) / (a.length - 1));
      node.next.push(b[j].id);
      if (j + 1 < b.length && Math.random() < 0.5) node.next.push(b[j + 1].id);
    });
    b.forEach((node, j) => { if (!a.some(x => x.next.includes(node.id))) a[Math.min(j, a.length - 1)].next.push(node.id); });
  }
  return map;
}
const curNode = () => (RUN.cur >= 0 ? RUN.map[RUN.cur] : null);
const available = () => (!RUN.done ? [] : RUN.cur < 0 ? RUN.map.filter(n => n.layer === 0) : curNode().next.map(i => RUN.map[i]));

function enterNode(n) {
  RUN.cur = n.id; RUN.done = false;
  if (!RUN.visited.includes(n.id)) RUN.visited.push(n.id);
  save();
  openNode(n);
}
function openNode(n) {
  if (n.type === 'camp') showCamp();
  else if (n.type === 'merchant') showMerchant(buildOffers());
  else startBattle(ENCOUNTERS[n.enc]);
}
function finishNode() {
  RUN.done = true;
  screen = 'map';
  if (curNode().type === 'boss') {
    clearSave();
    showModal('Vitória! O Grifo caiu e a Floresta está livre.', [opt('Voltar ao título', () => { RUN = null; screen = 'title'; })]);
    return;
  }
  save();
}

/* ---------- Recompensa e níveis ---------- */
function showReward() {
  const opts = [];
  for (let i = 0; i < 3; i++) opts.push(randomReward());
  showModal('Recompensa: escolha 1', opts);
}
function randomReward() {
  const h = pick(RUN.heroes), d = HEROES[h.key], r = Math.random();
  if (r < 0.45) {
    const t = pick(d.favored);
    return opt(`+1 ${TOKENS[t].name} na bag do ${d.name}`, () => { h.bag.push(t); afterReward(); });
  }
  const pages = d.rewardPages.filter(p => !h.pages.includes(p));
  if (r < 0.85 && pages.length) {
    const p = pick(pages);
    return opt(`Página "${PAGES[p].name}" para o ${d.name}`, () => addPage(h, p, afterReward));
  }
  return opt('+15 ouro', () => { RUN.gold += 15; afterReward(); });
}
function addPage(h, p, then) {
  if (h.pages.length < CONFIG.maxPages) { h.pages.push(p); then(); return; }
  const opts = h.pages.map((old, i) => opt(`Trocar ${PAGES[old].name}`, () => { h.pages[i] = p; then(); }));
  opts.push(opt('Recusar a página', then));
  showModal(`Livro do ${HEROES[h.key].name} cheio: trocar qual página?`, opts);
}
function afterReward() {
  if (RUN.xp < CONFIG.xpPerLevel) { finishNode(); return; }
  RUN.xp -= CONFIG.xpPerLevel;
  const opts = [];
  RUN.heroes.forEach(h => {
    const n = HEROES[h.key].name;
    if (h.breath < CONFIG.draw.length - 1)
      opts.push(opt(`${n}: Fôlego ${CONFIG.draw[h.breath]} > ${CONFIG.draw[h.breath + 1]} fichas por rodada`, () => { h.breath++; afterReward(); }));
    if (h.reserve < CONFIG.reserve.length - 1)
      opts.push(opt(`${n}: Reserva ${CONFIG.reserve[h.reserve]} > ${CONFIG.reserve[h.reserve + 1]} casas`, () => { h.reserve++; afterReward(); }));
  });
  if (!opts.length) { finishNode(); return; }
  showModal('Subiu de nível! Escolha uma trilha', opts);
}

/* ---------- Acampamento e Mercador ---------- */
const wounds = h => h.bag.filter(t => t === 'fer').length;
function pickHero(title, filter, then) {
  showModal(title, RUN.heroes.filter(filter).map(h => opt(HEROES[h.key].name, () => then(h))));
}
function showCamp() {
  const opts = [opt('Descansar: todos recuperam 30% dos PV', () => {
    RUN.heroes.forEach(h => { const max = HEROES[h.key].hp; h.hp = Math.min(max, h.hp + Math.ceil(max * CONFIG.campHeal)); });
    finishNode();
  })];
  if (RUN.heroes.some(h => wounds(h) > 0))
    opts.push(opt('Tratar: tira até 2 Feridas de um herói', () => pickHero('Tratar quem?', h => wounds(h) > 0, h => {
      removeOne(h.bag, 'fer'); removeOne(h.bag, 'fer'); finishNode();
    })));
  opts.push(opt('Treinar: tira 1 ficha da bag de um herói', () => pickHero('Treinar quem?', h => h.bag.length > 1, h => {
    const c = countBy(h.bag);
    showModal(`Tirar qual ficha do ${HEROES[h.key].name}?`, Object.keys(c).map(t => opt(`${TOKENS[t].name} (tem ${c[t]})`, () => { removeOne(h.bag, t); finishNode(); })));
  })));
  showModal('Acampamento: escolha 1', opts);
}
function buildOffers() {
  const offers = [];
  for (let i = 0; i < 2; i++) {
    const h = pick(RUN.heroes), t = pick(HEROES[h.key].favored);
    offers.push({ label: `+1 ${TOKENS[t].name}: ${HEROES[h.key].name}`, price: CONFIG.tokenPrice, apply: () => h.bag.push(t) });
  }
  const ph = pick(RUN.heroes), pages = HEROES[ph.key].rewardPages.filter(p => !ph.pages.includes(p));
  if (pages.length && ph.pages.length < CONFIG.maxPages) {
    const p = pick(pages);
    offers.push({ label: `Página "${PAGES[p].name}": ${HEROES[ph.key].name}`, price: CONFIG.pagePrice, apply: () => ph.pages.push(p) });
  }
  RUN.heroes.filter(h => wounds(h) > 0).forEach(h =>
    offers.push({ label: `Tratar 1 Ferida: ${HEROES[h.key].name}`, price: CONFIG.treatPrice, apply: () => removeOne(h.bag, 'fer') }));
  return offers;
}
function showMerchant(offers) {
  const opts = offers.map(o => opt(`${o.label} (${o.price} ouro)`, () => {
    RUN.gold -= o.price; o.apply(); offers.splice(offers.indexOf(o), 1); showMerchant(offers);
  }, o.price <= RUN.gold));
  opts.push(opt('Sair', finishNode));
  showModal(`Mercador (você tem ${RUN.gold} ouro)`, opts);
}

/* ================= Combate: grid ================= */
const inBounds = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH;
const blocked = (x, y) => !inBounds(x, y) || B.props.has(key(x, y));
const unitAt = (x, y) => B.units.find(u => u.hp > 0 && u.x === x && u.y === y) || null;
const free = (x, y) => !blocked(x, y) && !unitAt(x, y);
const living = side => B.units.filter(u => u.hp > 0 && u.side === side);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// BFS: todo passo custa 1, então a primeira vez que chega numa casa é pelo menor caminho.
function bfs(from, max) {
  const seen = new Map([[key(from.x, from.y), { x: from.x, y: from.y, d: 0, p: null }]]);
  const q = [seen.get(key(from.x, from.y))];
  while (q.length) {
    const c = q.shift();
    if (c.d >= max) continue;
    for (const [dx, dy] of DIRS) {
      const nx = c.x + dx, ny = c.y + dy, k = key(nx, ny);
      if (seen.has(k) || !free(nx, ny)) continue;
      const n = { x: nx, y: ny, d: c.d + 1, p: c };
      seen.set(k, n); q.push(n);
    }
  }
  return seen;
}
function pathTo(from, to, max) {
  const n = bfs(from, max).get(key(to.x, to.y));
  if (!n || n.d === 0) return null;
  const path = [];
  for (let c = n; c.p; c = c.p) path.unshift({ x: c.x, y: c.y });
  return path;
}
function cellsInRadius(c, r) {
  const out = [];
  for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++)
    if (Math.abs(dx) + Math.abs(dy) <= r && inBounds(c.x + dx, c.y + dy)) out.push({ x: c.x + dx, y: c.y + dy });
  return out;
}

/* ================= Combate: mão e bag (Parte 1 §6, §8, §9) ================= */
// Cada ficha do herói está em um lugar só: bag, mão (loose), casa de página, Reserva ou gasta.
function newHand(h) {
  return {
    bag: [...h.bag], loose: [], reserve: [], spent: [], cap: CONFIG.reserve[h.reserve],
    pages: h.pages.map(id => ({ id, slots: PAGES[id].slots.map(() => null), uses: PAGES[id].uses || 1 })),
  };
}
const hasFear = hand => hand.loose.includes('med');
function drawTokens(hand, n) { for (let i = 0; i < n && hand.bag.length; i++) hand.loose.push(hand.bag.splice(rnd(hand.bag.length), 1)[0]); }
function startRound(u) {
  const hand = u.hand;
  hand.pages.forEach(p => { p.uses = PAGES[p.id].uses || 1; });
  hand.loose.push(...hand.reserve); hand.reserve = [];
  drawTokens(hand, CONFIG.draw[u.run.breath]);
}
function tryPlace(hand, pi, si, t) {
  const p = hand.pages[pi];
  if (p.slots[si] || !accepts(PAGES[p.id].slots[si], t) || !removeOne(hand.loose, t)) return false;
  p.slots[si] = t; return true;
}
function unplace(hand, pi, si) { const t = hand.pages[pi].slots[si]; if (!t) return; hand.loose.push(t); hand.pages[pi].slots[si] = null; }
function tryReserve(hand, t) {
  if (isBad(t) || hand.reserve.length >= hand.cap || !removeOne(hand.loose, t)) return false;
  hand.reserve.push(t); return true;
}
function unreserve(hand, i) { if (i < hand.reserve.length) hand.loose.push(hand.reserve.splice(i, 1)[0]); }
function canActivate(hand, pi) {
  const p = hand.pages[pi];
  if (p.uses <= 0 || p.slots.some(s => !s)) return false;
  return !(hasFear(hand) && PAGES[p.id].kind === 'Especial');
}
function consume(hand, pi) {
  const p = hand.pages[pi];
  p.uses--; p.slots.forEach(s => s && hand.spent.push(s)); p.slots = p.slots.map(() => null);
}
function endRound(hand) {
  hand.bag.push(...hand.spent); hand.spent = [];
  hand.pages.forEach(p => { p.slots.forEach(s => s && hand.bag.push(s)); p.slots = p.slots.map(() => null); });
  hand.bag.push(...hand.loose); hand.loose = [];
}
// Clique numa ficha da mão: vai para a primeira casa vazia que aceita.
function autoPlace(hand, t) {
  for (let pi = 0; pi < hand.pages.length; pi++) {
    const p = hand.pages[pi]; if (p.uses <= 0) continue;
    for (let si = 0; si < p.slots.length; si++) if (!p.slots[si] && accepts(PAGES[p.id].slots[si], t)) { tryPlace(hand, pi, si, t); return; }
  }
  say('Nenhuma casa vazia aceita essa ficha.');
}
// Ficha recrutada e Ferida valem também para a run; Medo só para este combate.
function recruit(u, t, n = 1) { for (let i = 0; i < n; i++) { u.hand.bag.push(t); u.run.bag.push(t); } }
function treat(u) {
  if (!removeOne(u.run.bag, 'fer')) return false;
  removeOne(u.hand.loose, 'fer') || removeOne(u.hand.bag, 'fer');
  return true;
}
function clearFear(u) {
  const n = u.hand.loose.filter(t => t === 'med').length + u.hand.bag.filter(t => t === 'med').length;
  u.hand.loose = u.hand.loose.filter(t => t !== 'med'); u.hand.bag = u.hand.bag.filter(t => t !== 'med');
  return n;
}

/* ================= Combate: montagem e rodada ================= */
function freeCell(ys) {
  for (let i = 0; i < 500; i++) { const x = rnd(GW), y = pick(ys); if (free(x, y)) return { x, y }; }
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (free(x, y)) return { x, y };
  return null;
}
function startBattle(enc) {
  B = { enc, props: new Map(), units: [], round: 0, phase: 'busy', sel: null, pending: null, log: [], pops: [], info: '' };
  for (let i = 0; i < 9; i++) {
    const x = rnd(GW), y = 2 + rnd(GH - 4);
    B.props.set(key(x, y), Math.random() < 0.25 ? 'arvore' : 'pedra');
  }
  RUN.heroes.forEach(h => {
    const c = freeCell([GH - 1, GH - 2]);
    B.units.push({ side: 'hero', key: h.key, name: HEROES[h.key].name, hp: Math.max(1, h.hp), max: HEROES[h.key].hp, shield: 0,
      x: c.x, y: c.y, vx: c.x, vy: c.y, face: 'ne', run: h, hand: newHand(h) });
  });
  enc.enemies.forEach(k => {
    const d = ENEMIES[k], c = freeCell([0, 1]);
    B.units.push({ side: 'enemy', key: k, name: d.name, def: d, hp: DEV.has('win') ? 1 : d.hp, max: d.hp, shield: 0,
      x: c.x, y: c.y, vx: c.x, vy: c.y, face: 'sw', intent: null });
  });
  B.sel = B.units[0];
  screen = 'battle';
  log(enc.tier === 'boss' ? 'O Grifo desce sobre a clareira!' : 'Monstros à vista!');
  beginRound();
}
function log(s) { B.log.push(s); if (B.log.length > 4) B.log.shift(); }

function beginRound() {
  B.round++;
  log(`Rodada ${B.round}: cada herói tira fichas da bag.`);
  living('hero').forEach(startRound);
  living('enemy').forEach(planIntent);
  if (B.sel.hp <= 0) B.sel = living('hero')[0];
  B.phase = 'plan';
}
function select(u) { if (u && u.hp > 0 && u.side === 'hero' && B.phase === 'plan') B.sel = u; }

// Casas onde a página pode ser usada (Parte 1 §10: Manhattan, sem linha de visão).
function validCells(u, page) {
  if (page.target === 'self') return [{ x: u.x, y: u.y }];
  if (page.target === 'move') {
    const steps = Math.max(...page.effects.map(e => (e.t === 'move' ? e.n : 0)));
    return [...bfs(u, steps).values()].filter(c => c.d > 0).map(c => ({ x: c.x, y: c.y }));
  }
  return cellsInRadius(u, page.range || 1).filter(c => {
    const o = unitAt(c.x, c.y);
    if (page.target === 'enemy') return o && o.side !== u.side;
    if (page.target === 'ally') return o && o.side === u.side;
    return !blocked(c.x, c.y);
  });
}
function requestUse(u, pi) {
  if (B.phase !== 'plan' || !canActivate(u.hand, pi)) return;
  const page = PAGES[u.hand.pages[pi].id], cells = validCells(u, page);
  if (!cells.length) { say(`${page.name}: nenhum alvo válido.`); return; }
  if (page.target === 'self') { resolve(u, pi, { x: u.x, y: u.y }); return; }
  B.pending = { u, pi, cells };
  B.phase = 'target';
}
function cancelTarget() { if (B && B.phase === 'target') { B.pending = null; B.phase = 'plan'; } }
function clickCell(c) {
  if (B.phase === 'target') {
    const ok = B.pending.cells.some(v => v.x === c.x && v.y === c.y);
    if (ok) { const { u, pi } = B.pending; B.pending = null; resolve(u, pi, c); } else cancelTarget();
    return;
  }
  if (B.phase === 'plan') select(unitAt(c.x, c.y));
}
function faceTo(u, c) {
  const dx = c.x - u.x, dy = c.y - u.y;
  if (!dx && !dy) return;
  u.face = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'se' : 'nw') : (dy > 0 ? 'sw' : 'ne');
}

async function resolve(u, pi, c) {
  B.phase = 'busy';
  const page = PAGES[u.hand.pages[pi].id];
  consume(u.hand, pi);
  log(`${u.name} usa ${page.name}.`);
  let attacked = false;
  for (const e of page.effects) {
    if (e.t === 'move') { await walk(u, pathTo(u, c, e.n)); continue; }
    if (e.t === 'dmg') {
      const targets = cellsInRadius(c, e.r || 0).map(v => unitAt(v.x, v.y)).filter(o => o && o.side !== u.side);
      if (!attacked) { faceTo(u, c.x === u.x && c.y === u.y && targets[0] ? targets[0] : c); u.anim = { name: 'ataque', t: performance.now() }; attacked = true; await sleep(260); }
      targets.forEach(o => damage(o, e.n, u));
      await sleep(300);
    } else if (e.t === 'shield') {
      const o = unitAt(c.x, c.y), t = o && o.side === u.side ? o : u;
      t.shield += e.n; pop(t, `+${e.n} escudo`, '#7fd3ff'); log(`${t.name} ganha ${e.n} de escudo.`); await sleep(300);
    } else if (e.t === 'recruit') {
      recruit(u, e.tok); pop(u, `+1 ${TOKENS[e.tok].short}`, TOKENS[e.tok].light); log(`${u.name} recruta +1 ${TOKENS[e.tok].name} para a bag.`); await sleep(300);
    } else if (e.t === 'treat') {
      const o = unitAt(c.x, c.y), t = o && o.side === 'hero' ? o : u;
      if (treat(t)) { pop(t, '-1 FER', '#a9a9b4'); log(`${t.name}: 1 Ferida tratada.`); } else log(`${t.name} não tinha Ferida.`);
      await sleep(300);
    } else if (e.t === 'clearFear') {
      cellsInRadius(u, e.r).forEach(v => { const o = unitAt(v.x, v.y); if (o && o.side === 'hero' && clearFear(o)) { pop(o, 'sem Medo', '#c08cff'); log(`${o.name} perde o Medo.`); } });
      await sleep(300);
    }
  }
  if (checkEnd()) return;
  B.phase = 'plan';
}
function damage(t, n, src) {
  const abs = Math.min(t.shield, n); t.shield -= abs;
  const real = Math.min(t.hp, n - abs); t.hp -= real;
  t.hurt = performance.now();
  pop(t, abs ? `-${real} (${abs} esc.)` : `-${real}`, '#ff8a6e');
  log(`${src.name} causa ${n} em ${t.name}${abs ? ` (${abs} no escudo)` : ''}.`);
  if (t.hp <= 0) { t.dead = performance.now(); log(`${t.name} caiu.`); }
  return real;
}
function pop(u, s, color) { B.pops.push({ x: u.x, y: u.y, s, color, t: performance.now() }); }

function tween(u, tx, ty, ms) {
  return new Promise(res => {
    const sx = u.vx, sy = u.vy, t0 = performance.now(), dur = DEV.has('fast') ? ms / 6 : ms;
    const step = () => {
      const k = (performance.now() - t0) / dur;
      if (k >= 1) { u.vx = tx; u.vy = ty; res(); return; }
      u.vx = sx + (tx - sx) * k; u.vy = sy + (ty - sy) * k;
      requestAnimationFrame(step);
    };
    step();
  });
}
async function walk(u, path) {
  if (!path || !path.length) return;
  const end = path[path.length - 1];
  for (const c of path) { faceTo(u, c); u.x = c.x; u.y = c.y; await tween(u, c.x, c.y, 130); }
  u.x = end.x; u.y = end.y;
}

async function endTurn() {
  if (B.phase !== 'plan') return;
  B.phase = 'busy';
  log('Turno dos inimigos.');
  for (const e of B.units.filter(o => o.side === 'enemy')) {
    if (e.hp <= 0) continue;
    await enemyAct(e);
    e.intent = null;
    await sleep(220);
    if (!living('hero').length) break;
  }
  if (checkEnd()) return;
  living('hero').forEach(h => { endRound(h.hand); h.shield = 0; }); // escudo dura até o fim do turno inimigo
  beginRound();
}

/* ================= Inimigos (Parte 1 §11) ================= */
const nearestHero = e => living('hero').sort((a, b) => dist(a, e) - dist(b, e))[0] || null;
function planIntent(e) {
  if (e.def.shout && B.round % e.def.shout === 0) e.intent = { kind: 'shout' };
  else e.intent = { kind: 'attack', target: nearestHero(e) };
}
async function enemyAct(e) {
  if (e.intent.kind === 'shout') {
    e.anim = { name: 'ataque', t: performance.now() };
    log(`${e.name} solta um grito aterrorizante!`);
    cellsInRadius(e, 3).forEach(v => { const h = unitAt(v.x, v.y); if (h && h.side === 'hero') { h.hand.bag.push('med'); pop(h, '+1 MED', '#c08cff'); } });
    await sleep(500);
    return;
  }
  let t = e.intent.target;
  if (!t || t.hp <= 0) t = nearestHero(e);
  if (!t) return;
  if (dist(e, t) > e.def.range) {
    // casa mais perto (em passos) de onde o alvo fica no alcance; senão, a mais perto do alvo
    const reach = [...bfs(e, 99).values()];
    let best = reach.filter(c => dist(c, t) <= e.def.range).sort((a, b) => a.d - b.d)[0];
    if (!best) best = reach.filter(c => c.d <= e.def.move).sort((a, b) => dist(a, t) - dist(b, t))[0];
    const path = best && best.d > 0 ? pathTo(e, best, 99) : null;
    if (path) await walk(e, path.slice(0, e.def.move));
  }
  if (dist(e, t) > e.def.range) { log(`${e.name} não alcança ${t.name}.`); return; }
  faceTo(e, t); e.anim = { name: 'ataque', t: performance.now() };
  await sleep(260);
  const real = damage(t, e.def.dmg, e);
  if (real > 0 && e.def.wound) { recruit(t, 'fer'); pop(t, '+1 FER', '#a9a9b4'); log(`${t.name} ganha 1 Ferida.`); }
  await sleep(300);
}

/* ================= Fim do combate ================= */
function checkEnd() {
  const won = !living('enemy').length, lost = !living('hero').length;
  if (!won && !lost) return false;
  B.phase = 'over';
  if (lost) {
    clearSave();
    setTimeout(() => showModal('Derrota. Os três heróis caíram e a run acabou.', [opt('Voltar ao título', () => { RUN = null; B = null; screen = 'title'; })]), 600);
    return true;
  }
  // Leva vida e Feridas de volta para a run (Parte 1 §10).
  B.units.filter(u => u.side === 'hero').forEach(u => {
    if (u.hp > 0) { u.run.hp = u.hp; return; }
    u.run.hp = CONFIG.knockoutHp;
    for (let i = 0; i < CONFIG.woundsOnKnockout; i++) u.run.bag.push('fer');
  });
  RUN.gold += B.enc.gold; RUN.xp += B.enc.xp;
  setTimeout(() => showModal('Vitória!', [opt('Escolher recompensa', () => { screen = 'map'; B = null; showReward(); })],
    [`+${B.enc.gold} ouro, +${B.enc.xp} XP.`]), 600);
  return true;
}

/* ================= Desenho: tabuleiro ================= */
const tilePos = (x, y) => [OX + (x - y) * TW / 2, OY + (x + y) * TH / 2];
const cellCenter = (x, y) => { const [px, py] = tilePos(x, y); return [px + TW / 2, py + TH / 2]; };
function screenToCell(sx, sy) {
  const a = (sx - OX - TW / 2) / (TW / 2), b = (sy - OY - TH / 2) / (TH / 2);
  const x = Math.round((a + b) / 2), y = Math.round((b - a) / 2);
  return inBounds(x, y) ? { x, y } : null;
}
function diamond(x, y, color) {
  const [px, py] = tilePos(x, y);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(px + TW / 2, py); ctx.lineTo(px + TW, py + TH / 2); ctx.lineTo(px + TW / 2, py + TH); ctx.lineTo(px, py + TH / 2); ctx.closePath(); ctx.fill();
}
function drawFloor() {
  for (let s = 0; s <= GW + GH - 2; s++) for (let x = 0; x < GW; x++) {
    const y = s - x; if (y < 0 || y >= GH) continue;
    const [px, py] = tilePos(x, y);
    if (SPR.ground) ctx.drawImage(SPR.ground, px, py);
    else {
      diamond(x, y, '#5a8f45');
      rect(px, py + TH / 2, TW / 2, 1, '#33522a');
    }
    if ((x + y) % 2) diamond(x, y, 'rgba(0,0,0,0.07)');
  }
}
function drawProp(kind, cx, cy) {
  const img = SPR.props[kind];
  if (img) { const foot = footOf(`cenario/floresta/${kind}.png`, img); ctx.drawImage(img, Math.round(cx - img.width / 2), Math.round(cy + 4 - foot)); return; }
  if (kind === 'pedra') { rect(cx - 9, cy - 10, 18, 12, '#5c625e'); rect(cx - 7, cy - 12, 12, 4, '#8d948e'); }
  else { rect(cx - 2, cy - 20, 4, 22, '#4b3424'); ctx.fillStyle = '#35602f'; ctx.beginPath(); ctx.arc(cx, cy - 26, 12, 0, 7); ctx.fill(); }
}
// Personagem: SE/NE desenhados, SW/NW espelhados; animação parado/ataque. Devolve o topo da cabeça.
function drawUnit(u, cx, cy, now) {
  const art = SPR.chars[u.key];
  const back = u.face === 'ne' || u.face === 'nw', flip = u.face === 'sw' || u.face === 'nw';
  const dir = back ? 'ne' : 'se';
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, cy + 2, 9, 3.5, 0, 0, 7); ctx.fill();
  if (art) {
    const img = art[dir];
    let frame = 0, sheet = null;
    if (u.anim && art[`${u.anim.name}-${dir}`]) {
      sheet = art[`${u.anim.name}-${dir}`];
      frame = Math.floor((now - u.anim.t) / 70);
      if (frame >= Math.round(sheet.width / sheet.height)) { u.anim = null; sheet = null; frame = 0; }
    }
    if (!sheet && art[`parado-${dir}`] && !reduceMotion) {
      sheet = art[`parado-${dir}`];
      frame = Math.floor(now / 160) % Math.max(1, Math.round(sheet.width / sheet.height));
    }
    const src = sheet || img, fw = sheet ? sheet.height : img.width, fh = sheet ? sheet.height : img.height;
    const foot = footOf(`personagens/${u.key}/${dir}.png`, img) + (fh - img.height) / 2;
    const dx = Math.round(cx - fw / 2), dy = Math.round(cy + 2 - foot);
    ctx.save();
    if (flip) { ctx.translate(dx * 2 + fw, 0); ctx.scale(-1, 1); }
    if (u.hurt && now - u.hurt < 180) ctx.filter = 'brightness(2.2)';
    ctx.drawImage(src, frame * fw, 0, fw, fh, dx, dy, fw, fh);
    ctx.restore();
    const m = META[`personagens/${u.key}/${dir}.png`];
    return dy + (m ? m[1] : 8);
  }
  const col = u.side === 'hero' ? '#3b6fd1' : '#a33a2a', big = u.def && u.def.boss ? 1.5 : 1;
  rect(cx - 6 * big, cy - 22 * big, 12 * big, 22 * big, '#1b1b1b');
  rect(cx - 5 * big, cy - 14 * big, 10 * big, 13 * big, col);
  rect(cx - 4 * big, cy - 21 * big, 8 * big, 7 * big, u.side === 'hero' ? '#e2b48c' : '#7fae4a');
  return cy - 24 * big;
}
function hpBar(u, cx, top) {
  const w = 24, x = Math.round(cx - w / 2), y = Math.round(top - 6);
  rect(x, y, w, 4, '#05070f');
  rect(x + 1, y + 1, Math.round((w - 2) * u.hp / u.max), 2, u.side === 'hero' ? '#7be07b' : '#e0584a');
  if (u.shield) text(`+${u.shield}`, x + w + 2, y - 2, { size: 6, bold: true, color: '#7fd3ff' });
  return y;
}

function drawBoard(now) {
  drawFloor();
  // destaque: alvo válido (mirando) ou herói selecionado
  if (B.phase === 'target') B.pending.cells.forEach(c => diamond(c.x, c.y, 'rgba(242,193,78,0.45)'));
  if (B.sel && B.sel.hp > 0 && B.phase !== 'busy') diamond(B.sel.x, B.sel.y, 'rgba(120,200,255,0.35)');
  const hov = screenToCell(mouse.x, mouse.y);
  if (hov && mouse.x < PX && !MODAL) {
    diamond(hov.x, hov.y, 'rgba(255,255,255,0.18)');
    // área da página sendo mirada
    if (B.phase === 'target') {
      const page = PAGES[B.pending.u.hand.pages[B.pending.pi].id], r = (page.effects.find(e => e.t === 'dmg') || {}).r;
      if (r && page.target === 'cell' && B.pending.cells.some(c => c.x === hov.x && c.y === hov.y))
        cellsInRadius(hov, r).forEach(c => diamond(c.x, c.y, 'rgba(255,90,60,0.35)'));
    }
  }
  // objetos em ordem de profundidade (quem está mais embaixo na tela fica na frente)
  const objs = [];
  B.props.forEach((kind, k) => { const [x, y] = k.split(',').map(Number); objs.push({ d: x + y, f: () => { const [cx, cy] = cellCenter(x, y); drawProp(kind, cx, cy); } }); });
  B.units.forEach(u => {
    if (u.hp <= 0 && (!u.dead || now - u.dead > 500)) return;
    objs.push({ d: u.vx + u.vy + 0.01, f: () => {
      const [cx, cy] = cellCenter(u.vx, u.vy);
      ctx.save(); if (u.hp <= 0) ctx.globalAlpha = Math.max(0, 1 - (now - u.dead) / 500);
      u.top = drawUnit(u, cx, cy, now);
      ctx.restore();
    } });
  });
  objs.sort((a, b) => a.d - b.d).forEach(o => o.f());
  // segunda passada: vida e intenção por cima de árvores e pedras
  B.units.filter(u => u.hp > 0 && u.top !== undefined).forEach(u => {
    const [cx] = cellCenter(u.vx, u.vy), y = hpBar(u, cx, u.top);
    if (u.side === 'enemy' && u.intent && B.phase !== 'over') {
      const s = u.intent.kind === 'shout' ? 'GRITO: +Medo' : u.intent.target ? `ATQ ${u.def.dmg} > ${u.intent.target.name}` : '';
      if (s) { ctx.font = `600 6px ${FONT}`; const w = ctx.measureText(s).width + 6; rect(Math.round(cx - w / 2), y - 10, Math.round(w), 9, 'rgba(60,10,10,0.85)'); text(s, cx, y - 9, { size: 6, bold: true, align: 'center', color: '#ffd1c4' }); }
    }
  });
  // números que sobem
  B.pops = B.pops.filter(p => now - p.t < 900);
  B.pops.forEach(p => { const [cx, cy] = cellCenter(p.x, p.y); text(p.s, cx, cy - 46 - (now - p.t) / 30, { size: 7, bold: true, align: 'center', color: p.color }); });
}

/* ================= Desenho: painel do livro ================= */
function drawBook() {
  panel(PX, 18, PW, VH - 20);
  const heroes = B.units.filter(u => u.side === 'hero');
  // abas dos heróis
  heroes.forEach((u, i) => {
    const x = PX + 4 + i * 63, y = 22, sel = u === B.sel, on = u.hp > 0;
    rect(x, y, 61, 22, '#05070f'); rect(x + 1, y + 1, 59, 20, sel ? '#3b4f9a' : on ? '#202848' : '#2a1414');
    text(u.name, x + 4, y + 3, { size: 7, bold: true, color: on ? '#fff' : '#a77' });
    text(on ? `PV ${u.hp}/${u.max}` : 'caído', x + 4, y + 12, { size: 6, color: on ? '#7be07b' : '#a77' });
    if (on) hit(x, y, 61, 22, { click: () => select(u) });
  });
  const u = B.sel; if (!u) return;
  const hand = u.hand, run = u.run;
  let y = 48;
  text(`Fôlego ${CONFIG.draw[run.breath]} fichas/rodada   Reserva ${hand.cap}`, PX + 6, y, { size: 7, color: '#c8d4ff' });
  y += 10;
  const c = countBy(hand.bag);
  text(`Na bag (${hand.bag.length}): ` + Object.keys(TOKENS).filter(t => c[t]).map(t => `${TOKENS[t].short} ${c[t]}`).join('  '), PX + 6, y, { size: 6, color: '#9aa6d6', maxW: PW - 12 });
  y += 10;
  // mão
  text('Mão', PX + 6, y, { size: 7, bold: true, color: '#f2c14e' });
  if (hasFear(hand)) text('COM MEDO: sem Especiais', PX + PW - 6, y + 1, { size: 6, bold: true, align: 'right', color: '#c08cff' });
  const handY = y + 9;
  rect(PX + 4, handY - 1, PW - 8, 28, '#0b0f20'); hit(PX + 4, handY - 1, PW - 8, 28, { drop: { kind: 'hand' } });
  hand.loose.forEach((t, i) => {
    const x = PX + 6 + (i % 8) * 23, yy = handY + 1 + Math.floor(i / 8) * 13;
    if (drag && drag.from.kind === 'hand' && drag.from.i === i) return;
    chip(x, yy, t); hit(x, yy, 20, 12, { chip: { kind: 'hand', i, t } });
  });
  if (!hand.loose.length) text('vazia', PX + 8, handY + 8, { size: 6, color: '#555c80' });
  y = handY + 30;
  // Reserva
  text('Reserva', PX + 6, y + 2, { size: 7, bold: true, color: '#f2c14e' });
  for (let i = 0; i < hand.cap; i++) {
    const x = PX + 46 + i * 23, t = hand.reserve[i];
    hit(x, y, 20, 12, { drop: { kind: 'reserve' } });
    if (t && !(drag && drag.from.kind === 'reserve' && drag.from.i === i)) { chip(x, y, t); hit(x, y, 20, 12, { chip: { kind: 'reserve', i, t } }); }
    else emptySlot(x, y, 'qq');
  }
  y += 16;
  // páginas do livro
  const rowH = Math.min(26, Math.floor((VH - 36 - y) / Math.max(1, hand.pages.length)));
  hand.pages.forEach((p, pi) => {
    const pg = PAGES[p.id], used = p.uses <= 0, ry = y + pi * rowH;
    const pending = B.phase === 'target' && B.pending.u === u && B.pending.pi === pi;
    rect(PX + 4, ry, PW - 8, rowH - 2, pending ? '#4a3c12' : used ? '#11141f' : '#1c2340');
    const over = inside({ x: PX + 4, y: ry, w: PW - 8, h: rowH - 2 }, mouse.x, mouse.y);
    if (over) B.info = `${pg.name} (${pg.kind}): ${pg.desc}`;
    const kindColor = { Simples: '#9fd07a', Especial: '#ff9f6e', Movimento: '#7fd3ff', Suporte: '#c8d4ff', Recrutar: '#f2c14e' }[pg.kind];
    text(pg.name, PX + 7, ry + 1, { size: 7, bold: true, color: used ? '#666c88' : '#fff', maxW: 100 });
    text(pg.kind, PX + 110, ry + 2, { size: 5, color: used ? '#555' : kindColor });
    pg.slots.forEach((req, si) => {
      const x = PX + 7 + si * 23, sy = ry + rowH - 14, t = p.slots[si];
      hit(x, sy, 20, 12, { drop: { kind: 'slot', pi, si } });
      if (t && !(drag && drag.from.kind === 'slot' && drag.from.pi === pi && drag.from.si === si)) { chip(x, sy, t); hit(x, sy, 20, 12, { chip: { kind: 'slot', pi, si, t } }); }
      else emptySlot(x, sy, req);
    });
    const can = B.phase === 'plan' && canActivate(hand, pi);
    button(PX + PW - 42, ry + Math.round((rowH - 16) / 2), 36, 14, used ? 'usada' : 'Usar', () => requestUse(u, pi), { enabled: can, size: 7, color: '#2f7a3a' });
  });
  button(PX + 4, VH - 22, PW - 8, 18, B.phase === 'plan' ? 'Encerrar turno (E)' : B.phase === 'target' ? 'Escolha o alvo...' : '...', endTurn, { enabled: B.phase === 'plan', color: '#8a3a2a' });
}

/* ================= Telas ================= */
function topBar(title) {
  rect(0, 0, VW, 16, '#0a0d22');
  text('Bolsa de Heróis', 6, 3, { size: 9, bold: true, color: '#f2c14e' });
  if (title) text(title, 96, 4, { size: 7, color: '#c8d4ff', maxW: 260 });
  if (RUN) text(`${RUN.gold} ouro   XP ${RUN.xp}/${CONFIG.xpPerLevel}`, VW - 6, 4, { size: 7, bold: true, align: 'right', color: '#f2c14e' });
}
function drawBattle(now) {
  rect(0, 0, VW, VH, '#16241c');
  B.info = '';
  drawBoard(now);
  drawBook();
  const tier = { normal: 'Combate', elite: 'Elite', boss: 'CHEFE' }[B.enc.tier];
  topBar(`${tier}  ·  Rodada ${B.round}`);
  // log e dica
  panel(4, VH - 66, PX - 8, 62, '#0e1226');
  const info = B.phase === 'target' ? 'Clique numa casa amarela para usar a página. Botão direito ou Esc cancela.'
    : B.info || 'Arraste fichas da Mão para as casas das páginas (clique numa ficha encaixa sozinho). Página completa: Usar.';
  wrap(info, PX - 20, 6).slice(0, 2).forEach((l, i) => text(l, 10, VH - 61 + i * 8, { size: 6, color: '#f2c14e' }));
  B.log.forEach((l, i) => text(l, 10, VH - 42 + i * 9, { size: 7, color: i === B.log.length - 1 ? '#fff' : '#9aa6d6', maxW: PX - 24 }));
  // clique no mapa (área atrás do resto)
  HITS.unshift({ x: 0, y: 16, w: PX, h: VH - 84, board: true });
}

function nodePos(n) {
  return [220 + (n.idx - (n.n - 1) / 2) * 120, 330 - n.layer * 45];
}
const NODE_LABEL = { combat: 'Combate', elite: 'Elite', camp: 'Acampamento', merchant: 'Mercador', boss: 'CHEFE' };
const NODE_COLOR = { combat: '#7a3a2a', elite: '#a0282a', camp: '#2f6a3a', merchant: '#6a5a1a', boss: '#5a1a6a' };
function drawMap(now) {
  rect(0, 0, VW, VH, '#122019');
  topBar('Mapa da run: Floresta');
  const avail = available();
  RUN.map.forEach(n => n.next.forEach(id => {
    const m = RUN.map[id], [x1, y1] = nodePos(n), [x2, y2] = nodePos(m);
    const lit = (RUN.cur === n.id && RUN.done) || (RUN.visited.includes(n.id) && RUN.visited.includes(id));
    ctx.strokeStyle = lit ? '#f2c14e' : '#3c5a48'; ctx.lineWidth = lit ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }));
  RUN.map.forEach(n => {
    const [x, y] = nodePos(n), w = 74, h = 16, can = avail.includes(n);
    const pulse = can && !reduceMotion ? (Math.sin(now / 200) + 1) / 2 : 0;
    rect(x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2, can ? `rgba(242,193,78,${0.5 + pulse / 2})` : '#05070f');
    rect(x - w / 2, y - h / 2, w, h, RUN.visited.includes(n.id) ? '#2a2f44' : NODE_COLOR[n.type]);
    text((RUN.cur === n.id ? '> ' : '') + NODE_LABEL[n.type], x, y - 4, { size: 7, bold: true, align: 'center', color: can ? '#fff' : '#b8bcd0' });
    if (can) hit(x - w / 2, y - h / 2, w, h, { click: () => enterNode(n) });
  });
  if (!MODAL) text(avail.length ? 'Escolha o próximo nó (os que piscam).' : '', 220, 22, { size: 7, align: 'center', color: '#c8d4ff' });
  // grupo
  panel(PX, 18, PW, VH - 20);
  RUN.heroes.forEach((h, i) => {
    const y = 24 + i * 110, d = HEROES[h.key];
    portrait(h.key, PX + 6, y, 30);
    text(d.name, PX + 42, y, { size: 8, bold: true });
    text(`PV ${h.hp}/${d.hp}`, PX + 42, y + 10, { size: 7, color: '#7be07b' });
    text(`Fôlego ${CONFIG.draw[h.breath]}  Reserva ${CONFIG.reserve[h.reserve]}`, PX + 42, y + 19, { size: 6, color: '#c8d4ff' });
    const c = countBy(h.bag);
    let cx = PX + 6;
    Object.keys(TOKENS).filter(t => c[t]).forEach(t => { chip(cx, y + 34, t, 20, 12); text(`×${c[t]}`, cx + 22, y + 37, { size: 6 }); cx += 36; });
    wrap(h.pages.map(p => PAGES[p].name).join(', '), PW - 14, 6).slice(0, 5).forEach((l, j) => text(l, PX + 6, y + 50 + j * 8, { size: 6, color: '#9aa6d6' }));
  });
}
function portrait(k, x, y, size) {
  const art = SPR.chars[k];
  rect(x, y, size, size, '#0a0d22'); rect(x + 1, y + 1, size - 2, size - 2, '#22306a');
  if (!art) return;
  const m = META[`personagens/${k}/se.png`] || [0, 0, art.se.width, art.se.height];
  const w = m[2] - m[0], side = Math.max(w, Math.min(m[3] - m[1], w + 8));
  const k2 = (size - 2) / side;
  ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, size - 2, size - 2); ctx.clip();
  ctx.drawImage(art.se, m[0] + w / 2 - side / 2, m[1], side, side, x + 1, y + 1, side * k2, side * k2);
  ctx.restore();
}

function drawTitle(now) {
  rect(0, 0, VW, VH, '#101a28');
  // os três heróis na clareira
  ['guerreiro', 'arqueiro', 'mago'].forEach((k, i) => drawUnit({ key: k, face: 'se', side: 'hero' }, 250 + i * 70, 150, now));
  text('Bolsa de Heróis', VW / 2, 40, { size: 26, bold: true, align: 'center', color: '#f2c14e' });
  text('RPG tático com bag building no estilo Orléans', VW / 2, 74, { size: 9, align: 'center', color: '#c8d4ff' });
  const help = [
    'Cada herói tem a sua bag. A cada rodada ele tira fichas às cegas (Trilha de Fôlego).',
    'Arraste as fichas para as casas das páginas do livro; página completa = ação no mapa.',
    'Guarde fichas na Reserva para a próxima rodada e junte os especiais caros.',
    'Ferida (cinza) e Medo (roxo) entopem a bag. Os inimigos mostram antes o que vão fazer.',
  ];
  help.forEach((l, i) => text(l, VW / 2, 188 + i * 11, { size: 7, align: 'center', color: '#9aa6d6' }));
  const opts = [];
  if (hasSave()) opts.push(['Continuar', () => { RUN = loadSave(); if (!RUN) { newRun(); return; } screen = 'map'; if (!RUN.done) openNode(curNode()); }]);
  opts.push(['Nova run', () => { clearSave(); newRun(); }]);
  opts.forEach(([l, f], i) => button(VW / 2 - 60, 248 + i * 24, 120, 18, l, f));
}

function drawModal() {
  if (!MODAL) return;
  rect(0, 0, VW, VH, 'rgba(0,0,0,0.55)');
  hit(0, 0, VW, VH, { block: true });
  const w = 340, titleLines = wrap(MODAL.title, w - 20, 10);
  const lines = MODAL.lines.flatMap(l => wrap(l, w - 20, 7));
  const oh = 18, h = 16 + titleLines.length * 12 + lines.length * 9 + 6 + MODAL.options.length * (oh + 3) + 6;
  const x = (VW - w) / 2, y = Math.max(20, (VH - h) / 2);
  panel(x, y, w, h);
  let yy = y + 9;
  titleLines.forEach(l => { text(l, VW / 2, yy, { size: 10, bold: true, align: 'center', color: '#f2c14e' }); yy += 12; });
  lines.forEach(l => { text(l, VW / 2, yy, { size: 7, align: 'center', color: '#c8d4ff' }); yy += 9; });
  yy += 6;
  const m = MODAL;
  m.options.forEach(o => { button(x + 12, yy, w - 24, oh, o.label, () => { if (MODAL === m) MODAL = null; o.fn(); }, { enabled: o.enabled, size: 7 }); yy += oh + 3; });
}

/* ================= Laço principal ================= */
function frame(now) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  HITS = [];
  if (screen === 'title') drawTitle(now);
  else if (screen === 'map') drawMap(now);
  else if (screen === 'battle' && B) drawBattle(now);
  drawModal();
  if (drag && drag.moved) chip(Math.round(mouse.x - 10), Math.round(mouse.y - 6), drag.t);
  if (toast && now - toast.t < 1800) {
    ctx.font = `600 8px ${FONT}`; const w = ctx.measureText(toast.msg).width + 16;
    panel((VW - w) / 2, 22, w, 16, '#3a1620'); text(toast.msg, VW / 2, 26, { size: 8, bold: true, align: 'center' });
  }
  LAST_HITS = HITS;
  requestAnimationFrame(frame);
}

/* ================= Entrada ================= */
function toGame(e) {
  const r = cv.getBoundingClientRect();
  return [(e.clientX - r.left) * VW / r.width, (e.clientY - r.top) * VH / r.height];
}
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointermove', e => {
  [mouse.x, mouse.y] = toGame(e);
  if (drag && Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) > 3) drag.moved = true;
});
cv.addEventListener('pointerdown', e => {
  [mouse.x, mouse.y] = toGame(e);
  if (e.button === 2) { cancelTarget(); return; }
  const h = topHit(mouse.x, mouse.y);
  if (!h) return;
  if (h.chip && screen === 'battle' && !MODAL) {
    if (B.phase !== 'plan' || isBad(h.chip.t)) { if (isBad(h.chip.t)) say(`${TOKENS[h.chip.t].name} não encaixa em nada.`); return; }
    drag = { from: h.chip, t: h.chip.t, sx: mouse.x, sy: mouse.y, moved: false };
    cv.setPointerCapture(e.pointerId);
    return;
  }
  if (h.click) { h.click(); return; }
  if (h.board && screen === 'battle' && !MODAL) { const c = screenToCell(mouse.x, mouse.y); if (c) clickCell(c); else cancelTarget(); }
});
cv.addEventListener('pointerup', e => {
  [mouse.x, mouse.y] = toGame(e);
  if (!drag) return;
  const d = drag; drag = null;
  if (!B || B.phase !== 'plan') return;
  const hand = B.sel.hand;
  if (!d.moved) {
    // clique: ficha da mão encaixa sozinha; ficha numa casa volta para a mão
    if (d.from.kind === 'hand') autoPlace(hand, d.t);
    else if (d.from.kind === 'slot') unplace(hand, d.from.pi, d.from.si);
    else unreserve(hand, d.from.i);
    return;
  }
  const target = topHit(mouse.x, mouse.y, h => h.drop);
  if (!target) return;
  if (d.from.kind === 'slot') unplace(hand, d.from.pi, d.from.si);
  else if (d.from.kind === 'reserve') unreserve(hand, d.from.i);
  if (target.drop.kind === 'slot' && !tryPlace(hand, target.drop.pi, target.drop.si, d.t)) say('Essa casa não aceita essa ficha.');
  else if (target.drop.kind === 'reserve' && !tryReserve(hand, d.t)) say('A Reserva está cheia.');
});
addEventListener('keydown', e => {
  if (e.key === 'Escape') cancelTarget();
  if (screen !== 'battle' || !B || MODAL) return;
  if (e.key === 'e' || e.key === 'E') endTurn();
  const n = Number(e.key);
  if (n >= 1 && n <= 3) select(B.units.filter(u => u.side === 'hero')[n - 1]);
});

/* ================= Início ================= */
if (DEV.has('reset')) clearSave();
(async () => {
  await Promise.all([loadArt(), document.fonts ? document.fonts.load(`8px ${FONT}`).catch(() => {}) : null]);
  if (DEV.has('combate')) { newRun(); startBattle(ENCOUNTERS[DEV.has('chefe') ? 'chefe' : 'lobos']); }
  else if (DEV.has('mapa')) newRun();
  requestAnimationFrame(frame);
})();
