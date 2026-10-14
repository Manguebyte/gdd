// RaceLegenda — protótipo jogável em JavaScript puro.
// Segue a Parte 4 do RallySurvive.md (variante) sobre o Core (Parte 1, em ../rally-core/rally-core.js):
// circuito fechado estilo F1 anos 60, 2–3 voltas; setup do carro (asa e balanço de freio) ajustado uma
// única vez antes da corrida; corte de pista sem penalidade artificial — fora do asfalto o grip e a
// velocidade caem, e essa é a única punição. Multiplayer em tempo real é "Em aberto" no GDD: aqui o modo
// "Contra rivais" usa 3 pilotos da máquina no lugar dos outros jogadores. Arte: Sprites/RaceLegenda/.
'use strict';

const ART = '../../Sprites/RaceLegenda/';
const S = RC.store('race-legenda-save-v1');
S.data.setup = S.data.setup || {}; S.data.bestLap = S.data.bestLap || {}; S.data.history = S.data.history || {};
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { S.data.boards = {}; S.data.bestLap = {}; S.data.history = {}; S.save(); }

const HOLD_MS = 1500;
const TRACK_W = 3.8;
const VALID = TRACK_W / 2 + 0.6;   // pista + acostamento/zebra: dentro disso é asfalto (Parte 4 §Corte de pista)
const GROUND = {
  asfalto: { grip: 1.0, cap: 1.0 },
  grama: { grip: 0.45, cap: 0.5 },   // "reduz drasticamente a velocidade (grip baixo fora do asfalto)"
};

// ============================================================ circuitos (largada = chegada no ponto 0, sentido leste)

const CIRCUITS = [
  { id: 'serra', name: 'Circuito da Serra', sub: '3 voltas · curto e travado', laps: 3,
    pts: [[0, 0], [26, 0], [38, 4], [42, 13], [36, 21], [24, 22], [19, 29], [24, 37], [36, 39], [43, 47], [38, 56], [22, 58], [6, 54], [-6, 46], [-12, 34], [-9, 22], [-14, 12], [-11, 3]] },
  { id: 'litoral', name: 'Autódromo Litoral', sub: '2 voltas · rápido e largo', laps: 2,
    pts: [[0, 0], [34, 0], [47, 7], [49, 20], [38, 28], [20, 27], [9, 35], [11, 48], [26, 55], [43, 51], [58, 57], [61, 72], [46, 81], [16, 79], [-8, 70], [-15, 52], [-17, 30], [-13, 9]] },
];
const RIVALS = [
  { name: 'VASCO', hue: 125, skill: 0.93, lane: -0.7, look: 4.2 },
  { name: 'LOTTE', hue: 215, skill: 0.89, lane: 0.6, look: 4.6 },
  { name: 'MARCO', hue: 48, skill: 0.85, lane: 0, look: 4.0 },
];

