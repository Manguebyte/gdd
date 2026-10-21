// 8-Bit Armageddon — protótipo jogável em JavaScript puro.
// Segue a Parte 1 do GDD (GDD_8-Bit_Armageddon.md): Satellites, Quadrants, Waves, 13 Stats,
// Mothership, Planet Cores/Skins, conquistas, recorde de Wave e save local. Sem moeda permanente:
// tudo o que fortalece o planeta é comprado dentro da run, com Shards (Seção 5.1).
// A arte vem direto de Sprites/8-Bit-Armageddon/ (fonte única), sem cópias.
'use strict';

const ART = '../../Sprites/8-Bit-Armageddon/';
const REF_W = 320, REF_H = 180;   // resolução de referência
const PPU = 16;                   // pixels por unidade de mundo
const PLANET_R = 1;
const ORBIT_R = 1.75;
const SPAWN_R = 12;
const MAX_ENEMIES = 150;
const PROJECTILE_SPEED = 10;      // "Em aberto" no GDD: valor inicial do código
const DEG = Math.PI / 180;
const DRAWER_STRIP_H = 22;         // faixa das abas (gaveta fechada)
const DRAWER_OPEN_H = 60;          // gaveta aberta: faixa + uma fileira de cards compactos

// ============================================================ dados de design

const STATS = [
  { id: 'damage',       track: 'offense', name: 'Damage',            base: 10,  inc: 3,     cap: null, cost:  5, icon: 0,  fmt: v => fmt(v), desc: 'Dano de cada tiro dos Satellites.' },
  { id: 'attackSpeed',  track: 'offense', name: 'Attack Speed',      base: 1,   inc: 0.08,  cap: 6,    cost:  6, icon: 1,  fmt: v => v.toFixed(2) + '/s', desc: 'Tiros por segundo de cada Satellite.' },
  { id: 'critChance',   track: 'offense', name: 'Critical Chance',   base: 0,   inc: 0.015, cap: 0.8,  cost:  8, icon: 2,  fmt: v => pct(v), desc: 'Chance de um tiro ser crítico.' },
  { id: 'critFactor',   track: 'offense', name: 'Critical Factor',   base: 1.5, inc: 0.1,   cap: 6,    cost:  8, icon: 3,  fmt: v => v.toFixed(1) + 'x', desc: 'Multiplicador do dano de um tiro crítico.' },
  { id: 'attackRange',  track: 'offense', name: 'Attack Range',      base: 4,   inc: 0.15,  cap: 8,    cost:  6, icon: 4,  fmt: v => v.toFixed(2) + 'u', desc: 'Distância máxima até onde os Satellites atiram.' },
  { id: 'impetus',      track: 'offense', name: 'Impetus',           base: 0,   inc: 0.004, cap: 0.12, cost: 10, icon: 5,  fmt: v => pct(v) + '/u', desc: 'Dano extra por unidade de distância entre o Satellite e o alvo.' },
  { id: 'orbitSpeed',   track: 'offense', name: 'Orbit Speed',       base: 45,  inc: 5,     cap: 180,  cost:  6, icon: 6,  fmt: v => Math.round(v) + '°/s', desc: 'Velocidade da órbita: menos tempo com Quadrants sem cobertura.' },
  { id: 'hitpoints',    track: 'defense', name: 'Hitpoints',         base: 100, inc: 25,    cap: null, cost:  5, icon: 7,  fmt: v => fmt(v), desc: 'HP máximo do planeta. A compra também cura a mesma quantidade.' },
  { id: 'regen',        track: 'defense', name: 'Regeneration',      base: 0,   inc: 0.4,   cap: null, cost:  8, icon: 8,  fmt: v => v.toFixed(1) + '/s', desc: 'HP que o planeta recupera por segundo.' },
  { id: 'defAbs',       track: 'defense', name: 'Defense (abs.)',    base: 0,   inc: 0.5,   cap: null, cost:  8, icon: 9,  fmt: v => v.toFixed(1), desc: 'Dano fixo removido de cada golpe no planeta. Forte contra muitos golpes fracos.' },
  { id: 'defRel',       track: 'defense', name: 'Defense (rel.)',    base: 0,   inc: 0.015, cap: 0.75, cost: 10, icon: 10, fmt: v => pct(v), desc: 'Porcentagem do dano removida de cada golpe no planeta. Forte contra golpes grandes.' },
  { id: 'resBonus',     track: 'utility', name: 'Resource Bonus',    base: 0,   inc: 0.05,  cap: null, cost:  6, icon: 11, fmt: v => '+' + pct(v), desc: 'Shards a mais por nave destruída.' },
  { id: 'resWave',      track: 'utility', name: 'Resource per Wave', base: 0,   inc: 0.10,  cap: null, cost:  6, icon: 12, fmt: v => '+' + pct(v), desc: 'Bônus de Shards a mais ao limpar a tela (Wave Clear).' },
];
const STAT = Object.fromEntries(STATS.map(s => [s.id, s]));

const TRACKS = [
  { id: 'offense',    name: 'Offense',    icon: 13 },
  { id: 'defense',    name: 'Defense',    icon: 14 },
  { id: 'utility',    name: 'Utility',    icon: 15 },
  { id: 'satellites', name: 'Satellites', icon: 16 },
];
const ICON = { shards: 17, trophy: 19, trophyLocked: 20 };


// Satellites extras são comprados durante a run, com Shards, na aba Satellites da gaveta
// (não são Stats). Custo do 2º, 3º e 4º Satellite — valor inicial, ajustar jogando.
const SATELLITE_COSTS = [10, 50, 100];
const MAX_SATELLITES = 4;
const SATELLITE_DESC = 'Mais um Satellite na órbita. Todos ficam igualmente espaçados e cada um só atira no Quadrant onde está.';

const CORES = [
  { id: 'Terra', name: 'Terra Core', mods: 'Equilibrado', skins: ['Classic', 'Ocean', 'Desert'] },
  { id: 'Ice',   name: 'Ice Core',   mods: '+30% Defense · -20% Attack Speed · +0,5u Range', skins: ['Classic', 'Aurora', 'Crystal'] },
  { id: 'Magma', name: 'Magma Core', mods: '+30% Damage · -25% HP · -0,5u Range · +15°/s órbita', skins: ['Classic', 'Obsidian', 'Solar'] },
];

const ENEMIES = {
// speed: 20% abaixo do GDD (0,8 / 2,0 / 1,2 / 0,5), pedido do playtest: as naves estavam rápidas demais.
  grunt:   { hp: 10, dmg: 5,  speed: 0.64, shards: 1,   r: 0.5,  wave: 1, weight: 50 },
  scout:   { hp: 6,  dmg: 3,  speed: 1.6,  shards: 1,   r: 0.5,  wave: 3, weight: 25 },
  swarmer: { hp: 3,  dmg: 2,  speed: 0.96, shards: 0.5, r: 0.25, wave: 6, weight: 15 },
  brute:   { hp: 80, dmg: 20, speed: 0.4,  shards: 4,   r: 0.75, wave: 8, weight: 10 },
};
const MOTHERSHIP = { hp: 1200, laser: 25, shards: 50, r: 1.5 };

const PRIORITIES = [
  { id: 'closest',   name: 'Closest' },
  { id: 'weakest',   name: 'Weakest' },
  { id: 'strongest', name: 'Strongest' },
  { id: 'farthest',  name: 'Farthest' },
];

