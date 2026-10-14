// Paper Flight — protótipo jogável em JavaScript puro.
// Segue a Parte 1 do PaperFlight.md e porta do guia Unity o GameConfig.BuildStats, o PaperPlane (planeio com
// estol), o FlightInput (toque curto = vento, deslize = inclinação), o LaunchController (estilingue) e o
// MapSpawner (semente fixa por mapa). Valores: tabela "placeholders de MVP" da §12. Arte: Sprites/PaperFlight/.
'use strict';

const ART = '../../Sprites/PaperFlight/';
const VW = 180, VH = 320, PPM = 16;   // §8: 180×320, 16 px por metro
const SAVE_KEY = 'paperflight-save-v1';
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ============================================================ GameConfig (guia Fase 1.4 = GDD §12)

const CFG = {
  baseDrag: 0.012, dragMultiplierPerLevel: 0.9,
  baseStallSpeed: 7, stallSpeedReductionPerLevel: 0.4, minStallSpeed: 3, fullClimbMargin: 6,
  baseMaxClimbAngle: 20, climbAnglePerLevel: 3,
  baseLaunchSpeed: 14, launchSpeedPerLevel: 2,
  baseWindCharges: 1, windChargesPerLevel: 1, baseWindImpulse: 3, windImpulsePerLevel: 0.3,
  baseIncomeMultiplier: 1, incomePerLevel: 0.25, moneyPerMeter: 1,
  coinValue: 5, obstacleSpeedLoss: 0.4, maxLevel: 10,
  launchHeight: 2, minAngle: 0, maxAngle: 75, maxPullDistance: 3, minPower: 0.15,
  // PaperPlane
  neutralPitch: -8, maxDiveAngle: 60, stallDivePitch: -45, turnRate: 120, gravity: 9.81, minSpeed: 0.5,
  // FlightInput
  tapMaxDuration: 0.2, tapMaxMove: 0.02, fullPitchDrag: 0.15,
};
const upgradeCost = lvl => Math.round(20 * Math.pow(1.5, lvl));

const TRACKS = [
  { id: 'paper',  name: 'Papel',      icon: 'upgrade_paper',  desc: 'menos arrasto' },
  { id: 'fold',   name: 'Dobra',      icon: 'upgrade_fold',   desc: 'estol menor, sobe mais' },
  { id: 'launch', name: 'Lançamento', icon: 'upgrade_launch', desc: '+2 m/s no arremesso' },
  { id: 'wind',   name: 'Vento',      icon: 'upgrade_wind',   desc: '+1 carga, +10% força' },
  { id: 'income', name: 'Renda',      icon: 'upgrade_income', desc: '+0,25× no dinheiro' },
];

function buildStats(lv) {
  const stall = Math.max(CFG.minStallSpeed, CFG.baseStallSpeed - CFG.stallSpeedReductionPerLevel * lv.fold);
  return {
    launchSpeed: CFG.baseLaunchSpeed + CFG.launchSpeedPerLevel * lv.launch,
    drag: CFG.baseDrag * Math.pow(CFG.dragMultiplierPerLevel, lv.paper),
    stallSpeed: stall, fullClimbSpeed: stall + CFG.fullClimbMargin,
    maxClimbAngle: CFG.baseMaxClimbAngle + CFG.climbAnglePerLevel * lv.fold,
    windCharges: CFG.baseWindCharges + CFG.windChargesPerLevel * lv.wind,
    windImpulse: CFG.baseWindImpulse + CFG.windImpulsePerLevel * lv.wind,
    incomeMultiplier: CFG.baseIncomeMultiplier + CFG.incomePerLevel * lv.income,
  };
}