function buildTrack(def) {
  const path = RC.smoothPath(def.pts, true, 0.5), n = path.length;
  const cum = [0];
  for (let i = 1; i <= n; i++) { const a = path[i - 1], b = path[i % n]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const t = { ...def, path, cum, length: cum[n] };
  // Curvatura (rad por unidade) em cada ponto: usada pelos rivais para frear e pelas zebras.
  t.kappa = path.map((_, i) => {
    const a = path[(i - 3 + n) % n], b = path[i], c = path[(i + 3) % n];
    return Math.abs(RC.wrap(Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]))) / (Math.hypot(c[0] - a[0], c[1] - a[1]) || 1);
  });
  // Zebras só nas curvas.
  t.kerbs = [];
  let run = null;
  for (let i = 0; i <= n; i++) {
    const on = t.kappa[i % n] > 0.09;
    if (on && !run) run = [];
    if (on) run.push(i % n);
    if (!on && run) { if (run.length > 3) t.kerbs.push(run); run = null; }
  }
  // Cenário: arquibancada e box na reta principal, torre, pórtico; árvores, pneus, palha, placas e fiscais.
  const rng = RC.mulberry32(def.id.length * 977 + n);
  t.props = [];
  const clear = (x, y, m) => RC.nearest(path, x, y, true).dist > TRACK_W / 2 + m;
  const add = (key, x, y, s = 1, opt = {}) => { t.props.push({ key, x, y, s, ...opt }); };
  for (let x = 4; x <= 22; x += 6.4) add('grandstand', x, -5.2, 1.25, { r: 2.6 });
  add('tower', -4, -5.6, 1.1, { r: 1 });
  for (let x = 2; x <= 22; x += 6.6) add('pits', x, 8.6, 1.25, { rect: [6.4, 1.6] });
  t.gantry = { x: 0.1, y: TRACK_W / 2 + 0.5 };
  for (let i = 0; i < n; i += 6) {
    const p = path[i], q = path[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    if (Math.abs(p[1]) < 10 && p[0] > -8 && p[0] < 28) continue;   // reta dos boxes já está ocupada
    const k = t.kappa[i];
    for (const side of [-1, 1]) {
      if (k > 0.09 && rng() < 0.55) {   // barreira de pneus/palha por fora da curva
        const off = TRACK_W / 2 + 3.2, x = p[0] + nx * off * side, y = p[1] + ny * off * side;
        if (clear(x, y, 2.4)) add(rng() < 0.5 ? 'tirewall' : 'straw', x, y, 1, { r: 0.9 });
        continue;
      }
      const r = rng(), off = TRACK_W / 2 + 4 + rng() * 9, x = p[0] + nx * off * side, y = p[1] + ny * off * side;
      if (!clear(x, y, 3.2)) continue;
      if (r < 0.42) add(rng() < 0.6 ? 'oak' : 'pine', x, y, 0.9 + rng() * 0.3, { r: 0.5, flip: rng() < 0.5 });
      else if (r < 0.5) add('billboard', x, y, 1.1, { r: 0.6 });
      else if (r < 0.56) add('marshal', x, y, 0.8, {});
      else if (r < 0.66) add('bush', x, y, 0.9, {});
    }
  }
  t.blockers = t.props.filter(p => p.r || p.rect).map(p => p.rect ? { x: p.x - p.rect[0] / 2, y: p.y - p.rect[1], w: p.rect[0], h: p.rect[1] } : { x: p.x, y: p.y - 0.1, r: p.r });
  const xs = path.map(p => p[0]), ys = path.map(p => p[1]);
  t.bounds = { x0: Math.min(...xs) - 14, x1: Math.max(...xs) + 14, y0: Math.min(...ys) - 14, y1: Math.max(...ys) + 14 };
  return t;
}

function sampleAt(t, d) {
  d = ((d % t.length) + t.length) % t.length;
  let lo = 0, hi = t.path.length; while (lo < hi - 1) { const m = (lo + hi) >> 1; if (t.cum[m] <= d) lo = m; else hi = m; }
  const a = t.path[lo], b = t.path[(lo + 1) % t.path.length], seg = t.cum[lo + 1] - t.cum[lo] || 1, k = (d - t.cum[lo]) / seg;
  const dx = (b[0] - a[0]) / seg, dy = (b[1] - a[1]) / seg;
  return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, dx, dy, i: lo };
}

// Ponto do traçado mais perto, procurando numa janela em volta do último índice (o circuito passa perto
// de si mesmo em alguns trechos e a busca global poderia pular de trecho).
function locate(t, x, y, hint) {
  const n = t.path.length;
  let best = { dist: Infinity, along: 0, i: 0 };
  const from = hint < 0 ? 0 : hint - 20, to = hint < 0 ? n : hint + 40;
  for (let j = from; j < to; j++) {
    const i = (j % n + n) % n, a = t.path[i], b = t.path[(i + 1) % n], vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy || 1;
    const k = Math.max(0, Math.min(1, ((x - a[0]) * vx + (y - a[1]) * vy) / l2));
    const d = Math.hypot(x - a[0] - vx * k, y - a[1] - vy * k);
    if (d < best.dist) best = { dist: d, along: t.cum[i] + k * Math.sqrt(l2), i };
  }
  return best;
}