// Conquistas: reward = { core } / { skin: [core, skin] }, ou null (só o troféu).
const ACHIEVEMENTS = [
  { id: 'firstContact', name: 'First Contact',    cond: 'Completar a primeira run',              reward: null },
  { id: 'holdingLine',  name: 'Holding the Line', cond: 'Chegar à Wave 10',                     reward: null },
  { id: 'frozen',       name: 'Frozen Resolve',   cond: 'Chegar à Wave 20',                     reward: { core: 'Ice' } },
  { id: 'giantSlayer',  name: 'Giant Slayer',     cond: 'Destruir a primeira Mothership',       reward: { skin: ['Terra', 'Ocean'] } },
  { id: 'tripleThreat', name: 'Triple Threat',    cond: 'Destruir 3 Motherships (total)',       reward: { core: 'Magma' } },
  { id: 'deepSpace',    name: 'Deep Space',       cond: 'Chegar à Wave 40',                     reward: { skin: ['Terra', 'Desert'] } },
  { id: 'glacier',      name: 'Glacier',          cond: 'Wave 30 com Ice Core',                 reward: { skin: ['Ice', 'Aurora'] } },
  { id: 'absoluteZero', name: 'Absolute Zero',    cond: 'Wave 30, Ice Core, sem Offense',       reward: { skin: ['Ice', 'Crystal'] } },
  { id: 'eruption',     name: 'Eruption',         cond: '1.000 kills numa run com Magma Core',  reward: { skin: ['Magma', 'Obsidian'] } },
  { id: 'glassCannon',  name: 'Glass Cannon',     cond: 'Wave 25, Magma Core, sem Hitpoints',   reward: { skin: ['Magma', 'Solar'] } },
  { id: 'sniper',       name: 'Sniper',           cond: 'Hit de +10.000 com Impetus > 0',       reward: null },
  { id: 'criticalMass', name: 'Critical Mass',    cond: '500 críticos numa run',                reward: null },
  { id: 'untouchable',  name: 'Untouchable',      cond: 'Mothership sem levar dano na Boss Wave', reward: null },
  { id: 'cleanSweep',   name: 'Clean Sweep',      cond: '10 Wave Clears seguidos antes do timer', reward: null },
  { id: 'fullArsenal',  name: 'Full Arsenal',     cond: 'Ter 4 Satellites',                     reward: null },
];
const ACH = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

// ============================================================ utilidades

const fmt = v => v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e4 ? (v / 1e3).toFixed(1) + 'k' : String(Math.round(v));
const pct = v => (Math.round(v * 1000) / 10) + '%';
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const normDeg = d => ((d % 360) + 360) % 360;
const quadOf = deg => Math.floor(normDeg(deg) / 90) % 4;   // 0 cima-dir, 1 cima-esq, 2 baixo-esq, 3 baixo-dir
const $ = (sel, root = document) => root.querySelector(sel);
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function iconHtml(i) { return `<span class="icon" style="background-position:${-(i % 8) * 32 - 8}px ${-Math.floor(i / 8) * 32 - 8}px"></span>`; }
function planetHtml(core, skin, locked) {
  return `<span class="planet-spin${locked ? ' locked' : ''}" style="background-image:url('${ART}Planet/SPR_Planet_${core}_${skin}_Rotate.png')"></span>`;
}

// ============================================================ save local (Seção 7.3)

const SAVE_KEY = 'armageddon.save.v1';
function defaultSave() {
  return {
    version: 1,
    cores: ['Terra'],
    skins: ['Terra_Classic', 'Ice_Classic', 'Magma_Classic'],
    core: 'Terra', skin: 'Classic',
    ach: {},                       // id -> true quando desbloqueada
    totals: { motherships: 0 },
    hints: {},
    best: 0,
    settings: { shake: true, dmgNumbers: true, quadrants: true, reduceFlashes: false, fps30: false },
  };
}
let save = defaultSave();
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw), d = defaultSave();
      save = Object.assign(d, s, { settings: Object.assign(d.settings, s.settings), totals: Object.assign(d.totals, s.totals) });
    }
  } catch (e) { /* save corrompido ou storage bloqueado: começa do zero */ }
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* sem storage */ } }

// ============================================================ arte

const IMG = {};
const IMAGE_LIST = {
  bg: 'Backgrounds/SPR_Background_Space.png',
  twinkle: 'Backgrounds/SPR_Background_StarTwinkle.png',
  grunt: 'Enemies/SPR_Enemy_Grunt.png',
  scout: 'Enemies/SPR_Enemy_Scout.png',
  swarmer: 'Enemies/SPR_Enemy_Swarmer.png',
  brute: 'Enemies/SPR_Enemy_Brute.png',
  mothership: 'Enemies/SPR_Enemy_Mothership.png',
  satellite: 'Satellites/SPR_Satellite.png',
  projectile: 'Projectiles/SPR_Projectile_Satellite.png',
  expSmall: 'VFX/SPR_VFX_Explosion_Small.png',
  expBig: 'VFX/SPR_VFX_Explosion_Big.png',
  expMother: 'VFX/SPR_VFX_Explosion_Mothership.png',
  laserWarn: 'VFX/SPR_VFX_Laser_Warning.png',
  laserBeam: 'VFX/SPR_VFX_Laser_Beam.png',
  laserImpact: 'VFX/SPR_VFX_Laser_Impact.png',
  arrows: 'UI/SPR_UI_SpawnSectorArrow.png',
};
for (const c of CORES) for (const s of c.skins) IMAGE_LIST[`planet_${c.id}_${s}`] = `Planet/SPR_Planet_${c.id}_${s}_Rotate.png`;

function loadImages() {
  return Promise.all(Object.entries(IMAGE_LIST).map(([k, path]) => new Promise(res => {
    const im = new Image();
    im.onload = () => { IMG[k] = im; res(); };
    im.onerror = () => { console.warn('Falha ao carregar', path); res(); };
    im.src = ART + path;
  })));
}

// Silhueta branca de um sprite (flash de dano). Desenhar imagens de file:// num canvas é permitido;
// só ler pixels é que seria bloqueado, então isso funciona sem servidor.
const whiteCache = new Map();
function whiteOf(img) {
  let c = whiteCache.get(img);
  if (!c) {
    c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    whiteCache.set(img, c);
  }
  return c;
}

// ============================================================ tela (Pixel Perfect)

const canvas = $('#world');
const ctx = canvas.getContext('2d');
const ui = $('#ui');
const stage = $('#stage');
let P = 1, VW = REF_W, VH = REF_H;   // escala inteira e tamanho da vista em pixels de jogo
let bgTiles = [], bgStars = [];

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  // Escala inteira em pixels FÍSICOS do aparelho: no PC (dpr 1) é 1×, 2×, 3×…; num celular com dpr 3
  // pode ser 5/3 = 1,67× em pixels CSS, que continua sendo 5 pixels físicos por pixel de jogo (sem borrão).
  const dpr = window.devicePixelRatio || 1;
  const raw = Math.min(w / REF_W, h / REF_H);
  P = Math.max(1, Math.floor(raw * dpr)) / dpr;
  if (dpr === 1) P = Math.max(1, P);
  VW = Math.ceil(w / P); VH = Math.ceil(h / P);   // proporção diferente de 16:9 mostra mais espaço
  canvas.width = VW; canvas.height = VH;
  canvas.style.width = VW * P + 'px'; canvas.style.height = VH * P + 'px';
  ui.style.width = VW + 'px'; ui.style.height = VH + 'px';
  ui.style.transform = `scale(${P})`;
  ctx.imageSmoothingEnabled = false;
  const cols = Math.ceil(VW / 32) + 2, rows = Math.ceil(VH / 32) + 2;
  bgTiles = Array.from({ length: cols * rows }, () => Math.floor(Math.random() * 4));
  bgTiles.cols = cols;
  bgStars = Array.from({ length: Math.round(VW * VH / 2600) }, () => ({ x: Math.random() * VW, y: Math.random() * VH, ph: Math.random() * 4 }));
}
window.addEventListener('resize', () => {
  resize();
  // Só reajusta a altura da gaveta: reconstruir os cards perderia a posição da rolagem.
  if (hud && drawerTrack) hud.drawer.style.height = DRAWER_OPEN_H + 'px';
  if (hud) updateArrows();
});

// ============================================================ estado da run

let run = null;
let screen = 'menu';
let drawerTrack = null;     // aba aberta da gaveta, ou null
let buyQty = 1;             // 1, 10 ou Infinity (Max)
let camY = 0;               // deslocamento vertical da câmera (desliza quando a gaveta abre)
let shake = 0;
let clock = 0;              // tempo real (animações de UI/fundo)

function newRun() {
  const r = {
    core: save.core, skin: save.skin,
    levels: Object.fromEntries(STATS.map(s => [s.id, 0])),
    shards: 10, totalShards: 0, shardFrac: 0,   // 10 Shards iniciais (o GDD diz 5): dá para 1–2 Upgrades logo no início
    wave: 0, waveTimer: 0, warn: 0, warnWave: 0, warnSectors: [], waveTypes: [],
    queue: [], unpaid: [], enemies: [], projectiles: [], fx: [], nums: [],
    satAngle: 90, sats: [], quadFlash: [0, 0, 0, 0],
    time: 0, kills: 0, crits: 0, mothershipsKilled: 0,
    boughtOffense: false, boughtHp: false, cleanStreak: 0,
    bossHitFree: false, planetFlash: 0, paused: false, over: false,
  };
  r.sats.push({ priority: 'closest', cd: 0 });   // toda run começa com 1 Satellite
  run = r;
  r.hp = stat('hitpoints');
  prepareWave(1);
}