// Mapas (guia Fase 1.5 e Fase 6/9): meta, cor do céu, semente e os elementos sorteados com o mesmo molde.
const MAPS = [
  { key: '1_quintal',  name: 'Quintal',  goal: 300,  sky: ['#76C4F0', '#D6EEFA'], ground: 'ground_birdhouse', air: 'air_sparrow', seed: 11 },
  { key: '2_parque',   name: 'Parque',   goal: 600,  sky: ['#6EBEEE', '#CEECF6'], ground: 'ground_tree',      air: 'air_kite',    seed: 22 },
  { key: '3_praia',    name: 'Praia',    goal: 1000, sky: ['#5ABAF0', '#C8F0FA'], ground: 'ground_palm',      air: 'air_seagull', seed: 33 },
  { key: '4_cidade',   name: 'Cidade',   goal: 1500, sky: ['#82B8E2', '#DEE6F0'], ground: 'ground_lamppost',  air: 'air_drone',   seed: 44 },
  { key: '5_montanha', name: 'Montanha', goal: 2500, sky: ['#78AAE1', '#D8E8F6'], ground: 'ground_pine',      air: 'air_eagle',   seed: 55 },
];
const SPAWNS = [   // [tipo, peso, altura mín., altura máx.] (Fase 6.3)
  ['coin', 3, 2, 15], ['current', 1, 4, 4], ['ground', 1, 0, 0], ['air', 0.5, 6, 18],
];
const FIRST_SPAWN = 15, MIN_GAP = 6, MAX_GAP = 14;

function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// Gera os elementos até uma distância, sempre com a mesma semente (mapa igual em toda rodada, §6).
function buildElements(map, until) {
  const rng = mulberry32(map.seed), out = [];
  const total = SPAWNS.reduce((s, e) => s + e[1], 0);
  for (let x = FIRST_SPAWN; x < until; x += Math.max(1, MIN_GAP + (MAX_GAP - MIN_GAP) * rng())) {
    let roll = rng() * total, pick = SPAWNS[SPAWNS.length - 1];
    for (const e of SPAWNS) { roll -= e[1]; if (roll <= 0) { pick = e; break; } }
    const h = pick[2] + (pick[3] - pick[2]) * rng();
    const [type] = pick;
    if (type === 'coin') out.push({ type, x, y: h, r: 0.45 });
    else if (type === 'current') out.push({ type, x, y: h, w: 2.2, h: 7 });
    else if (type === 'ground') out.push({ type, x, y: 0, img: `obstacles/${map.key}_${map.ground}` });
    else out.push({ type, x, y: h, img: `obstacles/${map.key}_${map.air}` });
  }
  return out;
}

// ============================================================ save

const freshProgress = () => ({ map: 0, money: 0, lv: { paper: 0, fold: 0, launch: 0, wind: 0, income: 0 }, record: 0, goalReached: false, finished: false });
let P;
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.lv) return s; } catch (e) {} return freshProgress(); }
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(P)); } catch (e) {} }

// ============================================================ arte

const IMG = {};
function loadImages(keys) { return Promise.all(keys.map(k => new Promise(r => { const im = new Image(); im.onload = () => { IMG[k] = im; r(); }; im.onerror = () => { console.warn('sem arte', k); r(); }; im.src = `${ART}${k}.png`; }))); }

// ============================================================ estado do voo

const cv = document.getElementById('game'), g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
const $ = id => document.getElementById(id);
let state = 'hangar';   // hangar | aim | fly | result
let plane, stats, elements, cam, coinsRound, hitSet, windFx = [];
const map = () => MAPS[P.map];

function newRound() {
  stats = buildStats(P.lv);
  plane = { x: 0, y: CFG.launchHeight, speed: 0, pitch: 0, wind: stats.windCharges, flying: false, ext: [0, 0] };
  elements = buildElements(map(), map().goal * 1.6 + 400);
  cam = { x: plane.x + 3, y: 8 };
  coinsRound = 0; hitSet = new Set(); windFx = [];
  state = 'aim';
  aim.active = false;
  $('hangar').classList.add('hidden'); $('result').classList.add('hidden'); $('hud').classList.remove('hidden');
  $('tip').textContent = 'Puxe para trás e solte para lançar';
  renderWind();
}