// ============================================================ setup do carro (Parte 4 §Assistência ao carro)
// Asa: mais downforce = mais grip em curva, menos velocidade na reta.
// Balanço de freio: mais na frente = freia mais forte, mas trava e escorrega em frenagem forte.

function carParams(setup) {
  const w = setup.wing / 100, b = (setup.brake - 40) / 30;
  return {
    ...RC.CAR,
    maxSpeed: 9.4 * (1 - 0.15 * w),
    gripMul: 0.7 + 0.55 * w,
    brakeResponse: RC.CAR.steeringResponsiveness * (0.55 + 1.0 * b),
    lockRisk: Math.max(0, (b - 0.5) * 2),
  };
}
function setupFx(setup) {
  const p = carParams(setup);
  return {
    wing: `Vel. máxima ${Math.round(p.maxSpeed / 9.4 * 100)}% · grip em curva ${Math.round(p.gripMul * 100)}%`,
    brake: `Força de frenagem ${Math.round(p.brakeResponse / RC.CAR.steeringResponsiveness * 100)}%` + (p.lockRisk > 0 ? ` · risco de travar ${Math.round(p.lockRisk * 100)}%` : ' · sem travar as rodas'),
  };
}

// ============================================================ estado

const sc = RC.screen(), g = sc.g;
const $ = id => document.getElementById(id);
let mode = 'menu', selected = 0, raceMode = S.data.mode || 'race';
let track, cars, me, cam, timer, phase, lights, finished, particles = [], skids = [];
const SETS = {};

function getSetup(id) { return S.data.setup[id] || { wing: 50, brake: 55 }; }

function openSetup(i) {
  selected = i; const c = CIRCUITS[i], s = getSetup(c.id);
  RC.dialog(`<div class="card wide setup"><h2>Box — ${c.name}</h2>
    <p>Acerto do carro, uma vez só, antes da corrida (sem pit stop nem reajuste entre voltas).</p>
    <label>Ângulo de asa: <b id="wv">${s.wing}</b></label><input type="range" id="wing" min="0" max="100" step="5" value="${s.wing}">
    <div class="ends"><span>reta (menos asa)</span><span>curva (mais asa)</span></div><p class="fx" id="wfx"></p>
    <label>Balanço de freio: <b id="bv">${s.brake}% na frente</b></label><input type="range" id="brake" min="40" max="70" step="1" value="${s.brake}">
    <div class="ends"><span>mais atrás (estável)</span><span>mais na frente (forte, trava)</span></div><p class="fx" id="bfx"></p>
    <div class="row"><button class="btn" data-a="menu">Voltar</button><button class="btn go" data-a="grid">Para o grid</button></div></div>`,
    a => { if (a === 'menu') return showMenu(); S.data.setup[c.id] = read(); S.save(); startRace(i); });
  const read = () => ({ wing: +$('wing').value, brake: +$('brake').value });
  const upd = () => { const v = read(), fx = setupFx(v); $('wv').textContent = v.wing; $('bv').textContent = `${v.brake}% na frente`; $('wfx').textContent = fx.wing; $('bfx').textContent = fx.brake; };
  $('wing').oninput = upd; $('brake').oninput = upd; upd();
}

function newCar(along, lateral, imgs, params, extra) {
  const s = sampleAt(track, along);
  const x = s.x - s.dy * lateral, y = s.y + s.dx * lateral;
  return { x, y, vx: 0, vy: 0, ang: Math.atan2(s.dy, s.dx), target: 0, actual: 0, imgs, p: params, along: along, prevAlong: along, hint: s.i, lap: 0, half: false, lapStart: 0, laps: [], done: null, ...extra };
}

