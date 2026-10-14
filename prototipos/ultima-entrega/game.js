// Última Entrega — protótipo jogável (MVP) em JavaScript puro.
// Segue o UltimaEntrega.md: movimento com peso (Mecânicas), a pilha de caixas que inclina com aceleração,
// aterrissagem e vento e quebra acima do ângulo-limite, equilíbrio com Q/E e agachar parado para estabilizar,
// recolher caixas caídas; loucura aguda (auras dos monstros, linha de visão, cobertura) e acumulada (faixas
// que mudam o mundo); os 3 monstros da demo (Observador, Rastejante, Coro), 4 tipos de caixa, o depósito como hub,
// relógio de pulso no lugar do HUD, mercado paralelo, a escolha grande no Bunker Aurum e o gancho final
// (Conteúdo da demo). Arte: Sprites/UltimaEntrega/.
'use strict';

const ART = '../../Sprites/UltimaEntrega/';
const VW = 640, VH = 360, T = 32, ROWS = 11, OY = 4;   // cena em pixels de arte; 1 unidade do GDD = 1 tile (32 px)
const SAVE_KEY = 'ultimaentrega-save-v1';
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ============================================================ números (valores iniciais do GDD, "tuning")

const P = {
  runSpeed: 7 * T, minSpeed: 3.5 * T, speedLossPerWeight: 0.06, walkFactor: 0.6,
  jumpHeight: 3.2 * T, minJump: 1.6 * T, jumpLossPerWeight: 0.05,
  gravity: 1600, maxFall: 900, accelGround: 1400, accelAir: 800, coyote: 0.1, buffer: 0.1,
  maxBoxes: 6,
  breakBottom: 35, breakUpper: 25,          // graus
  stabilizeAfter: 1,                        // s agachado parado
  acuteDecay: 8, acuteDelay: 2, losMult: 1.5,
};
// Pilha: cada caixa é um pêndulo invertido preso à de baixo (junta com rigidez e amortecimento).
const STACK = { tip: 5, stiffness: 26, damping: 3.2, inertia: 1 / 420, balance: 7, runWobble: 1.6, wind: 6 };

// Tipos de caixa da demo (Tipos de caixa). base = pagamento por caixa intacta.
const BOX = {
  comum:  { name: 'Comum',  img: 'boxes/comum',  weight: 1, base: 20, k: 1.0, desc: 'Comida enlatada. Estável.' },
  fragil: { name: 'Frágil', img: 'boxes/fragil', weight: 1, base: 45, k: 0.85, fragile: true, desc: 'Vinho e vidro. Quebra com impacto, mesmo sem cair.' },
  pesada: { name: 'Pesada', img: 'boxes/pesada', weight: 3, base: 45, k: 2.1, desc: 'Peças de máquina. Muito estável, mas pesa no pulo.' },
  selada: { name: 'Selada', img: 'boxes/selada', weight: 2, base: 35, k: 1.15, desc: 'Tecnologia suspeita, com lacre.' },
};
const COND = { intacta: 1, amassada: 0.7, quebrada: 0 };

// Equipamento do depósito (Economia).
const EQUIP = {
  arnes:  { name: 'Arnês reforçado', price: 120, desc: 'Aumenta o ângulo de quebra da pilha' },
  botas:  { name: 'Botas com amortecedor', price: 90, desc: 'Reduz o impacto na aterrissagem' },
  fones:  { name: 'Fones abafadores', price: 110, desc: 'Reduz o ganho de loucura aguda' },
};
const CALM_PRICE = 30;

// Monstros da demo: aura (raio, intensidade/s no centro) e comportamento.
const MONSTER = {
  O: { name: 'Observador', img: 'monsters/observador', r: 260, I: 24, needLos: true },
  R: { name: 'Rastejante', img: 'monsters/rastejante', r: 150, I: 15, speed: 40 },
  c: { name: 'Coro', img: 'monsters/coro', r: 95, I: 9, speed: 38 },
};

// ============================================================ fases (Conteúdo da demo)
// ground: [coluna inicial, final, linha do topo]; plats: [ini, fim, linha]; fake: plataformas falsas (loucura ≥ 50).
// Entidades por coluna (e linha, quando importa). Linha 9 = chão normal (pés em y = 288).
const LEVELS = [
  { id: 1, name: 'Primeira rota', place: 'Avenida desabada', tiles: 'superficie', bg: 'rua',
    client: 'Sr. Valdemar Kroll', bunker: 'Bunker Pináculo', order: ['comum', 'comum', 'comum', 'comum', 'comum'],
    w: 100, ground: [[0, 28, 9], [30, 47, 9], [48, 60, 8], [61, 76, 9], [78, 99, 9]], plats: [], fake: [[34, 38, 6], [82, 86, 6]],
    ents: [['P', 3], ['C', 38], ['K', 68], ['D', 96], ['A', 53, 8], ['S', 34, 3], ['S', 66, 2], ['S', 90, 3], ['B', 63, 9, 'comum'],
      ['T', 2, 'A/D anda · Shift corre, e a pilha balança mais · Tab mostra o relógio de pulso.'],
      ['T', 14, 'Q/E inclina o corpo e segura a pilha. Passou do limite, a caixa cai.'],
      ['T', 24, 'W ou Espaço pula. Cada caixa pesa: você pula menos e anda mais devagar. Buraco largo pede corrida (Shift).'],
      ['T', 44, 'Agache (S) parado por 1 segundo para a pilha parar de balançar.'],
      ['T', 61, 'Uma caixa extraviada no chão. F recolhe; entregue e ganhe por ela.'],
      ['T', 88, 'A porta do bunker. F entrega.']] },
  { id: 2, name: 'Viaduto', place: 'Estruturas quebradas e vento', tiles: 'superficie', bg: 'rua', wind: true,
    client: 'Dona Celeste Brandt', bunker: 'Bunker Mirante', order: ['comum', 'comum', 'fragil', 'fragil', 'fragil'],
    w: 112, ground: [[0, 15, 9], [17, 30, 8], [33, 44, 8], [45, 70, 9], [73, 86, 9], [89, 111, 9]], plats: [[36, 42, 5]], fake: [[60, 64, 6]],
    ents: [['P', 3], ['C', 46], ['C', 90], ['K', 49], ['K', 57], ['K', 95], ['O', 54, 4], ['O', 101, 4], ['D', 108], ['A', 20, 8],
      ['T', 2, 'Viaduto. O vento sopra em rajadas e empurra a pilha: segure com Q/E.'],
      ['T', 44, 'Um Observador. Ele só pesa na mente se te vê: agache atrás dos carros e avance entre eles.']] },
  { id: 3, name: 'Cratera', place: 'Zona de impacto de fragmento', tiles: 'superficie', bg: 'rua',
    client: 'Dr. Ícaro Vance', bunker: 'Bunker Ônix', order: ['pesada', 'pesada', 'selada', 'selada', 'comum'],
    w: 124, ground: [[0, 18, 9], [19, 20, 8], [21, 42, 10], [43, 61, 9], [63, 80, 9], [81, 123, 9]],
    plats: [[22, 26, 7], [29, 33, 7], [36, 40, 7], [48, 49, 8], [51, 52, 7], [54, 59, 6]], fake: [[66, 70, 6]],
    ents: [['P', 3], ['C', 14], ['C', 64], ['K', 89], ['D', 120], ['A', 31, 10], ['A', 72, 9], ['M', 57, 6],
      ['R', 33, 10, 23, 41], ['R', 95, 9, 84, 105],
      ['T', 2, 'Cratera. O Rastejante patrulha lá embaixo. Há uma rota por cima, mais difícil com carga pesada.'],
      ['T', 47, 'Uma lanterna acesa no alto, fora da rota…']] },
  { id: 4, name: 'Bunker Aurum', place: 'Descida até um bunker de luxo', tiles: 'bunker', bg: 'bunker',
    client: 'Família Aurum', bunker: 'Bunker Aurum', order: ['selada', 'selada', 'selada', 'fragil', 'comum', 'pesada'],
    w: 112, ground: [[0, 12, 5], [13, 20, 6], [21, 28, 7], [29, 61, 8], [63, 90, 9], [91, 111, 9]], plats: [], fake: [[44, 48, 5]],
    ents: [['P', 3, 5], ['C', 30, 8], ['C', 64], ['D', 108], ['M', 98, 9, 'contato'],
      ['c', 36, 6], ['c', 39, 5], ['c', 42, 6], ['c', 71, 7], ['c', 74, 6], ['c', 77, 7], ['c', 80, 6],
      ['T', 2, 'Bunker Aurum. O Coro vem atrás do barulho: ande devagar e não deixe nada cair.']] },
];

