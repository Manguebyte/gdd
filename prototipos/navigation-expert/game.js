// RallySurvive: Navigation Expert — protótipo jogável em JavaScript puro.
// Segue a Parte 3 do RallySurvive.md (variante) sobre o Core (Parte 1, em ../rally-core/rally-core.js):
// mapa aberto com checkpoints em ordem, sem "sair da pista" e sem penalidade além do relógio; minimapa no
// canto inferior com o próximo checkpoint; seta direcional por 1,5 s após cada checkpoint, que volta por
// 1,5 s se o jogador passar ~8 s sem se aproximar do próximo. Arte: Sprites/NavigationExpert/ (PixelLab).
'use strict';

const ART = '../../Sprites/NavigationExpert/';
const S = RC.store('navigation-expert-save-v1');
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { S.data.boards = {}; S.save(); }

const HOLD_MS = 1500;
const ARROW_TIME = 1.5;          // Parte 3 §Guia direcional — timing
const NO_PROGRESS_TIME = 8;      // "~8 s sem progresso na direção certa"
const CP_RADIUS = 2.2;

// ============================================================ chão (grip do Core §3 por terreno)
// Estrada de terra = grip cheio. Fora dela o mapa é livre (não há "sair da pista"), mas o pasto agarra
// menos e a lagoa menos ainda: é isso que faz a rota pela estrada valer a pena e o atalho ser uma aposta.
const GROUND = {
  estrada: { grip: 1.0, cap: 1.0, dust: 'rgba(170,120,70,' },
  pasto: { grip: 0.55, cap: 0.82, dust: 'rgba(110,150,60,' },
  lagoa: { grip: 0.3, cap: 0.45, dust: 'rgba(150,200,255,' },
};
const ROAD_W = 3.4;

// ============================================================ o mapa: Vale Verde (180 × 130 unidades)

const WORLD = { w: 180, h: 130 };
const ROADS = [
  [[-4, 64], [22, 60], [40, 66], [58, 62], [76, 68], [96, 63], [116, 67], [136, 60], [156, 64], [184, 62]],
  [[96, 63], [92, 46], [98, 30], [90, 14], [96, -4]],
  [[22, 60], [18, 42], [28, 26], [48, 18], [70, 22], [90, 14]],
  [[116, 67], [124, 48], [140, 36], [160, 30], [170, 46], [156, 64]],
  [[96, 63], [100, 82], [92, 100], [98, 134]],
  [[40, 66], [34, 84], [22, 100], [36, 116], [62, 114], [92, 100]],
  [[136, 60], [142, 82], [160, 96], [150, 114], [124, 118], [98, 112]],
].map(p => RC.smoothPath(p));
const PONDS = [{ x: 121, y: 88, r: 4.2 }, { x: 62, y: 88, r: 4.6 }, { x: 150, y: 50, r: 3.4 }, { x: 70, y: 36, r: 3 }];

// Percursos (Em aberto no GDD: quantos mapas/checkpoints — aqui 1 mapa com 3 percursos de tamanhos diferentes).
const ROUTES = [
  { id: 'curto', name: 'Pasto Curto', sub: '6 checkpoints · aquecimento', start: [6, 63, 0],
    cps: [[40, 66], [19, 42], [48, 18], [90, 15], [93, 46], [117, 66]] },
  { id: 'medio', name: 'Rota das Fazendas', sub: '8 checkpoints · lagoas no caminho', start: [6, 63, 0],
    cps: [[34, 84], [36, 116], [62, 114], [92, 100], [124, 118], [160, 96], [142, 82], [117, 66]] },
  { id: 'longo', name: 'Volta ao Vale', sub: '11 checkpoints · o mapa inteiro', start: [6, 63, 0],
    cps: [[28, 26], [70, 22], [96, 6], [98, 30], [124, 48], [160, 30], [170, 46], [150, 114], [124, 118], [62, 114], [22, 100]] },
];

// Objetos: tamanho na tela (escala sobre a arte de 128 px a 0,6) e colisor no pé.
const PROPS = {
  oak: { s: 1.9, r: 0.5 }, pine: { s: 1.9, r: 0.45 }, boulders: { s: 1.3, r: 0.85 }, hay: { s: 1.1, r: 0.7 },
  bush: { s: 0.9 }, cow: { s: 1.0, r: 0.55 }, windpump: { s: 1.7, r: 0.35 },
  barn: { s: 1.7, rect: [4.4, 2.2] }, farmhouse: { s: 1.8, rect: [3.6, 1.9] }, fence: { s: 1.3, rect: [2.5, 0.3] },
};