// Valor de um Stat: (base + soma do core) + incremento × nível, até o teto, × core.
function statFor(id, level) {
  const s = STAT[id];
  let cMult = 1, cAdd = 0;
  const core = run ? run.core : save.core;
  if (core === 'Ice') {
    if (s.track === 'defense') cMult = 1.3;
    if (id === 'attackSpeed') cMult = 0.8;
    if (id === 'attackRange') cAdd = 0.5;
  } else if (core === 'Magma') {
    if (id === 'damage') cMult = 1.3;
    if (id === 'hitpoints') cMult = 0.75;
    if (id === 'attackRange') cAdd = -0.5;
    if (id === 'orbitSpeed') cAdd = 15;
  }
  let v = s.base + cAdd + s.inc * level;
  if (s.cap != null) v = Math.min(v, s.cap);
  v *= cMult;
  if (id === 'defRel') v = Math.min(v, 0.9);
  return v;
}
const stat = id => statFor(id, run.levels[id]);
const upgradeCost = (id, level) => Math.round(STAT[id].cost * Math.pow(1.15, level));
// No teto quando o próximo nível não muda mais o valor (já considera o Core).
const atCap = (id, level) => STAT[id].cap != null && statFor(id, level + 1) <= statFor(id, level) + 1e-9;

// Quantos níveis comprar com o seletor atual, e quanto custam juntos.
function purchasePlan(id) {
  let lvl = run.levels[id], n = 0, cost = 0;
  const want = buyQty;
  while (n < want && !atCap(id, lvl)) {
    const c = upgradeCost(id, lvl);
    if (cost + c > run.shards && n > 0) break;
    if (cost + c > run.shards && n === 0) { cost = c; break; }
    cost += c; lvl++; n++;
    if (want === Infinity && n > 500) break;
  }
  return { n, cost, capped: atCap(id, run.levels[id]) };
}

function buyStat(id) {
  const plan = purchasePlan(id);
  if (plan.capped || plan.n === 0 || plan.cost > run.shards) return;
  const oldMax = stat('hitpoints');
  run.shards -= plan.cost;
  run.levels[id] += plan.n;
  if (STAT[id].track === 'offense') run.boughtOffense = true;
  if (id === 'hitpoints') { run.boughtHp = true; run.hp += stat('hitpoints') - oldMax; }
  if (!save.hints.buy) { save.hints.buy = true; writeSave(); }
  refreshDrawer(true);
}

const satelliteCost = () => SATELLITE_COSTS[run.sats.length - 1];

// Novo Satellite entra na mesma órbita; o espaçamento igual (360°/n) se ajusta sozinho no update.
function buySatellite() {
  if (run.sats.length >= MAX_SATELLITES) return;
  const cost = satelliteCost();
  if (cost > run.shards) return;
  run.shards -= cost;
  run.sats.push({ priority: 'closest', cd: 0 });
  if (run.sats.length >= MAX_SATELLITES) unlockAch('fullArsenal');
  buildDrawer();
}

// ============================================================ waves (Seção 4.3)

const isBoss = w => w % 10 === 0;
function sectorCount(w) { return isBoss(w) ? 1 : w <= 4 ? 1 : w <= 14 ? 2 : 3; }

// Aviso de 2 s com os Spawn Sectors, antes de cada Wave.
function prepareWave(w) {
  const all = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
  run.warnWave = w;
  run.warnSectors = all.slice(0, sectorCount(w));
  run.warn = 2;
}

function startWave(w) {
  run.wave = w;
  run.waveTimer = isBoss(w) ? 120 : 60;   // o dobro do GDD (60/30 s), pedido do playtest
  run.unpaid.push(w);
  const sectors = run.warnSectors;
  if (isBoss(w)) {
    run.waveTypes = ['mothership', 'swarmer'];   // os Swarmers vêm da Mothership
    run.queue.push({ at: run.time, w, type: 'mothership', sector: sectors[0] });
    run.bossHitFree = true;
  } else {
    const n = Math.min(6 + 2 * w, 60);
    const pool = Object.entries(ENEMIES).filter(([, e]) => e.wave <= w);
    const total = pool.reduce((a, [, e]) => a + e.weight, 0);
    const types = new Set();
    for (let i = 0; i < n; i++) {
      let r = Math.random() * total, type = pool[0][0];
      for (const [k, e] of pool) { if ((r -= e.weight) < 0) { type = k; break; } }
      types.add(type);
      // Nascem espalhados por 40 s (o dobro dos 20 s do GDD), acompanhando o timer dobrado.
      run.queue.push({ at: run.time + i * 40 / n, w, type, sector: sectors[Math.floor(Math.random() * sectors.length)] });
    }
    run.waveTypes = Object.keys(ENEMIES).filter(k => types.has(k));
  }
  if (w === 10) unlockAch('holdingLine');
  if (w === 20) unlockAch('frozen');
  if (w === 40) unlockAch('deepSpace');
  if (w === 30 && run.core === 'Ice') { unlockAch('glacier'); if (!run.boughtOffense) unlockAch('absoluteZero'); }
  if (w === 25 && run.core === 'Magma' && !run.boughtHp) unlockAch('glassCannon');
}

function aliveCount() { return run.enemies.length; }

function spawnEnemy(type, w, x, y) {
  const e = ENEMIES[type], hp = e.hp * Math.pow(1.09, w - 1);
  const dir = Math.atan2(y, x);
  run.enemies.push({
    type, w, bx: x, by: y, x, y, hp, maxHp: hp,
    dmg: e.dmg * Math.pow(1.06, w - 1), speed: e.speed, r: e.r, shards: e.shards,
    variant: type === 'grunt' ? (Math.random() * 2) | 0 : type === 'brute' ? (Math.random() * 4) | 0 : 0,
    t: Math.random() * 10, flash: 0, perp: dir + Math.PI / 2,
  });
}
function spawnSwarm(w, x, y) {
  for (let i = 0; i < 8; i++) spawnEnemy('swarmer', w, x + rand(-0.7, 0.7), y + rand(-0.7, 0.7));
}
function spawnMothership(w, sector) {
  const a = (sector * 60 + 30) * DEG;
  const hp = MOTHERSHIP.hp * Math.pow(1.09, w - 1);
  run.enemies.push({
    type: 'mothership', w, ang: a, rad: SPAWN_R, x: Math.cos(a) * SPAWN_R, y: Math.sin(a) * SPAWN_R,
    hp, maxHp: hp, laserDmg: MOTHERSHIP.laser * Math.pow(1.06, w - 1), r: MOTHERSHIP.r, shards: MOTHERSHIP.shards,
    state: 'enter', laserT: 8, swarmT: 15, warnT: 0, beamT: 0, t: 0, flash: 0,
  });
}

function processQueue() {
  while (run.queue.length && run.queue[0].at <= run.time) {
    const q = run.queue[0];
    const size = q.type === 'swarmer' ? 8 : 1;
    if (aliveCount() + size > MAX_ENEMIES) break;   // o slot espera na fila, não é descartado
    run.queue.shift();
    if (q.type === 'mothership') { spawnMothership(q.w, q.sector); continue; }
    const a = (q.sector * 60 + Math.random() * 60) * DEG;
    const x = Math.cos(a) * SPAWN_R, y = Math.sin(a) * SPAWN_R;
    if (q.type === 'swarmer') spawnSwarm(q.w, x, y); else spawnEnemy(q.type, q.w, x, y);
  }
}

function checkWaveFlow(dt) {
  if (run.warn > 0) {
    run.warn -= dt;
    if (run.warn <= 0) startWave(run.warnWave);
  } else if (run.wave > 0) {
    run.waveTimer -= dt;
    if (run.waveTimer <= 0) {
      if (run.enemies.length || run.queue.length) run.cleanStreak = 0;
      prepareWave(run.wave + 1);
    }
  }
  // Wave Clear: tela vazia e fila vazia → paga todas as Waves pendentes.
  if (run.unpaid.length && !run.queue.length && !run.enemies.length) {
    let bonus = 0;
    for (const w of run.unpaid) bonus += (5 + w) * (1 + stat('resWave'));
    run.unpaid = [];
    addShards(bonus, true);
    toast(`Wave Clear  +${Math.round(bonus)}`, ICON.shards);
    if (run.warn <= 0 && run.waveTimer > 0) {
      run.cleanStreak++;
      if (run.cleanStreak >= 10) unlockAch('cleanSweep');
      prepareWave(run.wave + 1);
    }
  }
}