// ------------------------------------------------------------ física (PaperPlane.FixedUpdate)

const climbAbility = () => Math.max(0, Math.min(1, (plane.speed - stats.stallSpeed) / (stats.fullClimbSpeed - stats.stallSpeed)));
function targetPitch() {
  if (plane.speed <= stats.stallSpeed) return CFG.stallDivePitch;   // estol: embica
  const maxUp = stats.maxClimbAngle * climbAbility();
  const input = flightInput.pitch;
  return input >= 0 ? lerp(CFG.neutralPitch, maxUp, input) : lerp(CFG.neutralPitch, -CFG.maxDiveAngle, -input);
}
const lerp = (a, b, t) => a + (b - a) * t;
const moveTowards = (a, b, d) => Math.abs(b - a) <= d ? b : a + Math.sign(b - a) * d;

function fixedStep(dt) {
  if (state !== 'fly') return;
  plane.pitch = moveTowards(plane.pitch, targetPitch(), CFG.turnRate * dt);
  let rad = plane.pitch * Math.PI / 180;
  const acc = -CFG.gravity * Math.sin(rad) - stats.drag * plane.speed * plane.speed;
  plane.speed = Math.max(CFG.minSpeed, plane.speed + acc * dt);
  let vx = Math.cos(rad) * plane.speed, vy = Math.sin(rad) * plane.speed;
  // Correntes de ar: aceleração externa que muda velocidade e direção (AirCurrent + AddExternalAcceleration).
  for (const e of elements) {
    if (e.type !== 'current') continue;
    if (Math.abs(plane.x - e.x) < e.w / 2 && Math.abs(plane.y - e.y) < e.h / 2) { vy += 12 * dt; }
  }
  if (vy !== Math.sin(rad) * plane.speed) {
    plane.speed = Math.max(CFG.minSpeed, Math.hypot(vx, vy));
    plane.pitch = Math.max(-80, Math.min(80, Math.atan2(vy, vx) * 180 / Math.PI));
  }
  plane.x += vx * dt; plane.y += vy * dt;
  // Moedas e obstáculos (cada obstáculo freia uma vez só).
  for (const e of elements) {
    if (Math.abs(e.x - plane.x) > 3) continue;
    if (e.type === 'coin' && !e.taken && Math.hypot(e.x - plane.x, e.y - plane.y) < e.r + 0.5) { e.taken = true; coinsRound += CFG.coinValue; sparkle(e.x, e.y); }
    if ((e.type === 'ground' || e.type === 'air') && !hitSet.has(e) && hitsObstacle(e)) {
      hitSet.add(e); plane.speed *= 1 - CFG.obstacleSpeedLoss; shakeT = 0.25;
    }
  }
  if (plane.y <= 0.15) land();   // §4.4: para na hora
}

// Colisão por pixel: o avião só bate onde o sprite do obstáculo tem tinta (como o PolygonCollider2D do guia).
const masks = {};
function hitsObstacle(e) {
  const im = IMG[e.img]; if (!im) return false;
  const w = im.width / PPM, h = im.height / PPM;
  const left = e.x - w / 2, bottom = e.type === 'ground' ? 0 : e.y - h / 2;
  const px = (plane.x - left) / w, py = 1 - (plane.y - bottom) / h;
  if (px < 0 || px > 1 || py < 0 || py > 1) return false;
  let m = masks[e.img];
  if (!m) { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const cg = c.getContext('2d'); cg.drawImage(im, 0, 0); m = masks[e.img] = cg.getImageData(0, 0, im.width, im.height); }
  const ix = Math.floor(px * (im.width - 1)), iy = Math.floor(py * (im.height - 1));
  return m.data[(iy * im.width + ix) * 4 + 3] > 40;
}

