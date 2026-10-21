'use strict';
// Iso Cards: protótipo do loop inteiro (GDD em IsoCards.md).
// Mapa do mundo → Campo de batalha → Recompensas → Cidade (Forja, Loja, Classes, Montagem).
// Tudo é desenhado num canvas 16:9 de 640×360 "pixels de jogo", ampliado em escala inteira;
// texto em Pixelify Sans no mesmo canvas (fica nítido porque é vetor desenhado já ampliado).
// A lógica fica no grid (x, y, altura); só o desenho converte para a tela isométrica.
// Arte PixelLab em Sprites/IsoCards/ (âncoras em sprites.js); sem arte, cai no desenho por código.

const ART = '../../Sprites/IsoCards/';
const SAVE_KEY = 'isocards-save-v1';
const VIGOR = 3, HAND_START = 5, HAND_DRAW = 2, HAND_MAX = 10, N = 8;
const TW = 48, TH = 24, LV = 12;              // tile: largura, altura do losango, altura de 1 nível
const VW = 640, VH = 360;                     // resolução do jogo
const CW = 56, CH = 80;                       // carta: moldura 56×80 com arte 48×48
const FONT = '"Pixelify Sans", monospace';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const META = window.SPRITE_META || {};
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));

/* ================= Utilidades ================= */
const sleep = ms => new Promise(r => setTimeout(r, DEV.has('fast') ? ms / 6 : ms));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
const regionOf = key => REGIONS.find(r => r.key === key);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ================= Arte ================= */
const SPR = { chars: {}, tiles: {}, props: {}, tall: {}, cards: {}, frames: {} };
function loadImg(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
async function loadArt() {
  const charKeys = [...Object.keys(CLASSES), ...Object.keys(MONSTERS)];
  const anims = ['se', 'ne', 'parado-se', 'parado-ne', 'ataque-se', 'ataque-ne'];
  await Promise.all([
    ...charKeys.map(async k => {
      const imgs = await Promise.all(anims.map(n => loadImg(`${ART}personagens/${k}/${n}.png`)));
      if (!imgs[0]) return;
      const o = {}; anims.forEach((n, i) => { o[n] = imgs[i]; });
      SPR.chars[k] = o;
    }),
    ...REGIONS.map(async r => {
      const t = await Promise.all([...Array(16)].map((_, i) => loadImg(`${ART}tiles/${r.key}/tile_${i}.png`)));
      if (t.every(Boolean)) SPR.tiles[r.key] = t;
    }),
    (async () => {
      const [fundo, city, field, boss] = await Promise.all(['fundo', 'cidade', 'campo', 'chefe'].map(n => loadImg(`${ART}mapa/${n}.png`)));
      SPR.world = { fundo, city, field, boss };
    })(),
    ...REGIONS.map(async r => {
      const [arvore, pedra, deco] = await Promise.all(['arvore', 'pedra', 'deco'].map(n => loadImg(`${ART}cenario/${r.key}/${n}.png`)));
      SPR.props[r.key] = { arvore, pedra, deco };
    }),
    ...Object.keys(CARDS).map(async id => { SPR.cards[id] = await loadImg(`${ART}cartas/${id}.png`); }),
  ]);
}
// Base visível do sprite (linha do pé), medida pelo script de download; sem medida, o fundo da imagem
const footOf = (path, img) => (META[path] ? META[path][3] : img.height);

// Bloco elevado sem emenda: estica a lateral repetindo a faixa do meio, coluna a coluna
// (drawImage em fatias de 1 px; não usa getImageData, que falha em file://)
function tallBlock(biome, h) {
  const key = biome + h;
  if (SPR.tall[key]) return SPR.tall[key];
  const tile = SPR.tiles[biome][15], ext = h * LV;
  const c = document.createElement('canvas'); c.width = TW; c.height = tile.height + ext;
  const g = c.getContext('2d');
  for (let x = 0; x < TW; x++) {
    const yb = Math.round(12 + (24 - Math.abs(x + 0.5 - 24)) / 2);  // borda de baixo do losango
    g.drawImage(tile, x, 0, 1, yb + 3, x, 0, 1, yb + 3);
    let off = 0; const need = 7 + ext;
    while (off < need) { const n = Math.min(7, need - off); g.drawImage(tile, x, yb + 3, 1, n, x, yb + 3 + off, 1, n); off += n; }
    g.drawImage(tile, x, yb + 10, 1, 2, x, yb + 10 + ext, 1, 2);
  }
  return (SPR.tall[key] = c);
}

// Moldura da carta em pixel art por código: borda em degradê da cor, rebites, janela da arte e placa.
// Bicolor: metade esquerda de uma cor, metade direita da outra.
const RAMP = {
  branco: ['#6e5f3c', '#cdb98a', '#fff1c8'], preto: ['#24163a', '#5b3f7a', '#a383cc'], azul: ['#14325a', '#3f7fc0', '#a6d0f4'],
  verde: ['#1b441b', '#4f9a48', '#ade08d'], vermelho: ['#521910', '#c4472f', '#f4a27a'], incolor: ['#383c40', '#878d93', '#d2d7db'],
};
function cardFrame(c1, c2) {
  const key = c1 + (c2 || '');
  if (SPR.frames[key]) return SPR.frames[key];
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const half = (x0, x1, fn) => { g.save(); g.beginPath(); g.rect(x0, 0, x1 - x0, CH); g.clip(); fn(); g.restore(); };
  const paint = r => {
    px(0, 0, CW, CH, '#120c08');                 // contorno
    px(1, 1, CW - 2, CH - 2, r[1]);              // borda
    px(1, 1, CW - 2, 1, r[2]); px(1, 1, 1, CH - 2, r[2]);           // luz em cima/esquerda
    px(1, CH - 2, CW - 2, 1, r[0]); px(CW - 2, 1, 1, CH - 2, r[0]); // sombra embaixo/direita
    for (let i = 6; i < CW - 6; i += 4) { px(i, 2, 1, 1, r[2]); px(i, CH - 3, 1, 1, r[0]); }  // textura da borda
  };
  if (c2) { half(0, CW / 2, () => paint(RAMP[c1])); half(CW / 2, CW, () => paint(RAMP[c2])); } else paint(RAMP[c1]);
  // janela da arte (48×48 em 4,4) e placa de texto
  px(3, 3, 50, 50, '#120c08');
  px(4, 4, 48, 48, '#1d1a24');
  px(3, 54, 50, 23, '#120c08');
  px(4, 55, 48, 21, '#ead7aa'); px(4, 55, 48, 1, '#fff3d4'); px(4, 75, 48, 1, '#b8955f'); px(51, 55, 1, 21, '#c9a971');
  // rebites
  for (const [x, y] of [[1, 1], [CW - 3, 1], [1, CH - 3], [CW - 3, CH - 3]]) { px(x, y, 2, 2, '#f6e7b5'); px(x + 1, y + 1, 1, 1, '#6e5a2c'); }
  return (SPR.frames[key] = c);
}

/* ================= Save ================= */
let G;   // estado persistente da campanha
function newCampaign() {
  const collection = {};
  const heroes = START_NAMES.map((name, i) => {
    for (const [id, n] of Object.entries(STARTER_DECK)) collection[id] = (collection[id] || 0) + n;
    return { id: i + 1, name, cls: 'escudeiro', owned: ['escudeiro'], deck: { ...STARTER_DECK } };
  });
  return {
    gold: START_GOLD, spheres: { ...START_SPHERES }, items: {}, collection, heroes,
    party: heroes.map(h => h.id), nextId: heroes.length + 1, recruits: 0,
    node: 'pantano-city', visited: { 'pantano-city': true }, bosses: {}, recipes: {}, taught: {},
  };
}
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { /* sem storage: segue sem save */ } }
function loadGame() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

/* ================= Regras de baralho ================= */
const heroById = id => G.heroes.find(h => h.id === id);
function canUse(cls, cardId) {
  const d = CARDS[cardId], c = CLASSES[cls];
  if (d.classe) return d.classe === cls;
  if (d.color === 'incolor') return true;
  return d.color === c.color || d.color2 === c.color;
}
const inDecks = id => G.heroes.reduce((a, h) => a + (h.deck[id] || 0), 0);
const available = id => (G.collection[id] || 0) - inDecks(id);
const deckSize = h => sum(h.deck);
const deckValid = h => deckSize(h) === DECK_SIZE && Object.keys(h.deck).every(id => canUse(h.cls, id));

/* ================= Mapa do mundo ================= */
// Nós: cidade, 2 campos (rotas alternativas) e o chefe; o chefe liga na próxima cidade.
// Coordenadas no espaço do fundo ampliado 2× (480×300), deslocado por MAP_X/MAP_Y na tela.
const MAP_X = 8, MAP_Y = 28;
const NODES = {};
REGIONS.forEach((r, i) => {
  const bx = 34 + i * 90, by = i % 2 ? 150 : 172;
  NODES[`${r.key}-city`] = { region: r.key, type: 'city', x: bx, y: by, name: r.city };
  NODES[`${r.key}-f0`] = { region: r.key, type: 'field', map: r.fields[0], x: bx + 26, y: by - 60, name: MAPS[r.fields[0]].name };
  NODES[`${r.key}-f1`] = { region: r.key, type: 'field', map: r.fields[1], x: bx + 30, y: by + 58, name: MAPS[r.fields[1]].name };
  NODES[`${r.key}-boss`] = { region: r.key, type: 'boss', map: r.boss, x: bx + 58, y: by, name: MAPS[r.boss].name };
});
const EDGES = [];
REGIONS.forEach((r, i) => {
  const k = r.key;
  EDGES.push([`${k}-city`, `${k}-f0`], [`${k}-city`, `${k}-f1`], [`${k}-f0`, `${k}-boss`], [`${k}-f1`, `${k}-boss`]);
  if (REGIONS[i + 1]) EDGES.push([`${k}-boss`, `${REGIONS[i + 1].key}-city`]);
});
function neighbors(id) {
  return EDGES.filter(e => e.includes(id)).map(e => (e[0] === id ? e[1] : e[0])).filter(n => {
    const a = NODES[id], b = NODES[n];
    // Atravessar do chefe para a próxima região exige o chefe vencido
    if (a.type === 'boss' && b.region !== a.region) return G.bosses[a.region];
    return true;
  });
}

/* ================= Telas, avisos e janelas ================= */
let screen = 'map';
let modalBox = null, toastMsg = null;
function show(name) { screen = name; UI.scroll = {}; }
function toast(msg) { toastMsg = { msg, t: performance.now() }; }
// Janela modal desenhada no canvas: título, linhas de texto e botões
function modal(title, lines, buttons) { modalBox = { title, lines, buttons }; }

function travel(to) {
  if (!neighbors(G.node).includes(to)) return;
  G.node = to;
  const n = NODES[to], first = !G.visited[to];
  G.visited[to] = true;
  if (n.type === 'city') { enterCity(); return; }
  if (n.type === 'field' && first) { startBattle(n.map, to); return; }
  if (n.type === 'boss' && !G.bosses[n.region]) { startBattle(n.map, to); return; }
}