// Falas dos clientes (mudam com a avaliação e com a loucura acumulada).
const CLIENT_LINES = {
  good: ['"Pontual. Gosto disso num… funcionário."', '"Você parece saudável. Ótimo. Ótimo mesmo."', '"Deixe na câmara. Não toque na porta interna."'],
  bad: ['"Faltou coisa. Isso vai para o seu registro."', '"Quebrado? Vocês são todos iguais."', '"Vou pedir outro entregador. Tem tantos."'],
  mad: ['"Qual é o seu tipo sanguíneo mesmo?"', '"Você é o 4471 ou o 4472? Tanto faz."', '"Engraçado, você entregou isso ontem também."'],
};
const WHISPERS = ['volte', 'você já esteve aqui', 'quantos de você', 'não olhe para cima', 'o peso não é das caixas', 'eles sabem o seu nome. você sabe?'];

// ============================================================ save

const S = loadSave();
function loadSave() {
  const fresh = { phase: 0, credits: 60, equip: {}, calm: 1, acc: 0, loyB: 0, loyS: 0, susp: 0, diary: [], choice: null, deaths: 0, meter: false, done: false };
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return { ...fresh, ...s, equip: { ...s.equip } }; } catch (e) {}
  return fresh;
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
if (DEV.has('rich')) S.credits += 500;
const accBand = () => S.acc >= 75 ? 'Perdido' : S.acc >= 50 ? 'Fraturado' : S.acc >= 25 ? 'Abalado' : 'Lúcido';

// ============================================================ arte

const IMG = {};
const WALK = [0, 1, 2, 3, 4, 5, 6, 7].map(i => 'chars/entregador_andando_' + i);
function loadImages() {
  const names = ['chars/entregador', 'chars/entregador_pulo', 'chars/entregador_agachado', 'chars/colega_sem_capacete', ...WALK,
    ...Object.values(BOX).map(b => b.img), 'monsters/observador', 'monsters/rastejante', 'monsters/coro',
    'bg/ceu_criatura', 'bg/ruinas', 'bg/bunker', 'bg/deposito', 'tiles/superficie', 'tiles/bunker',
    'props/carro_destrocado', 'props/porta_bunker', 'props/banca_mercado', 'props/capsula_clone', 'props/fragmento_asteroide'];
  return Promise.all(names.map(n => new Promise(res => {
    const im = new Image(); im.onload = res; im.onerror = res; im.src = ART + n + '.png'; IMG[n] = im;
  })));
}

// Última linha opaca de cada sprite: os PNGs têm margem transparente embaixo, e os pés têm de tocar o chão.
const BOTTOM = new Map();
function bottomOf(img) {
  if (BOTTOM.has(img)) return BOTTOM.get(img);
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  let b = img.height;
  outer: for (let y = img.height - 1; y >= 0; y--) for (let x = 0; x < img.width; x++) if (d[(y * img.width + x) * 4 + 3] > 20) { b = y + 1; break outer; }
  BOTTOM.set(img, b);
  return b;
}

// Wang de cantos (NW NE SW SE; 1 = canto "upper") → coluna/linha no tileset de 4×4 (tiles/*.json). No tileset de
// plataforma, o sólido é o "lower" (o material da plataforma) e o "upper" é o vazio; por isso renderTiles inverte a chave.
const WANG = { '0000': [2, 1], '0001': [3, 1], '0010': [2, 2], '0011': [1, 2], '0100': [2, 0], '0101': [3, 2], '0110': [0, 1], '0111': [3, 3],
  '1000': [1, 1], '1001': [2, 3], '1010': [1, 0], '1011': [0, 2], '1100': [3, 0], '1101': [0, 0], '1110': [1, 3], '1111': [0, 3] };

// ============================================================ estado

const $ = id => document.getElementById(id);
const cv = $('view'), ctx = cv.getContext('2d');
const fx = document.createElement('canvas'); fx.width = VW; fx.height = VH;
const fctx = fx.getContext('2d');
let scene = 'hub';                // hub · play · screen
let L = null;                     // fase em andamento
let keys = new Set(), pressed = new Set();
const keyLog = [];                // para o atraso de entrada com loucura alta
let now = 0;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hyp = Math.hypot;
let nextId = 1;

function say(html, ms = 4500) {
  const s = $('say'); s.innerHTML = html; s.classList.remove('hidden');
  clearTimeout(say.t); say.t = setTimeout(() => s.classList.add('hidden'), ms);
}
function showScreen(html, clear) { const s = $('screen'); s.innerHTML = html; s.className = clear ? 'clear' : ''; }
function hideScreen() { $('screen').className = 'hidden'; }

// ============================================================ montagem da fase

function buildLevel(def, orderBoxes) {
  const grid = Array.from({ length: ROWS }, () => new Array(def.w).fill(0));
  for (const [a, b, top] of def.ground) for (let x = a; x <= b; x++) for (let y = top; y < ROWS; y++) grid[y][x] = 1;
  for (const [a, b, row] of def.plats) for (let x = a; x <= b; x++) grid[row][x] = 1;
  const lv = { def, grid, W: def.w * T, ents: [], monsters: [], free: [], noise: [], parts: [], hints: [], time: 0,
    acute: 0, lastGain: -9, acuteTotal: 0, gust: { t: rnd(4, 6), on: 0, dir: 1 }, stillT: 0, msgShown: {} };
  const feetY = row => row * T;
  for (const e of def.ents) {
    const [k, col, a, b, c] = e, x = col * T + 16;
    if (k === 'P') lv.start = { x, y: feetY(a ?? groundTop(grid, col)) };
    else if (k === 'T') lv.hints.push({ x, text: a, shown: false });
    else if (k === 'O') lv.monsters.push({ k, ...MONSTER.O, x, y: a * T + 16, seed: Math.random() * 9 });
    else if (k === 'R') lv.monsters.push({ k, ...MONSTER.R, x, y: feetY(a), x1: b * T, x2: c * T, dir: 1, seed: Math.random() * 9 });
    else if (k === 'c') lv.monsters.push({ k, ...MONSTER.c, x, y: a * T + 16, hx: x, hy: a * T + 16, tx: null, tt: 0, seed: Math.random() * 9 });
    else if (k === 'B') lv.free.push(newFree(newBox(b, true), x, feetY(a) - 12));
    else lv.ents.push({ k, x, y: feetY(a ?? groundTop(grid, col)), row: a, tag: b });
  }
  lv.tileCanvas = renderTiles(grid, def.w, def.tiles);
  lv.fakeCanvas = renderFake(def);
  lv.stack = orderBoxes.map(b => ({ box: b, ang: 0, w: 0 }));
  lv.order = orderBoxes.slice();
  lv.p = { x: lv.start.x, y: lv.start.y, vx: 0, vy: 0, face: 1, ground: true, coyote: 0, buffer: 0, crouch: false, lean: 0, anim: 0, stepT: 0, jumpHeld: false };
  lv.cp = { x: lv.start.x, y: lv.start.y, ids: lv.stack.map(s => s.box.id) };
  return lv;
}
function groundTop(grid, col) { for (let y = 0; y < ROWS; y++) if (grid[y][col]) return y; return ROWS; }
function newBox(type, bonus) { return { id: nextId++, type, cond: 'intacta', bonus: !!bonus }; }
function newFree(box, x, y, vx = 0, vy = 0, rv = 0) { return { box, x, y, vx, vy, rot: 0, rv, ground: false, lost: false }; }