function land() {
  state = 'result';
  plane.y = 0.15; plane.speed = 0; plane.flying = false;
  const dist = Math.max(0, Math.floor(plane.x));
  const fromDist = Math.floor(dist * CFG.moneyPerMeter * stats.incomeMultiplier);
  const total = fromDist + coinsRound;   // §5.1: Renda não multiplica as moedas (placeholder)
  const newRecord = dist > P.record;
  if (newRecord) P.record = dist;
  const reachedNow = !P.goalReached && dist >= map().goal;
  if (dist >= map().goal) P.goalReached = true;
  P.money += total; persist();
  setTimeout(() => showResult({ dist, fromDist, total, newRecord, reachedNow }), 700);
}

function useWind() {
  if (plane.wind <= 0) return;
  plane.wind--; plane.speed += stats.windImpulse;
  windFx.push({ x: plane.x - 1, y: plane.y, t: 0 });
  renderWind();
}

// ------------------------------------------------------------ entrada: estilingue e FlightInput

const aim = { active: false, sx: 0, sy: 0, angle: 30, power: 0 };
const flightInput = { down: false, t0: 0, sx: 0, sy: 0, moved: 0, pitch: 0 };
function toApp(e) { const r = $('app').getBoundingClientRect(); return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }; }

$('app').addEventListener('pointerdown', e => {
  if (e.target.closest('button')) return;
  const p = toApp(e);
  if (state === 'aim') { aim.active = true; aim.sx = p.x; aim.sy = p.y; aim.power = 0; }
  if (state === 'fly') Object.assign(flightInput, { down: true, t0: performance.now(), sx: p.x, sy: p.y, moved: 0 });
});
addEventListener('pointermove', e => {
  const p = toApp(e);
  if (state === 'aim' && aim.active) {
    // Arrastar para baixo/esquerda lança para cima/direita (§3). 3 m de puxada = força cheia.
    const dx = aim.sx - p.x, dy = p.y - aim.sy;   // vetor oposto ao arrasto, com y para cima
    const pull = Math.hypot(dx, dy) / 2 / PPM;     // 2× = escala do HTML sobre o jogo
    aim.power = Math.min(1, pull / CFG.maxPullDistance);
    if (pull > 0.1) aim.angle = Math.max(CFG.minAngle, Math.min(CFG.maxAngle, Math.atan2(dy, Math.max(0.001, dx)) * 180 / Math.PI));
    plane.pitch = aim.angle;
  }
  if (state === 'fly' && flightInput.down) {
    const dy = (flightInput.sy - p.y) / 640;      // deslize para cima = nariz para cima
    flightInput.moved = Math.max(flightInput.moved, Math.hypot(p.x - flightInput.sx, p.y - flightInput.sy) / 640);
    flightInput.pitch = Math.max(-1, Math.min(1, dy / CFG.fullPitchDrag));
  }
});
addEventListener('pointerup', () => {
  if (state === 'aim' && aim.active) {
    aim.active = false;
    if (aim.power < CFG.minPower) { aim.power = 0; return; }   // puxada curta demais: cancela
    plane.pitch = aim.angle; plane.speed = Math.max(CFG.minSpeed, stats.launchSpeed * aim.power);
    state = 'fly'; plane.flying = true;
    $('tip').textContent = 'Toque rápido = vento · deslize = nariz';
    setTimeout(() => { if (state === 'fly') $('tip').textContent = ''; }, 2500);
  } else if (state === 'fly' && flightInput.down) {
    const dur = (performance.now() - flightInput.t0) / 1000;
    if (dur <= CFG.tapMaxDuration && flightInput.moved <= CFG.tapMaxMove) useWind();
    flightInput.down = false; flightInput.pitch = 0;   // soltar devolve o nariz ao neutro
  }
});
addEventListener('keydown', e => {   // atalhos de teste no PC
  if (state === 'fly' && e.key === ' ') useWind();
  if (state === 'fly' && e.key === 'ArrowUp') flightInput.pitch = 1;
  if (state === 'fly' && e.key === 'ArrowDown') flightInput.pitch = -1;
});
addEventListener('keyup', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') flightInput.pitch = 0; });

// ============================================================ telas

function renderWind() {
  $('wind').innerHTML = Array.from({ length: stats.windCharges }, (_, i) => `<img src="${ART}common/wind_puff.png" class="${i < plane.wind ? '' : 'off'}">`).join('');
}

function showHangar() {
  state = 'hangar';
  $('hud').classList.add('hidden'); $('result').classList.add('hidden');
  const m = map(), st = buildStats(P.lv);
  const last = P.map === MAPS.length - 1;
  $('hangar').innerHTML = `
    <div class="head"><h1>${P.map + 1}. ${m.name}</h1><div class="money"><img src="${ART}common/coin.png">${P.money}</div></div>
    <div class="panel info">Recorde <b>${P.record} m</b> · Meta <b>${m.goal} m</b>
      <div class="goalbar"><i style="width:${Math.min(100, P.record / m.goal * 100)}%"></i></div>
      <span style="font-size:12px;color:#7b6a58">Lança ${st.launchSpeed} m/s · estol ${st.stallSpeed.toFixed(1)} m/s · ${st.windCharges} vento(s) · renda ×${st.incomeMultiplier.toFixed(2)}</span></div>
    <div class="panel ups">${TRACKS.map(t => {
      const lvl = P.lv[t.id], max = lvl >= CFG.maxLevel, cost = upgradeCost(lvl);
      return `<div class="up"><img src="${ART}icons/${t.icon}.png"><div class="n">${t.name}<small>${t.desc}</small>
        <div class="lv">${Array.from({ length: CFG.maxLevel }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div></div>
        <button class="btn" data-up="${t.id}" ${max || P.money < cost ? 'disabled' : ''}>${max ? 'MÁX' : cost}</button></div>`;
    }).join('')}</div>
    <div class="row"><button class="btn gold" id="launch" style="height:56px;font-size:24px">Lançar</button></div>
    ${P.goalReached && !last ? `<div class="row"><button class="btn" id="next">Próximo mapa →</button></div>` : ''}
    ${P.goalReached && last ? `<p class="note" style="color:#fff">Último mapa completo! Continue voando na Montanha.</p>` : ''}
    <p class="note" style="color:#e6eef6">Ao avançar de mapa, upgrades, dinheiro e recorde zeram (GDD §6).</p>`;
  $('hangar').querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
    const id = b.dataset.up, cost = upgradeCost(P.lv[id]);
    if (P.money < cost || P.lv[id] >= CFG.maxLevel) return;
    P.money -= cost; P.lv[id]++; persist(); showHangar();
  });
  $('launch').onclick = newRound;
  if ($('next')) $('next').onclick = () => {
    if (!confirm(`Ir para ${MAPS[P.map + 1].name}? Upgrades, dinheiro e recorde vão zerar.`)) return;
    const next = P.map + 1; P = freshProgress(); P.map = next; persist(); showHangar();
  };
  $('hangar').classList.remove('hidden');
  // Fundo do hangar: o cenário parado no início do mapa.
  stats = buildStats(P.lv);
  plane = { x: 0, y: CFG.launchHeight, speed: 0, pitch: 0, wind: 0 };
  elements = buildElements(map(), 200); cam = { x: 3, y: 8 };
}

function showResult(r) {
  $('hud').classList.add('hidden');
  const m = map();
  $('result').innerHTML = `<div class="panel">
    <div>Distância</div><div class="big">${r.dist} m</div>
    ${r.newRecord ? '<div class="flag">Novo recorde!</div>' : `<div>Recorde: ${P.record} m</div>`}
    ${r.reachedNow ? `<div class="flag">Meta de ${m.goal} m batida! Próximo mapa liberado.</div>` : ''}
    <div class="lines" style="margin-top:8px">
      <div><span>Distância × renda (×${stats.incomeMultiplier.toFixed(2)})</span><b>${r.fromDist}</b></div>
      <div><span>Moedas</span><b>${coinsRound}</b></div>
      <div class="tot"><span>Total</span><span>${r.total}</span></div>
    </div></div>
    <div class="row"><button class="btn gold" id="again">Hangar</button></div>`;
  $('result').classList.remove('hidden');
  $('again').onclick = showHangar;
}

// ============================================================ desenho (180×320, pixel art)

let shakeT = 0;
const sparkles = [];
function sparkle(x, y) { sparkles.push({ x, y, t: 0 }); }
const W2S = (x, y) => [Math.round((x - cam.x) * PPM + VW / 2), Math.round(VH / 2 - (y - cam.y) * PPM)];

function drawLayer(img, factor, baseY) {
  if (!img) return;
  const w = img.width, off = -((cam.x * PPM * factor) % w);
  const [, gy] = W2S(0, 0);
  const y = gy - img.height + baseY - (cam.y - 8) * PPM * (1 - factor) * 0.15;
  for (let x = off - w; x < VW + w; x += w) g.drawImage(img, Math.round(x), Math.round(y));
}

function draw(dt) {
  const m = map();
  // Céu em degradê (topo → horizonte).
  const sky = g.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, m.sky[0]); sky.addColorStop(1, m.sky[1]);
  g.fillStyle = sky; g.fillRect(0, 0, VW, VH);
  const sx = shakeT > 0 ? Math.round(Math.sin(shakeT * 80) * 2) : 0;
  g.save(); g.translate(sx, 0);
  // Parallax: longe (mais lento) e perto.
  drawLayer(IMG[`backgrounds/${m.key}_far`], 0.25, 4);
  drawLayer(IMG[`backgrounds/${m.key}_near`], 0.55, 2);
  // Chão: superfície + preenchimento em tiles de 16 px.
  const surf = IMG[`ground/${m.key}_surface`], fill = IMG[`ground/${m.key}_fill`];
  const [, gy] = W2S(0, 0);
  const start = -((cam.x * PPM) % 16) - 16;
  for (let x = start; x < VW + 16; x += 16) {
    if (surf) g.drawImage(surf, Math.round(x), gy);
    for (let y = gy + 16; y < VH; y += 16) if (fill) g.drawImage(fill, Math.round(x), y);
  }
  // Bandeira da meta e marcador do recorde.
  const flag = IMG['common/goal_flag'];
  if (flag) { const [fx, fy] = W2S(m.goal, 0); if (fx > -20 && fx < VW + 20) g.drawImage(flag, fx - 8, fy - flag.height); }
  if (P.record > 0) { const [rx, ry] = W2S(P.record, 0); if (rx > -10 && rx < VW + 10) { g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(rx, ry - 30, 1, 30); g.font = '8px "Pixelify Sans"'; g.fillText('recorde', rx + 2, ry - 24); } }
  // Elementos.
  for (const e of elements) {
    const [x, y] = W2S(e.x, e.y);
    if (x < -40 || x > VW + 40) continue;
    if (e.type === 'coin' && !e.taken && IMG['common/coin']) g.drawImage(IMG['common/coin'], x - 8, y - 8 + Math.round(Math.sin(performance.now() / 200 + e.x) * 1));
    if (e.type === 'current' && IMG['common/air_current']) { g.globalAlpha = 0.6; g.drawImage(IMG['common/air_current'], x - 24, y - 64); g.globalAlpha = 1; }
    if (e.type === 'ground' && IMG[e.img]) g.drawImage(IMG[e.img], x - IMG[e.img].width / 2, y - IMG[e.img].height);
    if (e.type === 'air' && IMG[e.img]) g.drawImage(IMG[e.img], x - IMG[e.img].width / 2, y - IMG[e.img].height / 2);
  }
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i]; s.t += dt; if (s.t > 0.4) { sparkles.splice(i, 1); continue; }
    const [x, y] = W2S(s.x, s.y); g.fillStyle = '#fff6a0';
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + s.t * 6; g.fillRect(Math.round(x + Math.cos(a) * s.t * 30), Math.round(y + Math.sin(a) * s.t * 30), 2, 2); }
  }
  for (let i = windFx.length - 1; i >= 0; i--) {
    const w = windFx[i]; w.t += dt; if (w.t > 0.5) { windFx.splice(i, 1); continue; }
    const [x, y] = W2S(w.x - w.t * 3, w.y); g.globalAlpha = 1 - w.t * 2;
    if (IMG['common/wind_puff']) g.drawImage(IMG['common/wind_puff'], x - 16, y - 16); g.globalAlpha = 1;
  }
  // Linha de mira do estilingue (só a linha, sem trajetória prevista — §3 placeholder).
  if (state === 'aim' && aim.active && aim.power > 0) {
    const [px, py] = W2S(plane.x, plane.y), r = aim.angle * Math.PI / 180, L = 8 + aim.power * 4 * PPM;
    g.fillStyle = aim.power >= CFG.minPower ? '#fff' : '#ffb0b0';
    for (let d = 10; d < L; d += 5) g.fillRect(Math.round(px + Math.cos(r) * d), Math.round(py - Math.sin(r) * d), 2, 2);
  }
  // Avião (rotação livre, §8 placeholder).
  const pim = IMG[`planes/plane_${m.key}`];
  if (pim) {
    const [px, py] = W2S(plane.x, plane.y);
    g.save(); g.translate(px, py); g.rotate(-plane.pitch * Math.PI / 180); g.drawImage(pim, -16, -16); g.restore();
  }
  g.restore();
}