/* ================= Cidade ================= */
let cityTab = 'grupo', deckHero = null, forgeSel = { item: null, spheres: {} }, conv = { from: 0, to: 1 };
function enterCity() {
  const n = NODES[G.node], r = regionOf(n.region);
  // O ferreiro ensina as receitas da cor local na primeira visita
  const taught = RECIPES.filter(rc => rc.region === r.key && rc.learned && !G.recipes[rc.card]);
  taught.forEach(rc => { G.recipes[rc.card] = 'aprendida'; });
  saveGame();
  show('city');
  if (taught.length) toast(`O ferreiro ensinou: ${taught.map(rc => CARDS[rc.card].name).join(', ')}.`);
}

function doForge() {
  const it = forgeSel.item, sp = Object.fromEntries(Object.entries(forgeSel.spheres).filter(([, n]) => n > 0));
  if (!it || !sum(sp)) return;
  G.items[it]--;
  for (const [c, n] of Object.entries(sp)) G.spheres[c] -= n;
  const match = RECIPES.find(rc => rc.item === it && Object.keys(rc.spheres).length === Object.keys(sp).length
    && Object.entries(rc.spheres).every(([c, n]) => sp[c] === n));
  forgeSel = { item: null, spheres: {} };
  if (match) {
    G.collection[match.card] = (G.collection[match.card] || 0) + FORGE_COPIES;
    const isNew = !G.recipes[match.card];
    if (isNew) G.recipes[match.card] = 'descoberta';
    modal('Forja', [`Saíram ${FORGE_COPIES} cópias de ${CARDS[match.card].name}.`, isNew ? 'Receita nova no Livro de Receitas!' : '', CARDS[match.card].text], [{ label: 'Ok', fn: () => {} }]);
    modalBox.card = match.card;
  } else {
    G.collection.rachada = (G.collection.rachada || 0) + 1;
    modal('A forja falhou', ['A combinação não era uma receita.', 'Saiu uma Carta Rachada (incolor e fraca), e o item e as esferas se perderam.'], [{ label: 'Ok', fn: () => {} }]);
    modalBox.card = 'rachada';
  }
}

function changeClass(heroId, cls) {
  const h = heroById(heroId), cl = CLASSES[cls];
  const free = h.owned.includes(cls) || cls === 'escudeiro';
  if (!free) {
    if ((G.spheres[cl.color] || 0) < CLASS_CHANGE_COST) return;
    G.spheres[cl.color] -= CLASS_CHANGE_COST;
  }
  if (!h.owned.includes(cls)) {
    h.owned.push(cls);
    cl.cards.forEach(id => { G.collection[id] = (G.collection[id] || 0) + CLASS_KIT; });
  }
  h.cls = cls;
  // Cartas que a classe nova não usa voltam para a coleção
  const out = Object.keys(h.deck).filter(id => !canUse(cls, id));
  const back = out.reduce((a, id) => a + h.deck[id], 0);
  out.forEach(id => delete h.deck[id]);
  toast(`${h.name} agora é ${cl.name}.${back ? ` ${back} cartas voltaram para a coleção: remonte o baralho.` : ''}`);
}
function recruit() {
  if (G.heroes.length >= PARTY_MAX || G.gold < RECRUIT_COST) return;
  G.gold -= RECRUIT_COST;
  const name = RECRUIT_NAMES[G.recruits++ % RECRUIT_NAMES.length];
  for (const [id, n] of Object.entries(STARTER_DECK)) G.collection[id] = (G.collection[id] || 0) + n;
  G.heroes.push({ id: G.nextId++, name, cls: 'escudeiro', owned: ['escudeiro'], deck: { ...STARTER_DECK } });
  toast(`${name} entrou no grupo como Escudeiro.`);
}
function toggleParty(id) {
  if (G.party.includes(id)) { G.party = G.party.filter(x => x !== id); return; }
  if (G.party.length >= BATTLE_SIZE) { toast(`Só ${BATTLE_SIZE} entram na batalha. Tire alguém antes.`); return; }
  G.party.push(id);
}
function leaveCity() {
  const party = G.party.map(heroById).filter(Boolean);
  if (party.length !== BATTLE_SIZE) { toast(`Escolha exatamente ${BATTLE_SIZE} personagens para a batalha.`); cityTab = 'grupo'; return; }
  const bad = party.find(h => !deckValid(h));
  if (bad) { toast(`O baralho de ${bad.name} precisa de ${DECK_SIZE} cartas válidas.`); cityTab = 'montagem'; deckHero = bad.id; return; }
  show('map');
}

/* ================= Batalha ================= */
let S = null, UID = 0;   // estado da batalha atual
const def = c => CARDS[c.id];
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const inBounds = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

function parseMap(m) {
  const H = [], T = [];
  m.rows.forEach((row, y) => {
    H.push([]); T.push([]);
    [...row].forEach((ch, x) => {
      H[y][x] = ch === '1' ? 1 : ch === '2' ? 2 : 0;
      T[y][x] = ch === '~' ? 'liquid' : ch === 'r' ? 'pedra' : ch === 't' ? 'arvore' : ch === 'm' ? 'deco' : 'ground';
    });
  });
  return { H, T };
}
const blocked = (x, y) => ['liquid', 'pedra', 'arvore'].includes(S.T[y][x]);
const heightAt = (x, y) => S.H[y][x];

function mkUnit(side, key, x, y, name, deck, hp, cls) {
  const cards = [];
  for (const [id, n] of Object.entries(deck)) for (let i = 0; i < n; i++) cards.push({ uid: ++UID, id });
  return { side, key, name, cls, hp, maxHp: hp, x, y, armor: 0, vigor: 0, counter: 0, status: {},
    deck: shuffle(cards), hand: [], discard: [], alive: true, face: side === 'hero' ? 'se' : 'sw', anim: null };
}
const heroes = () => S.units.filter(u => u.side === 'hero' && u.alive);
const enemies = () => S.units.filter(u => u.side === 'enemy' && u.alive);
const cur = () => S.units[S.sel];
const unitAt = (x, y) => S.units.find(u => u.alive && u.x === x && u.y === y);

function startBattle(mapKey, nodeId) {
  const m = MAPS[mapKey], { H, T } = parseMap(m), node = NODES[nodeId];
  UID = 0;
  S = { map: mapKey, node: nodeId, region: node.region, H, T, turn: 0, phase: 'player', units: [], sel: 0,
    pending: null, chosen: null, log: [], popups: [], hover: null, note: '', defeated: [] };
  G.party.map(heroById).forEach((h, i) => {
    const [x, y] = m.heroes[i];
    S.units.push(mkUnit('hero', h.cls, x, y, h.name, h.deck, CLASSES[h.cls].hp, h.cls));
  });
  m.foes.forEach(([k, x, y]) => {
    const mo = MONSTERS[k];
    S.units.push(mkUnit('enemy', k, x, y, mo.name, mo.deck, mo.hp));
  });
  S.units.forEach(u => drawCards(u, u.side === 'hero' ? HAND_START : 4));
  show('battle');
  log(`${m.name}: a batalha começa.`);
  startPlayerTurn(true);
}

function drawCards(u, n) {
  for (let i = 0; i < n; i++) {
    if (u.hand.length >= HAND_MAX) break;
    if (!u.deck.length) { if (!u.discard.length) break; u.deck = shuffle(u.discard); u.discard = []; }
    u.hand.push(u.deck.pop());
  }
}

// Casas alcançáveis: 4 vizinhos, sem líquido/obstáculo/unidade, subindo no máximo 1 nível por passo
function reachable(u, steps) {
  const seen = new Set([u.x + ',' + u.y]), out = [];
  let frontier = [[u.x, u.y]];
  for (let s = 0; s < steps; s++) {
    const next = [];
    for (const [x, y] of frontier) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (seen.has(k) || !inBounds(nx, ny) || blocked(nx, ny) || unitAt(nx, ny)) continue;
      if (heightAt(nx, ny) - heightAt(x, y) > 1) continue;
      seen.add(k); next.push([nx, ny]); out.push({ x: nx, y: ny });
    }
    frontier = next;
  }
  return out;
}
// Alcance efetivo: ataque à distância de cima ganha +1
const rangeTo = (u, d, t) => d.range + (d.range > 1 && heightAt(u.x, u.y) > heightAt(t.x, t.y) ? 1 : 0);

function targetsFor(u, d) {
  if (d.kind === 'move') return u.status.preso ? [] : reachable(u, d.move);
  if (d.kind === 'attack' || d.kind === 'steal')
    return S.units.filter(v => v.alive && v.side !== u.side && dist(u, v) <= rangeTo(u, d, v)).map(v => ({ x: v.x, y: v.y }));
  if (d.kind === 'heal')
    return S.units.filter(v => v.alive && v.side === u.side && dist(u, v) <= d.range).map(v => ({ x: v.x, y: v.y }));
  if (d.kind === 'area') {
    if (d.range === 0) return [{ x: u.x, y: u.y }];
    const foes = S.units.filter(v => v.alive && (d.ally ? v.side === u.side : v.side !== u.side));
    const out = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (Math.abs(u.x - x) + Math.abs(u.y - y) > d.range) continue;
      if (foes.some(f => Math.abs(f.x - x) + Math.abs(f.y - y) <= d.radius)) out.push({ x, y });
    }
    return out;
  }
  return [];
}

function log(msg) { S.log.unshift(msg); S.log = S.log.slice(0, 40); }
function popup(t, text, color) { S.popups.push({ x: t.x, y: t.y, h: heightAt(t.x, t.y), text, color, t: performance.now() }); }

function damage(t, n, src) {
  const absorbed = Math.min(t.armor, n);
  t.armor -= absorbed; t.hp -= (n - absorbed);
  popup(t, '-' + n, absorbed ? '#9cc3ff' : '#ff6b5a');
  t.hurt = performance.now();
  if (t.hp <= 0) {
    t.hp = 0; t.alive = false;
    log(`${t.name} caiu. O baralho sai da batalha.`);
    if (t.side === 'enemy') S.defeated.push(t.key);
  }
  if (src && src.melee && t.alive && t.counter && src.unit.alive) {
    const c = t.counter; t.counter = 0;
    log(`${t.name} revida ${c}.`); damage(src.unit, c);
  }
}
function heal(t, n) { if (!t.alive || n <= 0) return; const v = Math.min(n, t.maxHp - t.hp); t.hp += v; popup(t, '+' + n, '#7be08f'); }
function applyStatus(t, st) {
  if (!st || !t.alive) return;
  const [k, n] = st; t.status[k] = Math.max(t.status[k] || 0, n);
  popup(t, { preso: 'preso', veneno: 'veneno', queimadura: 'queimado' }[k], '#e8d27a');
}
function face(u, x, y) {
  const dx = x - u.x, dy = y - u.y;
  if (!dx && !dy) return;
  if (Math.abs(dx) >= Math.abs(dy)) u.face = dx > 0 ? 'se' : 'nw'; else u.face = dy > 0 ? 'sw' : 'ne';
}
function playAnim(u, name) { u.anim = { name, t: performance.now() }; }
// Andar é um deslize por código entre a casa de origem e a de destino
function moveUnit(u, x, y) { face(u, x, y); u.slide = { from: cellCenter(u.x, u.y), t: performance.now() }; u.x = x; u.y = y; }
const SLIDE_MS = 260;
const resonance = (u, d) => d.color2 && u.side === 'hero' && [d.color, d.color2].every(c => (CLASSES[u.cls].colors || [CLASSES[u.cls].color]).includes(c));

function removeCard(u, uid, toDiscard) {
  const i = u.hand.findIndex(c => c.uid === uid);
  const [c] = u.hand.splice(i, 1);
  if (toDiscard && !c.stolen) u.discard.push(c);
  return c;
}