function addShards(amount, exact) {
  if (exact) { const v = Math.round(amount); run.shards += v; run.totalShards += v; return; }
  run.shardFrac += amount * (1 + stat('resBonus'));
  const whole = Math.floor(run.shardFrac);
  if (whole > 0) { run.shardFrac -= whole; run.shards += whole; run.totalShards += whole; }
}

// ============================================================ simulação

function update(dt) {
  if (!run || run.paused || run.over) return;
  run.time += dt;
  checkWaveFlow(dt);
  processQueue();

  const maxHp = stat('hitpoints');
  run.hp = Math.min(maxHp, run.hp + stat('regen') * dt);

  // Inimigos
  for (let i = run.enemies.length - 1; i >= 0; i--) {
    const e = run.enemies[i];
    e.t += dt; e.flash = Math.max(0, e.flash - dt);
    if (e.type === 'mothership') { updateMothership(e, dt); continue; }
    const d = Math.hypot(e.bx, e.by);
    const step = e.speed * dt;
    if (d > 0) { e.bx -= e.bx / d * step; e.by -= e.by / d * step; }
    if (e.type === 'scout') {
      const off = 0.5 * Math.sin(2 * Math.PI * 1.5 * e.t);
      e.x = e.bx + Math.cos(e.perp) * off; e.y = e.by + Math.sin(e.perp) * off;
    } else { e.x = e.bx; e.y = e.by; }
    if (Math.hypot(e.x, e.y) < PLANET_R) {   // kamikaze: dano e some sem dar Shards
      e.dead = true;
      damagePlanet(e.dmg);
      addFx(e.type === 'brute' ? 'expBig' : 'expSmall', e.x, e.y);
      run.enemies.splice(i, 1);
      if (run.over) return;
    }
  }

  // Satellites
  const n = run.sats.length;
  run.satAngle = normDeg(run.satAngle + stat('orbitSpeed') * dt);   // anti-horário
  const range = stat('attackRange'), aspd = stat('attackSpeed');
  for (let i = 0; i < n; i++) {
    const s = run.sats[i];
    s.ang = normDeg(run.satAngle + i * 360 / n);
    s.x = Math.cos(s.ang * DEG) * ORBIT_R; s.y = Math.sin(s.ang * DEG) * ORBIT_R;
    s.q = quadOf(s.ang);
    s.cd -= dt;
    if (s.cd > 0) continue;
    const target = pickTarget(s.q, range, s.priority);
    if (!target) { s.cd = 0; continue; }   // segura o tiro
    fire(s, target);
    s.cd = Math.max(s.cd, -0.1) + 1 / aspd;
  }
  for (let q = 0; q < 4; q++) run.quadFlash[q] = Math.max(0, run.quadFlash[q] - dt * 4);

  // Projéteis teleguiados
  for (let i = run.projectiles.length - 1; i >= 0; i--) {
    const p = run.projectiles[i];
    p.t += dt;
    if (p.target.dead) { run.projectiles.splice(i, 1); continue; }
    const dx = p.target.x - p.x, dy = p.target.y - p.y, d = Math.hypot(dx, dy);
    const step = PROJECTILE_SPEED * dt;
    p.px = p.x; p.py = p.y;
    if (d <= step + Math.min(0.2, p.target.r * 0.5)) {
      run.projectiles.splice(i, 1);
      hitEnemy(p.target, p.dmg, p.crit);
    } else { p.x += dx / d * step; p.y += dy / d * step; }
  }

  // Efeitos
  for (let i = run.fx.length - 1; i >= 0; i--) { const f = run.fx[i]; f.t += dt; if (f.t >= f.dur) run.fx.splice(i, 1); }
  for (let i = run.nums.length - 1; i >= 0; i--) { const d = run.nums[i]; d.t += dt; if (d.t > 0.7) run.nums.splice(i, 1); }
  run.planetFlash = Math.max(0, run.planetFlash - dt);
}

function updateMothership(m, dt) {
  if (m.state === 'enter') {
    m.rad -= 1.5 * dt;
    if (m.rad <= 7) { m.rad = 7; m.state = 'spiral'; }
  } else {
    m.ang += 10 * DEG * dt;
    m.rad = Math.max(3.5, m.rad - 1.5 / 36 * dt);   // perde 1,5 u de raio por volta (36 s)
    m.laserT -= dt;
    if (m.laserT <= 0 && m.warnT <= 0 && m.beamT <= 0) { m.warnT = 1.5; m.laserT = 8; }
    if (m.warnT > 0) {
      m.warnT -= dt;
      if (m.warnT <= 0) { m.beamT = 0.45; damagePlanet(m.laserDmg); addShake(3); }
    }
    if (m.beamT > 0) m.beamT -= dt;
    m.swarmT -= dt;
    if (m.swarmT <= 0 && aliveCount() + 8 <= MAX_ENEMIES) { m.swarmT = 15; spawnSwarm(m.w, m.x, m.y); }
  }
  m.x = Math.cos(m.ang) * m.rad; m.y = Math.sin(m.ang) * m.rad;
}

function pickTarget(q, range, priority) {
  let best = null, bestScore = Infinity;
  for (const e of run.enemies) {
    const d = Math.hypot(e.x, e.y);
    if (d - e.r > range) continue;
    if (quadOf(Math.atan2(e.y, e.x) / DEG) !== q) continue;
    let score;
    switch (priority) {
      case 'weakest': score = e.hp; break;
      case 'strongest': score = -e.hp; break;
      case 'farthest': score = -d; break;
      default: score = d;
    }
    if (score < bestScore) { bestScore = score; best = e; }
  }
  return best;
}

function fire(sat, target) {
  const crit = Math.random() < stat('critChance');
  const dist = Math.hypot(target.x, target.y);
  const dmg = stat('damage') * (1 + stat('impetus') * dist) * (crit ? stat('critFactor') : 1);
  run.projectiles.push({ x: sat.x, y: sat.y, px: sat.x, py: sat.y, target, dmg, crit, t: Math.random() });
  run.quadFlash[sat.q] = 1;
}

function hitEnemy(e, dmg, crit) {
  if (e.dead) return;
  e.hp -= dmg; e.flash = 0.06;
  if (crit) { run.crits++; if (run.crits === 500) unlockAch('criticalMass'); }
  if (dmg > 10000 && stat('impetus') > 0) unlockAch('sniper');
  if (save.settings.dmgNumbers && run.nums.length < 80) run.nums.push({ x: e.x, y: e.y + e.r, v: dmg, crit, t: 0 });
  if (e.hp > 0) return;
  e.dead = true;
  run.enemies.splice(run.enemies.indexOf(e), 1);
  run.kills++;
  if (e.type === 'mothership') {
    addShards(e.shards * (1 + stat('resBonus')), true);
    addFx('expMother', e.x, e.y);
    addShake(4);
    run.mothershipsKilled++;
    save.totals.motherships++;
    unlockAch('giantSlayer');
    if (save.totals.motherships >= 3) unlockAch('tripleThreat');
    if (run.bossHitFree) unlockAch('untouchable');
    writeSave();
  } else {
    addShards(e.shards);
    addFx(e.type === 'brute' ? 'expBig' : 'expSmall', e.x, e.y);
  }
  if (run.core === 'Magma' && run.kills === 1000) unlockAch('eruption');
}

function damagePlanet(raw) {
  const dmg = Math.max(1, (raw - stat('defAbs')) * (1 - stat('defRel')));
  run.hp -= dmg;
  run.planetFlash = 0.08;
  addShake(1.5);
  if (run.enemies.some(e => e.type === 'mothership')) run.bossHitFree = false;
  if (run.hp <= 0) { run.hp = 0; endRun(); }
}

const FX = {
  expSmall:  { img: 'expSmall',  cell: 32, frames: 5, fps: 15 },
  expBig:    { img: 'expBig',    cell: 32, frames: 5, fps: 15 },
  expMother: { img: 'expMother', cell: 64, frames: 6, fps: 12 },
};
function addFx(kind, x, y) { const f = FX[kind]; run.fx.push({ ...f, x, y, t: 0, dur: f.frames / f.fps }); }
function addShake(v) { if (save.settings.shake) shake = Math.min(5, shake + v); }