function startRace(i) {
  track = CIRCUITS[i].built; selected = i;
  const params = carParams(getSetup(track.id));
  // Grid 2 por fila, atrás da linha (Parte 4: largada = chegada).
  const L = track.length, slot = k => [L - 3 - Math.floor(k / 2) * 3.4, (k % 2 ? 1 : -1) * 1.1];
  cars = [];
  if (raceMode === 'race') {   // contra rivais o jogador larga em último
    RIVALS.forEach((r, k) => { const [al, lat] = slot(k); cars.push(newCar(al, lat, SETS[r.name], carParams({ wing: 50, brake: 52 }), { name: r.name, bot: r })); });
    const [al, lat] = slot(RIVALS.length);
    cars.push(me = newCar(al, lat, SETS.player, params, { name: 'VOCÊ', me: true }));
  } else cars.push(me = newCar(L - 3, 0, SETS.player, params, { name: 'VOCÊ', me: true }));
  cam = { x: me.x, y: me.y, z: RC.PPU };
  timer = 0; phase = 'lights'; lights = { t: 0, out: 3.2 + Math.random() * 0.8 }; finished = false;
  particles = []; skids = [];
  sc.mouse.has = false; sc.active = true; mode = 'race';
  $('menu').classList.add('hidden'); RC.hideDialog(); $('hud').classList.remove('hidden');
  $('pos-box').classList.toggle('hidden', raceMode !== 'race');
}

// ============================================================ física

function groundOf(c) { return c.dist > VALID ? 'grama' : 'asfalto'; }

function botAim(c) {
  const b = c.bot, ahead = sampleAt(track, c.along + b.look);
  let k = 0; for (let j = 0; j < 30; j++) k = Math.max(k, track.kappa[(c.hint + j) % track.path.length]);
  const f = Math.max(0.3, Math.min(1, 1 - k * 2.75)) * b.skill;
  const ax = ahead.x - ahead.dy * b.lane, ay = ahead.y + ahead.dx * b.lane;
  const dx = ax - c.x, dy = ay - c.y, d = Math.hypot(dx, dy) || 1;
  const dist = c.p.minDistanceForMovement + Math.sqrt(f) * (c.p.maxDistanceForTopSpeed - c.p.minDistanceForMovement);
  return { x: c.x + dx / d * dist, y: c.y + dy / d * dist };
}

function driveCar(c, aim, dt) {
  const gr = GROUND[groundOf(c)];
  const prevDir = Math.atan2(c.vy, c.vx), prevSp = Math.hypot(c.vx, c.vy);
  RC.drive(c, aim, dt, c.p, gr.grip * c.p.gripMul, gr.cap);
  // Travar as rodas: freio muito na frente + frenagem forte → o carro segue na direção em que vinha.
  const sp = Math.hypot(c.vx, c.vy);
  c.locked = c.p.lockRisk > 0 && prevSp > 4 && c.target * c.p.maxSpeed < prevSp - 3.2;
  if (c.locked) {
    const nd = Math.atan2(c.vy, c.vx), keep = prevDir + RC.wrap(nd - prevDir) * (1 - 0.85 * c.p.lockRisk);
    c.vx = Math.cos(keep) * sp; c.vy = Math.sin(keep) * sp;
  }
}

function step(dt) {
  if (mode !== 'race' || finished) return;
  if (phase === 'lights') { lights.t += dt; if (lights.t >= lights.out) { phase = 'go'; } else return; }
  timer += dt;
  for (const c of cars) {
    if (c.done) { c.vx *= 0.97; c.vy *= 0.97; c.x += c.vx * dt; c.y += c.vy * dt; continue; }
    if (c.bot) driveCar(c, botAim(c), dt);
    else if (sc.mouse.has) driveCar(c, sc.toWorld(cam, sc.mouse.x, sc.mouse.y), dt);
    RC.collide(c, track.blockers, 0.45, 0.4);
    const loc = locate(track, c.x, c.y, c.hint);
    c.hint = loc.i; c.dist = loc.dist; c.prevAlong = c.along; c.along = loc.along;
    const L = track.length;
    if (c.along > L * 0.4 && c.along < L * 0.6) c.half = true;
    if (c.prevAlong > L * 0.8 && c.along < L * 0.2 && c.half) {   // cruzou a linha andando para frente
      c.half = false; c.lap++;
      c.laps.push(timer - c.lapStart); c.lapStart = timer;
      if (c.lap >= track.laps) c.done = timer;
    }
    if (c.me) {
      if (groundOf(c) === 'grama' || c.locked) RC.emitDust(particles, c, c.locked ? 'rgba(230,230,230,' : 'rgba(120,160,70,');
      if (c.locked && Math.random() < 0.7) skids.push({ x: c.x, y: c.y + 0.2, a: c.ang, t: 0 });
    }
  }
  // Toque entre carros: empurra um para fora do outro e tira um pouco de velocidade dos dois.
  for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
    const a = cars[i], b = cars[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d > 0 && d < 1.0) {
      const nx = dx / d, ny = dy / d, pen = (1.0 - d) / 2;
      a.x -= nx * pen; a.y -= ny * pen; b.x += nx * pen; b.y += ny * pen;
      for (const c of [a, b]) { c.vx *= 0.92; c.vy *= 0.92; }
    }
  }
  if (skids.length > 400) skids.splice(0, skids.length - 400);
  if (me.done) finish();
}