// Status no começo do turno do lado: veneno 1, queimadura 2 por turno
function tickStatus(u) {
  for (const [k, dmg] of [['veneno', 1], ['queimadura', 2]]) {
    if (!u.status[k]) continue;
    damage(u, dmg); log(`${u.name} sofre ${dmg} de ${k}.`);
    if (--u.status[k] <= 0) delete u.status[k];
  }
}
function endSideStatus(units) { units.forEach(u => { if (u.status.preso && --u.status.preso <= 0) delete u.status.preso; }); }

function startPlayerTurn(first) {
  S.turn++; S.phase = 'player'; S.pending = null; S.chosen = null; S.note = '';
  heroes().forEach(h => { h.vigor = VIGOR; if (!first) { drawCards(h, HAND_DRAW); tickStatus(h); } });
  if (checkEnd()) return;
  if (!cur() || !cur().alive || cur().side !== 'hero') S.sel = S.units.indexOf(heroes()[0]);
  log(`Turno ${S.turn}: sua vez.`);
  if (DEV.has('auto')) autoTurn();
}
// #auto: o grupo joga com a mesma IA dos inimigos (teste e miniatura do hub)
async function autoTurn() {
  await sleep(400);
  for (const h of heroes()) { S.sel = S.units.indexOf(h); await enemyAct(h); if (S.phase === 'over') return; }
  endTurn();
}

async function endTurn() {
  if (!S || S.phase !== 'player') return;
  S.pending = null; S.chosen = null; S.phase = 'enemy'; S.note = '';
  heroes().forEach(h => { h.vigor = 0; });
  endSideStatus(heroes());
  for (const e of enemies()) {
    tickStatus(e);
    if (checkEnd()) return;
    if (!e.alive) continue;
    e.vigor = VIGOR; drawCards(e, HAND_DRAW);
    await enemyAct(e);
    if (S.phase === 'over') return;
  }
  endSideStatus(enemies());
  await sleep(250);
  startPlayerTurn(false);
}

// Aplica uma carta jogada por u no alvo (x, y). Usado pelo jogador e pela IA.
function resolveCard(u, c, x, y) {
  const d = def(c), res = resonance(u, d) ? d.res : null;
  u.vigor -= d.cost; removeCard(u, c.uid, true);
  if (d.kind === 'move') {
    moveUnit(u, x, y); if (d.armor) u.armor += d.armor;
    log(`${u.name} usa ${d.name}.`);
  } else if (d.kind === 'attack') {
    const t = unitAt(x, y); face(u, x, y); playAnim(u, 'ataque');
    log(`${u.name} usa ${d.name} em ${t.name}.`);
    for (let i = 0; i < (d.hits || 1) && t.alive; i++) damage(t, d.dmg, { unit: u, melee: d.range === 1 });
    applyStatus(t, d.status);
    if (d.lifesteal) heal(u, d.lifesteal);
    if (res && res.status) applyStatus(t, res.status);
    if (res && res.pierce) {
      const bx = t.x + Math.sign(t.x - u.x), by = t.y + Math.sign(t.y - u.y), bu = inBounds(bx, by) && unitAt(bx, by);
      if (bu && bu.side !== u.side) { log('Ressonância: a flecha atravessa.'); damage(bu, d.dmg); }
    }
  } else if (d.kind === 'steal') {
    const t = unitAt(x, y); face(u, x, y); playAnim(u, 'ataque'); damage(t, d.dmg, { unit: u, melee: true });
    let taken = null;
    if (t.hand.length) taken = t.hand.splice(Math.floor(Math.random() * t.hand.length), 1)[0];
    else if (t.deck.length) taken = t.deck.pop();
    if (taken && u.hand.length < HAND_MAX) { u.hand.push({ uid: ++UID, id: taken.id, stolen: true }); log(`${u.name} rouba ${CARDS[taken.id].name} de ${t.name}.`); }
    else log(`${u.name} acerta ${t.name}, mas não rouba nada.`);
  } else if (d.kind === 'area') {
    playAnim(u, 'ataque'); if (d.range) face(u, x, y);
    const hit = S.units.filter(v => v.alive && (d.ally ? v.side === u.side : v.side !== u.side) && Math.abs(v.x - x) + Math.abs(v.y - y) <= d.radius);
    log(`${u.name} usa ${d.name} e atinge ${hit.length} ${d.ally ? 'aliado' : 'alvo'}${hit.length === 1 ? '' : 's'}.`);
    hit.forEach(v => { if (d.dmg) damage(v, d.dmg); if (d.heal) heal(v, d.heal); applyStatus(v, d.status); });
  } else if (d.kind === 'heal') {
    const t = unitAt(x, y); heal(t, d.heal); if (d.armor) t.armor += d.armor;
    log(`${u.name} usa ${d.name} em ${t.name}.`);
  } else if (d.kind === 'self') {
    u.armor += d.armor || 0; if (d.heal) heal(u, d.heal); if (d.counter) u.counter = d.counter;
    if (res && res.allyArmor) S.units.filter(v => v.alive && v !== u && v.side === u.side && dist(u, v) === 1).forEach(v => { v.armor += res.allyArmor; });
    log(`${u.name} usa ${d.name}.`);
  } else if (d.kind === 'draw') {
    drawCards(u, d.draw); log(`${u.name} usa ${d.name} e compra ${d.draw}.`);
  } else if (d.kind === 'rage') {
    u.hp = Math.max(1, u.hp - d.hpCost); u.vigor += d.vigor; popup(u, '+' + d.vigor + ' Vigor', '#f2c14e');
    log(`${u.name} usa ${d.name}: -${d.hpCost} PV, +${d.vigor} Vigor.`);
  }
}

async function enemyAct(e) {
  const pace = 480;
  let guarded = false;
  for (let step = 0; step < 8; step++) {
    if (!e.alive || S.phase === 'over') return;
    const hs = S.units.filter(v => v.alive && v.side !== e.side); if (!hs.length) return;
    // 1) atacar: cartas de dano que alcançam alguém, da mais forte
    const offensive = e.hand.filter(c => ['attack', 'area'].includes(def(c).kind)).sort((a, b) => def(b).dmg - def(a).dmg);
    let acted = false;
    for (const c of offensive) {
      const d = def(c);
      const tiles = targetsFor(e, d);
      if (!tiles.length) continue;
      if (!(await payFor(e, c, pace))) continue;
      // alvo: quem tem menos PV (área: casa que acerta mais gente)
      let tile;
      if (d.kind === 'attack') tile = tiles.map(t => unitAt(t.x, t.y)).sort((a, b) => a.hp - b.hp)[0];
      else tile = tiles.sort((a, b) => hs.filter(h => dist(h, b) <= d.radius).length - hs.filter(h => dist(h, a) <= d.radius).length)[0];
      resolveCard(e, c, tile.x, tile.y); await sleep(pace);
      if (checkEnd()) return;
      acted = true; break;
    }
    if (acted) continue;
    // 2) defesa: uma carta de armadura quando há inimigo perto
    const guard = !guarded && e.hand.find(c => def(c).kind === 'self' && def(c).cost <= e.vigor);
    if (guard && hs.some(h => dist(h, e) <= 2)) { resolveCard(e, guard, e.x, e.y); guarded = true; await sleep(pace); continue; }
    // 3) andar até ficar ao alcance do melhor ataque
    if (e.status.preso) break;
    const mv = e.hand.filter(c => def(c).kind === 'move' && def(c).cost <= e.vigor).sort((a, b) => def(b).move - def(a).move)[0];
    if (!mv) break;
    const ranges = e.hand.filter(c => def(c).kind === 'attack').map(c => def(c).range);
    const range = ranges.length ? Math.max(...ranges) : 1;
    const score = (x, y) => {
      const dm = Math.min(...hs.map(h => Math.abs(h.x - x) + Math.abs(h.y - y)));
      return Math.max(0, dm - range) * 10 + (range > 1 ? Math.abs(dm - range) : dm) * 0.1;
    };
    let best = null, bs = score(e.x, e.y);
    for (const t of reachable(e, def(mv).move)) { const s = score(t.x, t.y); if (s < bs - 1e-9) { bs = s; best = t; } }
    if (!best) break;
    resolveCard(e, mv, best.x, best.y); await sleep(pace);
  }
  // A IA não guarda mão cheia: descarta o excesso para o baralho girar
  while (e.alive && e.hand.length > 4) removeCard(e, e.hand[0].uid, true);
}
// A IA descarta uma carta que não é de ataque para pagar o Vigor que falta
async function payFor(e, c, pace) {
  const d = def(c);
  while (e.vigor < d.cost) {
    const fuel = e.hand.find(k => k.uid !== c.uid && !['attack', 'area'].includes(def(k).kind) && def(k).discard > 0);
    if (!fuel) return false;
    removeCard(e, fuel.uid, true); e.vigor += def(fuel).discard;
    log(`${e.name} descarta ${def(fuel).name} (+${def(fuel).discard} Vigor).`);
    await sleep(pace * 0.6);
  }
  return true;
}

function checkEnd() {
  if (S.phase === 'over') return true;
  if (!enemies().length) { S.phase = 'over'; setTimeout(victory, 500); return true; }
  if (!heroes().length) { S.phase = 'over'; setTimeout(defeat, 500); return true; }
  return false;
}

function victory() {
  const r = regionOf(S.region), node = NODES[S.node], got = { spheres: {}, items: {}, gold: 0 };
  const add = (o, k, n) => { o[k] = (o[k] || 0) + n; };
  for (const k of S.defeated) {
    const mo = MONSTERS[k];
    add(got.spheres, mo.color, mo.boss ? 4 : rnd(1, 2));
    if (Math.random() < 0.5) add(got.spheres, 'incolor', 1);
    if (mo.boss) add(got.spheres, 'especial', 1);
    if (mo.boss || Math.random() < 0.6) add(got.items, mo.item, 1);
    got.gold += mo.boss ? 60 : rnd(12, 20);
  }
  add(got.spheres, r.color, 1);   // a cor do campo
  G.gold += got.gold;
  for (const [k, n] of Object.entries(got.spheres)) add(G.spheres, k, n);
  for (const [k, n] of Object.entries(got.items)) add(G.items, k, n);
  const lines = [`${MAPS[S.map].name} em ${S.turn} turnos. Recompensas:`, `${got.gold} de ouro`];
  lines.spheres = got.spheres;
  for (const [k, n] of Object.entries(got.items)) lines.push(`${ITEMS[k].name} ×${n}`);
  if (node.type === 'boss' && !G.bosses[r.key]) {
    G.bosses[r.key] = true;
    const next = REGIONS[REGIONS.indexOf(r) + 1];
    lines.push(next ? `A trilha para a região ${next.name} está aberta!` : 'Você venceu o último chefe!');
  }
  modal('Vitória', lines, [{ label: 'Voltar ao mapa', fn: () => { S = null; show('map'); } }]);
  modalBox.spheres = got.spheres;
}
function defeat() {
  modal('Game over', ['O grupo caiu.', 'Você volta ao último save, gravado na última cidade em que entrou.'],
    [{ label: 'Voltar ao último save', fn: () => { G = loadGame() || newCampaign(); S = null; enterCity(); } }]);
}