function endRun() {
  run.over = true;
  run.newBest = run.wave > save.best;
  save.best = Math.max(save.best, run.wave);
  unlockAch('firstContact');
  writeSave();
  drawerTrack = null;
  setTimeout(() => showScreen('results'), 900);
}

// ============================================================ conquistas

function unlockAch(id) {
  if (save.ach[id]) return;
  const a = ACH[id];
  save.ach[id] = true;
  if (a.reward && a.reward.core && !save.cores.includes(a.reward.core)) save.cores.push(a.reward.core);
  if (a.reward && a.reward.skin) { const k = a.reward.skin.join('_'); if (!save.skins.includes(k)) save.skins.push(k); }
  writeSave();
  toast(`Conquista: ${a.name}`, ICON.trophy);
}

// ============================================================ render do mundo

function planetScreen() {
  const drawerH = drawerTrack ? DRAWER_OPEN_H : DRAWER_STRIP_H;
  const targetY = drawerTrack ? Math.round((VH - drawerH) / 2) : Math.round(VH / 2);
  return { cx: Math.round(VW / 2), cy: targetY };
}

function render(dt) {
  clock += dt;
  const { cx, cy: cyTarget } = planetScreen();
  camY += (cyTarget - camY) * Math.min(1, dt * 10);
  if (Math.abs(camY - cyTarget) < 0.5) camY = cyTarget;
  shake = Math.max(0, shake - dt * 12);
  const sx = shake ? Math.round(rand(-shake, shake)) : 0, sy = shake ? Math.round(rand(-shake, shake)) : 0;
  const ox = cx + sx, oy = Math.round(camY) + sy;
  const W = (x, y) => [Math.round(ox + x * PPU), Math.round(oy - y * PPU)];   // mundo (y pra cima) → tela

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;

  // Fundo: tiles 32x32 sorteados + estrelas piscando
  if (IMG.bg) {
    const cols = bgTiles.cols;
    for (let i = 0; i < bgTiles.length; i++) {
      const c = i % cols, r = (i / cols) | 0;
      ctx.drawImage(IMG.bg, bgTiles[i] * 32, 0, 32, 32, c * 32 - 32 + (sx >> 1), r * 32 - 32 + (sy >> 1), 32, 32);
    }
  } else { ctx.fillStyle = '#12103a'; ctx.fillRect(0, 0, VW, VH); }
  if (IMG.twinkle) for (const s of bgStars) {
    const f = Math.floor(clock * 4 + s.ph) % 4;
    ctx.drawImage(IMG.twinkle, f * 32, 0, 32, 32, Math.round(s.x) - 16, Math.round(s.y) - 16, 32, 32);
  }
  if (!run) return;

  // Quadrants: eixos pontilhados + preenchimento quente do Quadrant com Satellite
  ctx.fillStyle = 'rgba(200,200,255,0.18)';
  for (let x = 0; x < VW; x += 3) ctx.fillRect(x, oy, 1, 1);
  for (let y = 0; y < VH; y += 3) ctx.fillRect(ox, y, 1, 1);
  if (save.settings.quadrants && !run.over) {
    const R = stat('attackRange') * PPU;
    const occupied = new Set(run.sats.map(s => s.q));
    for (const q of occupied) {
      const a0 = -(q + 1) * Math.PI / 2, a1 = -q * Math.PI / 2;   // canvas tem y pra baixo
      const flash = save.settings.reduceFlashes ? run.quadFlash[q] * 0.3 : run.quadFlash[q];
      ctx.fillStyle = `rgba(255,150,60,${0.09 + 0.08 * flash})`;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, R, a0, a1); ctx.closePath(); ctx.fill();
    }
  }

  // Inimigos
  for (const e of run.enemies) {
    const [x, y] = W(e.x, e.y);
    let img, col = 0, row = 0, cell = 32;
    switch (e.type) {
      case 'grunt': img = IMG.grunt; col = Math.floor(e.t * 6) % 4; row = e.variant; break;
      case 'scout': img = IMG.scout; col = Math.floor(e.t * 12) % 4; break;
      case 'swarmer': img = IMG.swarmer; col = Math.floor(e.t * 4) % 2; break;
      case 'brute': img = IMG.brute; col = e.variant; break;
      case 'mothership': img = IMG.mothership; col = Math.floor(e.t * 5) % 5; cell = 64; break;
    }
    if (!img) continue;
    const src = e.flash > 0 && !save.settings.reduceFlashes ? whiteOf(img) : img;
    ctx.drawImage(src, col * cell, row * cell, cell, cell, x - cell / 2, y - cell / 2, cell, cell);
  }

  // Planeta girando (32 frames a 4 fps)
  const pImg = IMG[`planet_${run.core}_${run.skin}`];
  if (pImg) {
    const f = Math.floor(run.time * 4) % 32;
    const src = run.planetFlash > 0 && !save.settings.reduceFlashes ? whiteOf(pImg) : pImg;
    ctx.drawImage(src, f * 32, 0, 32, 32, ox - 16, oy - 16, 32, 32);
  }

  // Satellites (orientação fixa, luz piscando a 2 fps)
  if (IMG.satellite && !run.over) for (const s of run.sats) {
    if (s.x === undefined) continue;
    const [x, y] = W(s.x, s.y);
    ctx.drawImage(IMG.satellite, (Math.floor(clock * 2) % 2) * 32, 0, 32, 32, x - 16, y - 16, 32, 32);
  }

  // Projéteis + rastro curto
  for (const p of run.projectiles) {
    const [x, y] = W(p.x, p.y);
    const dx = p.x - p.px, dy = p.y - p.py, d = Math.hypot(dx, dy) || 1;
    ctx.fillStyle = 'rgba(255,170,60,0.55)';
    for (let k = 1; k <= 3; k++) ctx.fillRect(Math.round(x - dx / d * k * 1.2), Math.round(y + dy / d * k * 1.2), 1, 1);
    if (IMG.projectile) ctx.drawImage(IMG.projectile, (Math.floor(p.t * 8) % 2) * 32, 0, 32, 32, x - 16, y - 16, 32, 32);
  }

  // Laser da Mothership (tiles 32x32 girados ao longo da linha — única exceção à regra de não girar)
  for (const m of run.enemies) {
    if (m.type !== 'mothership' || (m.warnT <= 0 && m.beamT <= 0)) continue;
    const [mx, my] = W(m.x, m.y);
    const ang = Math.atan2(oy - my, ox - mx);
    const len = Math.hypot(ox - mx, oy - my) - PLANET_R * PPU;
    const warn = m.warnT > 0;
    const img = warn ? IMG.laserWarn : IMG.laserBeam;
    const frame = warn ? Math.floor(clock * 6) % 2 : Math.floor(clock * 12) % 4;
    if (!img) continue;
    ctx.save();
    ctx.translate(mx, my); ctx.rotate(ang);
    for (let d = 0; d < len; d += 32) {
      const w = Math.min(32, len - d);
      ctx.drawImage(img, frame * 32, 0, w, 32, Math.round(d), -16, w, 32);
    }
    if (!warn && IMG.laserImpact) ctx.drawImage(IMG.laserImpact, (Math.floor(clock * 12) % 4) * 32, 0, 32, 32, Math.round(len) - 16, -16, 32, 32);
    ctx.restore();
  }

  // Explosões
  for (const f of run.fx) {
    const img = IMG[f.img]; if (!img) continue;
    const [x, y] = W(f.x, f.y);
    const fr = Math.min(f.frames - 1, Math.floor(f.t * f.fps));
    ctx.drawImage(img, fr * f.cell, 0, f.cell, f.cell, x - f.cell / 2, y - f.cell / 2, f.cell, f.cell);
  }

  // Números de dano
  if (save.settings.dmgNumbers) {
    ctx.font = '16px m5x7';
    ctx.textAlign = 'center';
    for (const d of run.nums) {
      const [x, y] = W(d.x, d.y);
      const yy = Math.round(y - 4 - d.t * 14);
      ctx.globalAlpha = d.t > 0.45 ? 1 - (d.t - 0.45) / 0.25 : 1;
      const txt = fmt(d.v) + (d.crit ? '!' : '');
      ctx.fillStyle = '#000'; ctx.fillText(txt, x + 1, yy + 1);
      ctx.fillStyle = d.crit ? '#ffd25a' : '#ffffff'; ctx.fillText(txt, x, yy);
    }
    ctx.globalAlpha = 1;
  }

  // Setas dos Spawn Sectors na borda da tela (6 linhas pré-desenhadas, nada é girado)
  if (run.warn > 0 && IMG.arrows && !run.over) {
    const top = 24, bottom = (drawerTrack ? DRAWER_OPEN_H : DRAWER_STRIP_H) + 12, side = 12;
    for (const s of run.warnSectors) {
      const a = (s * 60 + 30) * DEG, dx = Math.cos(a), dy = -Math.sin(a);
      const tx = dx > 0 ? (VW - side - ox) / dx : dx < 0 ? (side - ox) / dx : Infinity;
      const ty = dy > 0 ? (VH - bottom - oy) / dy : dy < 0 ? (top - oy) / dy : Infinity;
      const t = Math.min(tx, ty);
      const x = Math.round(ox + dx * t), y = Math.round(oy + dy * t);
      const lit = Math.floor(clock * 4) % 2;
      ctx.drawImage(IMG.arrows, lit * 32, s * 32, 32, 32, x - 16, y - 16, 32, 32);
    }
  }
}