function standings() {
  return [...cars].sort((a, b) => (a.done && b.done) ? a.done - b.done : a.done ? -1 : b.done ? 1 : (b.lap - a.lap) || (prog(b) - prog(a)));
}
// Progresso dentro da volta, contando o trecho do grid (atrás da linha) como volta 0.
function prog(c) { return c.half || c.along < track.length * 0.5 ? c.along : c.along - track.length; }

function finish() {
  finished = true;
  const best = Math.min(...me.laps), id = track.id;
  const prevBest = S.data.bestLap[id];
  if (!prevBest || best < prevBest.t) S.data.bestLap[id] = { t: best, name: S.data.lastName || 'VOCÊ' };
  const lapsTxt = me.laps.map((l, i) => `V${i + 1} ${RC.fmt(l)}`).join(' · ');
  if (raceMode === 'race') {
    const st = standings(), pos = st.indexOf(me) + 1;
    const h = (S.data.history[id] = S.data.history[id] || []); h.push({ pos, t: timer, date: Date.now() }); S.save();
    const wins = h.filter(r => r.pos === 1).length;
    RC.dialog(`<div class="card"><h2>${pos === 1 ? 'Vitória!' : `${pos}º lugar`}</h2><p>${lapsTxt}</p>
      <table class="results">${st.map((c, i) => `<tr class="${c.me ? 'me' : ''}"><td>${i + 1}º</td><td>${c.name}</td><td>${c.done ? RC.fmt(c.done) : `${c.lap} volta(s)`}</td></tr>`).join('')}</table>
      <p>Vitórias neste circuito: <b>${wins}</b> em ${h.length} corrida(s)</p>
      <div class="row"><button class="btn" data-a="retry">Repetir (R)</button><button class="btn go" data-a="menu">Voltar ao Menu (ESC)</button></div></div>`, act);
  } else {
    S.save();
    RC.finishDialog({ time: timer, lastName: S.data.lastName || '', act,
      lines: [lapsTxt, `Melhor volta: ${RC.fmt(best)}`],
      onSave: name => { S.data.lastName = name; if (S.data.bestLap[id].t === best) S.data.bestLap[id].name = name; S.submit(id, name, timer, { lap: best }); } });
  }
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
  CIRCUITS.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'track' + (i === selected ? ' sel' : '');
    b.innerHTML = `${c.name}<small>${c.sub}</small><i class="hold"></i>`;
    RC.holdButton(b, HOLD_MS, () => { selected = i; renderBoard(); document.querySelectorAll('.track').forEach((x, j) => x.classList.toggle('sel', j === i)); }, () => openSetup(i));
    box.appendChild(b);
  });
  document.querySelectorAll('[data-mode]').forEach(b => {
    b.classList.toggle('on', b.dataset.mode === raceMode);
    b.onclick = () => { raceMode = S.data.mode = b.dataset.mode; S.save(); showMenu(); };
  });
  renderBoard();
}
function renderBoard() {
  const c = CIRCUITS[selected], bl = S.data.bestLap[c.id], h = S.data.history[c.id] || [];
  $('board').innerHTML = RC.boardHtml(`Tempo total (solo) — ${c.name}`, S.board(c.id)) +
    `<p><b>Melhor volta:</b> ${bl ? `${RC.fmt(bl.t)} (${bl.name})` : '—'}</p>` +
    `<p><b>Contra rivais:</b> ${h.length ? `${h.filter(r => r.pos === 1).length} vitória(s) em ${h.length}` : 'nenhuma corrida ainda'}</p>`;
}