// Tiles por cantos ("dual grid"): o canto (i, j) é o centro da célula; a borda desenhada cai na borda da célula.
function renderTiles(grid, w, set) {
  const c = document.createElement('canvas'); c.width = w * T; c.height = ROWS * T;
  const g = c.getContext('2d'), img = IMG['tiles/' + set];
  const s = (x, y) => (x < 0 || x >= w) ? (y >= 0 && y < ROWS ? grid[y][clamp(x, 0, w - 1)] : 0) : (y >= 0 && y < ROWS ? grid[y][x] : 0);
  for (let j = 0; j <= ROWS; j++) for (let i = 0; i <= w; i++) {
    const key = '' + (1 - s(i - 1, j - 1)) + (1 - s(i, j - 1)) + (1 - s(i - 1, j)) + (1 - s(i, j));
    if (key === '1111') continue;
    const [tx, ty] = WANG[key];
    g.drawImage(img, tx * T, ty * T, T, T, i * T - 16, j * T - 16, T, T);
  }
  return c;
}
// Plataformas falsas (Fraturado, acumulada ≥ 50): parecem chão, mas não seguram ninguém.
function renderFake(def) {
  if (!def.fake.length) return null;
  const grid = Array.from({ length: ROWS }, () => new Array(def.w).fill(0));
  for (const [a, b, row] of def.fake) for (let x = a; x <= b; x++) grid[row][x] = 1;
  return renderTiles(grid, def.w, def.tiles);
}

// ============================================================ física do entregador

const solid = (cx, cy) => cx < 0 || cx >= L.def.w ? true : cy < 0 || cy >= ROWS ? false : !!L.grid[cy][cx];
function hitBox(x, y, w, h) {
  const x0 = Math.floor((x - w / 2) / T), x1 = Math.floor((x + w / 2 - 0.01) / T);
  const y0 = Math.floor((y - h) / T), y1 = Math.floor((y - 0.01) / T);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (solid(cx, cy)) return true;
  return false;
}
const weight = () => L.stack.reduce((s, it) => s + BOX[it.box.type].weight, 0);
const runSpeed = () => Math.max(P.minSpeed, P.runSpeed * (1 - P.speedLossPerWeight * weight()));
const jumpV = () => Math.sqrt(2 * P.gravity * Math.max(P.minJump, P.jumpHeight * (1 - P.jumpLossPerWeight * weight())));

// Teclas lidas com atraso de 50 ms quando a loucura aguda passa de 80 (Efeitos da loucura no controle).
function key(k) {
  if (L && L.acute > 80) {
    for (let i = keyLog.length - 1; i >= 0; i--) if (now - keyLog[i].t >= 0.05) return keyLog[i].keys.has(k);
    return false;
  }
  return keys.has(k);
}
const anyKey = (...ks) => ks.some(key);

function updatePlayer(dt) {
  const p = L.p;
  const left = anyKey('a', 'arrowleft'), right = anyKey('d', 'arrowright');
  const run = anyKey('shift');
  p.crouch = anyKey('s', 'arrowdown') && p.ground;
  let dir = (right ? 1 : 0) - (left ? 1 : 0);
  if (p.crouch) dir = 0;
  if (dir) p.face = dir;
  const top = runSpeed() * (run ? 1 : P.walkFactor);
  const target = dir * top;
  const acc = p.ground ? P.accelGround : P.accelAir;
  const prevVx = p.vx;
  p.vx += clamp(target - p.vx, -acc * dt, acc * dt);
  if (L.def.wind && L.gust.on > 0) p.vx += L.gust.dir * 30 * dt;
  p.ax = (p.vx - prevVx) / dt;

  // Pulo com altura variável, coyote time e jump buffer.
  p.coyote = p.ground ? P.coyote : p.coyote - dt;
  if (pressed.has('w') || pressed.has(' ') || pressed.has('arrowup')) p.buffer = P.buffer; else p.buffer -= dt;
  if (p.buffer > 0 && p.coyote > 0 && !p.crouch) { p.vy = -jumpV(); p.buffer = 0; p.coyote = 0; p.ground = false; p.jumpHeld = true; }
  if (p.jumpHeld && !anyKey('w', ' ', 'arrowup') && p.vy < 0) { p.vy *= 0.5; p.jumpHeld = false; }
  p.vy = Math.min(P.maxFall, p.vy + P.gravity * dt);

  const h = p.crouch ? 36 : 54, w = 18;
  // X, com subida automática de degraus baixos (escalar bordas baixas).
  let nx = p.x + p.vx * dt;
  if (hitBox(nx, p.y, w, h)) {
    p.vx = 0;
  } else p.x = nx;
  // Y
  const wasGround = p.ground, fallV = p.vy;
  let ny = p.y + p.vy * dt;
  p.ground = false;
  if (hitBox(p.x, ny, w, h)) {
    if (p.vy > 0) { ny = Math.floor(ny / T) * T; p.ground = true; } else { ny = Math.floor((ny - h) / T + 1) * T + h; }
    p.vy = 0;
  }
  p.y = ny;
  if (!wasGround && p.ground) land(fallV);

  // Passos correndo fazem barulho (o Coro ouve).
  p.stepT -= dt;
  if (p.ground && run && Math.abs(p.vx) > 60 && p.stepT <= 0) { p.stepT = 0.4; noise(p.x, p.y, 170); }
  p.anim += Math.abs(p.vx) * dt / 18;

  // Agachar parado por 1 s estabiliza a pilha.
  L.stillT = p.crouch && Math.abs(p.vx) < 5 ? L.stillT + dt : 0;
  if (p.y > ROWS * T + 80) die('Você caiu no abismo.');
}

function land(v) {
  if (v < 260) return;
  const soft = S.equip.botas ? 0.55 : 1;
  const impact = (v - 200) / 600 * soft;
  for (const it of L.stack) it.w += (Math.random() < 0.5 ? -1 : 1) * impact * 2.4;
  if (v > 420) noise(L.p.x, L.p.y, 220);
  // Frágil quebra com impacto acima do limite, mesmo sem cair.
  if (v * soft > 640) for (const it of L.stack) if (BOX[it.box.type].fragile && it.box.cond !== 'quebrada') { it.box.cond = 'quebrada'; say('Barulho de vidro dentro da pilha.', 2200); }
}

// ============================================================ a pilha (Mecânicas: pilha de caixas)

function updateStack(dt) {
  const p = L.p, st = L.stack;
  const balance = (anyKey('e') ? 1 : 0) - (anyKey('q') ? 1 : 0);
  p.lean += (balance * 0.22 - p.lean) * Math.min(1, dt * 10);
  const run = anyKey('shift') && Math.abs(p.vx) > 60 && p.ground;
  const wind = L.def.wind && L.gust.on > 0 ? L.gust.dir * STACK.wind : 0;
  const arnes = S.equip.arnes ? 8 : 0;
  let A = 0;
  for (let i = 0; i < st.length; i++) {
    const it = st[i], b = BOX[it.box.type];
    A += it.ang;
    let tq = STACK.tip * (1 + i * 0.22) * Math.sin(A)                // gravidade tomba (instável)
      - STACK.inertia * (p.ax || 0) * Math.cos(A)                     // acelerar deixa a pilha para trás
      - STACK.stiffness * b.k * it.ang - STACK.damping * it.w         // a junta segura
      + balance * STACK.balance * (1 - i * 0.08)                      // Q/E: inclinar o corpo para o lado oposto
      + wind * (1 + i * 0.2);
    if (run) tq += Math.sin(now * 13 + i) * STACK.runWobble * (1 + i * 0.3);
    if (it.box.type === 'viva') tq += Math.sin(now * 3 + it.box.id) * 4;
    if (L.stillT > P.stabilizeAfter) { it.w *= 0.85; it.ang *= 0.9; }
    it.w += tq * dt;
    it.ang += it.w * dt;
    const lim = ((i === 0 ? P.breakBottom : P.breakUpper) + arnes) * Math.PI / 180;
    if (Math.abs(it.ang) > lim && !DEV.has('god')) { breakStack(i); return; }
  }
}