// ============================================================ UI (DOM em pixels de jogo)

let hud = null;

function showScreen(name) {
  screen = name;
  ui.innerHTML = '';
  if (name !== 'game') hud = null;
  const fn = SCREENS[name];
  if (fn) fn();
}

function toast(text, icon) {
  if (screen !== 'game' && screen !== 'menu') return;
  const t = el(`<div class="toast">${icon != null ? iconHtml(icon) : ''}<span>${text}</span></div>`);
  ui.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function topbar(title) {
  const bar = el(`<div class="topbar"><button class="btn" data-back>&lt; Voltar</button><span class="h" style="margin:0">${title}</span><span class="spacer"></span><span class="subtitle">Recorde: Wave ${save.best}</span></div>`);
  $('[data-back]', bar).onclick = () => showScreen('menu');
  return bar;
}


const SCREENS = {
  menu() {
    run = null;
    const s = el(`<div class="screen" style="background:rgba(10,8,30,.35)">
      <div style="height:6px"></div>
      <div class="title">8-Bit Armageddon</div>
      <div class="subtitle" style="margin-top:4px">Defenda o planeta. Caia. Bata o recorde.</div>
      <div class="row" style="margin-top:6px">
        ${planetHtml(save.core, save.skin)}
        <span class="subtitle">Recorde: Wave ${save.best}</span>
      </div>
      <div class="menu-buttons">
        <button class="btn play" data-go="cores">Jogar</button>
        <button class="btn" data-go="achievements">Conquistas</button>
        <button class="btn" data-go="settings">Settings</button>
      </div>
    </div>`);
    s.querySelectorAll('[data-go]').forEach(b => b.onclick = () => showScreen(b.dataset.go));
    $('.play', s).addEventListener('click', goFullscreen);
    ui.appendChild(s);
  },

  cores() {
    const s = el(`<div class="screen"></div>`);
    s.appendChild(topbar('Core Select'));
    const wrap = el(`<div class="cores"></div>`);
    for (const c of CORES) {
      const unlocked = save.cores.includes(c.id);
      const box = el(`<div class="core panel${save.core === c.id ? ' sel' : ''}">
        <span class="${unlocked ? '' : 'subtitle'}">${c.name}</span>
        ${planetHtml(c.id, save.core === c.id ? save.skin : 'Classic', !unlocked)}
        <span class="mods">${unlocked ? c.mods : 'Bloqueado: ' + ACHIEVEMENTS.find(a => a.reward && a.reward.core === c.id).name}</span>
        <div class="skins"></div>
      </div>`);
      const skins = $('.skins', box);
      for (const sk of c.skins) {
        const ok = unlocked && save.skins.includes(`${c.id}_${sk}`);
        const b = el(`<div class="skin${ok ? '' : ' locked'}${save.core === c.id && save.skin === sk ? ' sel' : ''}" title="${sk}">${planetHtml(c.id, sk, !ok)}</div>`);
        b.firstElementChild.style.animation = 'none';
        b.onclick = e => { e.stopPropagation(); if (!ok) return; save.core = c.id; save.skin = sk; writeSave(); showScreen('cores'); };
        skins.appendChild(b);
      }
      box.onclick = () => { if (!unlocked) return; if (save.core !== c.id) { save.core = c.id; save.skin = 'Classic'; writeSave(); showScreen('cores'); } };
      wrap.appendChild(box);
    }
    s.appendChild(wrap);
    const play = el(`<button class="btn" style="margin-top:8px;width:120px">Começar run</button>`);
    play.onclick = () => { newRun(); showScreen('game'); };
    s.appendChild(play);
    ui.appendChild(s);
  },

  achievements() {
    const s = el(`<div class="screen"></div>`);
    s.appendChild(topbar('Conquistas'));
    const list = el(`<div class="ach-list scroll"></div>`);
    for (const a of ACHIEVEMENTS) {
      const st = save.ach[a.id];
      const icon = st ? ICON.trophy : ICON.trophyLocked;
      let reward = '';
      if (a.reward && a.reward.core) reward = planetHtml(a.reward.core, 'Classic', !st);
      else if (a.reward && a.reward.skin) reward = planetHtml(a.reward.skin[0], a.reward.skin[1], !st);
      const row = el(`<div class="ach${st ? '' : ' locked'}">${iconHtml(icon)}
        <div class="txt"><span class="name">${a.name}</span><span class="cond">${a.cond}</span></div>
        <div class="reward">${reward}</div></div>`);
      row.querySelectorAll('.planet-spin').forEach(p => { p.style.animation = 'none'; p.style.transform = 'scale(.5)'; p.style.margin = '-8px'; });
      list.appendChild(row);
    }
    s.appendChild(list);
    ui.appendChild(s);
  },

  settings(fromPause) {
    const s = el(`<div class="screen"></div>`);
    if (fromPause) {
      s.appendChild(el(`<div class="topbar"><button class="btn" data-back>&lt; Voltar</button><span class="h" style="margin:0">Settings</span></div>`));
      $('[data-back]', s).onclick = () => { s.remove(); };
    } else s.appendChild(topbar('Settings'));
    const box = el(`<div class="settings"></div>`);
    const opts = [
      ['shake', 'Screen shake'], ['dmgNumbers', 'Números de dano'], ['quadrants', 'Mostrar Quadrants'],
      ['reduceFlashes', 'Reduzir flashes'], ['fps30', '30 fps (economia)'],
    ];
    for (const [k, label] of opts) {
      const b = el(`<button class="btn"><span>${label}</span><span class="${save.settings[k] ? 'badge' : 'subtitle'}">${save.settings[k] ? 'On' : 'Off'}</span></button>`);
      b.onclick = () => { save.settings[k] = !save.settings[k]; writeSave(); b.lastElementChild.className = save.settings[k] ? 'badge' : 'subtitle'; b.lastElementChild.textContent = save.settings[k] ? 'On' : 'Off'; };
      box.appendChild(b);
    }
    if (!fromPause) {
      let confirms = 0;
      const reset = el(`<button class="btn" style="margin-top:6px"><span>Resetar progresso</span></button>`);
      reset.onclick = () => {
        confirms++;
        if (confirms === 1) reset.firstElementChild.textContent = 'Tem certeza? Toque de novo';
        else if (confirms === 2) reset.firstElementChild.textContent = 'Última chance: apagar tudo?';
        else { save = defaultSave(); writeSave(); showScreen('menu'); }
      };
      box.appendChild(reset);
    }
    s.appendChild(box);
    ui.appendChild(s);
    return s;
  },

  game() {
    hud = {};
    const h = el(`<div id="hud">
      <div class="hpbar">${iconHtml(STAT.hitpoints.icon)}<div class="bar"><i></i><b></b></div></div>
      <div class="wave-info"><span class="w"></span> <span class="t"></span></div>
      <button class="btn pause-btn">II</button>
      <div class="foes hidden"></div>
      <div class="boss-bar hidden"><span>Mothership</span><div class="bar"><i></i></div></div>
    </div>`);
    ui.appendChild(h);
    hud.hpFill = $('.hpbar .bar i', h); hud.hpText = $('.hpbar .bar b', h);
    hud.wave = $('.wave-info .w', h); hud.timer = $('.wave-info .t', h);
    hud.boss = $('.boss-bar', h); hud.bossFill = $('.boss-bar i', h);
    $('.pause-btn', h).onclick = () => pause(true);
    hud.foes = $('.foes', h); hud.foesKey = '';

    const d = el(`<div id="drawer">
      <div class="drawer-strip">
        <span class="money shards">${iconHtml(ICON.shards)}<span class="sh">0</span></span><span class="spacer"></span>
      </div>
      <div class="drawer-body hidden">
        <div class="qty"><button class="btn"></button></div>
        <div class="cards-wrap">
          <div class="cards"></div>
          <button class="btn arrow l hidden">&lt;</button><button class="btn arrow r hidden">&gt;</button>
        </div>
      </div>
    </div>`);
    const strip = $('.drawer-strip', d);
    for (const t of TRACKS) {
      const b = el(`<button class="btn tab" data-track="${t.id}">${iconHtml(t.icon)}<span class="lbl">${t.name}</span></button>`);
      b.onclick = () => { drawerTrack = drawerTrack === t.id ? null : t.id; buildDrawer(); };
      strip.appendChild(b);
    }
    // Um só botão que alterna x1 → x10 → Max: ocupa uma linha só na gaveta compacta.
    const qty = $('.qty .btn', d), QTY = [[1, 'x1'], [10, 'x10'], [Infinity, 'Max']];
    const showQty = () => { qty.textContent = QTY.find(([v]) => v === buyQty)[1]; };
    qty.onclick = () => { buyQty = QTY[(QTY.findIndex(([v]) => v === buyQty) + 1) % QTY.length][0]; showQty(); refreshDrawer(true); };
    showQty();
    ui.appendChild(d);
    hud.tip = el(`<div class="tip hidden"></div>`);
    ui.appendChild(hud.tip);
    hud.drawer = d; hud.shards = $('.sh', d); hud.body = $('.drawer-body', d); hud.cards = $('.cards', d);
    // A fileira de cards rola na horizontal: a roda do mouse (vertical) também rola, e as setas
    // aparecem quando há cards escondidos daquele lado (no celular, o dedo arrasta normalmente).
    hud.arrowL = $('.arrow.l', d); hud.arrowR = $('.arrow.r', d);
    const step = dir => hud.cards.scrollBy({ left: dir * 87, behavior: 'smooth' });
    hud.arrowL.onclick = () => step(-1);
    hud.arrowR.onclick = () => step(1);
    hud.cards.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      hud.cards.scrollLeft += e.deltaY;
      e.preventDefault();
    }, { passive: false });
    hud.cards.addEventListener('scroll', updateArrows);
    hud.hint = el(`<div class="hint hidden">Toque em Offense para comprar Damage</div>`);
    ui.appendChild(hud.hint);
    buildDrawer();
  },

  results() {
    const r = run;
    const mins = Math.floor(r.time / 60), secs = Math.floor(r.time % 60);
    const s = el(`<div class="screen"><div class="dialog panel">
      <span class="h">Planeta destruído</span>
      ${planetHtml(r.core, r.skin)}
      <div class="stats">
        <span>Wave alcançada</span><span>${r.wave}</span>
        <span>Inimigos destruídos</span><span>${fmt(r.kills)}</span>
        <span>Tempo</span><span>${mins}:${String(secs).padStart(2, '0')}</span>
        <span>Shards coletados</span><span>${fmt(r.totalShards)}</span>
        <span>Motherships</span><span>${r.mothershipsKilled}</span>
      </div>
      <span class="${r.newBest ? 'badge' : 'subtitle'}">${r.newBest ? 'Novo recorde!' : `Recorde: Wave ${save.best}`}</span>
      <div class="row" style="margin-top:4px">
        <button class="btn" data-again>Jogar de novo</button>
        <button class="btn" data-menu>Menu</button>
      </div>
    </div></div>`);
    $('[data-again]', s).onclick = () => { newRun(); showScreen('game'); };
    $('[data-menu]', s).onclick = () => showScreen('menu');
    ui.appendChild(s);
  },
};

