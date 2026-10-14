// Street Legends — protótipo jogável em JavaScript puro.
// Segue a Parte 5 do RallySurvive.md (variante) sobre o Core (Parte 1, em ../rally-core/rally-core.js):
// corrida de rua à noite com rota aberta de checkpoints (minimapa + seta de 1,5 s, igual ao Navigation
// Expert); polícia que escala com o tempo de corrida e "pega" o jogador se ficar dentro de um raio por um
// tempo seguido (corrida termina, ESC/R); garagem permanente com moeda, upgrades de desempenho e visual,
// e desbloqueios por marcos. Solo (o multiplayer fica para depois do MVP). Arte: Sprites/StreetLegends/.
'use strict';

const ART = '../../Sprites/StreetLegends/';
const S = RC.store('street-legends-save-v1');
const D = S.data;
D.money = D.money ?? 0; D.up = D.up || { motor: 0, susp: 0, freio: 0 }; D.paint = D.paint || 'roxo'; D.glow = D.glow || 'nenhum';
D.owned = D.owned || ['roxo', 'nenhum']; D.stats = D.stats || { races: 0, done: {}, maxWanted: 0 };
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { localStorage.removeItem('street-legends-save-v1'); location.hash = ''; location.reload(); }
if (DEV.has('rico')) { D.money = 5000; }

const HOLD_MS = 1500;
const ARROW_TIME = 1.5, NO_PROGRESS_TIME = 8, CP_RADIUS = 2.4;   // herdados do Navigation Expert (Parte 5 §Estrutura)

// ============================================================ polícia (Parte 5 §Mecânica de Polícia)
// "Em aberto para prototipagem": curva de escalonamento e IA. Escolhas daqui: 1ª viatura aos 8 s, +1 a
// cada 25 s (máx. 6); as viaturas andam pelas ruas até chegarem perto, e aí vão direto no jogador.
const POLICE = { radius: 3, catchTime: 2, first: 8, every: 25, max: 6, chaseDist: 13, loseDist: 20 };
if (DEV.has('sempolicia')) POLICE.max = 0;

// ============================================================ cidade: grade de quarteirões

const BLOCK = 16, ROAD = 5, STEP = BLOCK + ROAD, COLS = 9, ROWS = 7;
const WORLD = { w: COLS * STEP + ROAD, h: ROWS * STEP + ROAD };
const gx = i => ROAD / 2 + i * STEP;   // centro da rua vertical i (0..COLS)
const gy = j => ROAD / 2 + j * STEP;   // centro da rua horizontal j (0..ROWS)
const at = ([i, j]) => [gx(i), gy(j)];
const PARKS = new Set(['2,3', '6,1', '4,5', '8,6']);
const SIDEWALK = 1.3;

const ROUTES = [
  { id: 'avenida', name: 'Avenida', sub: '5 checkpoints · aquecimento', par: 45, start: [0.12, 3, 0], cps: [[3, 3], [3.5, 1], [6, 1.5], [8, 3], [9, 4.5]] },
  { id: 'centro', name: 'Centro', sub: '7 checkpoints · cruzamentos', par: 65, start: [0.12, 3, 0], cps: [[2, 3], [2, 5.5], [5, 6], [6.5, 4], [5, 2], [7, 0.5], [9, 2]] },
  { id: 'porto', name: 'Porto', sub: '10 checkpoints · a cidade toda', par: 95, start: [0.12, 3, 0], cps: [[1, 6], [3.5, 7], [6, 6.5], [8, 7], [9, 5.5], [7.5, 4], [8, 1], [5, 0], [2.5, 1], [0, 2]] },
];

// ============================================================ garagem (Parte 5 §Carros Modificados)
// Desempenho: 3 categorias × 3 níveis, mudam o CarController de vez. Visual: pintura e neon, só estética.
// Desbloqueios por marco (Em aberto no GDD; aqui: nível 2 após 2 corridas, nível 3 após terminar o Porto).
const PARTS = {
  motor: { name: 'Motor / turbo', fx: 'velocidade máxima +7% por nível', cost: [150, 320, 650] },
  susp: { name: 'Suspensão', fx: 'aderência e resposta +15% por nível', cost: [120, 280, 560] },
  freio: { name: 'Freios', fx: 'frenagem +30% por nível', cost: [100, 240, 500] },
};
const LOCKS = [null, { need: () => D.stats.races >= 2, txt: 'termine 2 corridas' }, { need: () => !!D.stats.done.porto, txt: 'termine a rota Porto' }];
const PAINTS = [
  { id: 'roxo', name: 'Roxo', hue: 280, css: '#7d3fc4' }, { id: 'vermelho', name: 'Vermelho', hue: 0, css: '#d23a3a', cost: 80 },
  { id: 'laranja', name: 'Laranja', hue: 26, css: '#ec7a22', cost: 80 }, { id: 'amarelo', name: 'Amarelo', hue: 50, css: '#e8c22a', cost: 80 },
  { id: 'azul', name: 'Azul', hue: 212, css: '#2f6ee0', cost: 80 }, { id: 'verde', name: 'Verde', hue: 140, css: '#2fae5a', cost: 120, need: () => D.stats.races >= 3, txt: '3 corridas' },
  { id: 'preto', name: 'Preto', hue: 280, sat: 0.15, light: -0.22, css: '#26262c', cost: 200, need: () => D.stats.maxWanted >= 3, txt: 'fuja de 3 viaturas' },
];
const GLOWS = [
  { id: 'nenhum', name: 'Sem neon', css: '#555' }, { id: 'ciano', name: 'Ciano', color: '63,240,224', css: '#3ff0e0', cost: 150 },
  { id: 'magenta', name: 'Magenta', color: '240,70,220', css: '#f046dc', cost: 150 }, { id: 'verde', name: 'Verde', color: '90,255,90', css: '#5aff5a', cost: 180, need: () => D.stats.races >= 4, txt: '4 corridas' },
];