/* ---------- Ações do jogador ---------- */
function choose(i) {
  if (S.phase !== 'player') return;
  const c = cur().hand[i]; if (!c) return;
  S.pending = null; S.note = '';
  S.chosen = S.chosen === c.uid ? null : c.uid;
}
function onPlay(c) {
  const u = cur(), d = def(c);
  if (u.vigor < d.cost) { S.note = `Falta Vigor para ${d.name}. Descarte outra carta para ganhar Vigor.`; return; }
  S.pending = null; S.note = ''; S.chosen = null;
  if (['self', 'draw', 'rage'].includes(d.kind) || (d.kind === 'area' && d.range === 0)) { resolveCard(u, c, u.x, u.y); checkEnd(); return; }
  if (d.kind === 'move' && u.status.preso) { S.note = `${u.name} está preso e não pode se mover neste turno.`; return; }
  const tiles = targetsFor(u, d);
  if (!tiles.length) { S.note = `${d.name}: nenhum alvo ao alcance.`; return; }
  S.pending = { uid: c.uid, mode: d.kind, radius: d.radius || 0, tiles, source: 'play' };
}
function onDiscard(c) {
  const u = cur(), d = def(c);
  if (!(d.discard > 0 || d.discardMove)) return;
  S.pending = null; S.note = ''; S.chosen = null;
  removeCard(u, c.uid, true); u.vigor += d.discard;
  log(`${u.name} descarta ${d.name} (+${d.discard} Vigor).`);
  if (d.discardMove && !u.status.preso) { const tiles = reachable(u, d.discardMove); if (tiles.length) S.pending = { mode: 'move', tiles, source: 'discardMove' }; }
}
function onShare(c, ally) {
  const u = cur();
  if (!ally || !ally.alive || ally.hand.length >= HAND_MAX) return;
  u.hand.splice(u.hand.indexOf(c), 1); ally.hand.push(c);
  log(`${u.name} passa ${def(c).name} para ${ally.name}.`);
  S.chosen = null;
}
function resolveAt(x, y) {
  const p = S.pending, u = cur();
  if (!p.tiles.some(t => t.x === x && t.y === y)) return;
  S.pending = null;
  if (p.source === 'discardMove') { moveUnit(u, x, y); log(`${u.name} se move 1 casa.`); return; }
  const c = u.hand.find(k => k.uid === p.uid);
  resolveCard(u, c, x, y); checkEnd();
}
function onTile(x, y) {
  if (S.phase !== 'player') return;
  if (S.pending) { resolveAt(x, y); return; }
  const u = unitAt(x, y);
  if (u && u.side === 'hero') selectHero(S.units.indexOf(u));
}
function selectHero(i) { if (S.phase !== 'player') return; S.sel = i; S.pending = null; S.chosen = null; S.note = ''; }
function cancelPending() { if (S && (S.pending || S.chosen)) { S.pending = null; S.chosen = null; } }

/* ================= Canvas, escala e entrada ================= */
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
let SC = 1, DPR = 1;
function resize() {
  const s = Math.min(innerWidth / VW, innerHeight / VH);
  SC = s >= 1 ? Math.floor(s) : s;   // escala inteira mantém o pixel art nítido
  DPR = devicePixelRatio || 1;
  cv.style.width = VW * SC + 'px'; cv.style.height = VH * SC + 'px';
  cv.width = Math.round(VW * SC * DPR); cv.height = Math.round(VH * SC * DPR);
}
addEventListener('resize', resize);

// Interface imediata: cada quadro registra as áreas clicáveis; o clique usa as do último quadro
const UI = { hits: [], mx: -1, my: -1, scroll: {} };
const hot = (x, y, w, h) => UI.mx >= x && UI.mx < x + w && UI.my >= y && UI.my < y + h;
const region = (x, y, w, h, fn, extra) => UI.hits.push({ x, y, w, h, fn, ...extra });
function toGame(ev) { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * VW / r.width, (ev.clientY - r.top) * VH / r.height]; }
cv.addEventListener('pointermove', ev => { [UI.mx, UI.my] = toGame(ev); });
cv.addEventListener('pointerleave', () => { UI.mx = UI.my = -1; });
cv.addEventListener('pointerdown', ev => {
  [UI.mx, UI.my] = toGame(ev);
  const hit = [...UI.hits].reverse().find(h => UI.mx >= h.x && UI.mx < h.x + h.w && UI.my >= h.y && UI.my < h.y + h.h);
  if (hit && hit.fn) hit.fn(ev);
  else if (!hit && screen === 'battle' && S) { if (S.chosen && !S.pending) S.chosen = null; }
});
cv.addEventListener('contextmenu', ev => { ev.preventDefault(); cancelPending(); });
cv.addEventListener('wheel', ev => {
  const h = [...UI.hits].reverse().find(r => r.scrollId && hot(r.x, r.y, r.w, r.h));
  if (h) { UI.scroll[h.scrollId] = clamp((UI.scroll[h.scrollId] || 0) + Math.sign(ev.deltaY) * 28, 0, h.maxScroll); ev.preventDefault(); }
}, { passive: false });
addEventListener('keydown', e => {
  if (e.key === 'Escape') cancelPending();
  if (e.key === 'Enter' && screen === 'battle' && !modalBox) endTurn();
});

/* ---------- Primitivas de desenho ---------- */
function rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }
function text(str, x, y, o = {}) {
  const size = o.size || 8;
  ctx.font = `${o.bold ? 600 : 400} ${size}px ${FONT}`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'top';
  let s = String(str);
  if (o.maxW) while (s.length > 1 && ctx.measureText(s).width > o.maxW) s = s.slice(0, -2) + '…';
  if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillText(s, x + 0.5, y + 0.5); }
  ctx.fillStyle = o.color || '#f5ecd2'; ctx.fillText(s, x, y);
}
function wrap(str, maxW, size) {
  ctx.font = `400 ${size}px ${FONT}`;
  const words = String(str).split(' '), lines = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}
// Janela no estilo dos menus do FF9: azul em degradê, borda clara e cantos chanfrados
function panel(x, y, w, h, o = {}) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, o.top || '#3b4f9e'); g.addColorStop(1, o.bottom || '#141c4a');
  rect(x + 1, y, w - 2, h, '#0a0d22'); rect(x, y + 1, w, h - 2, '#0a0d22');
  ctx.fillStyle = g; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  rect(x + 2, y + 1, w - 4, 1, '#d8e0ff'); rect(x + 1, y + 2, 1, h - 4, '#d8e0ff');
  rect(x + 2, y + h - 2, w - 4, 1, '#7f8cc8'); rect(x + w - 2, y + 2, 1, h - 4, '#7f8cc8');
}
function button(x, y, w, h, label, fn, o = {}) {
  const dis = o.disabled, on = o.active, hov = !dis && hot(x, y, w, h);
  panel(x, y, w, h, on ? { top: '#c98f2a', bottom: '#6a4510' } : hov ? { top: '#5b72c8', bottom: '#24306a' } : dis ? { top: '#3a3f55', bottom: '#1d2030' } : {});
  text(label, x + w / 2, y + Math.round((h - (o.size || 8)) / 2), { align: 'center', size: o.size || 8, color: dis ? '#8a8fa3' : '#ffffff', maxW: w - 4, bold: true });
  if (!dis) region(x, y, w, h, fn);
}
function sphereIcon(c, x, y, r = 4) {
  ctx.fillStyle = '#0a0d22'; ctx.beginPath(); ctx.arc(x, y, r + 1, 0, 7); ctx.fill();
  ctx.fillStyle = COLOR_HEX[c]; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(Math.round(x - r / 2), Math.round(y - r / 2), 1, 1);
}
function pipsDraw(x, y, n, max) {
  for (let i = 0; i < Math.max(n, max); i++) {
    rect(x + i * 7, y, 6, 6, '#0a0d22');
    rect(x + i * 7 + 1, y + 1, 4, 4, i < n ? '#f2c14e' : '#3a3f55');
  }
}
function bar(x, y, w, h, frac, col) { rect(x, y, w, h, '#0a0d22'); rect(x + 1, y + 1, Math.max(0, Math.round((w - 2) * clamp(frac, 0, 1))), h - 2, col); }

/* ---------- Cartas ---------- */
const kindLabel = d => ({ move: 'Movimento', attack: d.magic ? 'Ataque mágico' : 'Ataque básico', area: 'Feitiço', self: 'Feitiço', heal: 'Feitiço', draw: 'Utilitário', steal: 'Roubo', rage: 'Feitiço' })[d.kind];
const colorLabel = d => d.classe ? `exclusiva do ${CLASSES[d.classe].name}` : d.color2 ? `${COLOR_NAME[d.color]}/${COLOR_NAME[d.color2]}` : COLOR_NAME[d.color];
const discardText = d => (d.discard > 0 || d.discardMove) ? `Descarte: ${d.discText || `+${d.discard} Vigor`}` : 'Não pode ser descartada';
// Carta em escala k (1 = 56×80): moldura, arte, custo e nome
function drawCard(id, x, y, k = 1, o = {}) {
  const d = CARDS[id];
  ctx.save();
  if (o.dim) ctx.globalAlpha = 0.55;
  ctx.drawImage(cardFrame(d.color, d.color2), x, y, CW * k, CH * k);
  const art = SPR.cards[id];
  if (art) ctx.drawImage(art, x + 4 * k, y + 4 * k, 48 * k, 48 * k);
  else { rect(x + 4 * k, y + 4 * k, 48 * k, 48 * k, COLOR_HEX[d.color]); text(kindLabel(d)[0], x + 28 * k, y + 20 * k, { align: 'center', size: 12 * k, bold: true }); }
  // gema do custo
  const gx = x + 8 * k, gy = y + 8 * k, gr = 6 * k;
  ctx.fillStyle = '#120c08'; ctx.beginPath(); ctx.arc(gx, gy, gr + k, 0, 7); ctx.fill();
  ctx.fillStyle = '#e0a82e'; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff1b0'; ctx.fillRect(Math.round(gx - gr / 2), Math.round(gy - gr / 2), k, k);
  text(d.cost, gx, gy - 4 * k, { align: 'center', size: 8 * k, bold: true, color: '#2a1a05', shadow: false });
  // nome na placa (encolhe a fonte até caber)
  let fs = 7;
  ctx.font = `600 ${fs * k}px ${FONT}`;
  while (fs > 4 && ctx.measureText(d.name).width > 46 * k) { fs -= 0.5; ctx.font = `600 ${fs * k}px ${FONT}`; }
  text(d.name, x + 28 * k, y + (k >= 2 ? 57 : 58) * k, { align: 'center', size: fs * k, bold: true, color: '#2a1a05', shadow: false });
  if (k >= 2) text(kindLabel(d), x + 28 * k, y + 66 * k, { align: 'center', size: 4.5 * k, color: '#6a4a20', shadow: false, maxW: 46 * k });
  if (o.badge) { rect(x + 30 * k, y + 2 * k, 24 * k, 7 * k, '#b5552f'); text(o.badge, x + 42 * k, y + 2.5 * k, { align: 'center', size: 5 * k, bold: true }); }
  ctx.restore();
}
// Carta ampliada (2×) com o texto completo numa janela ao lado/abaixo
function cardDetail(id, x, y) {
  const d = CARDS[id];
  drawCard(id, x, y, 2);
  const py = y + CH * 2 + 4, lines = [colorLabel(d), ...wrap(d.text, 104, 7)];
  if (d.resText) lines.push(...wrap(d.resText, 104, 7));
  const disc = wrap(discardText(d), 104, 7);
  const h = 8 + (lines.length + disc.length) * 9 + 4;
  panel(x, py, CW * 2, h);
  lines.forEach((l, i) => text(l, x + 5, py + 5 + i * 9, { size: 7, color: i === 0 ? '#c8d4ff' : '#ffffff' }));
  disc.forEach((l, i) => text(l, x + 5, py + 5 + (lines.length + i) * 9, { size: 7, color: '#f2c14e' }));
}