// No celular: tela cheia e paisagem travada (Android). Precisa de um toque do jogador para ser permitido;
// onde não existe (iPhone), simplesmente não faz nada.
function goFullscreen() {
  if (!matchMedia('(pointer: coarse)').matches) return;
  const root = document.documentElement;
  if (document.fullscreenElement || !root.requestFullscreen) return;
  root.requestFullscreen()
    .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
    .catch(() => {});
}

function pause(on) {
  if (!run || run.over || screen !== 'game') return;
  if (run.paused === on) return;
  run.paused = on;
  const old = $('#pause'); if (old) old.remove();
  if (!on) return;
  const p = el(`<div id="pause" class="screen"><div class="dialog panel">
    <span class="h">Pausa</span>
    <button class="btn" style="width:120px" data-c>Continuar</button>
    <button class="btn" style="width:120px" data-s>Settings</button>
    <button class="btn" style="width:120px" data-q>Desistir da run</button>
  </div></div>`);
  $('[data-c]', p).onclick = () => pause(false);
  $('[data-s]', p).onclick = () => { const st = SCREENS.settings(true); st.style.zIndex = 5; };
  $('[data-q]', p).onclick = () => { p.remove(); run.paused = false; endRun(); };
  ui.appendChild(p);
}
// Pausa automática quando a aba perde o foco (Seção 4.6).
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });
window.addEventListener('blur', () => pause(true));
window.addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'p') pause(!(run && run.paused)); });

// ---------- gaveta

function buildDrawer() {
  if (!hud) return;
  const open = !!drawerTrack;
  hud.body.classList.toggle('hidden', !open);
  hud.drawer.style.height = open ? DRAWER_OPEN_H + 'px' : '';
  hideTip();
  hud.drawer.querySelectorAll('.tab').forEach(t => t.classList.toggle('open', t.dataset.track === drawerTrack));
  $('.qty', hud.drawer).classList.toggle('hidden', drawerTrack === 'satellites');
  hud.cards.innerHTML = '';
  hud.cards.scrollLeft = 0;
  hud.cardEls = [];
  requestAnimationFrame(updateArrows);   // depois do layout dos cards novos
  if (!open) return;
  if (drawerTrack === 'satellites') {
    run.sats.forEach((s, i) => {
      const row = el(`<div class="sat-row framed"><span class="row">${iconHtml(16)}<span class="name">Satellite ${i + 1}</span></span></div>`);
      const b = el(`<button class="btn" title="Target Priority">${PRIORITIES.find(p => p.id === s.priority).name}</button>`);
      b.onclick = () => {
        const idx = PRIORITIES.findIndex(p => p.id === s.priority);
        s.priority = PRIORITIES[(idx + 1) % PRIORITIES.length].id;
        b.textContent = PRIORITIES.find(p => p.id === s.priority).name;
      };
      row.appendChild(b);
      hud.cards.appendChild(row);
    });
    if (run.sats.length < MAX_SATELLITES) {
      const card = el(`<div class="card">
        <span class="row">${iconHtml(16)}<span class="name">Satellite ${run.sats.length + 1}</span></span>
        <span class="row"><span class="vals">${run.sats.length} &gt; <em>${run.sats.length + 1}</em></span><span class="spacer"></span><span class="money shards cost"></span></span>
      </div>`);
      card.dataset.sat = '1';
      attachTip(card, buySatellite);
      hud.cards.appendChild(card);
      hud.cardEls.push(card);
    }
    refreshDrawer(true);
    return;
  }
  for (const s of STATS.filter(s => s.track === drawerTrack)) {
    const card = el(`<div class="card">
      <span class="row">${iconHtml(s.icon)}<span class="name">${s.name}</span><span class="spacer"></span><span class="lvl">Nv <span class="lv"></span></span></span>
      <span class="row"><span class="vals"></span><span class="spacer"></span><span class="money shards cost"></span></span>
    </div>`);
    card.dataset.stat = s.id;
    attachTip(card, () => buyStat(s.id));
    hud.cards.appendChild(card);
    hud.cardEls.push(card);
  }
  refreshDrawer(true);
}

// Explicação de cada card: hover no mouse; no toque, pressionar e segurar mostra sem comprar
// (o toque curto continua comprando).
const LONG_PRESS = 0.35;   // segundos
function attachTip(card, buy) {
  let timer = null, held = false;
  const cancel = () => { clearTimeout(timer); timer = null; };
  card.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') showTip(card); });
  card.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hideTip(); });
  card.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    held = false;
    cancel();
    timer = setTimeout(() => { held = true; showTip(card); }, LONG_PRESS * 1000);
  });
  card.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') { cancel(); if (held) hideTip(); } });
  card.addEventListener('pointercancel', () => { cancel(); hideTip(); });
  card.addEventListener('contextmenu', e => e.preventDefault());
  card.onclick = () => { if (held) { held = false; return; } buy(); };
}