function roadDist(x, y) { let d = Infinity; for (const r of ROADS) d = Math.min(d, RC.nearest(r, x, y).dist); return d; }
function groundAt(x, y) {
  if (PONDS.some(p => Math.hypot(x - p.x, y - p.y) < p.r * 0.85)) return 'lagoa';
  return roadDist(x, y) < ROAD_W / 2 ? 'estrada' : 'pasto';
}

function buildWorld() {
  const rng = RC.mulberry32(20261014);
  const things = [], blockers = [];
  const allCps = ROUTES.flatMap(r => r.cps);
  const free = (x, y, m) => x > 1 && y > 1 && x < WORLD.w - 1 && y < WORLD.h - 1 && roadDist(x, y) > ROAD_W / 2 + m &&
    !PONDS.some(p => Math.hypot(x - p.x, y - p.y) < p.r + m) && !allCps.some(c => Math.hypot(x - c[0], y - c[1]) < CP_RADIUS + 2.5) &&
    !things.some(t => Math.hypot(x - t.x, y - t.y) < (t.gap || 1) + m * 0.5);
  const add = (key, x, y, opt = {}) => {
    const p = PROPS[key], t = { key, x, y, s: p.s * (opt.s || 1), flip: opt.flip, gap: p.rect ? p.rect[0] * 0.7 : (p.r || 0.4) + 0.6 };
    things.push(t);
    if (p.r) blockers.push({ x, y: y - 0.1, r: p.r * (opt.s || 1) });
    if (p.rect) blockers.push({ x: x - p.rect[0] / 2, y: y - p.rect[1], w: p.rect[0], h: p.rect[1] });
    return t;
  };
  // Fazendas: casa, celeiro, cata-vento, feno, cerca e vacas.
  for (const [fx, fy] of [[60, 47], [126, 100], [150, 16]]) {
    add('farmhouse', fx, fy); add('barn', fx + 8, fy + 1.5); add('windpump', fx - 5, fy - 2.5);
    for (let i = 0; i < 3; i++) add('hay', fx + 3 + i * 2.2, fy + 4.5, { s: 0.9 + rng() * 0.2 });
    for (let i = 0; i < 5; i++) add('fence', fx - 6 + i * 3.2, fy + 7.5);
    for (let i = 0; i < 3; i++) { const x = fx - 4 + rng() * 14, y = fy + 9.5 + rng() * 3; if (free(x, y, 1)) add('cow', x, y, { flip: rng() < 0.5 }); }
  }
  // Matas: aglomerados de árvores (as bordas do mapa são mata fechada — é o "muro" do mapa aberto).
  const woods = [[8, 10, 20], [172, 10, 18], [8, 124, 16], [174, 124, 16], [130, 12, 9], [46, 40, 6], [78, 90, 6], [108, 40, 6], [168, 80, 7], [10, 84, 8]];
  for (const [cx, cy, r] of woods) for (let i = 0; i < r * r * 0.6; i++) {
    const a = rng() * Math.PI * 2, d = Math.sqrt(rng()) * r, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    if (free(x, y, 0.8)) add(rng() < 0.55 ? 'pine' : 'oak', x, y, { s: 0.85 + rng() * 0.3, flip: rng() < 0.5 });
  }
  for (let x = 1; x < WORLD.w; x += 2.4) for (const y of [0.5, WORLD.h - 0.2]) if (free(x, y, 0.2)) add('pine', x, y, { s: 0.9 + rng() * 0.2 });
  for (let y = 2; y < WORLD.h; y += 2.4) for (const x of [0.5, WORLD.w - 0.5]) if (free(x, y, 0.2)) add('pine', x, y, { s: 0.9 + rng() * 0.2 });
  // Espalhados pelo pasto.
  for (let i = 0; i < 1500; i++) {
    const x = rng() * WORLD.w, y = rng() * WORLD.h, k = rng();
    const key = k < 0.45 ? 'bush' : k < 0.65 ? 'boulders' : k < 0.8 ? 'oak' : k < 0.9 ? 'hay' : 'pine';
    if (free(x, y, 1)) add(key, x, y, { s: 0.8 + rng() * 0.35, flip: rng() < 0.5 });
  }
  // Paredes invisíveis fora do mapa.
  blockers.push({ x: -10, y: -10, w: WORLD.w + 20, h: 10 }, { x: -10, y: WORLD.h, w: WORLD.w + 20, h: 10 }, { x: -10, y: 0, w: 10, h: WORLD.h }, { x: WORLD.w, y: 0, w: 10, h: WORLD.h });
  return { things, blockers };
}