// A junta quebra: a caixa e todas acima dela caem com física.
function breakStack(i) {
  const p = L.p, fallen = L.stack.splice(i);
  let A = L.stack.reduce((s, it) => s + it.ang, 0) + p.lean;
  const base = stackBase();
  let x = base.x + Math.sin(A) * 22 * i, y = base.y - Math.cos(A) * 22 * i;
  for (const it of fallen) {
    A += it.ang;
    L.free.push(newFree(it.box, x + Math.sin(A) * 12, y - Math.cos(A) * 12, p.vx + Math.sin(A) * 120 + it.w * 40, -80 - Math.random() * 60, it.w * 2 + rnd(-3, 3)));
    x += Math.sin(A) * 22; y -= Math.cos(A) * 22;
  }
  say(fallen.length > 1 ? `${fallen.length} caixas caíram!` : 'Uma caixa caiu!', 1800);
}

function stackBase() { const p = L.p; return { x: p.x - 13 * p.face, y: p.y - (p.crouch ? 20 : 30) }; }

function updateFree(dt) {
  for (const f of L.free) {
    if (f.lost || f.held) continue;
    if (!f.ground) {
      f.vy = Math.min(P.maxFall, f.vy + P.gravity * dt);
      f.rot += f.rv * dt;
      let nx = f.x + f.vx * dt;
      if (hitBox(nx, f.y + 10, 20, 20)) f.vx *= -0.3; else f.x = nx;
      let ny = f.y + f.vy * dt;
      if (f.vy > 0 && hitBox(f.x, ny + 10, 20, 20)) {
        const v = f.vy;
        f.y = Math.floor((ny + 10) / T) * T - 10; f.vy = 0; f.ground = true; f.vx = 0; f.rv = 0;
        f.rot = Math.round(f.rot / (Math.PI / 2)) * (Math.PI / 2);
        noise(f.x, f.y, 260);
        if (v > 300) { if (BOX[f.box.type].fragile) f.box.cond = 'quebrada'; else if (f.box.cond === 'intacta') f.box.cond = 'amassada'; }
        // Caixa que cai em zona de monstro está perdida.
        if (L.monsters.some(m => hyp(m.x - f.x, m.y - f.y) < m.r * 0.5)) { f.lost = true; say('A caixa caiu perto demais da criatura. Perdida.', 2600); }
      } else f.y = ny;
      if (f.y > ROWS * T + 40) { f.lost = true; say('A caixa sumiu no abismo.', 2200); }
    }
  }
}

function tryPickup() {
  const p = L.p;
  if (L.stack.length >= P.maxBoxes) { say('A pilha já está no limite de 6 caixas.', 1800); return true; }
  const f = L.free.find(o => !o.lost && o.ground && Math.abs(o.x - p.x) < 30 && Math.abs(o.y - (p.y - 12)) < 40);
  if (!f) return false;
  L.free = L.free.filter(o => o !== f);
  L.stack.push({ box: f.box, ang: 0, w: 0 });
  if (!L.order.includes(f.box)) L.order.push(f.box);
  say(`${BOX[f.box.type].name} de volta à pilha${f.box.cond !== 'intacta' ? ` (${f.box.cond})` : ''}.`, 1600);
  return true;
}

// ============================================================ monstros, barulho e loucura

function noise(x, y, r) { L.noise.push({ x, y, r, t: now }); }

function los(m) {
  const p = L.p, hx = p.x, hy = p.y - (p.crouch ? 26 : 44);
  // Cobertura: agachado atrás de um carro, ninguém te vê.
  if (p.crouch && L.ents.some(e => e.k === 'K' && Math.abs(e.x - p.x) < 40)) return false;
  const my = m.k === 'R' ? m.y - 20 : m.y;
  const d = hyp(hx - m.x, hy - my), n = Math.ceil(d / 8);
  for (let i = 1; i < n; i++) {
    const x = m.x + (hx - m.x) * i / n, y = my + (hy - my) * i / n;
    if (solid(Math.floor(x / T), Math.floor(y / T))) return false;
  }
  return true;
}

function updateMonsters(dt) {
  const p = L.p;
  for (const m of L.monsters) {
    if (m.k === 'R') {
      m.x += m.dir * m.speed * dt;
      if (m.x < m.x1 || m.x > m.x2) { m.dir *= -1; m.x = clamp(m.x, m.x1, m.x2); }
    } else if (m.k === 'c') {
      // O Coro se aproxima do barulho e depois volta para o seu lugar.
      for (const n of L.noise) if (now - n.t < 0.05 && hyp(n.x - m.x, n.y - m.y) < n.r + 120) { m.tx = n.x; m.ty = n.y - 30; m.tt = 4; }
      m.tt -= dt;
      const tx = m.tt > 0 ? m.tx : m.hx, ty = m.tt > 0 ? m.ty : m.hy, d = hyp(tx - m.x, ty - m.y) || 1;
      const sp = m.tt > 0 ? m.speed : m.speed * 0.5;
      if (d > 4) { m.x += (tx - m.x) / d * sp * dt; m.y += (ty - m.y) / d * sp * dt; }
    }
  }
  L.noise = L.noise.filter(n => now - n.t < 0.5);

  // Loucura aguda: soma das auras, mais forte perto e com linha de visão (×1,5); o Observador só pesa se te vê.
  let gain = 0;
  const head = { x: p.x, y: p.y - 40 };
  for (const m of L.monsters) {
    const my = m.k === 'R' ? m.y - 20 : m.y;
    const d = hyp(m.x - head.x, my - head.y);
    if (d > m.r) continue;
    const seen = los(m);
    if (m.needLos && !seen) continue;
    gain += m.I * (1 - d / m.r) * (seen ? P.losMult : 0.6);
  }
  gain *= (1 + S.acc / 100) * (S.equip.fones ? 0.75 : 1) * (DEV.has('god') ? 0 : 1);
  if (gain > 0.05) { L.acute += gain * dt; L.acuteTotal += gain * dt; L.lastGain = L.time; }
  else if (L.time - L.lastGain > P.acuteDelay) L.acute = Math.max(0, L.acute - P.acuteDecay * dt);
  if (L.acute >= 100) die('Colapso mental.');
}

// Morte: um novo clone é ativado no último ponto de controle.
function die(why) {
  if (L.dying) return;
  L.dying = 1.6;
  S.deaths++; S.acc = Math.min(100, S.acc + 3); save();
  say(`<b>${why}</b> <i>Ativando o próximo clone…</i>`, 2600);
}
function respawn() {
  const ids = L.cp.ids;
  const all = [...L.stack.map(s => s.box), ...L.free.map(f => f.box)];
  L.free = L.free.filter(f => !ids.includes(f.box.id));
  L.stack = ids.map(id => all.find(b => b.id === id)).filter(Boolean).map(box => ({ box, ang: 0, w: 0 }));
  Object.assign(L.p, { x: L.cp.x, y: L.cp.y, vx: 0, vy: 0 });
  L.acute = 0; L.dying = 0;
}