/* ---------- Unidades e tabuleiro ---------- */
const OX = 206, OY = 58;
// Canto superior esquerdo do tile da casa (x, y) na altura h
const tilePos = (x, y, h = 0) => [OX + (x - y) * TW / 2, OY + (x + y) * TH / 2 - h * LV];
const cellCenter = (x, y) => { const [px, py] = tilePos(x, y, heightAt(x, y)); return [px + TW / 2, py + TH / 2]; };

function diamond(px, py, color) {
  ctx.fillStyle = color;
  for (let r = 0; r < TH; r++) { const w = r < TH / 2 ? (r + 1) * 2 : (TH - r) * 2; ctx.fillRect(px + TW / 2 - w, py + r, w * 2, 1); }
}
// Bloco desenhado por código (sem tileset): topo e duas laterais
function codeBlock(px, py, h, top, left, right) {
  const depth = LV + h * LV;
  for (let c = 0; c < TW / 2; c++) {
    ctx.fillStyle = left; ctx.fillRect(px + c, py + TH / 2 + (c >> 1), 1, depth);
    ctx.fillStyle = right; ctx.fillRect(px + TW / 2 + c, py + TH - 1 - (c >> 1), 1, depth);
  }
  diamond(px, py, top);
}
const BIOME_CODE = {
  pantano: ['#4f7448', '#2c4a2d', '#3a5e37', '#2a5f78'], floresta: ['#5a8f45', '#33522a', '#416a33', '#3a7f8f'],
  deserto: ['#d9b46c', '#a07a3e', '#b98d4c', '#4f9fb0'], gelo: ['#cfe3ef', '#7f9db4', '#9bb8cc', '#4f7fb8'], fogo: ['#5a4038', '#2e1f1b', '#43302a', '#e2622a'],
};

function drawFloor(biome) {
  const tiles = SPR.tiles[biome];
  if (tiles) {
    // Grid dual: um tile em cada vértice, com os 4 cantos vindo das 4 casas em volta,
    // assim a borda chão/líquido cai exatamente na borda das casas
    const ground = (x, y) => (S.T[clamp(y, 0, N - 1)][clamp(x, 0, N - 1)] === 'liquid' ? 0 : 1);
    for (let s = 0; s <= 2 * N; s++) for (let vx = 0; vx <= N; vx++) {
      const vy = s - vx; if (vy < 0 || vy > N) continue;
      const m = (ground(vx - 1, vy - 1) << 3) | (ground(vx, vy - 1) << 2) | (ground(vx - 1, vy) << 1) | ground(vx, vy);
      const [px, py] = tilePos(vx - 0.5, vy - 0.5);
      ctx.drawImage(tiles[m], Math.round(px), Math.round(py));
    }
  } else {
    const [top, left, right, liq] = BIOME_CODE[biome];
    for (let s = 0; s <= 2 * (N - 1); s++) for (let x = 0; x < N; x++) {
      const y = s - x; if (y < 0 || y >= N) continue;
      const [px, py] = tilePos(x, y);
      codeBlock(px, py, 0, S.T[y][x] === 'liquid' ? liq : top, left, right);
    }
  }
}
function drawProp(biome, kind, cx, cy) {
  const img = SPR.props[biome] && SPR.props[biome][kind];
  if (img) { const foot = footOf(`cenario/${biome}/${kind}.png`, img); ctx.drawImage(img, Math.round(cx - img.width / 2), Math.round(cy + 4 - foot)); return; }
  if (kind === 'pedra') { rect(cx - 9, cy - 10, 18, 12, '#5c625e'); rect(cx - 7, cy - 12, 12, 4, '#8d948e'); }
  else if (kind === 'arvore') { rect(cx - 2, cy - 20, 4, 22, '#4b3424'); ctx.fillStyle = '#35602f'; ctx.beginPath(); ctx.arc(cx, cy - 26, 12, 0, 7); ctx.fill(); }
  else { rect(cx - 4, cy - 4, 2, 4, '#9fd07a'); rect(cx + 2, cy - 6, 2, 6, '#9fd07a'); }
}

// Personagem: SE/NE desenhados, SW/NW espelhados (como no FFT); animação parado/ataque
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
      frame = Math.floor((now - u.anim.t) / 90);
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
  // Sem arte: boneco simples na cor da classe/monstro
  const col = u.side === 'hero' ? COLOR_HEX[CLASSES[u.cls].color] : COLOR_HEX[MONSTERS[u.key].color];
  const big = u.side === 'enemy' && MONSTERS[u.key].boss ? 1.5 : 1;
  rect(cx - 6 * big, cy - 22 * big, 12 * big, 22 * big, '#1b1b1b');
  rect(cx - 5 * big, cy - 14 * big, 10 * big, 13 * big, col);
  rect(cx - 4 * big, cy - 21 * big, 8 * big, 7 * big, u.side === 'hero' ? '#e2b48c' : '#7fae4a');
  return cy - 24 * big;
}
// Retrato: o sprite de frente recortado na caixa visível
function portrait(key, x, y, size) {
  const art = SPR.chars[key];
  rect(x, y, size, size, '#0a0d22'); rect(x + 1, y + 1, size - 2, size - 2, '#22306a');
  if (!art) return;
  const m = META[`personagens/${key}/se.png`] || [0, 0, art.se.width, art.se.height];
  const w = m[2] - m[0], h = m[3] - m[1], side = Math.max(w, Math.min(h, w + 8));
  const sx = m[0] + w / 2 - side / 2, sy = m[1];
  const k = Math.min(1, (size - 2) / side);
  ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, size - 2, size - 2); ctx.clip();
  ctx.drawImage(art.se, sx, sy, side, side, x + 1, y + 1, side * k, side * k);
  ctx.restore();
}

/* ================= Telas ================= */
function topBar(title) {
  rect(0, 0, VW, 18, '#0a0d22');
  text('Iso Cards', 6, 4, { size: 10, bold: true, color: '#f2c14e' });
  if (title) text(title, 78, 5, { size: 8, color: '#c8d4ff', maxW: 240 });
  // carteira: ouro e esferas
  let x = 330;
  text(`${G.gold} ouro`, x, 5, { size: 8, bold: true, color: '#f2c14e' }); x += 46;
  for (const c of [...COLORS, 'incolor', 'especial']) {
    if (!G.spheres[c]) continue;
    sphereIcon(c, x + 4, 9); text(G.spheres[c], x + 10, 5, { size: 8 }); x += 26;
  }
  button(VW - 108, 2, 22, 14, '?', () => help());
  button(VW - 82, 2, 78, 14, 'Novo jogo', () => modal('Novo jogo', ['Apagar o save e recomeçar do Pântano com 3 Escudeiros?'], [
    { label: 'Recomeçar', fn: () => { G = newCampaign(); saveGame(); enterCity(); } }, { label: 'Cancelar', fn: () => {} }]));
}
function help() {
  modal('Como jogar', [
    'Mapa: clique num nó ligado por trilha. Chegar num Campo pela 1ª vez inicia a luta; depois dá para lutar de novo (farm). O chefe abre a próxima região.',
    'Cidade: o jogo grava ao entrar. Troque de classe pagando esferas, monte baralhos de 40, compre esferas e forje cartas.',
    'Batalha: 3 de Vigor por turno. Clique numa carta e escolha Jogar ou Descartar (descartar dá Vigor). Mover também é carta.',
    'Altura: subir no máximo 1 nível por casa; ataque à distância de cima ganha +1 de alcance. Botão direito ou Esc cancela.',
  ], [{ label: 'Ok', fn: () => {} }]);
}

/* ---------- Mapa do mundo ---------- */
function renderWorld(now) {
  rect(0, 0, VW, VH, '#0d1a3a');
  const W = SPR.world || {};
  if (W.fundo) ctx.drawImage(W.fundo, MAP_X, MAP_Y, W.fundo.width * 2, W.fundo.height * 2);
  const P = (n) => [MAP_X + n.x, MAP_Y + n.y];
  // trilhas
  for (const [a, c] of EDGES) {
    const [ax, ay] = P(NODES[a]), [cx2, cy2] = P(NODES[c]), open = G.visited[a] || G.visited[c];
    const steps = Math.floor(Math.hypot(cx2 - ax, cy2 - ay) / 5);
    for (let i = 1; i < steps; i++) { const t = i / steps; rect(Math.round(ax + (cx2 - ax) * t), Math.round(ay + (cy2 - ay) * t), 2, 2, open ? '#f1e2b8' : '#6b6a5e'); }
  }
  const nb = neighbors(G.node);
  let hoverId = null;
  for (const [id, n] of Object.entries(NODES)) {
    const [x, y] = P(n), can = nb.includes(id), seen = G.visited[id];
    const hov = hot(x - 18, y - 34, 36, 40);
    if (hov) hoverId = id;
    if (can) { ctx.fillStyle = hov ? '#fff3b0' : 'rgba(255,243,176,0.5)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 16 + (reduceMotion ? 0 : Math.sin(now / 250)), 7, 0, 0, 7); ctx.fill(); }
    const icon = W[n.type];
    if (icon) { ctx.globalAlpha = seen || can ? 1 : 0.55; ctx.drawImage(icon, Math.round(x - icon.width / 2), Math.round(y - icon.height + 8)); ctx.globalAlpha = 1; }
    else { ctx.fillStyle = COLOR_HEX[regionOf(n.region).color]; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); }
    if (n.type === 'boss' && G.bosses[n.region]) rect(x + 8, y - 14, 4, 4, '#5fbf86');
    region(x - 18, y - 34, 36, 40, () => { if (can) travel(id); else if (id !== G.node) toast('Esse lugar não está ligado por trilha a onde o grupo está.'); });
  }
  // grupo no nó atual
  const [hx, hy] = P(NODES[G.node]), lead = heroById(G.party[0]) || G.heroes[0];
  drawUnit({ key: lead.cls, cls: lead.cls, side: 'hero', face: 'se', status: {} }, hx + 12, hy + 10, now);
  // nomes das regiões
  REGIONS.forEach(r => { const c = NODES[`${r.key}-city`]; text(r.name, MAP_X + c.x + 29, MAP_Y + 6, { align: 'center', size: 9, bold: true }); });
  if (hoverId) { const n = NODES[hoverId], [x, y] = P(n); ctx.font = `600 8px ${FONT}`; const w = ctx.measureText(n.name).width + 10; panel(x - w / 2, y - 50, w, 14); text(n.name, x, y - 47, { align: 'center', size: 8, bold: true }); }
  // painel do lugar atual
  const n = NODES[G.node], r = regionOf(n.region);
  const px = 494, py = 26, pw = 140;
  panel(px, py, pw, 150);
  text(`${r.name} · ${{ city: 'Cidade', field: 'Campo de batalha', boss: 'Ponto de história' }[n.type]}`, px + 7, py + 7, { size: 7, color: '#c8d4ff', maxW: pw - 12 });
  text(n.name, px + 7, py + 18, { size: 10, bold: true, maxW: pw - 12 });
  let info = '';
  if (n.type === 'city') info = 'Nó seguro: forja, loja, classes e montagem. O jogo grava aqui.';
  if (n.type === 'field') info = `Esferas ${COLOR_NAME[r.color]}. Monstros: ${[...new Set(MAPS[n.map].foes.map(f => MONSTERS[f[0]].name))].join(', ')}.`;
  if (n.type === 'boss') info = G.bosses[n.region] ? 'Chefe vencido. A trilha para a próxima região está aberta.' : 'O chefe espera aqui.';
  wrap(info, pw - 14, 7).forEach((l, i) => text(l, px + 7, py + 34 + i * 9, { size: 7 }));
  if (n.type === 'city') button(px + 7, py + 120, pw - 14, 20, 'Entrar na cidade', () => enterCity());
  if (n.type === 'field') button(px + 7, py + 120, pw - 14, 20, 'Lutar aqui de novo', () => startBattle(n.map, G.node));
  panel(px, py + 156, pw, 52);
  wrap('Clique num lugar vizinho, ligado por trilha, para viajar.', pw - 14, 7).forEach((l, i) => text(l, px + 7, py + 163 + i * 9, { size: 7, color: '#c8d4ff' }));
  topBar('Mapa do mundo');
}