function carParams() {
  return {
    ...RC.CAR,
    maxSpeed: RC.CAR.maxSpeed * (1 + 0.07 * D.up.motor),
    steeringResponsiveness: RC.CAR.steeringResponsiveness * (1 + 0.15 * D.up.susp),
    brakeResponse: RC.CAR.steeringResponsiveness * (1 + 0.3 * D.up.freio),
  };
}

// ============================================================ mundo

function buildWorld() {
  const rng = RC.mulberry32(9090);
  const buildings = [], parks = [], props = [], blockers = [], parked = [], lamps = [];
  const PAL = ['#5b5f73', '#6e5a52', '#4d6470', '#6a6a5a', '#584c6c', '#4f5d4f'];
  const signs = ['#f046dc', '#3ff0e0', '#ffd23f', '#ff5a5a', '#5aff5a'];
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
    const x0 = gx(i) + ROAD / 2, y0 = gy(j) + ROAD / 2, x1 = x0 + BLOCK, y1 = y0 + BLOCK;
    if (PARKS.has(`${i},${j}`)) {
      parks.push({ x: x0, y: y0, w: BLOCK, h: BLOCK });
      for (let k = 0; k < 9; k++) { const x = x0 + 2 + rng() * (BLOCK - 4), y = y0 + 3 + rng() * (BLOCK - 4); props.push({ key: 'citytree', x, y, s: 1 }); blockers.push({ x, y: y - 0.1, r: 0.5 }); }
      continue;
    }
    // Quarteirão dividido em 1 ou 2 prédios (cada um com telhado + fachada iluminada).
    const split = rng() < 0.55, inner = { x: x0 + SIDEWALK, y: y0 + SIDEWALK, w: BLOCK - SIDEWALK * 2, h: BLOCK - SIDEWALK * 2 };
    const parts = split ? (rng() < 0.5
      ? [{ ...inner, w: inner.w / 2 - 0.3 }, { ...inner, x: inner.x + inner.w / 2 + 0.3, w: inner.w / 2 - 0.3 }]
      : [{ ...inner, h: inner.h / 2 - 0.3 }, { ...inner, y: inner.y + inner.h / 2 + 0.3, h: inner.h / 2 - 0.3 }]) : [inner];
    for (const b of parts) {
      b.color = PAL[Math.floor(rng() * PAL.length)];
      b.face = Math.min(2.6, b.h * 0.3);
      b.sign = rng() < 0.45 ? { color: signs[Math.floor(rng() * signs.length)], x: 0.2 + rng() * 0.5 } : null;
      b.roof = [];
      for (let k = 0; k < 1 + Math.floor(rng() * 3); k++) b.roof.push({ key: rng() < 0.6 ? 'roof_ac' : 'roof_tank', x: b.x + 1.2 + rng() * (b.w - 2.4), y: b.y + 1.2 + rng() * (b.h - b.face - 2.4) });
      b.windows = [];
      for (let wx = b.x + 0.6; wx < b.x + b.w - 0.8; wx += 1.1) for (let wy = 0; wy < 2; wy++) if (rng() < 0.55) b.windows.push([wx, b.y + b.h - b.face + 0.45 + wy * 1.0]);
      buildings.push(b); blockers.push({ x: b.x, y: b.y, w: b.w, h: b.h });
    }
    // Calçada: postes nos cantos, lixeiras e árvores soltas.
    for (const [cx, cy] of [[x0 + 0.6, y0 + 0.6], [x1 - 0.6, y1 - 0.6]]) { props.push({ key: 'streetlamp', x: cx, y: cy, s: 1.3 }); lamps.push({ x: cx, y: cy - 2.4 }); blockers.push({ x: cx, y: cy - 0.05, r: 0.2 }); }
    if (rng() < 0.4) { const x = x0 + 3 + rng() * (BLOCK - 6), y = y1 - 0.5; props.push({ key: 'dumpster', x, y, s: 0.8 }); blockers.push({ x, y: y - 0.1, r: 0.55 }); }
    if (rng() < 0.4) { const x = x0 + 3 + rng() * (BLOCK - 6), y = y1 - 0.5; props.push({ key: 'citytree', x, y, s: 0.75 }); blockers.push({ x, y: y - 0.1, r: 0.4 }); }
  }
  // Carros estacionados junto ao meio-fio e obras na rua (obstáculos).
  const allCps = ROUTES.flatMap(r => [r.cps, [r.start]].flat()).map(at);
  const nearCp = (x, y) => allCps.some(([cx, cy]) => Math.hypot(cx - x, cy - y) < 7);
  for (let k = 0; k < 70; k++) {
    const horiz = rng() < 0.5, i = Math.floor(rng() * (horiz ? COLS : COLS + 1)), j = Math.floor(rng() * (horiz ? ROWS + 1 : ROWS));
    const t = 0.2 + rng() * 0.6, side = rng() < 0.5 ? -1 : 1;
    const x = horiz ? gx(i) + ROAD / 2 + t * BLOCK : gx(i) + side * 1.6, y = horiz ? gy(j) + side * 1.6 : gy(j) + ROAD / 2 + t * BLOCK;
    if (nearCp(x, y) || parked.some(p => Math.hypot(p.x - x, p.y - y) < 3)) continue;
    if (rng() < 0.18) { props.push({ key: 'barrier', x, y: y + 0.3, s: 0.9 }); blockers.push({ x: x - 0.9, y: y - 0.1, w: 1.8, h: 0.5 }); continue; }
    const ang = horiz ? (side > 0 ? 0 : Math.PI) : (side > 0 ? Math.PI / 2 : -Math.PI / 2);
    parked.push({ x, y, ang, set: Math.floor(rng() * 4) });
    blockers.push(horiz ? { x: x - 0.75, y: y - 0.45, w: 1.5, h: 0.9 } : { x: x - 0.45, y: y - 0.75, w: 0.9, h: 1.5 });
  }
  blockers.push({ x: -10, y: -10, w: WORLD.w + 20, h: 10 }, { x: -10, y: WORLD.h, w: WORLD.w + 20, h: 10 }, { x: -10, y: 0, w: 10, h: WORLD.h }, { x: WORLD.w, y: 0, w: 10, h: WORLD.h });
  return { buildings, parks, props, blockers, parked, lamps };
}