// ============================================================ laço da fase

function updatePlay(dt) {
  L.time += dt;
  if (L.dying) { L.dying -= dt; if (L.dying <= 0) respawn(); return; }
  // Vento do viaduto: rajadas que empurram a pilha.
  if (L.def.wind) {
    const g = L.gust;
    if (g.on > 0) g.on -= dt;
    else if ((g.t -= dt) <= 0) { g.on = 2; g.t = rnd(5, 8); g.dir = Math.random() < 0.5 ? -1 : 1; if (!L.msgShown.wind) { L.msgShown.wind = 1; say('Rajada de vento! Segure a pilha com Q/E.', 2200); } }
  }
  updatePlayer(dt);
  if (L.dying) return;
  updateStack(dt);
  updateFree(dt);
  updateMonsters(dt);
  if (L.acute > 80 && Math.random() < dt * 0.5) L.parts.push({ halluc: true, x: L.p.x + rnd(-60, 60), y: L.p.y - 140, vy: 0, life: 0.8 });
  for (const q of L.parts) { q.vy += P.gravity * dt * 0.6; q.y += q.vy * dt; q.life -= dt; }
  L.parts = L.parts.filter(q => q.life > 0);

  // Dicas no mundo, ponto de controle, interações.
  const p = L.p;
  for (const h of L.hints) if (!h.shown && p.x > h.x) { h.shown = true; say(h.text, 5200); }
  for (const e of L.ents) if (e.k === 'C' && Math.abs(e.x - p.x) < 24 && L.cp.x !== e.x) {
    L.cp = { x: e.x, y: e.y, ids: L.stack.map(s => s.box.id) };
    say('Cápsula de clone: <i>registro atualizado.</i>', 1800);
  }
  const near = L.ents.find(e => (e.k === 'D' || e.k === 'M') && Math.abs(e.x - p.x) < 40 && Math.abs(e.y - p.y) < 50);
  const pick = L.free.some(o => !o.lost && o.ground && Math.abs(o.x - p.x) < 30 && Math.abs(o.y - (p.y - 12)) < 40);
  const pr = $('prompt');
  if (near || pick) { pr.textContent = pick ? 'F recolher caixa' : near.k === 'D' ? 'F entregar' : near.tag === 'contato' ? 'F falar com o contato' : 'F negociar'; pr.classList.remove('hidden'); }
  else pr.classList.add('hidden');
  if (pressed.has('f')) {
    if (pick) tryPickup();
    else if (near && near.k === 'D') arrive();
    else if (near && near.k === 'M') market(near);
  }
  if (pressed.has('c')) useCalm();
  watchUpdate();
}

function useCalm() {
  if (!S.calm) return say('Sem calmantes.', 1400);
  S.calm--; S.acc = Math.min(100, S.acc + 2); L.acute = Math.max(0, L.acute - 40); save();
  say('Calmante. <i>O mundo para de tremer… por enquanto.</i>', 2200);
}

// ============================================================ desenho

const CAM = { x: 0 };
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (scene === 'hub' || !L) return drawHub();
  const p = L.p;
  CAM.x += (clamp(p.x - VW * 0.42 + p.face * 40, 0, L.W - VW) - CAM.x) * 0.12;
  const shake = L.acute > 40 ? (L.acute - 40) / 25 : 0;
  const cx = Math.round(CAM.x + rnd(-shake, shake)), cy = -OY + Math.round(rnd(-shake, shake) * 0.6);

  // Fundo em camadas (parallax).
  if (L.def.bg === 'bunker') tileBg(IMG['bg/bunker'], cx * 0.2, 0);
  else { tileBg(IMG['bg/ceu_criatura'], cx * 0.04, 0); tileBg(IMG['bg/ruinas'], cx * 0.25, 20); }
  if (S.acc >= 25 || L.def.id === 1) drawShadows(cx);

  ctx.save(); ctx.translate(-cx, -cy);
  ctx.drawImage(L.tileCanvas, 0, 0);
  if (L.fakeCanvas && S.acc >= 50) { ctx.globalAlpha = 0.9 + 0.1 * Math.sin(now * 7); ctx.drawImage(L.fakeCanvas, 0, 0); ctx.globalAlpha = 1; }

  const hideBehind = p.crouch;
  for (const e of L.ents) if (!(e.k === 'K' && hideBehind && Math.abs(e.x - p.x) < 40)) drawEnt(e);
  for (const m of L.monsters) drawMonster(m);
  for (const f of L.free) drawFree(f);
  if (!L.dying) drawPlayer();
  for (const e of L.ents) if (e.k === 'K' && hideBehind && Math.abs(e.x - p.x) < 40) drawEnt(e);   // agachado: o carro fica na frente
  for (const q of L.parts) if (q.halluc) { ctx.globalAlpha = q.life; ctx.drawImage(IMG['boxes/comum'], q.x - 12, q.y - 12); ctx.globalAlpha = 1; }
  if (L.def.wind && L.gust.on > 0) drawWind(cx);
  if (S.acc >= 25 && Math.sin(now * 0.7) > 0.97) { ctx.font = '16px VT323'; ctx.fillStyle = 'rgba(220,210,190,.35)'; ctx.fillText(WHISPERS[Math.floor(now) % WHISPERS.length], p.x + 60, p.y - 100); }
  ctx.restore();

  postFx();
}

function tileBg(img, off, y) {
  const w = VW, h = VH, x0 = -((off % (w * 2)) + w * 2) % (w * 2);
  for (let x = x0, i = 0; x < VW; x += w, i++) {
    ctx.save();
    // Espelha uma cópia sim, outra não, para a emenda não aparecer.
    const flip = Math.floor((x - x0) / w) % 2 === 1;
    if (flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); }
    else ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }
}

// Sombras que se mexem no fundo (fase 1 e Abalado em diante): silhuetas que somem quando você chega perto.
function drawShadows(cx) {
  const list = L.def.ents.filter(e => e[0] === 'S');
  const extra = S.acc >= 25 ? [[0, 20, 2], [0, 55, 3], [0, 85, 2]] : [];
  for (const [, col, row] of [...list, ...extra]) {
    const x = col * T - cx * 0.6, d = Math.abs(col * T - L.p.x);
    const a = clamp((d - 120) / 300, 0, 1) * 0.22 * (0.7 + 0.3 * Math.sin(now * 2 + col));
    if (a <= 0.01) continue;
    ctx.globalAlpha = a; ctx.filter = 'brightness(0)';
    ctx.drawImage(IMG['monsters/observador'], x, row * T, 96, 96);
    ctx.filter = 'none'; ctx.globalAlpha = 1;
  }
}

function drawEnt(e) {
  const map = { K: 'props/carro_destrocado', D: 'props/porta_bunker', M: 'props/banca_mercado', C: 'props/capsula_clone', A: 'props/fragmento_asteroide' };
  const im = IMG[map[e.k]];
  if (!im) return;
  if (e.k === 'A') { const g = ctx.createRadialGradient(e.x, e.y - 20, 4, e.x, e.y - 20, 70); g.addColorStop(0, 'rgba(150,230,90,.25)'); g.addColorStop(1, 'rgba(150,230,90,0)'); ctx.fillStyle = g; ctx.fillRect(e.x - 70, e.y - 90, 140, 140); }
  if (e.k === 'C' && L.cp.x === e.x) { ctx.fillStyle = 'rgba(120,255,140,.18)'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 30, 28, 36, 0, 0, 7); ctx.fill(); }
  ctx.drawImage(im, Math.round(e.x - im.width / 2), Math.round(e.y - bottomOf(im)));
}

