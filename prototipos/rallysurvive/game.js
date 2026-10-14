// RallySurvive — protótipo jogável em JavaScript puro.
// Segue a Parte 1 (Core) e a Parte 2 (variante RallySurvive) do RallySurvive.md: o carro vai na direção do
// cursor com velocidade pela distância (curva t², Fase 1 §1.4), grip por terreno (Deserto 1,0 / poças da
// Floresta / Gelo), ChevronGuide verde/vermelho, sair do traçado = "Você Bateu!", tela de chegada com nome
// de 5 letras, fantasma do recorde pessoal e menu de "segurar para largar". Arte: Sprites/Rally2D/.
'use strict';

const ART = '../../Sprites/Rally2D/';
const SAVE_KEY = 'rallysurvive-save-v1';
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ============================================================ CarController (Parte 8 §1.2–1.4) — unidades de mundo

const CAR = {
  maxSpeed: 8,                  // unidades/s
  minDistanceForMovement: 0.3,  // zona morta
  maxDistanceForTopSpeed: 6,
  steeringResponsiveness: 20,
  rotationSpeed: 10,
  length: 1.35,                 // tamanho do sprite no mundo (Em aberto no guia: escala do carro)
};
const PPU = 64;                 // pixels de tela por unidade de mundo (zoom da câmera)
const HOLD_MS = 1500;           // "segurar para largar" (Parte 13 §6.4, placeholder do guia)
const CHEVRON = { max: 5, spacing: 0.8 };

// ============================================================ pistas (Parte 2 §Pistas)
// Pontos de controle em unidades; o traçado é suavizado (Catmull-Rom) e tem largura fixa.
// Recortes dos tilesets de 15 peças: miolo de terreno puro e miolo de estrada pura.

const TRACKS = [
  { id: 'deserto', name: 'Deserto', sub: 'grip total · referência', tiles: 'dirt_sand_v1', width: 3.0, grip: 1.0,
    edge: '#d89a3c', dust: 'rgba(214,164,92,', bg: '#f0c160',
    props: ['props/desert/cactus_large', 'props/desert/cactus_medium', 'props/desert/rock_cluster', 'props/desert/rock_large', 'props/desert/bush_dry', 'deco/desert/dune_a', 'deco/desert/dune_small', 'deco/desert/acacia_a', 'deco/desert/palm', 'deco/desert/grass_tuft_large', 'props/desert/tire_stack'],
    pts: [[0, 0], [14, -2], [26, 4], [33, 15], [29, 27], [17, 31], [9, 41], [15, 53], [31, 57], [45, 49], [51, 36], [63, 29], [76, 36], [79, 50], [74, 62]] },
  { id: 'floresta', name: 'Floresta', sub: 'chuva · poças escorregadias', tiles: 'grass_mud_v1', width: 2.8, grip: 1.0, puddleGrip: 0.5, rain: true,
    edge: '#5c3d22', dust: 'rgba(110,80,50,', bg: '#7cc251',
    props: ['props/forest/tree_large', 'props/forest/tree_medium', 'props/forest/tree_small', 'props/forest/bush', 'props/forest/rock_mossy', 'props/forest/log', 'deco/forest/pine_a', 'deco/forest/pine_b', 'deco/forest/fern', 'deco/forest/mushrooms_a', 'deco/forest/stump', 'deco/forest/flowers'],
    pts: [[0, 0], [11, 0], [17, 7], [12, 16], [4, 22], [7, 32], [18, 34], [26, 27], [36, 25], [42, 32], [39, 42], [29, 48], [30, 58], [42, 63], [52, 57], [56, 45], [67, 40], [75, 46]] },
  { id: 'gelo', name: 'Gelo', sub: 'grip baixo na pista inteira', tiles: 'snow_ice_v1', width: 3.4, grip: 0.3,
    edge: '#9cc3dd', dust: 'rgba(225,240,255,', bg: '#eaf4fb',
    props: ['props/ice/pine_large', 'props/ice/pine_medium', 'props/ice/pine_small', 'props/ice/snowbank_a', 'props/ice/snowbank_b', 'props/ice/ice_rock_a', 'deco/ice/snowman_a', 'deco/ice/snow_bush_cluster', 'deco/ice/cabin', 'deco/ice/frozen_pond'],
    pts: [[0, 0], [16, 4], [28, 14], [30, 30], [20, 40], [22, 54], [38, 60], [54, 54], [60, 40], [74, 36], [88, 44], [92, 60]] },
];
const CROPS = { terrain: [0, 330, 180, 110], road: [226, 196, 96, 92] };