/* ---------- Cidade ---------- */
const TABS = [['grupo', 'Grupo e classes'], ['montagem', 'Montagem'], ['loja', 'Loja de esferas'], ['forja', 'Forja'], ['livro', 'Livro de Receitas']];
function renderCity(now) {
  const n = NODES[G.node], r = regionOf(n.region);
  // fundo: o mapa escurecido
  rect(0, 0, VW, VH, '#0d1a3a');
  if (SPR.world && SPR.world.fundo) { ctx.globalAlpha = 0.35; ctx.drawImage(SPR.world.fundo, 0, 0, VW, VH); ctx.globalAlpha = 1; }
  panel(4, 22, VW - 8, VH - 26);
  text(r.city, 12, 28, { size: 12, bold: true, color: '#f2c14e' });
  text(`${r.name} · esferas ${COLOR_NAME[r.color]} · jogo gravado`, 12, 43, { size: 7, color: '#c8d4ff' });
  TABS.forEach(([k, label], i) => button(170 + i * 78, 28, 76, 16, label, () => { cityTab = k; UI.scroll = {}; }, { active: cityTab === k, size: 7 }));
  button(VW - 96, 48, 86, 16, 'Sair para o mapa', leaveCity, { size: 7 });
  rect(10, 66, VW - 20, 1, '#7f8cc8');
  ({ grupo: cityGroup, montagem: cityDeck, loja: cityShop, forja: cityForge, livro: cityBook })[cityTab](now, r);
  topBar(r.city);
}

function cityGroup(now) {
  const y0 = 72, rowH = 42;
  G.heroes.forEach((h, i) => {
    const y = y0 + i * rowH, c = CLASSES[h.cls], inParty = G.party.includes(h.id);
    panel(10, y, VW - 20, rowH - 3, { top: '#2c3c80', bottom: '#18214f' });
    portrait(h.cls, 14, y + 3, 33);
    text(h.name, 52, y + 4, { size: 9, bold: true });
    text(`${c.name} · ${COLOR_NAME[c.color]} · ${c.hp} PV`, 52 + 50, y + 5, { size: 7, color: '#c8d4ff' });
    const ok = deckValid(h);
    text(`${deckSize(h)}/${DECK_SIZE} cartas`, 300, y + 5, { size: 7, bold: true, color: ok ? '#7be08f' : '#ff8a7a' });
    button(VW - 104, y + 4, 88, 14, inParty ? '✓ Na batalha' : 'Fora da batalha', () => toggleParty(h.id), { active: inParty, size: 7 });
    // troca de classe
    let x = 52;
    Object.entries(CLASSES).filter(([k]) => k !== h.cls).forEach(([k, cl]) => {
      const free = h.owned.includes(k) || k === 'escudeiro';
      const can = free || (G.spheres[cl.color] || 0) >= CLASS_CHANGE_COST;
      button(x, y + 21, 72, 14, `${cl.name} ${free ? '✓' : CLASS_CHANGE_COST}`, () => changeClass(h.id, k), { disabled: !can, size: 6.5 });
      sphereIcon(cl.color, x + 6, y + 28, 2.5);
      x += 74;
    });
  });
  const y = y0 + G.heroes.length * rowH + 2;
  if (G.heroes.length < PARTY_MAX) button(10, y, 170, 16, `Recrutar Escudeiro (${RECRUIT_COST} ouro)`, recruit, { disabled: G.gold < RECRUIT_COST, size: 7 });
  wrap(`Escolha os ${BATTLE_SIZE} que lutam. A troca custa ${CLASS_CHANGE_COST} esferas da cor da classe nova (✓ = grátis, já teve). Na 1ª vez numa classe, ela traz ${CLASS_KIT} cópias de cada carta exclusiva.`, 420, 7)
    .forEach((l, i) => text(l, 190, y + 1 + i * 9, { size: 7, color: '#c8d4ff' }));
}

// Lista com rolagem (roda do mouse); devolve a carta sob o mouse, para a pré-visualização
function cardList(id, x, y, w, h, ids, count, sign, fn) {
  panel(x, y, w, h, { top: '#22306a', bottom: '#141c4a' });
  const rowH = 14, total = ids.length * rowH, maxScroll = Math.max(0, total - (h - 6));
  const off = clamp(UI.scroll[id] || 0, 0, maxScroll);
  region(x, y, w, h, null, { scrollId: id, maxScroll });
  let hovered = null;
  ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 3, w - 4, h - 6); ctx.clip();
  ids.forEach((cid, i) => {
    const ry = y + 3 + i * rowH - off; if (ry < y - rowH || ry > y + h) return;
    const d = CARDS[cid];
    if (hot(x + 2, ry, w - 4, rowH) && hot(x, y + 3, w, h - 6)) { rect(x + 2, ry, w - 4, rowH, 'rgba(255,255,255,0.08)'); hovered = cid; }
    sphereIcon(d.color, x + 9, ry + 7, 3);
    text(d.name, x + 16, ry + 3, { size: 7, maxW: w - 74 });
    text(`${d.cost}V`, x + w - 54, ry + 3, { size: 7, color: '#f2c14e' });
    text(`×${count(cid)}`, x + w - 38, ry + 3, { size: 7, bold: true });
    if (ry >= y + 3 && ry + rowH <= y + h - 2) button(x + w - 18, ry + 1, 13, 12, sign, () => fn(cid), { size: 8 });
  });
  ctx.restore();
  if (!ids.length) text('Vazio', x + 8, y + 8, { size: 7, color: '#8a8fa3' });
  return hovered;
}
function cityDeck() {
  if (!deckHero || !heroById(deckHero)) deckHero = G.heroes[0].id;
  const h = heroById(deckHero), c = CLASSES[h.cls];
  G.heroes.forEach((x, i) => button(10 + i * 96, 72, 94, 14, `${x.name} · ${CLASSES[x.cls].name}`, () => { deckHero = x.id; UI.scroll = {}; }, { active: x.id === h.id, size: 6.5 }));
  const ok = deckValid(h);
  text(`Baralho ${deckSize(h)}/${DECK_SIZE}`, 12, 92, { size: 8, bold: true, color: ok ? '#7be08f' : '#ff8a7a' });
  text(`Coleção disponível para ${c.name}`, 238, 92, { size: 8, bold: true });
  const deckIds = Object.keys(h.deck).filter(id => h.deck[id] > 0);
  const pool = Object.keys(G.collection).filter(id => canUse(h.cls, id) && available(id) > 0);
  const hv1 = cardList('deck', 10, 104, 220, 248, deckIds, id => h.deck[id], '−', id => { if (--h.deck[id] <= 0) delete h.deck[id]; });
  const hv2 = cardList('pool', 236, 104, 220, 248, pool, available, '+', id => { if (deckSize(h) >= DECK_SIZE) { toast(`O baralho já tem ${DECK_SIZE} cartas. Tire uma antes.`); return; } h.deck[id] = (h.deck[id] || 0) + 1; });
  const show = hv1 || hv2;
  if (show) cardDetail(show, 486, 72);
  else wrap(`${h.name} usa cartas incolores${c.color !== 'incolor' ? ` e da cor ${COLOR_NAME[c.color]}` : ''}${c.cards.length ? ', mais as exclusivas da classe' : ''}. Passe o mouse numa carta para ver o texto.`, 140, 7)
    .forEach((l, i) => text(l, 480, 110 + i * 9, { size: 7, color: '#c8d4ff' }));
}
function cityShop(now, r) {
  const items = [...r.sells.map((c, i) => [c, i === 0 ? PRICE_LOCAL : PRICE_NEAR]), ['incolor', PRICE_INCOLOR]];
  wrap('Esta cidade vende esferas da cor do seu bioma (mais baratas), das cores vizinhas na trilha e incolores.', 600, 7).forEach((l, i) => text(l, 12, 72 + i * 9, { size: 7, color: '#c8d4ff' }));
  items.forEach(([c, p], i) => {
    const y = 92 + i * 30;
    panel(10, y, 420, 26, { top: '#2c3c80', bottom: '#18214f' });
    sphereIcon(c, 26, y + 13, 7);
    text(`Esfera ${COLOR_NAME[c]}`, 40, y + 5, { size: 9, bold: true });
    text(`Você tem ${G.spheres[c] || 0}`, 40, y + 15, { size: 7, color: '#c8d4ff' });
    text(`${p} ouro`, 200, y + 9, { size: 8, bold: true, color: '#f2c14e' });
    button(260, y + 5, 76, 16, 'Comprar 1', () => { G.gold -= p; G.spheres[c] = (G.spheres[c] || 0) + 1; }, { disabled: G.gold < p, size: 7 });
    button(342, y + 5, 80, 16, 'Comprar 5', () => { G.gold -= p * 5; G.spheres[c] = (G.spheres[c] || 0) + 5; }, { disabled: G.gold < p * 5, size: 7 });
  });
}
function cityForge() {
  const all = [...COLORS, 'incolor', 'especial'];
  text('Item', 12, 72, { size: 8, bold: true });
  const items = Object.keys(G.items).filter(k => G.items[k] > 0);
  if (!items.length) text('Sem itens. Monstros deixam itens ao cair.', 12, 84, { size: 7, color: '#8a8fa3' });
  items.forEach((k, i) => button(12 + (i % 5) * 86, 84 + Math.floor(i / 5) * 16, 84, 14, `${ITEMS[k].name} ×${G.items[k]}`, () => { forgeSel.item = forgeSel.item === k ? null : k; }, { active: forgeSel.item === k, size: 6 }));
  const iy = 84 + Math.ceil(Math.max(1, items.length) / 5) * 16 + 3;
  if (forgeSel.item) wrap(`“${ITEMS[forgeSel.item].text}”`, 420, 7).forEach((l, i) => text(l, 12, iy + i * 9, { size: 7, color: '#f2c14e' }));
  const sy = iy + 20;
  text('Esferas', 12, sy, { size: 8, bold: true });
  all.forEach((c, i) => {
    const x = 12 + (i % 4) * 106, y = sy + 12 + Math.floor(i / 4) * 22, have = G.spheres[c] || 0, n = forgeSel.spheres[c] || 0;
    panel(x, y, 104, 20, { top: '#2c3c80', bottom: '#18214f' });
    sphereIcon(c, x + 9, y + 10, 4);
    text(`${COLOR_NAME[c]} (${have})`, x + 16, y + 6, { size: 6.5, maxW: 50 });
    button(x + 66, y + 3, 12, 14, '−', () => { forgeSel.spheres[c] = Math.max(0, n - 1); }, { disabled: !n });
    text(n, x + 84, y + 6, { size: 8, bold: true, align: 'center' });
    button(x + 90, y + 3, 12, 14, '+', () => { forgeSel.spheres[c] = Math.min(have, n + 1); }, { disabled: n >= have });
  });
  const fy = sy + 60;
  button(12, fy, 120, 18, 'Forjar', doForge, { disabled: !(forgeSel.item && sum(forgeSel.spheres)) });
  wrap(`Receita certa forja ${FORGE_COPIES} cópias da carta e entra no Livro; combinação errada vira Carta Rachada e gasta tudo.`, 290, 7).forEach((l, i) => text(l, 140, fy + 1 + i * 9, { size: 7, color: '#c8d4ff' }));
  // conversão 3 → 1
  const cy = fy + 32;
  text('Conversão: 3 esferas de uma cor viram 1 de outra', 12, cy, { size: 8, bold: true });
  const from = [...COLORS, 'incolor'][conv.from], to = COLORS[conv.to];
  button(12, cy + 12, 110, 16, `De: ${COLOR_NAME[from]} ▸`, () => { conv.from = (conv.from + 1) % 6; }, { size: 7 });
  button(128, cy + 12, 110, 16, `Para: ${COLOR_NAME[to]} ▸`, () => { conv.to = (conv.to + 1) % 5; }, { size: 7 });
  button(244, cy + 12, 90, 16, 'Converter', () => {
    if (from === to) { toast('Escolha cores diferentes.'); return; }
    if ((G.spheres[from] || 0) < 3) { toast(`Precisa de 3 esferas ${COLOR_NAME[from].toLowerCase()}.`); return; }
    G.spheres[from] -= 3; G.spheres[to] = (G.spheres[to] || 0) + 1;
  }, { size: 7 });
  // à direita: as receitas conhecidas que usam o item escolhido
  const known = RECIPES.filter(rc => G.recipes[rc.card] && (!forgeSel.item || rc.item === forgeSel.item));
  text(forgeSel.item ? 'Receitas conhecidas com este item' : 'Receitas conhecidas', 450, 72, { size: 8, bold: true });
  known.slice(0, 2).forEach((rc, i) => {
    drawCard(rc.card, 450 + i * 92, 84, 1);
    const sp = Object.entries(rc.spheres);
    sp.forEach(([c, n], j) => { sphereIcon(c, 454 + i * 92, 172 + j * 10, 3); text(`${n}`, 460 + i * 92, 168 + j * 10, { size: 7 }); });
    text(ITEMS[rc.item].name, 450 + i * 92, 172 + sp.length * 10, { size: 6.5, maxW: 88, color: '#c8d4ff' });
  });
  if (known.length > 2) text(`+${known.length - 2} no Livro de Receitas`, 450, 250, { size: 7, color: '#c8d4ff' });
}
function cityBook() {
  const list = RECIPES.filter(rc => G.recipes[rc.card]);
  text(`${list.length} de ${RECIPES.length} receitas. As aprendidas vêm do ferreiro; as outras se descobrem testando. A descrição dos itens dá pistas.`, 12, 72, { size: 7, color: '#c8d4ff', maxW: 610 });
  const id = 'book', x = 10, y = 86, w = VW - 20, h = 266, colW = 150, rowH = 108;
  const cols = 4, total = Math.ceil(list.length / cols) * rowH, maxScroll = Math.max(0, total - h + 6);
  const off = clamp(UI.scroll[id] || 0, 0, maxScroll);
  region(x, y, w, h, null, { scrollId: id, maxScroll });
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  list.forEach((rc, i) => {
    const cx = x + 6 + (i % cols) * (colW + 6), cy = y + 4 + Math.floor(i / cols) * rowH - off;
    panel(cx, cy, colW, rowH - 6, { top: '#2c3c80', bottom: '#18214f' });
    drawCard(rc.card, cx + 4, cy + 10, 1);
    text(G.recipes[rc.card], cx + 64, cy + 6, { size: 6.5, color: '#c8d4ff' });
    const sp = Object.entries(rc.spheres);
    sp.forEach(([c, n], j) => { sphereIcon(c, cx + 68, cy + 22 + j * 11, 3.5); text(`${n} ${COLOR_NAME[c]}`, cx + 75, cy + 18 + j * 11, { size: 7 }); });
    wrap(`+ ${ITEMS[rc.item].name}`, colW - 66, 7).forEach((l, j) => text(l, cx + 64, cy + 22 + sp.length * 11 + j * 9, { size: 7, color: '#f2c14e' }));
  });
  ctx.restore();
  if (!list.length) text('Nenhuma ainda.', 16, 96, { size: 8, color: '#8a8fa3' });
}