function drawMonster(m) {
  const im = m.k === 'O' ? IMG['monsters/observador'] : IMG[m.img];
  const bob = Math.sin(now * 2 + m.seed) * (m.k === 'R' ? 0 : 3);
  // Aura: névoa escura com um verde doentio.
  const g = ctx.createRadialGradient(m.x, m.y, 4, m.x, m.y, m.r * 0.7);
  g.addColorStop(0, 'rgba(20,30,10,.35)'); g.addColorStop(1, 'rgba(20,30,10,0)');
  ctx.fillStyle = g; ctx.fillRect(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
  ctx.globalAlpha = m.k === 'O' ? 0.75 + 0.25 * Math.sin(now * 3 + m.seed) : 0.92;
  ctx.save(); ctx.translate(Math.round(m.x), Math.round(m.y + bob));
  if (m.k === 'R' && m.dir < 0) ctx.scale(-1, 1);
  if (m.k === 'R') ctx.drawImage(im, -32, -bottomOf(im));
  else if (m.k === 'O') ctx.drawImage(im, -32, -32);
  else ctx.drawImage(im, -16, -16);
  ctx.restore(); ctx.globalAlpha = 1;
}

function drawFree(f) {
  ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
  if (f.lost) ctx.globalAlpha = 0.35;
  ctx.drawImage(IMG[BOX[f.box.type].img], -12, -12);
  if (f.box.cond === 'quebrada') { ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(6, 4); ctx.moveTo(4, -9); ctx.lineTo(-3, 7); ctx.stroke(); }
  ctx.restore(); ctx.globalAlpha = 1;
  if (f.box.bonus && f.ground && !f.lost) { ctx.fillStyle = 'rgba(242,194,48,' + (0.5 + 0.5 * Math.sin(now * 4)) + ')'; ctx.fillRect(f.x - 2, f.y - 26, 4, 6); }
}

function drawPlayer() {
  const p = L.p;
  let img = IMG['chars/entregador'];
  if (!p.ground) img = IMG['chars/entregador_pulo'];
  else if (p.crouch) img = IMG['chars/entregador_agachado'];
  else if (Math.abs(p.vx) > 20) img = IMG[WALK[Math.floor(p.anim) % 8]];
  ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y));
  ctx.rotate(p.lean * 0.35);
  if (p.face < 0) ctx.scale(-1, 1);
  ctx.drawImage(img, -24, -bottomOf(img));
  ctx.restore();
  // Pilha nas costas, caixa por caixa, cada uma girando sobre a de baixo.
  const base = stackBase();
  const fake = L.acute > 60 ? Math.sin(now * 3) * 0.1 * (L.acute - 60) / 40 : 0;   // balanço visual falso (loucura > 60)
  ctx.save(); ctx.translate(Math.round(base.x), Math.round(base.y)); ctx.rotate(p.lean * 0.35 + fake);
  for (const it of L.stack) {
    ctx.rotate(it.ang);
    ctx.drawImage(IMG[BOX[it.box.type].img], -12, -23);
    if (it.box.cond === 'quebrada') { ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.beginPath(); ctx.moveTo(-8, -19); ctx.lineTo(6, -7); ctx.stroke(); }
    ctx.translate(0, -22);
  }
  ctx.restore();
}

function drawWind(cx) {
  ctx.strokeStyle = 'rgba(220,220,200,.25)';
  for (let i = 0; i < 18; i++) {
    const y = (i * 53 + 20) % 330, x = cx + ((i * 97 + now * 600 * L.gust.dir) % VW + VW) % VW;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 30 * L.gust.dir, y); ctx.stroke();
  }
}

// Efeitos de tela: vinheta e batimento (> 40), aberração cromática (> 80), distorção (Perdido, ≥ 75).
function postFx() {
  const a = L.acute;
  if (S.acc >= 75) {
    fctx.clearRect(0, 0, VW, VH); fctx.drawImage(cv, 0, 0);
    for (let y = 0; y < VH; y += 4) ctx.drawImage(fx, 0, y, VW, 4, Math.sin(now * 2 + y * 0.05) * 2.5, y, VW, 4);
  }
  if (a > 80) {
    fctx.clearRect(0, 0, VW, VH); fctx.drawImage(cv, 0, 0);
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.25;
    ctx.filter = 'sepia(1) saturate(6) hue-rotate(-50deg)'; ctx.drawImage(fx, 3, 0);
    ctx.filter = 'sepia(1) saturate(6) hue-rotate(170deg)'; ctx.drawImage(fx, -3, 0);
    ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  const beat = a > 40 ? 0.08 * Math.max(0, Math.sin(now * (6 + a / 15))) : 0;
  const v = clamp((a - 15) / 85, 0, 1) * 0.85 + beat;
  if (v > 0.01) {
    const g = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.25, VW / 2, VH / 2, VW * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(5,2,2,${v})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  }
  if (S.meter) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(8, 8, 104, 12);
    ctx.fillStyle = '#e0574a'; ctx.fillRect(10, 10, a, 8);
    ctx.font = '12px VT323'; ctx.fillStyle = '#fff'; ctx.fillText(`loucura ${Math.round(a)} · acumulada ${Math.round(S.acc)}`, 116, 18);
  }
  cv.style.filter = S.acc >= 25 ? `saturate(${(1 - Math.min(S.acc, 80) / 110).toFixed(2)})${S.acc >= 75 ? ' contrast(1.1)' : ''}` : '';
}

// ============================================================ relógio de pulso (UI diegética)

function watchUpdate() {
  const w = $('watch');
  if (!keys.has('tab')) { w.classList.add('hidden'); return; }
  w.classList.remove('hidden');
  const bpm = Math.round(68 + L.acute * 0.9);
  const illegible = S.acc >= 75;
  const scr = t => illegible ? t.replace(/[aeiou]/g, () => '#~*'[Math.floor(Math.random() * 3)]) : t;
  w.innerHTML = `<h3>RELÓGIO · ${scr(L.def.bunker.toUpperCase())}</h3>
    <div class="row"><span>${scr('Pedido: ' + L.def.client)}</span></div>
    <div class="row"><span>Caixas na pilha</span><b>${L.stack.length}/${L.order.length}</b></div>
    <div class="row"><span>Créditos</span><b>${S.credits}</b></div>
    <div class="row"><span>Pulso</span><b style="color:${bpm > 120 ? 'var(--red)' : 'var(--ink)'}">${bpm} bpm</b></div>
    <div class="row"><span>Calmantes [C]</span><b>${S.calm}</b></div>
    ${S.meter ? `<div class="meter"><i style="width:${L.acute}%"></i></div>` : ''}
    <small>F interage · Q/E equilibra · S agacha · Esc pausa</small>`;
}

// ============================================================ entrega, mercado e escolha

function market(e) {
  if (e.tag === 'contato') return;   // o contato do Aurum fala na hora da entrega
  pauseWith(`<h2>Mercado paralelo</h2>
    <p>Uma voz por trás do lenço: <i>"Superfície paga melhor que bunker. Em coisa que serve."</i></p>
    <div class="row">${L.stack.map((it, i) => `<button class="btn" data-sell="${i}">Vender ${BOX[it.box.type].name}</button>`).join('') || '<small>Você não tem nada para vender.</small>'}</div>
    <small>Vender paga em escambo (calmantes), aumenta a lealdade à superfície e a suspeita dos bilionários. A caixa vendida falta na entrega.</small>
    <button class="btn" id="back">Voltar à rota</button>`);
  document.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => {
    const it = L.stack.splice(+b.dataset.sell, 1)[0];
    it.box.sold = true;
    S.calm += it.box.type === 'selada' ? 2 : 1; S.loyS++; S.susp++; save();
    const reveal = it.box.type === 'selada' ? '<p>Ele abre o lacre na sua frente: <b>bobinas de propulsão</b>. <i>"Peça de nave. Os bunkers estão construindo uma."</i></p>' : '';
    pauseWith(`<h2>Negócio feito</h2>${reveal}<p>Você recebeu ${it.box.type === 'selada' ? '2 calmantes' : '1 calmante'}.</p><button class="btn go" id="back">Voltar à rota</button>`);
    $('back').onclick = resume;
  });
  $('back').onclick = resume;
}