// ============================================================ estado

const sc = RC.screen(), g = sc.g;
const $ = id => document.getElementById(id);
let mode = 'menu', selected = 0, world, carImgs;
let route, car, cam, timer, started, finished, cpIdx, arrowT, bestDist, lastProgress, particles = [], skids = [];

function startRace(i) {
  route = ROUTES[i]; selected = i;
  const [x, y, a] = route.start;
  car = { x, y, vx: 0, vy: 0, ang: a, target: 0, actual: 0, ground: 'estrada' };
  cam = { x, y, z: RC.PPU };
  timer = 0; started = false; finished = false; cpIdx = 0; arrowT = 0; bestDist = Infinity; lastProgress = 0;
  particles = []; skids = [];
  sc.mouse.has = false; sc.active = true; mode = 'race';
  $('menu').classList.add('hidden'); RC.hideDialog(); $('hud').classList.remove('hidden');
  const best = S.board(route.id)[0];
  $('best').textContent = best ? `Recorde: ${RC.fmt(best.t)} (${best.name})` : 'Sem recorde ainda';
}

function step(dt) {
  if (mode !== 'race' || finished || !sc.mouse.has) return;
  car.ground = groundAt(car.x, car.y);
  const gr = GROUND[car.ground];
  RC.drive(car, sc.toWorld(cam, sc.mouse.x, sc.mouse.y), dt, RC.CAR, gr.grip, gr.cap);
  if (RC.collide(car, world.blockers)) cam.shake = 0.25;
  if (!started && car.actual > 0.02) { started = true; arrowT = ARROW_TIME; }   // cronômetro começa ao sair do grid
  if (!started) return;
  timer += dt;
  arrowT = Math.max(0, arrowT - dt);
  // Checkpoint: passar dentro do raio do próximo, na ordem.
  const cp = route.cps[cpIdx], d = Math.hypot(car.x - cp[0], car.y - cp[1]);
  if (d < CP_RADIUS) {
    cpIdx++; arrowT = ARROW_TIME; bestDist = Infinity; lastProgress = timer;
    if (cpIdx >= route.cps.length) return finish();
  } else if (d < bestDist - 1) { bestDist = d; lastProgress = timer; }
  else if (timer - lastProgress > NO_PROGRESS_TIME) { arrowT = ARROW_TIME; lastProgress = timer; }   // assistência extra
  RC.emitDust(particles, car, gr.dust);
  const sp = Math.hypot(car.vx, car.vy);
  if (sp > 1.5 && Math.abs(Math.sin(Math.atan2(car.vy, car.vx) - car.ang)) > 0.35 && Math.random() < 0.5) skids.push({ x: car.x, y: car.y + 0.2, a: car.ang, t: 0 });
  if (skids.length > 400) skids.splice(0, skids.length - 400);
}

function finish() {
  finished = true;
  const list = S.board(route.id), pb = list.length ? list[0].t : Infinity;
  RC.finishDialog({
    time: timer, lastName: S.data.lastName || '',
    lines: [route.name, timer < pb ? (pb === Infinity ? 'Primeiro tempo neste percurso' : `Novo recorde! (antes ${RC.fmt(pb)})`) : `Recorde: ${RC.fmt(pb)}`],
    onSave: name => { S.data.lastName = name; S.submit(route.id, name, timer); },
    act,
  });
}

function act(a) {
  if (a === 'retry') return startRace(selected);
  if (a === 'menu') return showMenu();
}

// ============================================================ menu