/* ---------- Batalha ---------- */
// Casa sob o ponteiro: testa unidades e depois do bloco mais alto para o mais baixo
function pickTile(bx, by) {
  const front = S.units.filter(u => u.alive).sort((a, c) => (c.x + c.y) - (a.x + a.y));
  for (const u of front) { const [cx, cy] = cellCenter(u.x, u.y); if (bx >= cx - 9 && bx <= cx + 9 && by >= cy - 26 && by <= cy + 4) return { x: u.x, y: u.y }; }
  for (let h = 2; h >= 0; h--) {
    const a = (bx - OX - TW / 2) / (TW / 2), c = (by - OY + h * LV) / (TH / 2);
    const gx = Math.floor((a + c) / 2), gy = Math.floor((c - a) / 2);
    if (inBounds(gx, gy) && heightAt(gx, gy) === h) return { x: gx, y: gy };
  }
  return null;
}
const HL = { move: 'rgba(110,190,255,0.45)', area: 'rgba(242,193,78,0.42)', heal: 'rgba(110,220,130,0.45)' };

function renderBoard(now) {
  const r = regionOf(S.region);
  rect(0, 0, VW, VH, r.sky);
  drawFloor(S.region);
  const p = S.pending;
  const mark = (x, y, color) => { const [px, py] = tilePos(x, y, heightAt(x, y)); diamond(px, py, color); };
  S.hover = (UI.my < 272 && UI.mx < 440 && !modalBox) ? pickTile(UI.mx, UI.my) : null;
  if (p) {
    p.tiles.forEach(t => mark(t.x, t.y, HL[p.mode] || 'rgba(239,90,70,0.5)'));
    const h = S.hover;
    if (p.mode === 'area' && h && p.tiles.some(t => t.x === h.x && t.y === h.y))
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.abs(x - h.x) + Math.abs(y - h.y) <= p.radius) mark(x, y, 'rgba(255,140,40,0.5)');
  }
  if (S.hover) mark(S.hover.x, S.hover.y, 'rgba(255,255,255,0.18)');

  // Blocos elevados, cenário e unidades em ordem de profundidade
  const objs = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (S.H[y][x] > 0) objs.push({ x, y, z: 0, block: S.H[y][x] });
    if (['pedra', 'arvore', 'deco'].includes(S.T[y][x])) objs.push({ x, y, z: 1, prop: S.T[y][x] });
  }
  S.units.filter(u => u.alive).forEach(u => objs.push({ x: u.x, y: u.y, z: 2, u }));
  objs.sort((a, c) => (a.x + a.y) - (c.x + c.y) || a.z - c.z);
  const tops = [];
  for (const o of objs) {
    if (o.block) {
      const [px, py] = tilePos(o.x, o.y, o.block);
      if (SPR.tiles[S.region]) ctx.drawImage(tallBlock(S.region, o.block), Math.round(px), Math.round(py));
      else { const [top, left, right] = BIOME_CODE[S.region]; codeBlock(px, py, o.block, top, left, right); }
      if (p && p.tiles.some(t => t.x === o.x && t.y === o.y)) diamond(px, py, HL[p.mode] || 'rgba(239,90,70,0.5)');
      if (S.hover && S.hover.x === o.x && S.hover.y === o.y) diamond(px, py, 'rgba(255,255,255,0.18)');
      continue;
    }
    let [cx, cy] = cellCenter(o.x, o.y);
    if (o.prop) { drawProp(S.region, o.prop, cx, cy); continue; }
    const u = o.u;
    if (u.slide && !reduceMotion) {
      const k = (now - u.slide.t) / SLIDE_MS;
      if (k < 1) { cx = u.slide.from[0] + (cx - u.slide.from[0]) * k; cy = u.slide.from[1] + (cy - u.slide.from[1]) * k - Math.sin(k * Math.PI) * 4; }
      else u.slide = null;
    }
    tops.push({ u, cx, top: drawUnit(u, cx, cy, now) });
  }
  // Barras de vida, estados e marcador do selecionado
  for (const { u, cx, top } of tops) {
    const y = top - 5;
    bar(cx - 10, y, 20, 4, u.hp / u.maxHp, u.side === 'hero' ? '#5fbf86' : '#ef6b57');
    if (u.armor) rect(cx - 9, y + 4, Math.min(18, u.armor * 2), 1, '#7aa7ff');
    if (u.status.preso) rect(cx + 11, y, 3, 3, '#8bd36b');
    if (u.status.veneno) rect(cx + 11, y + 3, 3, 3, '#b36bd3');
    if (u.status.queimadura) rect(cx - 14, y, 3, 3, '#f08a3c');
    if (u.side === 'hero' && S.units.indexOf(u) === S.sel && S.phase === 'player') {
      const bob = reduceMotion ? 0 : Math.round(Math.sin(now / 200));
      rect(cx - 3, y - 8 + bob, 7, 1, '#f2c14e'); rect(cx - 2, y - 7 + bob, 5, 1, '#f2c14e'); rect(cx - 1, y - 6 + bob, 3, 1, '#f2c14e');
    }
  }
  // Números flutuantes
  S.popups = S.popups.filter(pp => now - pp.t < 1000);
  for (const pp of S.popups) {
    const k = (now - pp.t) / 1000, [px, py] = tilePos(pp.x, pp.y, pp.h);
    ctx.globalAlpha = 1 - k * 0.6;
    text(pp.text, px + TW / 2, py - 30 - (reduceMotion ? 0 : k * 12), { align: 'center', size: 10, bold: true, color: pp.color });
    ctx.globalAlpha = 1;
  }
  // clique no tabuleiro
  region(0, 18, 440, 254, () => { const t = S.hover; if (t) onTile(t.x, t.y); else if (S.chosen && !S.pending) S.chosen = null; });
}