// ============================================================ desenho

let patGrass, patAsphalt;
function drawTrack(t, v) {
  g.fillStyle = patGrass || '#5f9e44'; g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
  g.lineJoin = g.lineCap = 'round';
  RC.strokePath(g, t.path, true); g.strokeStyle = '#cdbb94'; g.lineWidth = VALID * 2; g.stroke();          // acostamento de terra
  RC.strokePath(g, t.path, true); g.strokeStyle = patAsphalt || '#55575e'; g.lineWidth = TRACK_W; g.stroke();
  // Faixas brancas das bordas e zebras vermelho/branco nas curvas.
  g.save(); g.setLineDash([]); g.lineCap = 'butt';
  for (const side of [-1, 1]) {
    const edge = t.path.map((p, i) => { const q = t.path[(i + 1) % t.path.length], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [p[0] - dy / l * (TRACK_W / 2 - 0.12) * side, p[1] + dx / l * (TRACK_W / 2 - 0.12) * side]; });
    RC.strokePath(g, edge, true); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 0.12; g.stroke();
    for (const run of t.kerbs) {
      const kp = run.map(i => { const p = t.path[i], q = t.path[(i + 1) % t.path.length], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [p[0] - dy / l * (TRACK_W / 2 + 0.25) * side, p[1] + dx / l * (TRACK_W / 2 + 0.25) * side]; });
      RC.strokePath(g, kp); g.lineWidth = 0.5; g.strokeStyle = '#f4f1e8'; g.setLineDash([]); g.stroke();
      g.setLineDash([0.5, 0.5]); g.strokeStyle = '#d83a2e'; g.stroke(); g.setLineDash([]);
    }
  }
  g.restore();
  // Linha de largada/chegada quadriculada.
  const s0 = sampleAt(t, 0), ang = Math.atan2(s0.dy, s0.dx);
  g.save(); g.translate(s0.x, s0.y); g.rotate(ang);
  const q = 0.4; for (let r = 0; r < TRACK_W / q; r++) for (let c2 = 0; c2 < 2; c2++) { g.fillStyle = (r + c2) % 2 ? '#111' : '#fff'; g.fillRect(-q + c2 * q, -TRACK_W / 2 + r * q, q, q); }
  g.restore();
  for (const s of skids) if (RC.inView(v, s.x, s.y)) { g.save(); g.translate(s.x, s.y); g.rotate(s.a); g.fillStyle = 'rgba(20,20,20,.3)'; g.fillRect(-0.3, -0.35, 0.6, 0.12); g.fillRect(-0.3, 0.23, 0.6, 0.12); g.restore(); }
}

function drawScene(t, v) {
  const list = t.props.filter(p => RC.inView(v, p.x, p.y, 5));
  if (mode === 'race') for (const c of cars) list.push({ car: c, y: c.y });
  list.sort((a, b) => a.y - b.y);
  for (const o of list) {
    if (o.car) RC.drawCar(g, o.car.imgs, o.car.x, o.car.y, o.car.ang);
    else RC.drawProp(g, o.key, o.x, o.y, o.s, { flip: o.flip });
  }
  // Pórtico de largada passa por cima dos carros.
  RC.drawProp(g, 'gantry', t.gantry.x, t.gantry.y, 1.95, { noShadow: true });
}

function drawLights() {
  // Cinco luzes vermelhas acendem uma a uma; quando todas apagam, é largada.
  const n = phase === 'lights' ? Math.min(5, Math.floor(lights.t / 0.6)) : 0;
  if (phase !== 'lights' && timer > 1.2) return;
  const r = 16, gap = 44, x0 = sc.W / 2 - gap * 2, y = 120;
  g.fillStyle = 'rgba(20,20,26,.9)'; RC.roundRect(g, x0 - 30, y - 30, gap * 4 + 60, 60, 8); g.fill();
  for (let i = 0; i < 5; i++) { g.fillStyle = i < n ? '#ff3b30' : '#3a3a44'; g.fillRect(x0 + i * gap - r, y - r, r * 2, r * 2); }
  if (phase !== 'lights') { g.font = '700 46px "Pixelify Sans", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#3fcf5a'; g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeText('VAI!', sc.W / 2, y + 80); g.fillText('VAI!', sc.W / 2, y + 80); }
}