function groundAt(x, y) {
  for (const p of world.parks) if (x > p.x && x < p.x + p.w && y > p.y && y < p.y + p.h) return { grip: 0.5, cap: 0.7, dust: 'rgba(90,140,60,' };
  const ox = ((x - ROAD) % STEP + STEP) % STEP, oy = ((y - ROAD) % STEP + STEP) % STEP;
  const onSidewalk = ox < BLOCK && oy < BLOCK;   // dentro do quarteirão (calçada: o prédio já bloqueia o resto)
  return onSidewalk ? { grip: 0.85, cap: 0.9, dust: 'rgba(160,160,170,' } : { grip: 1, cap: 1, dust: 'rgba(120,120,130,' };
}

// ============================================================ estado

const sc = RC.screen(), g = sc.g;
const $ = id => document.getElementById(id);
let mode = 'menu', selected = 0, world;
let route, car, cam, timer, started, finished, caught, cpIdx, arrowT, bestDist, lastProgress, police, spawnN, catchT, particles = [], skids = [];
const SETS = {};

function playerSet() {
  const key = `paint-${D.paint}`;
  if (!SETS[key]) { const p = PAINTS.find(x => x.id === D.paint); SETS[key] = p.id === 'roxo' ? RC.carSet('tuner') : RC.carSet('tuner', im => RC.recolor(im, 280, p.hue, 45, p.sat ?? 1, p.light ?? 0)); }
  return SETS[key];
}

function startRace(i) {
  route = ROUTES[i]; selected = i;
  const [sx, sy, a] = route.start, [x, y] = at([sx, sy]);
  car = { x, y, vx: 0, vy: 0, ang: a, target: 0, actual: 0 };
  car.p = carParams();
  cam = { x, y, z: RC.PPU };
  timer = 0; started = false; finished = false; caught = false; cpIdx = 0; arrowT = 0; bestDist = Infinity; lastProgress = 0;
  police = []; spawnN = 0; catchT = 0; particles = []; skids = [];
  sc.mouse.has = false; sc.active = true; mode = 'race';
  $('menu').classList.add('hidden'); RC.hideDialog(); $('hud').classList.remove('hidden');
  const best = S.board(route.id)[0];
  $('best').textContent = best ? `Recorde: ${RC.fmt(best.t)} (${best.name})` : 'Sem recorde ainda';
}

// ------------------------------------------------------------ polícia