function showMenu() {
  mode = 'menu'; sc.active = false;
  $('hud').classList.add('hidden'); RC.hideDialog(); $('menu').classList.remove('hidden');
  const box = $('tracks'); box.innerHTML = '';
  ROUTES.forEach((r, i) => {
    const b = document.createElement('button');
    b.className = 'track' + (i === selected ? ' sel' : '');
    b.innerHTML = `${r.name}<small>${r.sub}</small><i class="hold"></i>`;
    RC.holdButton(b, HOLD_MS, () => { selected = i; renderBoard(); document.querySelectorAll('.track').forEach((x, j) => x.classList.toggle('sel', j === i)); }, () => startRace(i));
    box.appendChild(b);
  });
  renderBoard();
}
function renderBoard() { $('board').innerHTML = RC.boardHtml(`Ranking — ${ROUTES[selected].name}`, S.board(ROUTES[selected].id)); }

// ============================================================ desenho

let patGrass, patDirt;
function drawGround(v) {
  g.fillStyle = patGrass || '#6fae4a'; g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
  g.lineJoin = g.lineCap = 'round';
  for (const r of ROADS) { RC.strokePath(g, r); g.strokeStyle = 'rgba(60,40,20,.35)'; g.lineWidth = ROAD_W + 0.5; g.stroke(); }
  for (const r of ROADS) { RC.strokePath(g, r); g.strokeStyle = patDirt || '#b98a55'; g.lineWidth = ROAD_W; g.stroke(); }
  for (const p of PONDS) if (RC.inView(v, p.x, p.y, p.r * 2)) RC.drawFlat(g, 'pond', p.x, p.y, p.r * 2.6 / (160 * RC.ART / RC.PPU));
  for (const s of skids) if (RC.inView(v, s.x, s.y)) {
    g.save(); g.translate(s.x, s.y); g.rotate(s.a); g.fillStyle = 'rgba(50,35,20,.18)'; g.fillRect(-0.3, -0.35, 0.6, 0.12); g.fillRect(-0.3, 0.23, 0.6, 0.12); g.restore();
  }
}