function showTip(card) {
  if (!hud || !hud.tip || !card.isConnected) return;
  let name, desc, next = '';
  if (card.dataset.sat) { name = `Satellite ${run.sats.length + 1}`; desc = SATELLITE_DESC; }
  else {
    const s = STAT[card.dataset.stat], lvl = run.levels[s.id];
    name = s.name; desc = s.desc;
    next = atCap(s.id, lvl) ? 'Nível máximo' : `Nv ${lvl + 1}: ${s.fmt(statFor(s.id, lvl + 1))}`;
  }
  hud.tip.innerHTML = `<span class="tname">${name}</span><span>${desc}</span>${next ? `<span class="subtitle">${next}</span>` : ''}`;
  hud.tip.classList.remove('hidden');
  hud.tipCard = card;
  // Posição em pixels de jogo: o #ui é escalado por P.
  const ur = ui.getBoundingClientRect(), cr = card.getBoundingClientRect();
  const x = (cr.left - ur.left) / P, y = (cr.top - ur.top) / P;
  const w = hud.tip.offsetWidth, h = hud.tip.offsetHeight;
  hud.tip.style.left = Math.round(clamp(x, 2, VW - w - 2)) + 'px';
  hud.tip.style.top = Math.round(Math.max(2, y - h - 2)) + 'px';
}

function hideTip() {
  if (!hud || !hud.tip) return;
  hud.tip.classList.add('hidden');
  hud.tipCard = null;
}

// Painel dos inimigos da Wave atual (canto superior direito): HP e ATK de cada tipo, já escalados
// pela Wave, para o jogador decidir entre Offense e Defense. Na Boss Wave, ATK é o laser.
function foeStats(type, w) {
  if (type === 'mothership') return { hp: MOTHERSHIP.hp * Math.pow(1.09, w - 1), atk: MOTHERSHIP.laser * Math.pow(1.06, w - 1) };
  const e = ENEMIES[type];
  return { hp: e.hp * Math.pow(1.09, w - 1), atk: e.dmg * Math.pow(1.06, w - 1) };
}
function updateFoes() {
  const w = run.wave, key = w + ':' + run.waveTypes.join(',');
  if (key === hud.foesKey) return;
  hud.foesKey = key;
  hud.foes.innerHTML = '';
  hud.foes.classList.toggle('hidden', !w || !run.waveTypes.length);
  for (const type of run.waveTypes) {
    const { hp, atk } = foeStats(type, w);
    const row = el(`<div class="foe"><canvas width="16" height="16"></canvas><span class="hp">${iconHtml(STAT.hitpoints.icon)}${fmt(hp)}</span><span class="atk">${iconHtml(STAT.damage.icon)}${fmt(atk)}</span></div>`);
    const img = IMG[type], cell = type === 'mothership' ? 64 : 32;
    if (img) { const g = $('canvas', row).getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, cell, cell, 0, 0, 16, 16); }
    hud.foes.appendChild(row);
  }
}

function updateArrows() {
  if (!hud || !hud.cards) return;
  const c = hud.cards, max = c.scrollWidth - c.clientWidth;
  hud.arrowL.classList.toggle('hidden', c.scrollLeft <= 1);
  hud.arrowR.classList.toggle('hidden', c.scrollLeft >= max - 1);
}

let lastRefresh = 0;
function refreshDrawer(force) {
  if (!hud || !run) return;
  if (!force && clock - lastRefresh < 0.1) return;
  lastRefresh = clock;
  hud.shards.textContent = fmt(run.shards);
  if (force && hud.tipCard) showTip(hud.tipCard);
  for (const c of hud.cardEls || []) {
    if (c.dataset.sat) {
      const cost = satelliteCost();
      $('.cost', c).innerHTML = `${iconHtml(ICON.shards)}${fmt(cost)}`;
      c.classList.toggle('poor', cost > run.shards);
      c.classList.toggle('can', cost <= run.shards);
      continue;
    }
    const id = c.dataset.stat, lvl = run.levels[id], plan = purchasePlan(id);
    $('.lv', c).textContent = lvl;
    const cur = STAT[id].fmt(statFor(id, lvl));
    if (plan.capped) {
      $('.vals', c).innerHTML = cur;
      $('.cost', c).innerHTML = '<span class="subtitle">Máx</span>';
      c.classList.add('poor'); c.classList.remove('can');
      continue;
    }
    const nextLvl = lvl + Math.max(1, plan.n);
    $('.vals', c).innerHTML = `${cur} &gt; <em>${STAT[id].fmt(statFor(id, nextLvl))}</em>`;
    $('.cost', c).innerHTML = `${iconHtml(ICON.shards)}${fmt(plan.cost)}${plan.n > 1 ? ` <span class="subtitle">(x${plan.n})</span>` : ''}`;
    const can = plan.cost <= run.shards;
    c.classList.toggle('poor', !can);
    c.classList.toggle('can', can);
  }
}

function updateHud() {
  if (!hud || !run) return;
  const max = stat('hitpoints');
  hud.hpFill.style.width = (100 * run.hp / max) + '%';
  hud.hpFill.style.background = run.hp / max < 0.3 ? '#e04848' : '#5cc45c';
  hud.hpText.textContent = `${fmt(Math.ceil(run.hp))}/${fmt(max)}`;
  if (run.warn > 0 && run.wave === 0) { hud.wave.textContent = 'Prepare-se'; hud.timer.textContent = ''; }
  else {
    hud.wave.textContent = `Wave ${run.wave}${isBoss(run.wave) ? ' · Boss' : ''}`;
    hud.timer.textContent = run.warn > 0 ? `· próxima em ${Math.ceil(run.warn)}s` : `· ${Math.max(0, Math.ceil(run.waveTimer))}s`;
  }
  const m = run.enemies.find(e => e.type === 'mothership');
  hud.boss.classList.toggle('hidden', !m);
  if (m) hud.bossFill.style.width = (100 * m.hp / m.maxHp) + '%';
  updateFoes();
  refreshDrawer(false);
  // Dica contextual: só na primeira vez que dá para comprar Damage.
  const showHint = !save.hints.buy && !drawerTrack && run.shards >= upgradeCost('damage', run.levels.damage) && !run.over;
  hud.hint.classList.toggle('hidden', !showHint);
  if (showHint) {
    const tab = hud.drawer.querySelector('.tab[data-track="offense"]');
    hud.hint.style.left = tab.offsetLeft + 'px';
    hud.hint.style.top = (VH - 22 - 16) + 'px';
  }
}

// ============================================================ loop principal

let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (save.settings.fps30) { acc += dt; if (acc < 1 / 30 - 0.002) return; dt = acc; acc = 0; }
  dt = Math.min(dt, 0.1);
  // Subpassos curtos deixam a simulação estável mesmo em frames lentos.
  let rest = dt;
  while (rest > 0) { const s = Math.min(rest, 1 / 60); update(s); rest -= s; }
  render(dt);
  if (screen === 'game') updateHud();
}

loadSave();
resize();
document.fonts && document.fonts.load('16px m5x7').catch(() => {});
loadImages().then(() => {
  showScreen('menu');
  // Atalhos de desenvolvimento: index.html#play começa uma run; #play,offense já abre a gaveta.
  const dev = location.hash.slice(1).split(',');
  if (dev.includes('play')) { newRun(); showScreen('game'); }
  for (const t of TRACKS) if (dev.includes(t.id)) { drawerTrack = t.id; buildDrawer(); }
  if (dev.includes('rich') && run) run.shards = 5000;
  const startAt = dev.find(d => d.startsWith('wave='));   // #play,wave=10 começa na Boss Wave
  if (startAt && run) prepareWave(+startAt.slice(5));
  const sim = dev.find(d => d.startsWith('sim='));   // #play,sim=40 avança a simulação 40 s
  if (sim && run) for (let i = 0; i < +sim.slice(4) * 60; i++) update(1 / 60);
  for (const name of ['cores', 'achievements', 'settings']) if (dev.includes(name)) showScreen(name);
  last = performance.now();
  requestAnimationFrame(frame);
});