function spawnPolice() {
  // Num cruzamento longe do jogador (fora da tela), de preferência entre 35 e 70 unidades.
  const nodes = [];
  for (let i = 0; i <= COLS; i++) for (let j = 0; j <= ROWS; j++) nodes.push([i, j, Math.hypot(gx(i) - car.x, gy(j) - car.y)]);
  const ok = nodes.filter(n => n[2] > 35 && n[2] < 70);
  const n = ok.length ? ok[Math.floor(Math.random() * ok.length)] : nodes.sort((a, b) => b[2] - a[2])[0];
  police.push({ x: gx(n[0]), y: gy(n[1]), vx: 0, vy: 0, ang: 0, target: 0, actual: 0, node: [n[0], n[1]], chase: false,
    p: { ...RC.CAR, maxSpeed: 7.2 + 0.2 * Math.min(4, police.length) } });
}

function nearestNode(x, y) { return [Math.max(0, Math.min(COLS, Math.round((x - ROAD / 2) / STEP))), Math.max(0, Math.min(ROWS, Math.round((y - ROAD / 2) / STEP)))]; }

function policeAim(c) {
  const d = Math.hypot(car.x - c.x, car.y - c.y);
  if (!c.chase && d < POLICE.chaseDist) c.chase = true;
  if (c.chase && d > POLICE.loseDist) { c.chase = false; c.node = nearestNode(c.x, c.y); }
  let tx, ty;
  if (c.chase) { tx = car.x + car.vx * 0.4; ty = car.y + car.vy * 0.4; }
  else {
    // Pelas ruas: anda de cruzamento em cruzamento, sempre no eixo em que falta mais para chegar ao jogador.
    let [nx, ny] = at(c.node);
    if (Math.hypot(nx - c.x, ny - c.y) < 2.5) {
      const [pi, pj] = nearestNode(car.x, car.y), di = pi - c.node[0], dj = pj - c.node[1];
      if (Math.abs(di) >= Math.abs(dj) && di) c.node = [c.node[0] + Math.sign(di), c.node[1]];
      else if (dj) c.node = [c.node[0], c.node[1] + Math.sign(dj)];
      [nx, ny] = at(c.node);
    }
    tx = nx; ty = ny;
  }
  const dx = tx - c.x, dy = ty - c.y, l = Math.hypot(dx, dy) || 1;
  return { x: c.x + dx / l * c.p.maxDistanceForTopSpeed, y: c.y + dy / l * c.p.maxDistanceForTopSpeed };
}

// ------------------------------------------------------------ passo

function step(dt) {
  if (mode !== 'race' || finished || caught || !sc.mouse.has) return;
  const gr = groundAt(car.x, car.y);
  RC.drive(car, sc.toWorld(cam, sc.mouse.x, sc.mouse.y), dt, car.p, gr.grip, gr.cap);
  RC.collide(car, world.blockers);
  if (!started && car.actual > 0.02) { started = true; arrowT = ARROW_TIME; }
  if (!started) return;
  timer += dt;
  arrowT = Math.max(0, arrowT - dt);
  // Escalonamento pelo tempo de corrida.
  const want = Math.min(POLICE.max, timer < POLICE.first ? 0 : 1 + Math.floor((timer - POLICE.first) / POLICE.every));
  while (spawnN < want) { spawnPolice(); spawnN++; }
  let close = false;
  for (const c of police) {
    const pg = groundAt(c.x, c.y);
    RC.drive(c, policeAim(c), dt, c.p, pg.grip, pg.cap);
    RC.collide(c, world.blockers, 0.45, 0.5);
    if (Math.hypot(c.x - car.x, c.y - car.y) < POLICE.radius) close = true;
  }
  // Viaturas não se atravessam nem atravessam o jogador.
  const all = [car, ...police];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d > 0 && d < 1.1) { const nx = dx / d, ny = dy / d, pen = (1.1 - d) / 2; a.x -= nx * pen; a.y -= ny * pen; b.x += nx * pen; b.y += ny * pen; a.vx *= 0.9; a.vy *= 0.9; b.vx *= 0.9; b.vy *= 0.9; }
  }
  // Detecção: raio X por Y segundos seguidos (Parte 5: "ex.: raio de 3 unidades por 2 s contínuos").
  catchT = close ? catchT + dt : 0;
  if (catchT >= POLICE.catchTime) return getCaught();
  const cp = at(route.cps[cpIdx]), d = Math.hypot(car.x - cp[0], car.y - cp[1]);
  if (d < CP_RADIUS) {
    cpIdx++; arrowT = ARROW_TIME; bestDist = Infinity; lastProgress = timer;
    if (cpIdx >= route.cps.length) return finish();
  } else if (d < bestDist - 1) { bestDist = d; lastProgress = timer; }
  else if (timer - lastProgress > NO_PROGRESS_TIME) { arrowT = ARROW_TIME; lastProgress = timer; }
  RC.emitDust(particles, car, gr.dust);
  const sp = Math.hypot(car.vx, car.vy);
  if (sp > 1.5 && Math.abs(Math.sin(Math.atan2(car.vy, car.vx) - car.ang)) > 0.3 && Math.random() < 0.6) skids.push({ x: car.x, y: car.y + 0.2, a: car.ang });
  if (skids.length > 500) skids.splice(0, skids.length - 500);
}