function renderBattle(now) {
  renderBoard(now);
  const playerTurn = S.phase === 'player', u = cur();
  // linha de status sobre o tabuleiro
  const p = S.pending;
  let st;
  if (S.phase === 'enemy') st = 'Os inimigos estão agindo…';
  else if (S.phase === 'over') st = 'Batalha encerrada.';
  else if (S.note) st = S.note;
  else if (p && p.source === 'discardMove') st = 'Movimento extra: escolha uma casa azul.';
  else if (p && p.mode === 'move') st = 'Escolha uma casa azul. Subir mais de 1 nível de uma vez não dá.';
  else if (p && (p.mode === 'attack' || p.mode === 'steal')) st = 'Escolha um inimigo marcado em vermelho.';
  else if (p && p.mode === 'heal') st = 'Escolha um aliado marcado em verde.';
  else if (p && p.mode === 'area') st = 'Escolha o centro do efeito.';
  else st = `Vez de ${u.name}: clique numa carta para jogar ou descartar.`;
  panel(4, 21, 432, 16);
  text(st, 10, 25, { size: 7.5, maxW: p || S.chosen ? 350 : 420 });
  if (p || S.chosen) button(370, 22, 64, 14, 'Cancelar', cancelPending, { size: 7 });

  // coluna da direita: grupo, inimigos, registro e fim de turno
  const rx = 444, rw = 192;
  panel(rx, 21, rw, 132);
  text('Seu grupo', rx + 7, 25, { size: 8, bold: true, color: '#f2c14e' });
  S.units.filter(v => v.side === 'hero').forEach((h, i) => {
    const y = 36 + i * 38, idx = S.units.indexOf(h), sel = idx === S.sel;
    if (sel) rect(rx + 3, y - 1, rw - 6, 36, 'rgba(242,193,78,0.25)');
    ctx.globalAlpha = h.alive ? 1 : 0.4;
    portrait(h.cls, rx + 6, y, 32);
    text(h.name, rx + 42, y + 1, { size: 8, bold: true });
    text(CLASSES[h.cls].name, rx + 42 + 44, y + 2, { size: 6.5, color: '#c8d4ff' });
    bar(rx + 42, y + 12, 90, 5, h.hp / h.maxHp, '#5fbf86');
    text(`${h.hp}/${h.maxHp}`, rx + 136, y + 10, { size: 6.5 });
    pipsDraw(rx + 42, y + 20, h.vigor, VIGOR);
    const st2 = [h.armor ? `${h.armor} arm.` : '', ...Object.entries(h.status).map(([k, n]) => `${k} ${n}`)].filter(Boolean).join(', ');
    text(h.alive ? `${h.hand.length} na mão${st2 ? ' · ' + st2 : ''}` : 'Fora de combate', rx + 66, y + 20, { size: 6, color: '#c8d4ff', maxW: rw - 72 });
    ctx.globalAlpha = 1;
    if (h.alive) region(rx + 3, y - 1, rw - 6, 36, () => selectHero(idx));
  });
  panel(rx, 155, rw, 100);
  text('Inimigos', rx + 7, 159, { size: 8, bold: true, color: '#ff8a7a' });
  S.units.filter(v => v.side === 'enemy').forEach((e, i) => {
    const y = 170 + i * 28;
    ctx.globalAlpha = e.alive ? 1 : 0.35;
    portrait(e.key, rx + 6, y, 24);
    text(e.name, rx + 34, y, { size: 7.5, bold: true, maxW: 150 });
    bar(rx + 34, y + 10, 100, 5, e.hp / e.maxHp, '#ef6b57');
    text(e.alive ? `${e.hp}/${e.maxHp} · ${e.hand.length} cartas` : 'Derrotado', rx + 138, y + 9, { size: 6, color: '#c8d4ff', maxW: 52 });
    const st3 = [e.armor ? `${e.armor} arm.` : '', ...Object.entries(e.status).map(([k, n]) => `${k} ${n}`)].filter(Boolean).join(', ');
    if (st3) text(st3, rx + 34, y + 17, { size: 6, color: '#e8d27a' });
    ctx.globalAlpha = 1;
  });
  panel(rx, 257, rw, 74);
  S.log.slice(0, 7).forEach((l, i) => text(l, rx + 6, 262 + i * 9, { size: 6.5, color: i ? '#a9b4e0' : '#ffffff', maxW: rw - 12 }));
  button(rx, 334, rw, 22, 'Encerrar turno ⏎', endTurn, { disabled: !playerTurn });

  renderHand(now);
  topBar(`${MAPS[S.map].name} · Turno ${S.turn}`);
}

// Mão em leque na parte de baixo; a carta sob o mouse sobe e aparece ampliada à esquerda
function renderHand(now) {
  const u = cur(), hand = u.alive ? u.hand : [], n = hand.length;
  const playerTurn = S.phase === 'player';
  // cabeçalho da mão: Vigor e baralho
  panel(4, 296, 94, 60);
  text(`Mão de ${u.name}`, 9, 300, { size: 7.5, bold: true, maxW: 84 });
  text('Vigor', 9, 312, { size: 6.5, color: '#c8d4ff' });
  pipsDraw(34, 313, u.vigor, VIGOR);
  text(`${u.deck.length} no baralho`, 9, 326, { size: 6.5, color: '#c8d4ff' });
  text(`${u.discard.length} no descarte`, 9, 336, { size: 6.5, color: '#c8d4ff' });
  if (!n) { text(u.alive ? 'Mão vazia: encerre o turno para comprar.' : 'Fora de combate.', 120, 310, { size: 8, color: '#c8d4ff' }); return; }
  const spread = n > 1 ? Math.min(CW + 4, (330 - CW) / (n - 1)) : 0, x0 = 270 - (spread * (n - 1) + CW) / 2;
  // qual carta está sob o mouse (a da direita fica por cima)
  let hov = -1;
  for (let i = n - 1; i >= 0; i--) { const x = x0 + i * spread, raised = hand[i].uid === S.chosen; if (hot(x, raised ? 262 : 282, CW, CH)) { hov = i; break; } }
  if (modalBox) hov = -1;
  hand.forEach((c, i) => {
    const d = def(c), chosen = c.uid === S.chosen;
    const x = Math.round(x0 + i * spread), y = chosen ? 262 : hov === i ? 274 : 284;
    const canPlay = playerTurn && u.vigor >= d.cost;
    drawCard(c.id, x, y, 1, { dim: !canPlay && !chosen, badge: c.stolen ? 'Roubada' : null });
    if (chosen) { ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 1; ctx.strokeRect(x - 0.5, y - 0.5, CW + 1, CH + 1); }
    region(x, y, i === n - 1 ? CW : spread, CH, () => choose(i));
  });
  // ações da carta escolhida
  const ci = hand.findIndex(c => c.uid === S.chosen);
  if (ci >= 0 && playerTurn) {
    const c = hand[ci], d = def(c), x = Math.round(x0 + ci * spread) + CW / 2;
    const canDisc = d.discard > 0 || d.discardMove;
    const acts = [
      { label: `Jogar (${d.cost})`, fn: () => onPlay(c), disabled: u.vigor < d.cost },
      { label: canDisc ? `Descartar ${d.discText ? '+' : `+${d.discard}V`}` : 'Sem descarte', fn: () => onDiscard(c), disabled: !canDisc },
    ];
    if (c.stolen) heroes().filter(h => h !== u).forEach(a => acts.push({ label: `Passar a ${a.name}`, fn: () => onShare(c, a) }));
    const bw = 74, total = acts.length * (bw + 2);
    let bx = clamp(x - total / 2, 4, 436 - total);
    acts.forEach(a => { button(bx, 244, bw, 16, a.label, a.fn, { disabled: a.disabled, size: 6.5 }); bx += bw + 2; });
  }
  // carta ampliada
  const zoom = hov >= 0 ? hand[hov] : ci >= 0 ? hand[ci] : null;
  if (zoom) cardDetail(zoom.id, 6, 40);
}

/* ---------- Janela modal e aviso ---------- */
function renderModal() {
  if (!modalBox) return;
  rect(0, 0, VW, VH, 'rgba(0,0,0,0.55)');
  region(0, 0, VW, VH, null);   // bloqueia cliques atrás da janela
  const m = modalBox, w = 300, card = m.card ? CH + 8 : 0;
  const lines = m.lines.filter(Boolean).flatMap(l => wrap(l, w - (card ? CW + 24 : 20), 8));
  const sph = m.spheres ? Object.entries(m.spheres) : [];
  const h = Math.max(36 + lines.length * 11 + (sph.length ? 16 : 0) + 30, card + 40);
  const x = (VW - w) / 2, y = (VH - h) / 2;
  panel(x, y, w, h);
  text(m.title, x + 10, y + 7, { size: 12, bold: true, color: '#f2c14e' });
  const tx = x + 10 + (card ? CW + 10 : 0);
  if (card) drawCard(m.card, x + 10, y + 26);
  lines.forEach((l, i) => text(l, tx, y + 26 + i * 11, { size: 8 }));
  let sx = tx; const sy = y + 26 + lines.length * 11 + 6;
  sph.forEach(([c, n]) => { sphereIcon(c, sx + 5, sy + 4, 4); text(`${n} ${COLOR_NAME[c]}`, sx + 12, sy, { size: 8 }); sx += 70; });
  m.buttons.forEach((b, i) => button(x + w - 10 - (m.buttons.length - i) * 112 + 2, y + h - 26, 110, 18, b.label, () => { modalBox = null; b.fn(); }, { size: 7.5 }));
}
function renderToast(now) {
  if (!toastMsg) return;
  const age = now - toastMsg.t;
  if (age > 3200) { toastMsg = null; return; }
  const lines = wrap(toastMsg.msg, 360, 8), w = 380, h = 10 + lines.length * 11;
  ctx.globalAlpha = age > 2800 ? (3200 - age) / 400 : 1;
  panel((VW - w) / 2, VH - h - 40, w, h, { top: '#6a4510', bottom: '#2a1a05' });
  lines.forEach((l, i) => text(l, VW / 2, VH - h - 35 + i * 11, { align: 'center', size: 8 }));
  ctx.globalAlpha = 1;
}

function frame(now) {
  UI.hits = [];
  ctx.setTransform(SC * DPR, 0, 0, SC * DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (screen === 'battle' && S) renderBattle(now);
  else if (screen === 'city') renderCity(now);
  else renderWorld(now);
  renderToast(now);
  renderModal();
  // cursor de mão sobre algo clicável
  const h = [...UI.hits].reverse().find(r => hot(r.x, r.y, r.w, r.h));
  cv.style.cursor = h && h.fn ? 'pointer' : 'default';
  requestAnimationFrame(frame);
}

/* ================= Início ================= */
(async function boot() {
  resize();
  await Promise.all([loadArt(), document.fonts.load(`8px ${FONT}`), document.fonts.load(`600 8px ${FONT}`)]);
  if (DEV.has('reset')) try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* sem storage */ }
  G = loadGame() || newCampaign();
  if (DEV.has('rich')) { G.gold += 2000; [...COLORS, 'incolor', 'especial'].forEach(c => { G.spheres[c] = (G.spheres[c] || 0) + 30; }); Object.keys(ITEMS).forEach(k => { G.items[k] = (G.items[k] || 0) + 3; }); }
  if (DEV.has('open')) { REGIONS.forEach(r => { G.bosses[r.key] = true; ['city', 'f0', 'f1', 'boss'].forEach(t => { G.visited[`${r.key}-${t}`] = true; }); }); }
  const go = [...DEV].find(k => MAPS[k]);
  requestAnimationFrame(frame);
  cv.focus();
  if (go) {
    const node = Object.keys(NODES).find(id => NODES[id].map === go) || 'pantano-f0'; G.node = node; startBattle(go, node);
    if (DEV.has('zoom')) choose(0);   // já começa com a 1ª carta escolhida (teste da carta ampliada)
    return;
  }
  const tab = [...DEV].find(k => TABS.some(t => t[0] === k));
  if (tab) { cityTab = tab; enterCity(); return; }
  if (DEV.has('mapa')) { show('map'); return; }
  if (NODES[G.node].type === 'city') enterCity(); else show('map');
})();