function arrive() {
  const sealed = L.stack.filter(it => it.box.type === 'selada');
  if (L.def.id === 4 && sealed.length && S.choice == null) {
    // Escolha grande da demo: entregar as peças seladas ou trocar com a superfície.
    pauseWith(`<h2>Bunker Aurum</h2>
      <p>Antes de você tocar o interfone, alguém sai de trás de uma coluna: o contato da superfície.</p>
      <p><i>"Essas caixas seladas são as últimas peças da nave deles. Com elas, a gente abre essa porta por dentro. Troque comigo."</i></p>
      <div class="row"><button class="btn go" id="deliver">Entregar as peças ao Bunker Aurum</button><button class="btn red" id="trade">Trocar com a superfície</button></div>
      <small>Escolha grande: muda a cena final e fica salva.</small>`);
    $('deliver').onclick = () => { S.choice = 'bunker'; S.loyB += 3; save(); deliver(); };
    $('trade').onclick = () => {
      S.choice = 'superficie'; S.loyS += 3; S.susp += 2; S.calm += 2; save();
      for (const it of sealed) it.box.sold = true;
      L.stack = L.stack.filter(it => it.box.type !== 'selada');
      deliver();
    };
    return;
  }
  deliver();
}

function deliver() {
  const delivered = new Set(L.stack.map(s => s.box.id));
  let value = 0, ordered = 0;
  const rows = L.order.map(b => {
    const base = BOX[b.type].base;
    if (!b.bonus) ordered += base;
    const got = delivered.has(b.id) ? base * COND[b.cond] : 0;
    value += got;
    const state = b.sold ? 'vendida' : b.left ? 'ficou no depósito' : !delivered.has(b.id) ? 'perdida' : b.cond;
    return `<div class="row" style="justify-content:space-between;width:520px"><span>${BOX[b.type].name}${b.bonus ? ' (extraviada)' : ''}</span><span>${state}</span><b>${Math.round(got)}</b></div>`;
  }).join('');
  const stars = clamp(Math.round(value / ordered * 5), 1, 5);
  const pay = Math.round(value * (0.6 + 0.1 * stars));
  const missing = L.order.some(b => !delivered.has(b.id) && !b.bonus);
  if (missing) S.susp++;
  const accGain = Math.round(6 + L.acuteTotal * 0.08);
  S.credits += pay; S.acc = Math.min(100, S.acc + accGain);
  const pool = S.acc >= 50 ? CLIENT_LINES.mad : stars >= 4 ? CLIENT_LINES.good : CLIENT_LINES.bad;
  const line = pool[(L.def.id + stars) % pool.length];
  S.diary.push({ fase: L.def.name, cliente: L.def.client, stars, pay });
  S.phase = Math.max(S.phase, L.def.id); save();
  pauseWith(`<h1>Entrega</h1><h2>${L.def.client} · ${L.def.bunker}</h2>
    <div class="panel" style="width:600px">${rows}</div>
    <p><span class="stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span> · pagamento <b>${pay} créditos</b></p>
    <p><i>${line}</i></p>
    <small>Loucura acumulada +${accGain}. Você se sente ${accBand().toLowerCase()}.</small>
    <button class="btn go" id="back">Voltar ao depósito</button>`);
  $('back').onclick = () => { const last = L.def.id === 4; L = null; hideScreen(); if (last) ending(); else hub(); };
}

function pauseWith(html) { showScreen(html); scene = 'paused'; $('prompt').classList.add('hidden'); $('say').classList.add('hidden'); }
function resume() { hideScreen(); scene = 'play'; }

// ============================================================ depósito (hub)

function drawHub() {
  ctx.drawImage(IMG['bg/deposito'], 0, 0, VW, VH);
  if (scene === 'ending' && endingStep >= 1) {
    ctx.drawImage(IMG['chars/colega_sem_capacete'], 420, 230, 72, 96);
    ctx.save(); ctx.translate(340 + 36, 230); ctx.scale(-1, 1); ctx.drawImage(IMG['chars/entregador'], -36, 0, 72, 96); ctx.restore();
  }
  cv.style.filter = S.acc >= 25 ? `saturate(${(1 - Math.min(S.acc, 80) / 110).toFixed(2)})` : '';
}

function hub() {
  scene = 'hub'; L = null; $('say').classList.add('hidden');
  $('watch').classList.add('hidden'); $('prompt').classList.add('hidden');
  const next = LEVELS[S.phase];
  showScreen(`<div class="panel" style="width:1000px">
      <h3>DEPÓSITO 7 · ${S.deaths ? `clones ativados: ${S.deaths + 1}` : 'turno 1'}</h3>
      <div class="row" style="justify-content:space-between"><span>Créditos de bunker <b>${S.credits}</b> · Calmantes <b>${S.calm}</b></span><span>${next ? `Próxima rota: <b>${next.id}. ${next.name}</b>` : ''}</span></div>
    </div>
    <div class="hub" style="width:1000px">
      <button class="btn go" id="h-term">Terminal de pedidos</button>
      <button class="btn" id="h-shop">Loja de equipamento</button>
      <button class="btn" id="h-diary">Diário de entregas</button>
      <button class="btn" id="h-pod">Cápsula</button>
    </div>
    <div class="row"><button class="btn" id="h-meter">Medidor de loucura: ${S.meter ? 'ligado' : 'desligado'}</button><button class="btn" id="h-reset">Recomeçar</button></div>`, true);
  scene = 'hub';
  $('h-term').onclick = terminal; $('h-shop').onclick = shop; $('h-diary').onclick = diary;
  $('h-pod').onclick = () => { scene = 'screen'; showScreen(`<h2>Cápsula de ativação</h2><p>Um tanque de vidro com um líquido verde. Dentro, uma forma humana, encolhida. A placa diz <b>LOTE 44 · PRONTO</b>.</p><small>Ninguém no depósito fala sobre ela.</small><button class="btn" id="back">Voltar</button>`); $('back').onclick = hub; };
  $('h-meter').onclick = () => { S.meter = !S.meter; save(); hub(); };
  $('h-reset').onclick = () => { if (confirm('Apagar o progresso e recomeçar do turno 1?')) { localStorage.removeItem(SAVE_KEY); location.hash = ''; location.reload(); } };
}

function terminal() {
  const lv = LEVELS[S.phase];
  if (!lv) return hub();
  scene = 'screen';
  const pick = lv.order.map(() => true);
  const render = () => {
    const chosen = lv.order.filter((_, i) => pick[i]);
    const wsum = chosen.reduce((s, t) => s + BOX[t].weight, 0);
    showScreen(`<h1>Terminal de pedidos</h1>
      <div class="panel"><h3>ROTA ${lv.id}/4 · ${lv.name.toUpperCase()}</h3>
        <p style="font-size:22px">${lv.place}. Cliente: <b>${lv.client}</b>, ${lv.bunker}.</p></div>
      <div class="panel"><h3>CARGA (máximo 6) · clique para levar ou deixar</h3><div class="boxes">
        ${lv.order.map((t, i) => `<label class="${pick[i] ? 'on' : ''}" data-i="${i}"><img src="${ART + BOX[t].img}.png" alt=""><span>${BOX[t].name} · ${BOX[t].base}<small>${BOX[t].desc} Peso ${BOX[t].weight}.</small></span></label>`).join('')}
      </div><p style="font-size:21px;margin:8px 0 0">Levando ${chosen.length} caixas · peso ${wsum} · velocidade ${Math.round(Math.max(P.minSpeed, P.runSpeed * (1 - P.speedLossPerWeight * wsum)) / P.runSpeed * 100)}% · pulo ${Math.round(Math.max(P.minJump, P.jumpHeight * (1 - P.jumpLossPerWeight * wsum)) / P.jumpHeight * 100)}%</p></div>
      <small>Quanto mais caixas, mais pagamento e mais instabilidade. Caixa deixada para trás conta como faltando.</small>
      <div class="row"><button class="btn go" id="go" ${chosen.length ? '' : 'disabled'}>Sair para a rota</button><button class="btn" id="back">Voltar</button></div>`);
    document.querySelectorAll('[data-i]').forEach(l => l.onclick = () => { pick[+l.dataset.i] = !pick[+l.dataset.i]; render(); });
    $('go').onclick = () => startLevel(lv, lv.order.map((t, i) => [t, i]));
    $('back').onclick = hub;
    // Caixas deixadas para trás continuam no pedido (contam como faltando).
    render.pick = pick;
  };
  render();
  startLevel.pick = () => pick;
}