function getCaught() {
  caught = true;
  RC.dialog(`<div class="card"><h2 class="red">A polícia te pegou!</h2>
    <p>${police.length} viatura(s) na sua cola em ${RC.fmt(timer)}.</p>
    <p>Aperte <b>ESC</b> para voltar ao grid ou <b>R</b> para tentar novamente.</p>
    <div class="row"><button class="btn" data-a="menu">ESC · Grid</button><button class="btn go" data-a="retry">R · Tentar de novo</button></div></div>`, act);
}

function finish() {
  finished = true;
  // Moeda: base + bônus por tempo abaixo do par + bônus por viatura despistada (Parte 5 §progressão).
  const wanted = police.length, timeBonus = Math.max(0, Math.round((route.par - timer) * 4)), copBonus = wanted * 30;
  const earned = 100 + timeBonus + copBonus;
  D.money += earned; D.stats.races++; D.stats.done[route.id] = true; D.stats.maxWanted = Math.max(D.stats.maxWanted, wanted); S.save();
  const list = S.board(route.id), pb = list.length ? list[0].t : Infinity;
  RC.finishDialog({
    title: 'Escapou!', time: timer, lastName: D.lastName || '', act,
    lines: [`${route.name} · nível de procurado ${wanted}`, timer < pb ? (pb === Infinity ? 'Primeiro tempo nesta rota' : `Novo recorde! (antes ${RC.fmt(pb)})`) : `Recorde: ${RC.fmt(pb)}`,
      `<b>+$${earned}</b> (corrida $100 · tempo $${timeBonus} · polícia $${copBonus})`],
    onSave: name => { D.lastName = name; S.submit(route.id, name, timer, { wanted }); },
  });
}

function act(a) {
  if (a === 'retry') return startRace(selected);
  if (a === 'menu') return showMenu();
}

// ============================================================ menu e garagem

function showMenu() {
  mode = 'menu'; sc.active = false;
  $('hud').classList.add('hidden'); RC.hideDialog(); $('menu').classList.remove('hidden');
  const box = $('tracks'); box.innerHTML = '';
  ROUTES.forEach((r, i) => {
    const b = document.createElement('button');
    b.className = 'track' + (i === selected ? ' sel' : '');
    b.innerHTML = `${r.name}<small>${r.sub}${D.stats.done[r.id] ? ' · ✓' : ''}</small><i class="hold"></i>`;
    RC.holdButton(b, HOLD_MS, () => { selected = i; renderBoard(); document.querySelectorAll('.track').forEach((x, j) => x.classList.toggle('sel', j === i)); }, () => startRace(i));
    box.appendChild(b);
  });
  $('money').textContent = `$${D.money}`;
  $('garage-btn').onclick = showGarage;
  renderBoard();
}
function renderBoard() {
  const r = ROUTES[selected], list = S.board(r.id);
  $('board').innerHTML = `<h3>Ranking — ${r.name}</h3>${list.length ? `<ol>${list.map(x => `<li>${x.name} <small>★${x.wanted ?? 0}</small><span>${RC.fmt(x.t)}</span></li>`).join('')}</ol>` : '<p class="empty">Ninguém correu aqui ainda.</p>'}
    <p class="note">★ = viaturas na perseguição. Ranking local deste navegador (o jogo final usa o Firebase).</p>`;
}

function showGarage() {
  const parts = Object.entries(PARTS).map(([k, p]) => {
    const lv = D.up[k], next = lv < 3 ? p.cost[lv] : null, lock = lv < 3 && LOCKS[lv] && !LOCKS[lv].need() ? LOCKS[lv] : null;
    return `<div class="part"><b>${p.name}</b><small>${p.fx}</small><div class="lv">${[0, 1, 2].map(n => `<i class="${n < lv ? 'on' : ''}"></i>`).join('')}</div>
      ${next == null ? '<small>nível máximo</small>' : lock ? `<small>🔒 ${lock.txt}</small>` : `<button class="btn" data-a="up:${k}" ${D.money < next ? 'disabled' : ''}>Nível ${lv + 1} · $${next}</button>`}</div>`;
  }).join('');
  const sw = (list, cur, kind) => list.map(o => {
    const owned = D.owned.includes(o.id), lock = !owned && o.need && !o.need();
    return `<button class="swatch ${cur === o.id ? 'on' : ''}" data-a="${kind}:${o.id}" ${lock || (!owned && D.money < o.cost) ? 'disabled' : ''}><i style="background:${o.css}"></i>${o.name}<br>${owned ? (cur === o.id ? 'em uso' : 'usar') : lock ? `🔒 ${o.txt}` : `$${o.cost}`}</button>`;
  }).join('');
  RC.dialog(`<div class="card wide"><h2>Garagem <small style="float:right">$${D.money}</small></h2>
    <div class="garage"><div><h3>Desempenho (permanente)</h3>${parts}</div>
    <div><h3>Pintura</h3><div class="swatches">${sw(PAINTS, D.paint, 'paint')}</div><h3>Neon embaixo do carro</h3><div class="swatches">${sw(GLOWS, D.glow, 'glow')}</div>
    <p class="note" style="font-size:13px;color:var(--muted)">Visual não muda nada no desempenho. Corridas: ${D.stats.races} · maior procurado: ★${D.stats.maxWanted}</p></div></div>
    <div class="row"><button class="btn go" data-a="close">Voltar às ruas</button></div></div>`, a => {
    if (a === 'close') return showMenu();
    const [kind, id] = a.split(':');
    if (kind === 'up') { const c = PARTS[id].cost[D.up[id]]; if (D.money >= c) { D.money -= c; D.up[id]++; } }
    else {
      const o = (kind === 'paint' ? PAINTS : GLOWS).find(x => x.id === id);
      if (!D.owned.includes(id)) { if (D.money < o.cost) return; D.money -= o.cost; D.owned.push(id); }
      D[kind] = id;
    }
    S.save(); showGarage();
  });
}