function drawMenuBg() {
  const t = CIRCUITS[selected].built, b = t.bounds;
  const z = Math.min(sc.W / (b.x1 - b.x0), sc.H / (b.y1 - b.y0));
  const v = sc.begin({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, z });
  drawTrack(t, v); drawScene(t, v); sc.end();
  g.fillStyle = 'rgba(20,22,30,.45)'; g.fillRect(0, 0, sc.W, sc.H);
}

const ord = n => `${n}º`;
let last = 0, acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
  g.setTransform(sc.DPR, 0, 0, sc.DPR, 0, 0);
  if (mode === 'menu') drawMenuBg();
  else {
    acc += dt; while (acc >= RC.FIXED) { step(RC.FIXED); acc -= RC.FIXED; }
    cam.x += (me.x - cam.x) * Math.min(1, dt * 6); cam.y += (me.y - cam.y) * Math.min(1, dt * 6);
    const v = sc.begin(cam);
    drawTrack(track, v);
    RC.drawParticles(g, particles, dt);
    if (sc.mouse.has && !finished && phase === 'go') RC.drawChevrons(g, me, sc.toWorld(cam, sc.mouse.x, sc.mouse.y));
    drawScene(track, v);
    sc.end();
    drawLights();
    $('time').textContent = RC.fmt(timer);
    const bl = S.data.bestLap[track.id];
    $('lapinfo').textContent = `Volta atual ${RC.fmt(timer - me.lapStart)}` + (me.laps.length ? ` · melhor ${RC.fmt(Math.min(...me.laps))}` : bl ? ` · recorde ${RC.fmt(bl.t)}` : '');
    $('lap').textContent = `${Math.min(track.laps, me.lap + 1)}/${track.laps}`;
    if (raceMode === 'race') $('pos').textContent = `${ord(standings().indexOf(me) + 1)}/${cars.length}`;
    $('speed').style.width = `${me.actual * 100}%`;
    $('prog').style.width = `${Math.max(0, prog(me)) / track.length * 100}%`;
    if (phase === 'lights' || !sc.mouse.has) {
      g.font = '700 22px "Pixelify Sans", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 4;
      const msg = phase === 'lights' ? 'Posicione o cursor · largada quando as luzes apagarem' : 'Mova o mouse (ou arraste o dedo) para pilotar';
      g.strokeText(msg, sc.W / 2, sc.H - 40); g.fillText(msg, sc.W / 2, sc.H - 40);
    }
  }
  requestAnimationFrame(frame);
}

addEventListener('keydown', e => {
  if (mode !== 'race' || document.activeElement?.tagName === 'INPUT') return;
  if (e.key === 'Escape') act('menu');
  if ((e.key === 'r' || e.key === 'R') && (finished || e.shiftKey)) act('retry');
});

async function boot() {
  const keys = [...RC.dirKeys('f1'), 'grandstand', 'pits', 'tower', 'gantry', 'tirewall', 'straw', 'billboard', 'marshal', 'oak', 'pine', 'bush', 'tiles/grass', 'tiles/asphalt'];
  await RC.loadImages(ART, keys);
  SETS.player = RC.carSet('f1');
  for (const r of RIVALS) SETS[r.name] = RC.carSet('f1', im => RC.recolor(im, 0, r.hue, 28));
  patGrass = RC.pattern(g, 'tiles/grass'); patAsphalt = RC.pattern(g, 'tiles/asphalt');
  for (const c of CIRCUITS) c.built = buildTrack(c);
  const start = CIRCUITS.findIndex(c => DEV.has(c.id));
  if (DEV.has('solo')) raceMode = 'solo';
  if (start >= 0) startRace(start); else showMenu();
  requestAnimationFrame(frame);
}
boot();