function startLevel(lv, list) {
  const pick = startLevel.pick ? startLevel.pick() : list.map(() => true);
  const order = list.map(([t]) => newBox(t));
  // Mais pesadas embaixo, frágeis em cima.
  const rank = { pesada: 0, selada: 1, comum: 2, fragil: 3 };
  order.forEach((b, i) => { if (!pick[i]) b.left = true; });
  const carried = order.filter((_, i) => pick[i]).sort((a, b) => rank[a.type] - rank[b.type]);
  hideScreen();
  L = buildLevel(lv, carried);
  L.order = order;
  CAM.x = 0; scene = 'play';
  say(`<b>${lv.name}</b> · ${lv.place}`, 2600);
}

function shop() {
  scene = 'screen';
  showScreen(`<h1>Loja de equipamento</h1><h2>${S.credits} créditos</h2>
    <div class="panel"><div class="shop">
      ${Object.entries(EQUIP).map(([id, e]) => `<button data-eq="${id}" ${S.equip[id] || S.credits < e.price ? 'disabled' : ''}>${e.name} · ${S.equip[id] ? 'comprado' : e.price}<span>${e.desc}</span></button>`).join('')}
      <button data-calm ${S.credits < CALM_PRICE ? 'disabled' : ''}>Calmante (tem ${S.calm}) · ${CALM_PRICE}<span>Consumível [C]: −40 de loucura aguda na hora; o uso frequente aumenta a acumulada</span></button>
    </div></div>
    <button class="btn" id="back">Voltar</button>`);
  document.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => { const id = b.dataset.eq; S.credits -= EQUIP[id].price; S.equip[id] = true; save(); shop(); });
  document.querySelector('[data-calm]').onclick = () => { S.credits -= CALM_PRICE; S.calm++; save(); shop(); };
  $('back').onclick = hub;
}

function diary() {
  scene = 'screen';
  // O diário fica rabiscado e ilegível com a loucura alta.
  const scr = t => S.acc >= 75 ? t.replace(/\S/g, ch => Math.random() < 0.5 ? '░▒#~'[Math.floor(Math.random() * 4)] : ch) : S.acc >= 50 ? t.replace(/[aeo]/g, ch => Math.random() < 0.3 ? '~' : ch) : t;
  showScreen(`<h1>Diário de entregas</h1>
    <div class="panel diary">${S.diary.length ? S.diary.map((d, i) => `<div>${scr(`#${i + 1} · ${d.fase} · ${d.cliente}`)} · <span class="stars">${'★'.repeat(d.stars)}</span> · ${d.pay} créditos</div>`).join('') : '<div>Nenhuma entrega ainda.</div>'}
      <div style="color:var(--dim)">${scr(`Estado: ${accBand()}. Lealdade: bunkers ${S.loyB}, superfície ${S.loyS}. Suspeita: ${S.susp}.`)}</div></div>
    <button class="btn" id="back">Voltar</button>`);
  $('back').onclick = hub;
}

// ============================================================ gancho final

let endingStep = 0;
function ending() {
  scene = 'ending'; endingStep = 0; $('say').classList.add('hidden');
  showScreen(`<p>De volta ao depósito. Os outros entregadores estão na fila, de capacete, como sempre.</p><button class="btn" id="next">…</button>`, true);
  $('next').onclick = () => {
    endingStep = 1;
    showScreen(`<p>Um deles tira o capacete e olha para você.</p><p><b>Ele tem o seu rosto.</b></p><button class="btn" id="next">…</button>`, true);
    $('next').onclick = () => {
      const tail = S.choice === 'superficie'
        ? 'Em algum lugar da superfície, alguém começa a montar uma chave para a porta do Aurum.'
        : 'Lá embaixo, no Bunker Aurum, a última peça da nave encaixa no lugar.';
      scene = 'screen'; S.done = true; save();
      showScreen(`<h1 style="font-size:64px">ÚLTIMA ENTREGA</h1><p>${tail}</p>
        <small>Fim da demo · loucura acumulada ${Math.round(S.acc)} (${accBand()}) · lealdade bunkers ${S.loyB}, superfície ${S.loyS} · clones ativados ${S.deaths + 1}</small>
        <div class="row"><button class="btn go" id="again">Jogar de novo</button></div>`);
      $('again').onclick = () => { localStorage.removeItem(SAVE_KEY); location.hash = ''; location.reload(); };
    };
  };
}

// ============================================================ entrada, laço e início

addEventListener('keydown', ev => {
  const k = ev.key.toLowerCase();
  if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) ev.preventDefault();
  if (!keys.has(k)) pressed.add(k);
  keys.add(k);
  if (k === 'escape' && scene === 'play') { pauseWith(`<h2>Pausa</h2><p>${L.def.name}</p><div class="row"><button class="btn go" id="back">Continuar</button><button class="btn red" id="quit">Abandonar a rota</button></div><small>Abandonar volta ao depósito sem pagamento.</small>`); $('back').onclick = resume; $('quit').onclick = () => { L = null; hub(); }; }
});
addEventListener('keyup', ev => keys.delete(ev.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

let last = performance.now();
function frame(t) {
  const dt = Math.min(0.033, (t - last) / 1000); last = t; now = t / 1000;
  keyLog.push({ t: now, keys: new Set(keys) }); while (keyLog.length > 20) keyLog.shift();
  if (scene === 'play' && L) updatePlay(dt);
  pressed.clear();
  draw();
  requestAnimationFrame(frame);
}

function fit() {
  const s = Math.min(innerWidth / 1280, innerHeight / 720), app = $('app');
  app.style.transform = `scale(${s})`;
  app.style.left = (innerWidth - 1280 * s) / 2 + 'px';
  app.style.top = (innerHeight - 720 * s) / 2 + 'px';
}
addEventListener('resize', fit);
fit();

function intro() {
  scene = 'screen';
  showScreen(`<h1 style="font-size:60px">ÚLTIMA ENTREGA</h1>
    <p>O mundo acabou quando os bilionários trouxeram algo de um asteroide. Eles se trancaram em bunkers.<br>Você entrega o que eles pedem.</p>
    <small>A/D anda · Shift corre · W/Espaço pula · S agacha · Q/E equilibra a pilha · F interage · C calmante · Tab relógio · Esc pausa</small>
    <button class="btn go" id="start">Bater o ponto</button>`);
  $('start').onclick = hub;
}

loadImages().then(() => {
  requestAnimationFrame(frame);
  const f = [...DEV].map(d => /^f(\d)$/.exec(d)).find(Boolean);
  if (f) { S.phase = +f[1] - 1; const lv = LEVELS[S.phase]; startLevel.pick = null; startLevel(lv, lv.order.map((t, i) => [t, i])); }
  else if (S.done) hub();
  else if (DEV.has('go') || S.diary.length || S.phase) hub();
  else intro();
});