// ============================================================ desenho

let patRoad, patWalk;
const view = { cache: null };

function drawCity(v) {
  // Quarteirões são calçada; o resto é rua.
  g.fillStyle = patRoad || '#3a3c44'; g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
    const x = gx(i) + ROAD / 2, y = gy(j) + ROAD / 2;
    if (x > v.x1 || y > v.y1 || x + BLOCK < v.x0 || y + BLOCK < v.y0) continue;
    g.fillStyle = '#26272d'; g.fillRect(x - 0.12, y - 0.12, BLOCK + 0.24, BLOCK + 0.24);   // meio-fio
    g.fillStyle = PARKS.has(`${i},${j}`) ? '#3f6e3a' : (patWalk || '#8a8a90'); g.fillRect(x, y, BLOCK, BLOCK);
  }
  // Faixa central tracejada.
  g.save(); g.strokeStyle = 'rgba(240,210,90,.7)'; g.lineWidth = 0.14; g.setLineDash([1, 1]);
  for (let i = 0; i <= COLS; i++) { g.beginPath(); for (let j = 0; j < ROWS; j++) { g.moveTo(gx(i), gy(j) + ROAD / 2 + 0.5); g.lineTo(gx(i), gy(j + 1) - ROAD / 2 - 0.5); } g.stroke(); }
  for (let j = 0; j <= ROWS; j++) { g.beginPath(); for (let i = 0; i < COLS; i++) { g.moveTo(gx(i) + ROAD / 2 + 0.5, gy(j)); g.lineTo(gx(i + 1) - ROAD / 2 - 0.5, gy(j)); } g.stroke(); }
  g.restore();
  for (const s of skids) if (RC.inView(v, s.x, s.y)) { g.save(); g.translate(s.x, s.y); g.rotate(s.a); g.fillStyle = 'rgba(10,10,10,.35)'; g.fillRect(-0.3, -0.35, 0.6, 0.12); g.fillRect(-0.3, 0.23, 0.6, 0.12); g.restore(); }
}

function drawBuilding(b) {
  const roofH = b.h - b.face;
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(b.x + 0.25, b.y + 0.25, b.w, b.h);   // sombra
  g.fillStyle = b.color; g.fillRect(b.x, b.y, b.w, roofH);                           // telhado
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 0.18; g.strokeRect(b.x + 0.3, b.y + 0.3, b.w - 0.6, roofH - 0.6);
  for (const r of b.roof) RC.drawFlat(g, r.key, r.x, r.y, 0.75);
  g.fillStyle = shade(b.color, -0.35); g.fillRect(b.x, b.y + roofH, b.w, b.face);  // fachada
  g.fillStyle = '#1b1c22'; for (const [wx, wy] of b.windows) g.fillRect(wx, wy, 0.55, 0.6);
  g.fillStyle = '#ffd98a'; for (const [wx, wy] of b.windows) g.fillRect(wx + 0.06, wy + 0.06, 0.43, 0.48);
  if (b.sign) { g.fillStyle = b.sign.color; g.fillRect(b.x + b.w * b.sign.x, b.y + roofH + 0.15, Math.min(4, b.w * 0.4), 0.45); }
  g.fillStyle = '#16171c'; g.fillRect(b.x, b.y + b.h - 0.15, b.w, 0.15);
}
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * (1 + k)))); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; }

function drawScene(v, now) {
  const list = [];
  for (const b of world.buildings) if (b.x < v.x1 && b.x + b.w > v.x0 && b.y < v.y1 && b.y + b.h > v.y0) list.push({ b, y: b.y + b.h });
  for (const p of world.props) if (RC.inView(v, p.x, p.y, 4)) list.push({ p, y: p.y });
  for (const p of world.parked) if (RC.inView(v, p.x, p.y, 2)) list.push({ parked: p, y: p.y });
  if (mode === 'race') {
    const cp = route.cps[cpIdx]; if (cp) { const [x, y] = at(cp); list.push({ cp: true, x, y: y - 0.2 }); }
    list.push({ car, y: car.y });
    for (const c of police) if (RC.inView(v, c.x, c.y, 2)) list.push({ cop: c, y: c.y });
  }
  list.sort((a, b) => a.y - b.y);
  for (const o of list) {
    if (o.b) drawBuilding(o.b);
    else if (o.p) RC.drawProp(g, o.p.key, o.p.x, o.p.y, o.p.s);
    else if (o.parked) RC.drawCar(g, SETS.parked[o.parked.set], o.parked.x, o.parked.y, o.parked.ang);
    else if (o.cp) RC.drawProp(g, 'neon_checkpoint', o.x, o.y, 1.6);
    else if (o.cop) RC.drawCar(g, SETS.police, o.cop.x, o.cop.y, o.cop.ang);
    else if (o.car) RC.drawCar(g, playerSet(), car.x, car.y, car.ang);
  }
}