// Anel do próximo checkpoint no chão (pulsando) e o seguinte, apagado, para dar a ideia de rota.
function drawCpRings(now) {
  for (let k = 1; k >= 0; k--) {
    const cp = route.cps[cpIdx + k]; if (!cp) continue;
    const pulse = k ? 0 : Math.sin(now / 160) * 0.15;
    g.save(); g.globalAlpha = k ? 0.35 : 0.9;
    g.strokeStyle = '#1b1d24'; g.lineWidth = 0.32; g.beginPath(); g.ellipse(cp[0], cp[1], CP_RADIUS + pulse, (CP_RADIUS + pulse) * 0.7, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = k ? '#ffffff' : '#ffd23f'; g.lineWidth = 0.18; g.stroke();
    g.restore();
  }
}

function drawScene(v, now) {
  // Objetos em pé e carro, ordenados pelo pé (y): quem está mais embaixo na tela fica na frente.
  const list = [];
  for (const t of world.things) if (RC.inView(v, t.x, t.y, 4)) list.push(t);
  if (mode === 'race') {
    for (let k = 0; k < 2; k++) { const cp = route.cps[cpIdx + k]; if (cp) list.push({ cp: true, x: cp[0], y: cp[1] - 0.3, next: k === 0 }); }
    list.push({ car: true, y: car.y });
  }
  list.sort((a, b) => a.y - b.y);
  for (const t of list) {
    if (t.car) RC.drawCar(g, carImgs, car.x, car.y, car.ang);
    else if (t.cp) RC.drawProp(g, 'checkpoint', t.x, t.y, 2.2, { alpha: t.next ? 1 : 0.45, shadowW: 0.4 });
    else RC.drawProp(g, t.key, t.x, t.y, t.s, { flip: t.flip });
  }
}

function drawMinimap(now) {
  const w = Math.min(240, sc.W * 0.32), h = w * WORLD.h / WORLD.w;
  RC.drawMinimap(g, sc.W - w - 22, sc.H - h - 22, w, h, WORLD, (m, s) => {
    m.fillStyle = '#4c7d38'; m.fillRect(0, 0, WORLD.w, WORLD.h);
    m.lineJoin = m.lineCap = 'round'; m.strokeStyle = '#d9b27c'; m.lineWidth = 2.6;
    for (const r of ROADS) { RC.strokePath(m, r); m.stroke(); }
    m.fillStyle = '#5aa0e0'; for (const p of PONDS) { m.beginPath(); m.arc(p.x, p.y, p.r, 0, Math.PI * 2); m.fill(); }
    // Só o próximo checkpoint (Parte 3 §Navegação), piscando.
    const cp = route.cps[cpIdx];
    if (cp) { m.fillStyle = Math.floor(now / 300) % 2 ? '#ffd23f' : '#ff8a1f'; m.beginPath(); m.arc(cp[0], cp[1], 4 / s * 1.4, 0, Math.PI * 2); m.fill(); m.strokeStyle = '#1b1d24'; m.lineWidth = 1.5 / s; m.stroke(); }
    m.save(); m.translate(car.x, car.y); m.rotate(car.ang); m.fillStyle = '#fff'; m.strokeStyle = '#1b1d24'; m.lineWidth = 1.2 / s;
    m.beginPath(); m.moveTo(6 / s, 0); m.lineTo(-4 / s, 4 / s); m.lineTo(-4 / s, -4 / s); m.closePath(); m.fill(); m.stroke(); m.restore();
  });
}

function drawMenuBg() {
  const z = Math.max(sc.W / WORLD.w, sc.H / WORLD.h) * 1.05;
  const t = performance.now() / 1000;
  const v = sc.begin({ x: WORLD.w / 2 + Math.sin(t * 0.05) * 20, y: WORLD.h / 2, z });
  drawGround(v); drawScene(v, 0); sc.end();
  g.fillStyle = 'rgba(20,24,34,.45)'; g.fillRect(0, 0, sc.W, sc.H);
}

// ============================================================ laço

let last = 0, acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
  g.setTransform(sc.DPR, 0, 0, sc.DPR, 0, 0);
  if (mode === 'menu') drawMenuBg();
  else {
    acc += dt; while (acc >= RC.FIXED) { step(RC.FIXED); acc -= RC.FIXED; }
    cam.x += (car.x - cam.x) * Math.min(1, dt * 6); cam.y += (car.y - cam.y) * Math.min(1, dt * 6);
    const v = sc.begin(cam);
    drawGround(v);
    drawCpRings(now);
    RC.drawParticles(g, particles, dt);
    if (sc.mouse.has && !finished) RC.drawChevrons(g, car, sc.toWorld(cam, sc.mouse.x, sc.mouse.y));
    drawScene(v, now);
    sc.end();
    // Seta direcional temporária (Parte 3): aponta o próximo checkpoint e some.
    const cp = route.cps[cpIdx];
    if (cp && arrowT > 0 && !finished) {
      const p = sc.toScreen(cam, car.x, car.y);
      RC.drawGuideArrow(g, p.x, p.y, Math.atan2(cp[1] - car.y, cp[0] - car.x), Math.min(1, arrowT / 0.3));
    }
    drawMinimap(now);
    $('time').textContent = RC.fmt(timer);
    $('cp').textContent = `${cpIdx}/${route.cps.length}`;
    $('speed').style.width = `${car.actual * 100}%`;
    $('ground').textContent = car.ground;
    if (!started) {
      g.font = '700 22px "Pixelify Sans", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 4;
      const msg = sc.mouse.has ? 'Afaste o cursor do carro para acelerar' : 'Mova o mouse (ou arraste o dedo) para pilotar';
      g.strokeText(msg, sc.W / 2, sc.H - 40); g.fillText(msg, sc.W / 2, sc.H - 40);
    }
  }
  requestAnimationFrame(frame);
}

addEventListener('keydown', e => {
  if (mode !== 'race') return;
  if (e.key === 'Escape') act('menu');
  if ((e.key === 'r' || e.key === 'R') && (finished || e.shiftKey)) act('retry');
});

async function boot() {
  const keys = [...RC.dirKeys('car'), 'checkpoint', 'pond', 'tiles/grass', 'tiles/dirt', ...Object.keys(PROPS)];
  await RC.loadImages(ART, keys);
  carImgs = RC.carSet('car');
  patGrass = RC.pattern(g, 'tiles/grass'); patDirt = RC.pattern(g, 'tiles/dirt');
  world = buildWorld();
  const start = ROUTES.findIndex(r => DEV.has(r.id));
  if (start >= 0) startRace(start); else showMenu();
  requestAnimationFrame(frame);
}
boot();