function smoothOpen(pts, spacing = 0.5) {
  const n = pts.length, out = [];
  const P = i => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const steps = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / spacing));
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      const f = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  out.push(pts[n - 1]);
  return out;
}

function buildTrack(def) {
  const path = smoothOpen(def.pts);
  const cum = [0];
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const t = { ...def, path, cum, length: cum[cum.length - 1] };
  const rng = mulberry32(def.id.length * 7919 + def.pts.length);
  // Poças (Floresta): posições fixas, autoradas por pista (Parte 2), aqui por fração do traçado.
  t.puddles = def.puddleGrip ? [0.16, 0.3, 0.44, 0.58, 0.72, 0.86].map((f, i) => {
    const s = sample(t, f * t.length), lat = (rng() - 0.5) * def.width * 0.5;
    return { x: s.x - s.dy * lat, y: s.y + s.dx * lat, r: 0.85, img: i % 2 ? 'props/forest/puddle_b' : 'props/forest/puddle_a', rot: rng() * Math.PI };
  }) : [];
  // Decoração fora da pista: espalhada ao longo do traçado, sem invadir a faixa (+ margem).
  t.deco = [];
  for (let d = 2; d < t.length; d += 1.6) {
    for (const side of [-1, 1]) {
      if (rng() < 0.45) continue;
      const s = sample(t, d), off = def.width / 2 + 1.4 + rng() * 6;
      const x = s.x - s.dy * off * side, y = s.y + s.dx * off * side;
      if (nearestOnPath(t, x, y).dist < def.width / 2 + 1.1) continue;
      t.deco.push({ x, y, img: def.props[Math.floor(rng() * def.props.length)], s: 0.75 + rng() * 0.6, rot: (rng() - 0.5) * 0.4 });
    }
  }
  // Público e arco de largada/chegada nas duas pontas.
  for (const [d, label] of [[1.2, 'start'], [t.length - 0.6, 'finish']]) {
    const s = sample(t, d);
    t.deco.push({ x: s.x, y: s.y, img: 'deco/common/start_finish_gantry', gantry: true, ang: Math.atan2(s.dy, s.dx) + Math.PI / 2, label });
    for (const side of [-1, 1]) {
      const off = def.width / 2 + 1.8;
      t.deco.push({ x: s.x - s.dy * off * side, y: s.y + s.dx * off * side, img: 'deco/common/crowd_row_long', s: 1, rot: Math.atan2(s.dy, s.dx) + (side > 0 ? 0 : Math.PI) - Math.PI / 2, crowd: true });
    }
  }
  t.deco.sort((a, b) => a.y - b.y);
  return t;
}

function sample(t, d) {
  d = Math.max(0, Math.min(t.length, d));
  let i = 1; while (i < t.cum.length - 1 && t.cum[i] < d) i++;
  const a = t.path[i - 1], b = t.path[i], seg = t.cum[i] - t.cum[i - 1] || 1, k = (d - t.cum[i - 1]) / seg;
  const dx = (b[0] - a[0]) / seg, dy = (b[1] - a[1]) / seg;
  return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, dx, dy };
}

// Ponto mais perto do traçado. "hint" limita a busca a uma janela em volta do último índice (evita pular
// para um trecho vizinho da pista quando duas partes passam perto uma da outra).
function nearestOnPath(t, x, y, hint = -1) {
  let best = { dist: Infinity, along: 0, i: 0 };
  const lo = hint < 0 ? 1 : Math.max(1, hint - 30), hi = hint < 0 ? t.path.length : Math.min(t.path.length, hint + 60);
  for (let i = lo; i < hi; i++) {
    const a = t.path[i - 1], b = t.path[i], vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy || 1;
    const k = Math.max(0, Math.min(1, ((x - a[0]) * vx + (y - a[1]) * vy) / l2));
    const px = a[0] + vx * k, py = a[1] + vy * k, dist = Math.hypot(x - px, y - py);
    if (dist < best.dist) best = { dist, along: t.cum[i - 1] + k * Math.sqrt(l2), i };
  }
  return best;
}