// Noite: escurece tudo e "recorta" as luzes (postes, faróis, neon, sirenes). Faróis e visibilidade são
// "Em aberto" no GDD; aqui a escuridão é de verdade (o que está longe dos postes e dos faróis some).
const night = document.createElement('canvas'), ng = night.getContext('2d');
function drawNight(now, v) {
  if (night.width !== sc.W * sc.DPR || night.height !== sc.H * sc.DPR) { night.width = sc.W * sc.DPR; night.height = sc.H * sc.DPR; }
  ng.setTransform(sc.DPR, 0, 0, sc.DPR, 0, 0);
  ng.globalCompositeOperation = 'source-over'; ng.fillStyle = 'rgba(8,10,34,.6)'; ng.fillRect(0, 0, sc.W, sc.H);
  ng.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a = 1) => { const p = sc.toScreen(cam, x, y), R = r * cam.z; const gr = ng.createRadialGradient(p.x, p.y, 0, p.x, p.y, R); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); ng.fillStyle = gr; ng.fillRect(p.x - R, p.y - R, R * 2, R * 2); };
  for (const l of world.lamps) if (RC.inView(v, l.x, l.y, 6)) hole(l.x, l.y + 2.6, 5.5, 0.9);
  for (const b of world.buildings) if (b.sign && RC.inView(v, b.x, b.y, 4)) hole(b.x + b.w * b.sign.x + 1, b.y + b.h - b.face + 0.4, 2, 0.6);
  if (mode === 'race') {
    // Faróis: um cone à frente do carro.
    const p = sc.toScreen(cam, car.x, car.y), len = 10 * cam.z;
    ng.save(); ng.translate(p.x, p.y); ng.rotate(car.ang);
    const gr = ng.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ng.fillStyle = gr; ng.beginPath(); ng.moveTo(0.4 * cam.z, -0.35 * cam.z); ng.lineTo(len, -len * 0.42); ng.lineTo(len, len * 0.42); ng.lineTo(0.4 * cam.z, 0.35 * cam.z); ng.closePath(); ng.fill();
    ng.restore();
    hole(car.x, car.y, 2.6, 0.7);
    for (const c of police) hole(c.x, c.y, 3, 0.75);
    const cp = route.cps[cpIdx]; if (cp) { const [x, y] = at(cp); hole(x, y - 1, 4, 0.9); }
  }
  g.drawImage(night, 0, 0, sc.W, sc.H);
  // Brilhos coloridos por cima (soma de luz): neon embaixo do carro, sirenes e o checkpoint.
  g.save(); g.globalCompositeOperation = 'lighter';
  const glow = (x, y, r, rgb, a) => { const p = sc.toScreen(cam, x, y), R = r * cam.z; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, R); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(p.x - R, p.y - R, R * 2, R * 2); };
  if (mode === 'race') {
    const gl = GLOWS.find(x => x.id === D.glow);
    if (gl && gl.color) glow(car.x, car.y + 0.2, 1.8, gl.color, 0.55);
    const blink = Math.floor(now / 180) % 2;
    for (const c of police) { glow(c.x - 0.3, c.y - 0.5, 2.4, blink ? '255,40,40' : '40,90,255', 0.6); }
    const cp = route.cps[cpIdx]; if (cp) { const [x, y] = at(cp); glow(x, y - 1, 3, '63,240,224', 0.35 + Math.sin(now / 200) * 0.1); }
  }
  for (const b of world.buildings) if (b.sign && RC.inView(v, b.x, b.y, 4)) { const c = b.sign.color; glow(b.x + b.w * b.sign.x + 1, b.y + b.h - b.face + 0.4, 1.6, `${parseInt(c.slice(1, 3), 16)},${parseInt(c.slice(3, 5), 16)},${parseInt(c.slice(5, 7), 16)}`, 0.35); }
  g.restore();
}