// ============================================================ laço

let scale = 1;
function fit() {
  scale = Math.min(innerWidth / 360, innerHeight / 640);
  const a = $('app'); a.style.transform = `scale(${scale})`;
  a.style.left = `${(innerWidth - 360 * scale) / 2}px`; a.style.top = `${(innerHeight - 640 * scale) / 2}px`;
}

let last = 0, acc = 0;
const FIXED = 1 / 60;
function frame(t) {
  const dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
  acc += dt; while (acc >= FIXED) { fixedStep(FIXED); acc -= FIXED; }
  shakeT = Math.max(0, shakeT - dt);
  if (plane) {
    // CameraFollow: segue com folga à frente, sem descer abaixo de y = 8 (o chão sempre aparece embaixo).
    const tx = plane.x + 3, ty = Math.max(8, plane.y);
    cam.x += (tx - cam.x) * Math.min(1, dt * 10); cam.y += (ty - cam.y) * Math.min(1, dt * 6);
    draw(dt);
  }
  if (state === 'fly' || state === 'aim') {
    $('dist').textContent = `${Math.max(0, Math.floor(plane.x))} m`;
    $('goal').textContent = `meta ${map().goal} m · recorde ${P.record} m`;
    // Velocímetro da regra do planeio: vermelho = sem subida, amarelo = limitada, verde = plena (§9).
    const ca = climbAbility(), sp = $('speed');
    sp.style.width = `${Math.min(92, plane.speed / (stats.fullClimbSpeed * 1.4) * 92)}%`;
    sp.style.background = plane.speed <= stats.stallSpeed ? '#e04848' : ca < 1 ? '#f2c443' : '#5cc85a';
  }
  requestAnimationFrame(frame);
}

async function boot() {
  const keys = ['common/coin', 'common/goal_flag', 'common/wind_puff', 'common/air_current'];
  for (const m of MAPS) keys.push(`planes/plane_${m.key}`, `backgrounds/${m.key}_far`, `backgrounds/${m.key}_near`, `ground/${m.key}_surface`, `ground/${m.key}_fill`, `obstacles/${m.key}_${m.ground}`, `obstacles/${m.key}_${m.air}`);
  await loadImages(keys);
  P = load();
  if (DEV.has('rich')) { P.money += 5000; persist(); }
  const mp = [...DEV].find(k => /^m[1-5]$/.test(k));
  if (mp) { P = { ...freshProgress(), map: +mp[1] - 1, money: P.money }; persist(); }
  addEventListener('resize', fit); fit();
  showHangar();
  requestAnimationFrame(frame);
}
boot();