function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ============================================================ save local (no lugar do Firebase, Parte 12)

function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } }
let save = loadSave();
save.boards = save.boards || {}; save.ghosts = save.ghosts || {};
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
const board = id => (save.boards[id] = save.boards[id] || []);
const fmt = s => { const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r.toFixed(2).padStart(5, '0')}`; };

// ============================================================ arte

const IMG = {};
const PAT = {};
function loadImages(keys) {
  return Promise.all(keys.map(k => new Promise(res => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = () => { console.warn('sem arte', k); res(); }; im.src = `${ART}${k}.png`; })));
}
function cropCanvas(img, [x, y, w, h]) { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h); return c; }
// Pinturas da carroceria tingidas são desnecessárias: o pacote já tem 8 liveries prontas.

// ============================================================ estado

const cv = document.getElementById('game'), g = cv.getContext('2d');
const $ = id => document.getElementById(id);
let W = 0, H = 0, DPR = 1;
let mode = 'menu', track = null, selected = 0;
let car, cam, timer, started, finished, crashed, runTrace, ghost, progIdx;
const mouse = { x: 0, y: 0, has: false };
const particles = [], skids = [];

function resize() {
  DPR = window.devicePixelRatio || 1; W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
}

function startRace(i) {
  track = TRACKS[i].built;
  const s = sample(track, 1.6);
  car = { x: s.x, y: s.y, vx: 0, vy: 0, ang: Math.atan2(s.dy, s.dx), grip: track.grip, target: 0, actual: 0, inPuddle: false };
  cam = { x: car.x, y: car.y };
  timer = 0; started = false; finished = false; crashed = false; progIdx = -1;
  runTrace = [];
  const gh = save.ghosts[track.id];
  ghost = gh ? { pts: gh.pts, dt: gh.dt } : null;
  particles.length = 0; skids.length = 0;
  // Começa com o cursor um pouco à frente do carro, parado na zona morta.
  mouse.has = false;
  mode = 'race';
  $('menu').classList.add('hidden'); $('dialog').classList.add('hidden'); $('hud').classList.remove('hidden');
  const best = board(track.id)[0];
  $('best').textContent = best ? `Recorde: ${fmt(best.t)} (${best.name})` : 'Sem recorde ainda';
}

// ============================================================ física (CarController.FixedUpdate)

const FIXED = 1 / 60;
function physics(dt) {
  if (!mouse.has) return;
  const world = screenToWorld(mouse.x, mouse.y);
  const tx = world.x - car.x, ty = world.y - car.y, dist = Math.hypot(tx, ty);
  const t = Math.max(0, Math.min(1, (dist - CAR.minDistanceForMovement) / (CAR.maxDistanceForTopSpeed - CAR.minDistanceForMovement)));
  const speedT = t * t;   // curva "exponencial suave" do guia (§1.4, versão em código)
  let dvx = 0, dvy = 0;
  if (dist > CAR.minDistanceForMovement) {
    dvx = tx / dist * speedT * CAR.maxSpeed; dvy = ty / dist * speedT * CAR.maxSpeed;
    const target = Math.atan2(ty, tx);
    let da = target - car.ang; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    car.ang += da * Math.min(1, CAR.rotationSpeed * dt);
  }
  // Grip do terreno: base da pista, ou o da poça que o carro estiver sobrepondo (CarTerrainSensor).
  car.inPuddle = track.puddles.some(p => Math.hypot(car.x - p.x, car.y - p.y) < p.r);
  car.grip = car.inPuddle ? track.puddleGrip : track.grip;
  const k = Math.min(1, CAR.steeringResponsiveness * car.grip * dt);
  car.vx += (dvx - car.vx) * k; car.vy += (dvy - car.vy) * k;
  car.x += car.vx * dt; car.y += car.vy * dt;
  car.target = speedT;
  car.actual = Math.min(1, Math.hypot(car.vx, car.vy) / CAR.maxSpeed);
  if (!started && car.actual > 0.02) started = true;   // o cronômetro começa quando o carro sai do grid
}

function step(dt) {
  if (mode !== 'race' || crashed || finished) return;
  physics(dt);
  if (started) {
    timer += dt;
    runTrace.push([+car.x.toFixed(2), +car.y.toFixed(2), +car.ang.toFixed(2)]);
  }
  const near = nearestOnPath(track, car.x, car.y, progIdx);
  progIdx = near.i;
  // Saída do traçado → "Você Bateu!" (Parte 2, Menus de Feedback).
  if (near.dist > track.width / 2 + 0.1) return crash();
  if (near.along >= track.length - 0.7) return finish();
  car.progress = near.along / track.length;
  // Partículas: poeira / respingo / spray, pela velocidade real.
  if (car.actual > 0.1 && Math.random() < car.actual) {
    const back = CAR.length * 0.45;
    particles.push({ x: car.x - Math.cos(car.ang) * back, y: car.y - Math.sin(car.ang) * back, vx: -car.vx * 0.15 + (Math.random() - 0.5), vy: -car.vy * 0.15 + (Math.random() - 0.5), life: 0.6, t: 0, splash: car.inPuddle });
  }
  // Marcas de derrapagem quando a velocidade real diverge muito da direção do carro (grip baixo).
  const sp = Math.hypot(car.vx, car.vy);
  if (sp > 1.5) {
    const slip = Math.abs(Math.sin(Math.atan2(car.vy, car.vx) - car.ang));
    if (slip > 0.35 && Math.random() < 0.5) skids.push({ x: car.x, y: car.y, a: car.ang, t: 0 });
  }
}

function crash() {
  crashed = true;
  dialog(`<div class="card"><h2 class="red">Você Bateu!</h2>
    <p>Aperte <b>ESC</b> para voltar ao grid ou <b>R</b> para tentar novamente.</p>
    <div class="row"><button class="btn" data-a="menu">ESC · Grid</button><button class="btn go" data-a="retry">R · Tentar de novo</button></div></div>`);
}

function finish() {
  finished = true;
  const t = timer, list = board(track.id), pb = list.length ? Math.min(...list.map(r => r.t)) : Infinity;
  // Fantasma do recorde pessoal (Parte 2 §Ghost Replay): grava o traçado se bateu o melhor tempo local.
  if (t < pb) { save.ghosts[track.id] = { dt: FIXED, pts: runTrace.filter((_, i) => i % 2 === 0) }; persist(); }
  dialog(`<div class="card"><h2>Chegada!</h2><div class="big">${fmt(t)}</div>
    <p>${t < pb ? (pb === Infinity ? 'Primeiro tempo nesta pista' : `Novo recorde! (antes ${fmt(pb)})`) : `Recorde: ${fmt(pb)}`}</p>
    <p>Seu nome (até 5 letras):</p>
    <input id="name" maxlength="5" value="${save.lastName || ''}" autocomplete="off" spellcheck="false">
    <div class="row"><button class="btn go" data-a="save" id="save-btn">Enviar tempo</button></div>
    <div class="row"><button class="btn" data-a="retry">Repetir Pista</button><button class="btn" data-a="menu">Voltar ao Menu</button></div></div>`);
  const inp = $('name'); inp.focus(); inp.select();
  inp.oninput = () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
  inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') act('save'); };
  finish.time = t;
}

function dialog(html) {
  const d = $('dialog'); d.innerHTML = html; d.classList.remove('hidden');
  d.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(b.dataset.a));
}

function act(a) {
  if (a === 'retry') return startRace(TRACKS.indexOf(TRACKS.find(t => t.id === track.id)));
  if (a === 'menu') return showMenu();
  if (a === 'save') {
    const inp = $('name'), name = (inp.value || 'PLAYR').toUpperCase().slice(0, 5);   // vazio vira "PLAYR" (Em aberto no GDD)
    save.lastName = name;
    const list = board(track.id); list.push({ name, t: finish.time, date: Date.now() });
    list.sort((x, y) => x.t - y.t); list.splice(10);
    persist();
    const btn = $('save-btn'); btn.disabled = true; btn.textContent = 'Tempo enviado ✓';
  }
}

// ============================================================ menu (Parte 2 §Menu Principal)

function showMenu() {
  mode = 'menu';
  $('hud').classList.add('hidden'); $('dialog').classList.add('hidden'); $('menu').classList.remove('hidden');
  const box = $('tracks'); box.innerHTML = '';
  TRACKS.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'track' + (i === selected ? ' sel' : '');
    b.innerHTML = `${t.name}<small>${t.sub}</small><i class="hold"></i>`;
    let t0 = 0, raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / HOLD_MS);
      b.querySelector('.hold').style.width = `${p * 100}%`;
      if (p >= 1) { t0 = 0; startRace(i); return; }
      raf = requestAnimationFrame(tick);
    };
    const down = e => { e.preventDefault(); selected = i; renderBoard(); document.querySelectorAll('.track').forEach((x, j) => x.classList.toggle('sel', j === i)); t0 = performance.now(); tick(); };
    const up = () => { cancelAnimationFrame(raf); t0 = 0; b.querySelector('.hold').style.width = '0'; };
    b.onpointerdown = down; b.onpointerup = up; b.onpointerleave = up; b.onpointercancel = up;
    box.appendChild(b);
  });
  renderBoard();
}

function renderBoard() {
  const t = TRACKS[selected], list = board(t.id);
  $('board').innerHTML = `<h3>Ranking — ${t.name}</h3>
    ${list.length ? `<ol>${list.map(r => `<li>${r.name}<span>${fmt(r.t)}</span></li>`).join('')}</ol>` : '<p class="empty">Ninguém correu aqui ainda.</p>'}
    <p class="note">Ranking local deste navegador (o jogo final usa o Firebase, Parte 12).</p>`;
}

// ============================================================ câmera e desenho

function screenToWorld(sx, sy) { return { x: cam.x + (sx - W / 2) / PPU, y: cam.y + (sy - H / 2) / PPU }; }

function drawWorld(t, camX, camY, scale) {
  g.save();
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.translate(W / 2, H / 2); g.scale(scale, scale); g.translate(-camX, -camY);
  const view = { x0: camX - W / 2 / scale - 4, x1: camX + W / 2 / scale + 4, y0: camY - H / 2 / scale - 4, y1: camY + H / 2 / scale + 4 };
  // Terreno: miolo puro do tileset, repetido (1 tile de 128 px = 1 unidade).
  const pt = PAT[t.tiles];
  if (pt) {
    pt.terrain.setTransform(new DOMMatrix().scale(1 / 128 * 1.4));
    g.fillStyle = pt.terrain;
  } else g.fillStyle = t.bg;
  g.fillRect(view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0);
  // Estrada: borda + miolo de estrada do mesmo tileset.
  const line = () => { g.beginPath(); t.path.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
  g.lineJoin = g.lineCap = 'round';
  line(); g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = t.width + 0.8; g.stroke();
  line(); g.strokeStyle = t.edge; g.lineWidth = t.width + 0.35; g.stroke();
  if (pt) { pt.road.setTransform(new DOMMatrix().scale(1 / 128 * 1.4)); g.strokeStyle = pt.road; } else g.strokeStyle = '#8a5a34';
  line(); g.lineWidth = t.width; g.stroke();
  // Decalques: marcas de derrapagem.
  if (IMG['decals/skid_short']) for (const s of skids) {
    if (s.x < view.x0 || s.x > view.x1 || s.y < view.y0 || s.y > view.y1) continue;
    g.save(); g.translate(s.x, s.y); g.rotate(s.a); g.globalAlpha = Math.max(0, 0.35 - s.t * 0.05);
    g.drawImage(IMG['decals/skid_short'], -0.5, -0.25, 1, 0.42); g.restore();
  }
  // Poças.
  for (const p of t.puddles) drawSprite(p.img, p.x, p.y, p.r * 2.2, p.rot, 0.95);
  return view;
}

function drawSprite(key, x, y, w, rot = 0, alpha = 1) {
  const im = IMG[key]; if (!im) return;
  const h = w * im.height / im.width;
  g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.globalAlpha = alpha;
  g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
}

function drawDeco(t, view) {
  for (const d of t.deco) {
    if (d.x < view.x0 - 3 || d.x > view.x1 + 3 || d.y < view.y0 - 3 || d.y > view.y1 + 3) continue;
    const im = IMG[d.img]; if (!im) continue;
    if (d.gantry) { drawSprite(d.img, d.x, d.y, t.width + 1.2, d.ang); continue; }
    const w = (im.width / 128) * 0.55 * d.s;
    drawSprite(d.img, d.x, d.y, w, d.rot);
  }
}

function drawCar(x, y, ang, key, alpha = 1) {
  const im = IMG[key]; if (!im) return;
  // O sprite aponta para cima; o ângulo 0 do mundo é para a direita (por isso o +90°).
  g.save(); g.translate(x, y); g.rotate(ang + Math.PI / 2); g.globalAlpha = alpha;
  const h = CAR.length, w = h * im.width / im.height;
  g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
}

// ChevronGuide: setas entre o carro e o cursor. Verde = pedindo mais velocidade do que o carro tem
// (acelerando); vermelho = pedindo menos (freando). Quantidade cresce com a diferença (Parte 1 §2).
function drawChevrons() {
  if (!mouse.has || crashed || finished || !IMG['ui/chevron']) return;
  const w = screenToWorld(mouse.x, mouse.y), dx = w.x - car.x, dy = w.y - car.y, dist = Math.hypot(dx, dy);
  if (dist < CAR.minDistanceForMovement + 0.4) return;
  const diff = car.target - car.actual;
  const color = diff > 0.02 ? '#3fbf6a' : diff < -0.02 ? '#e5484d' : 'rgba(255,255,255,.8)';
  const count = Math.max(1, Math.min(CHEVRON.max, Math.round(1 + Math.abs(diff) * 8), Math.floor((dist - 0.6) / CHEVRON.spacing)));
  const ang = Math.atan2(dy, dx);
  const tint = tintedChevron(color);
  for (let i = 0; i < count; i++) {
    const d = 0.9 + i * CHEVRON.spacing;
    const x = car.x + dx / dist * d, y = car.y + dy / dist * d;
    g.save(); g.translate(x, y); g.rotate(ang + Math.PI / 2); g.globalAlpha = 0.95 - i * 0.1;
    g.drawImage(tint, -0.28, -0.28, 0.56, 0.56); g.restore();
  }
}
const chevronCache = {};
function tintedChevron(color) {
  if (chevronCache[color]) return chevronCache[color];
  const im = IMG['ui/chevron'], c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const cg = c.getContext('2d'); cg.drawImage(im, 0, 0, 128, 128);
  cg.globalCompositeOperation = 'source-in'; cg.fillStyle = color; cg.fillRect(0, 0, 128, 128);
  return (chevronCache[color] = c);
}

let rainDrops = [];
function drawRain(dt) {
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (rainDrops.length < 160) rainDrops.push({ x: Math.random() * W, y: Math.random() * H, v: 600 + Math.random() * 300 });
  g.strokeStyle = 'rgba(200,220,255,.35)'; g.lineWidth = 1.5; g.beginPath();
  for (const r of rainDrops) { r.y += r.v * dt; r.x -= r.v * dt * 0.2; if (r.y > H) { r.y = -10; r.x = Math.random() * W * 1.2; } g.moveTo(r.x, r.y); g.lineTo(r.x - 4, r.y + 16); }
  g.stroke();
  g.fillStyle = 'rgba(40,60,80,.12)'; g.fillRect(0, 0, W, H);
}

// Fundo do menu: a pista selecionada inteira, como "imagem de fundo por pista" (Parte 2 §Menu Principal).
function drawMenuBg(t) {
  const xs = t.path.map(p => p[0]), ys = t.path.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const sc = Math.min(W / (Math.max(...xs) - Math.min(...xs) + 16), H / (Math.max(...ys) - Math.min(...ys) + 16));
  const view = drawWorld(t, cx, cy, sc);
  drawDeco(t, view);
  g.restore();
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.fillStyle = 'rgba(25,28,38,.45)'; g.fillRect(0, 0, W, H);
}

// ============================================================ laço

let last = 0, acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (mode === 'menu') {
    drawMenuBg(TRACKS[selected].built);
    if (TRACKS[selected].built.rain) drawRain(dt);
  } else {
    acc += dt; while (acc >= FIXED) { step(FIXED); acc -= FIXED; }
    cam.x += (car.x - cam.x) * Math.min(1, dt * 6); cam.y += (car.y - cam.y) * Math.min(1, dt * 6);
    const view = drawWorld(track, cam.x, cam.y, PPU);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.t += dt; if (p.t > p.life) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      g.fillStyle = p.splash ? `rgba(160,200,255,${0.6 * (1 - p.t / p.life)})` : track.dust + (0.5 * (1 - p.t / p.life)) + ')';
      g.beginPath(); g.arc(p.x, p.y, 0.12 + p.t * 0.5, 0, Math.PI * 2); g.fill();
    }
    for (const s of skids) s.t += dt;
    if (skids.length > 300) skids.splice(0, skids.length - 300);
    // Fantasma do recorde pessoal, na mesma linha do tempo.
    if (ghost && started) {
      const i = Math.min(ghost.pts.length - 1, Math.floor(timer / (ghost.dt * 2)));
      const p = ghost.pts[i]; if (p) drawCar(p[0], p[1], p[2], 'cars/liveries/rally_blue', 0.4);
    }
    drawCar(car.x, car.y, car.ang, 'cars/rally_orange_v1');
    drawChevrons();
    drawDeco(track, view);
    g.restore();
    if (track.rain) drawRain(dt);
    // HUD
    $('time').textContent = fmt(timer);
    $('speed').style.width = `${car.actual * 100}%`;   // velocidade REAL (pós-grip), Parte 1 §5
    $('prog').style.width = `${(car.progress || 0) * 100}%`;
    if (!started && !crashed) {
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.font = "700 22px Rubik, sans-serif"; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 4;
      const msg = mouse.has ? 'Afaste o cursor do carro para acelerar' : 'Mova o mouse (ou arraste o dedo) para pilotar';
      g.strokeText(msg, W / 2, H - 40); g.fillText(msg, W / 2, H - 40);
    }
  }
  requestAnimationFrame(frame);
}

// ============================================================ entrada

addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; if (mode === 'race') mouse.has = true; });
addEventListener('pointerdown', e => { if (e.target === cv) { mouse.x = e.clientX; mouse.y = e.clientY; if (mode === 'race') mouse.has = true; } });
addEventListener('keydown', e => {
  if (mode !== 'race') return;
  if (e.key === 'Escape' && (crashed || finished)) act('menu');
  if ((e.key === 'r' || e.key === 'R') && (crashed || finished)) act('retry');
});
addEventListener('resize', resize);

async function boot() {
  resize();
  const keys = new Set(['cars/rally_orange_v1', 'cars/liveries/rally_blue', 'ui/chevron', 'decals/skid_short', 'deco/common/start_finish_gantry', 'deco/common/crowd_row_long', 'props/forest/puddle_a', 'props/forest/puddle_b']);
  TRACKS.forEach(t => { keys.add('tilesets/' + t.tiles); t.props.forEach(p => keys.add(p)); });
  await loadImages([...keys]);
  for (const t of TRACKS) {
    const im = IMG['tilesets/' + t.tiles];
    if (im) PAT[t.tiles] = { terrain: g.createPattern(cropCanvas(im, CROPS.terrain), 'repeat'), road: g.createPattern(cropCanvas(im, CROPS.road), 'repeat') };
    t.built = buildTrack(t);
  }
  const start = [...DEV].find(k => TRACKS.some(t => t.id === k));
  if (start) startRace(TRACKS.findIndex(t => t.id === start)); else showMenu();
  requestAnimationFrame(frame);
}
boot();