function drawMinimap(now) {
  const w = Math.min(240, sc.W * 0.32), h = w * WORLD.h / WORLD.w;
  RC.drawMinimap(g, sc.W - w - 22, sc.H - h - 22, w, h, WORLD, (m, s) => {
    m.fillStyle = '#2a2b33'; m.fillRect(0, 0, WORLD.w, WORLD.h);
    for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) { m.fillStyle = PARKS.has(`${i},${j}`) ? '#2f5a2c' : '#4a4b58'; m.fillRect(gx(i) + ROAD / 2, gy(j) + ROAD / 2, BLOCK, BLOCK); }
    const cp = route.cps[cpIdx];
    if (cp) { const [x, y] = at(cp); m.fillStyle = Math.floor(now / 300) % 2 ? '#3ff0e0' : '#f046dc'; m.beginPath(); m.arc(x, y, 6 / s, 0, Math.PI * 2); m.fill(); }
    for (const c of police) { m.fillStyle = Math.floor(now / 200) % 2 ? '#ff3b30' : '#3b6bff'; m.fillRect(c.x - 3 / s, c.y - 3 / s, 6 / s, 6 / s); }
    m.save(); m.translate(car.x, car.y); m.rotate(car.ang); m.fillStyle = '#fff'; m.strokeStyle = '#111'; m.lineWidth = 1.2 / s;
    m.beginPath(); m.moveTo(7 / s, 0); m.lineTo(-4 / s, 4.5 / s); m.lineTo(-4 / s, -4.5 / s); m.closePath(); m.fill(); m.stroke(); m.restore();
  });
}

function drawMenuBg(now) {
  const t = now / 1000, z = RC.PPU * 0.55;
  cam = { x: 60 + Math.sin(t * 0.04) * 50, y: 70 + Math.cos(t * 0.03) * 30, z };
  const v = sc.begin(cam); drawCity(v); drawScene(v, now); sc.end();
  drawNight(now, v);
  g.fillStyle = 'rgba(10,8,24,.35)'; g.fillRect(0, 0, sc.W, sc.H);
}

let last = 0, acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
  g.setTransform(sc.DPR, 0, 0, sc.DPR, 0, 0);
  if (mode === 'menu') drawMenuBg(now);
  else {
    acc += dt; while (acc >= RC.FIXED) { step(RC.FIXED); acc -= RC.FIXED; }
    cam.x += (car.x - cam.x) * Math.min(1, dt * 6); cam.y += (car.y - cam.y) * Math.min(1, dt * 6);
    const v = sc.begin(cam);
    drawCity(v);
    RC.drawParticles(g, particles, dt);
    drawScene(v, now);
    sc.end();
    drawNight(now, v);
    // Chevrons e seta por cima da escuridão: são interface, não mundo.
    if (sc.mouse.has && !finished && !caught) { sc.begin(cam); RC.drawChevrons(g, car, sc.toWorld(cam, sc.mouse.x, sc.mouse.y)); sc.end(); }
    const cp = route.cps[cpIdx];
    if (cp && arrowT > 0 && !finished && !caught) { const [x, y] = at(cp), p = sc.toScreen(cam, car.x, car.y); RC.drawGuideArrow(g, p.x, p.y, Math.atan2(y - car.y, x - car.x), Math.min(1, arrowT / 0.3), '#3ff0e0'); }
    drawMinimap(now);
    $('time').textContent = RC.fmt(timer);
    $('cp').textContent = `${cpIdx}/${route.cps.length}`;
    $('wanted').textContent = police.length ? '★'.repeat(police.length) : '—';
    $('speed').style.width = `${car.actual * 100}%`;
    $('busted').style.width = `${Math.min(1, catchT / POLICE.catchTime) * 100}%`;
    if (!started) {
      g.font = '700 22px "Pixelify Sans", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 4;
      const msg = sc.mouse.has ? 'Afaste o cursor do carro para acelerar · a polícia chega logo' : 'Mova o mouse (ou arraste o dedo) para pilotar';
      g.strokeText(msg, sc.W / 2, sc.H - 40); g.fillText(msg, sc.W / 2, sc.H - 40);
    }
  }
  requestAnimationFrame(frame);
}

addEventListener('keydown', e => {
  if (mode !== 'race' || document.activeElement?.tagName === 'INPUT') return;
  if (e.key === 'Escape') act('menu');
  if ((e.key === 'r' || e.key === 'R') && (finished || caught || e.shiftKey)) act('retry');
});

async function boot() {
  const keys = [...RC.dirKeys('tuner'), ...RC.dirKeys('police'), 'streetlamp', 'dumpster', 'citytree', 'neon_checkpoint', 'barrier', 'roof_ac', 'roof_tank', 'tiles/road', 'tiles/sidewalk'];
  await RC.loadImages(ART, keys);
  SETS.police = RC.carSet('police');
  // Carros estacionados: o mesmo modelo do jogador, em cores apagadas.
  SETS.parked = [[200, 0.35, 0], [20, 0.4, -0.05], [0, 0.05, 0.15], [120, 0.3, -0.1]].map(([h, s, l]) => RC.carSet('tuner', im => RC.recolor(im, 280, h, 45, s, l)));
  patRoad = RC.pattern(g, 'tiles/road'); patWalk = RC.pattern(g, 'tiles/sidewalk');
  world = buildWorld();
  const start = ROUTES.findIndex(r => DEV.has(r.id));
  if (start >= 0) startRace(start); else showMenu();
  requestAnimationFrame(frame);
}
boot();
