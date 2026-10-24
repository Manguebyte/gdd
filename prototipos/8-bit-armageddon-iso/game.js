// Orbitfall Iso (antes 8-Bit Armageddon Iso) — protótipo jogável em JavaScript puro.
// Segue a Parte 1 do GDD (GDD_8-Bit_Armageddon_Iso.md): as regras do Orbitfall (Satellites,
// Quadrants, Waves, 17 Stats, Mothership, Planet Cores/Skins, conquistas, recorde de Wave, save local)
// e os dois modos (Last Stand e Invasion),
// vistas por uma câmera isométrica. A simulação continua num plano 2D (o "chão"); só o render muda.
// A arte é a do 8-Bit Armageddon (Sprites/8-Bit-Armageddon/), mais o chão do grid em
// Sprites/8-Bit-Armageddon-Iso/, tudo direto do lugar, sem cópias.
'use strict';

const ART = '../../Sprites/8-Bit-Armageddon/';
const ISO_ART = '../../Sprites/8-Bit-Armageddon-Iso/';
const REF_W = 320, REF_H = 180;   // resolução de referência
// Projeção isométrica 2:1 (GDD §6.1): 1 u no eixo x do chão vira (+ISO_K, −ISO_K/2) px na tela, e no
// eixo y vira (−ISO_K, −ISO_K/2). Um círculo de raio r no chão vira uma elipse de ~17·r × 8,5·r px.
const ISO_K = 12;
const FLOOR_DROP = 16;            // px entre o plano de voo (planeta, inimigos) e o chão do grid
const GRID_CELL = 32 / (2 * ISO_K);   // lado de um tile do grid no chão (4/3 u: o tile tem 32 px de largura)
const GRID_CELLS = 10;            // tiles do centro até a borda do grid, em cada eixo
const GRID_TILE_TOP = 13;         // y do centro da face de cima do tile, dentro da célula 32x32
const GRID_ALPHA = 0.45;          // o grid é referência: fica discreto para não competir com os inimigos
const PLANET_R = 1;
const ORBIT_R = 1.75;
const SPAWN_R = 12;
const MAX_ENEMIES = 150;
const PROJECTILE_SPEED = 10;      // "Em aberto" no GDD: valor inicial do código
const DEG = Math.PI / 180;
const DRAWER_STRIP_H = 22;         // faixa das abas (gaveta fechada)
const DRAWER_OPEN_H = 60;          // gaveta aberta: faixa + uma fileira de cards compactos
const REFLECT_R = 2.5;             // órbita do Reflector (por fora da dos Satellites)
const REFLECT_SPEED = 30;          // °/s, sentido horário
const REFLECT_HALF_ARC = 20;       // metade do Reflect Arc de 40°
const SHIELD_RECHARGE = 12;        // s por carga do Energy Shield
const SHIELD_COSTS = [30, 90, 250];   // preço fixo de cada nível (exceção à fórmula 1.15^nível)
const BOLT_SPEED = 4;

// ============================================================ dados de design

const STATS = [
  { id: 'damage',       track: 'offense', name: 'Damage',            base: 10,  inc: 3,     cap: null, cost:  5, icon: 0,  fmt: v => fmt(v), desc: 'Dano de cada tiro dos Satellites.' },
  { id: 'attackSpeed',  track: 'offense', name: 'Attack Speed',      base: 1,   inc: 0.08,  cap: 6,    cost:  6, icon: 1,  fmt: v => v.toFixed(2) + '/s', desc: 'Tiros por segundo de cada Satellite.' },
  { id: 'critChance',   track: 'offense', name: 'Critical Chance',   base: 0,   inc: 0.015, cap: 0.8,  cost:  8, icon: 2,  fmt: v => pct(v), desc: 'Chance de um tiro ser crítico.' },
  { id: 'critFactor',   track: 'offense', name: 'Critical Factor',   base: 1.5, inc: 0.1,   cap: 6,    cost:  8, icon: 3,  fmt: v => v.toFixed(1) + 'x', desc: 'Multiplicador do dano de um tiro crítico.' },
  { id: 'attackRange',  track: 'offense', name: 'Attack Range',      base: 4,   inc: 0.15,  cap: 8,    cost:  6, icon: 4,  fmt: v => v.toFixed(2) + 'u', desc: 'Distância máxima até onde os Satellites atiram.' },
  { id: 'impetus',      track: 'offense', name: 'Impetus',           base: 0,   inc: 0.004, cap: 0.12, cost: 10, icon: 5,  fmt: v => pct(v) + '/u', desc: 'Dano extra por unidade de distância entre o Satellite e o alvo.' },
  { id: 'orbitSpeed',   track: 'offense', name: 'Orbit Speed',       base: 45,  inc: 5,     cap: 180,  cost:  6, icon: 6,  fmt: v => Math.round(v) + '°/s', desc: 'Velocidade da órbita: menos tempo com Quadrants sem cobertura.' },
  { id: 'multiChance',  track: 'offense', name: 'Multishot Chance',  base: 0,   inc: 0.02,  cap: 0.5,  cost: 10, icon: 22, fmt: v => pct(v), desc: 'Chance de um tiro virar Multishot: o Satellite atira também em outros inimigos do Quadrant.' },
  { id: 'multiTargets', track: 'offense', name: 'Multishot Targets', base: 1,   inc: 1,     cap: 4,    cost: 25, icon: 23, fmt: v => '+' + v + ' alvo' + (v > 1 ? 's' : ''), desc: 'Quantos alvos extras cada Multishot atinge. Sem Multishot Chance, não faz nada.' },
  { id: 'hitpoints',    track: 'defense', name: 'Hitpoints',         base: 100, inc: 25,    cap: null, cost:  5, icon: 7,  fmt: v => fmt(v), desc: 'HP máximo do planeta. A compra também cura a mesma quantidade.' },
  { id: 'regen',        track: 'defense', name: 'Regeneration',      base: 0,   inc: 0.4,   cap: null, cost:  8, icon: 8,  fmt: v => v.toFixed(1) + '/s', desc: 'HP que o planeta recupera por segundo.' },
  { id: 'defAbs',       track: 'defense', name: 'Defense (abs.)',    base: 0,   inc: 0.5,   cap: null, cost:  8, icon: 9,  fmt: v => v.toFixed(1), desc: 'Dano fixo removido de cada golpe no planeta. Forte contra muitos golpes fracos.' },
  { id: 'defRel',       track: 'defense', name: 'Defense (rel.)',    base: 0,   inc: 0.015, cap: 0.75, cost: 10, icon: 10, fmt: v => pct(v), desc: 'Porcentagem do dano removida de cada golpe no planeta. Forte contra golpes grandes.' },
  { id: 'shield',       track: 'defense', name: 'Energy Shield',     base: 0,   inc: 1,     cap: 3,    costs: SHIELD_COSTS, icon: 24, fmt: v => v + (v === 1 ? ' carga' : ' cargas'), desc: `Cada carga anula um golpe inteiro (kamikaze, Bolt ou laser). Recarrega 1 carga a cada ${SHIELD_RECHARGE} s.` },
  // Nível 0 = sem Reflector; nível 1 = 15 de dano; cada nível seguinte +8 (Reflect Damage, absoluto).
  { id: 'reflect',      track: 'defense', name: 'Reflect Shield',    base: 0,   inc: 0,     cap: null, cost: 15, icon: 25, value: l => l ? 15 + 8 * (l - 1) : 0, fmt: v => v ? fmt(v) + ' dano' : 'Off', desc: 'Um escudo-satélite em órbita: devolve os tiros dos Gunners, bloqueia o laser e fere os kamikazes que passam por ele.' },
  { id: 'resBonus',     track: 'utility', name: 'Resource Bonus',    base: 0,   inc: 0.05,  cap: 1,    cost:  6, icon: 11, fmt: v => pct(v), desc: 'Chance de uma nave destruída pagar o dobro de Shards.' },
  { id: 'resWave',      track: 'utility', name: 'Resource per Wave', base: 0,   inc: 0.10,  cap: null, cost:  6, icon: 12, fmt: v => '+' + pct(v), desc: 'Bônus de Shards a mais ao limpar a tela (Wave Clear).' },
];
const STAT = Object.fromEntries(STATS.map(s => [s.id, s]));

const TRACKS = [
  { id: 'offense',    name: 'Offense',    icon: 13 },
  { id: 'defense',    name: 'Defense',    icon: 14 },
  { id: 'utility',    name: 'Utility',    icon: 15 },
  { id: 'satellites', name: 'Satellites', icon: 16 },
];
const ICON = { shards: 17, trophy: 19, trophyLocked: 20, plasma: 28 };


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
  // Gunner: para a 4,5 u do centro e atira Gunner Bolts a cada 2,5 s (velocidade 20% abaixo, como os outros).
  gunner:  { hp: 14, dmg: 4,  speed: 0.72, shards: 2,   r: 0.5,  wave: 5, weight: 12, stopAt: 4.5, fireEvery: 2.5 },
  swarmer: { hp: 3,  dmg: 2,  speed: 0.96, shards: 0.5, r: 0.25, wave: 6, weight: 15 },
  brute:   { hp: 80, dmg: 20, speed: 0.4,  shards: 4,   r: 0.75, wave: 8, weight: 10 },
};
// laser: 30% abaixo do GDD (25), pedido do playtest: o laser da Wave 10 estava forte demais.
const MOTHERSHIP = { hp: 1200, laser: 17.5, shards: 50, r: 1.5 };

// ---------- modo Invasion (Seção 4.7): valores iniciais do GDD, ajustar jogando
const SIEGE_TIME = 120;       // s para derrubar cada Target Planet
const DEPLOY_R = 9;           // as naves do jogador nascem dentro da tela
const FLEET_SHIPS = [
  { type: 'grunt',      name: 'Grunt',      cost: 4,   planet: 1, desc: 'Barato e lento. Bom para encher um Quadrant sem Satellite.' },
  { type: 'scout',      name: 'Scout',      cost: 5,   planet: 1, desc: 'Rápido e frágil: cruza o Attack Range antes do Satellite voltar.' },
  { type: 'swarmer',    name: 'Swarmer x8', cost: 8,   planet: 2, desc: 'Cacho de 8 naves fracas. Sofre contra Multishot e Reflector.' },
  { type: 'gunner',     name: 'Gunner',     cost: 10,  planet: 3, desc: 'Para fora do planeta e atira Bolts. O Reflector devolve os Bolts.' },
  { type: 'brute',      name: 'Brute',      cost: 18,  planet: 4, desc: 'Muito HP e dano alto. Gasta uma carga inteira do Energy Shield.' },
  { type: 'mothership', name: 'Mothership', cost: 120, planet: 6, desc: 'Desce em espiral, dispara laser e solta naves: Grunts e Scouts primeiro, depois Swarmers. Só uma em campo.' },
];
const FLEET_UPGRADES = [
  { id: 'hull',      name: 'Hull',        inc: 0.10, cap: null, cost: 15, icon: 29, fmt: v => '+' + pct(v), desc: 'HP de todas as naves.' },
  { id: 'warheads',  name: 'Warheads',    inc: 0.10, cap: null, cost: 15, icon: 30, fmt: v => '+' + pct(v), desc: 'Dano de todas as naves (contato, Bolt e laser).' },
  { id: 'thrusters', name: 'Thrusters',   inc: 0.05, cap: 0.5,  cost: 20, icon: 31, fmt: v => '+' + pct(v), desc: 'Velocidade de todas as naves.' },
  { id: 'flow',      name: 'Plasma Flow', inc: 0.5,  cap: null, cost: 20, icon: 32, fmt: v => '+' + v.toFixed(1) + '/s', desc: 'Renda de Plasma por segundo.' },
];
const FLEET = Object.fromEntries(FLEET_UPGRADES.map(f => [f.id, f]));
const INV_TRACKS = [
  { id: 'deploy', name: 'Deploy', icon: 26 },
  { id: 'fleet',  name: 'Fleet',  icon: 27 },
];
// Perfil de compra da IA por Planet Core (a ordem exata é Em aberto no GDD): ela percorre a lista
// em círculo e junta Shards quando o próximo item não cabe.
const AI_PROFILES = {
  Terra: ['damage', 'hitpoints', 'attackSpeed', 'orbitSpeed', 'regen', 'attackRange', 'shield', 'critChance', 'defAbs', 'multiChance', 'critFactor', 'reflect', 'defRel', 'multiTargets'],
  Ice:   ['hitpoints', 'defAbs', 'shield', 'damage', 'reflect', 'regen', 'defRel', 'attackSpeed', 'orbitSpeed', 'hitpoints', 'reflect'],
  Magma: ['damage', 'attackSpeed', 'critChance', 'multiChance', 'critFactor', 'orbitSpeed', 'multiTargets', 'damage', 'hitpoints', 'attackRange'],
};

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
// Quadrant pelo sinal de x e y do chão. Na tela isométrica: 0 cima, 1 esquerda, 2 baixo, 3 direita.
const quadOf = deg => Math.floor(normDeg(deg) / 90) % 4;
const $ = (sel, root = document) => root.querySelector(sel);
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function iconHtml(i) { return `<span class="icon" style="background-position:${-(i % 8) * 32 - 8}px ${-Math.floor(i / 8) * 32 - 8}px"></span>`; }
function planetHtml(core, skin, locked) {
  return `<span class="planet-spin${locked ? ' locked' : ''}" style="background-image:url('${ART}Planet/SPR_Planet_${core}_${skin}_Rotate.png')"></span>`;
}

// ============================================================ save local (Seção 7.3)

const SAVE_KEY = 'armageddonIso.save.v1';   // jogo separado: progresso próprio
function defaultSave() {
  return {
    version: 1,
    cores: ['Terra'],
    skins: ['Terra_Classic', 'Ice_Classic', 'Magma_Classic'],
    core: 'Terra', skin: 'Classic',
    ach: {},                       // id -> true quando desbloqueada
    totals: { motherships: 0 },
    hints: {},
    best: 0, bestPlanet: 0, mode: 'laststand',
    settings: { shake: true, dmgNumbers: true, quadrants: true, reduceFlashes: false, fps30: false, zoom: 1 },
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
  gunner: 'Enemies/SPR_Enemy_Gunner.png',
  bolt: 'Projectiles/SPR_Projectile_GunnerBolt.png',
  reflected: 'Projectiles/SPR_Projectile_Reflected.png',
  reflector: 'Satellites/SPR_Reflector.png',
  shield: 'VFX/SPR_VFX_EnergyShield.png',
  shieldPop: 'VFX/SPR_VFX_EnergyShield_Pop.png',
};
for (const c of CORES) for (const s of c.skins) IMAGE_LIST[`planet_${c.id}_${s}`] = `Planet/SPR_Planet_${c.id}_${s}_Rotate.png`;
// Arte própria do Iso (caminho completo, fora de ART).
IMAGE_LIST.grid = ISO_ART + 'Grid/SPR_Grid_Floor.png';

function loadImages() {
  return Promise.all(Object.entries(IMAGE_LIST).map(([k, path]) => new Promise(res => {
    const im = new Image();
    im.onload = () => { IMG[k] = im; res(); };
    im.onerror = () => { console.warn('Falha ao carregar', path); res(); };
    im.src = path.startsWith('../') ? path : ART + path;
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
let S = 1;                           // pixels físicos do canvas por pixel de jogo (P × dpr, inteiro)
let bgTiles = [], bgStars = [], gridTiles = [];

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  // Escala inteira em pixels FÍSICOS do aparelho: no PC (dpr 1) é 1×, 2×, 3×…; num celular com dpr 3
  // pode ser 5/3 = 1,67× em pixels CSS, que continua sendo 5 pixels físicos por pixel de jogo (sem borrão).
  const dpr = window.devicePixelRatio || 1;
  const raw = Math.min(w / REF_W, h / REF_H);
  P = Math.max(1, Math.floor(raw * dpr)) / dpr;
  if (dpr === 1) P = Math.max(1, P);
  VW = Math.ceil(w / P); VH = Math.ceil(h / P);   // proporção diferente de 16:9 mostra mais espaço
  // O canvas fica na resolução física (não em pixels de jogo) para o zoom do mundo continuar nítido.
  S = Math.round(P * dpr);
  canvas.width = VW * S; canvas.height = VH * S;
  canvas.style.width = VW * P + 'px'; canvas.style.height = VH * P + 'px';
  ui.style.width = VW + 'px'; ui.style.height = VH + 'px';
  ui.style.transform = `scale(${P})`;
  ctx.imageSmoothingEnabled = false;
  const cols = Math.ceil(VW / 32) + 2, rows = Math.ceil(VH / 32) + 2;
  bgTiles = Array.from({ length: cols * rows }, () => Math.floor(Math.random() * 4));
  bgTiles.cols = cols;
  if (!gridTiles.length) {   // variação sorteada de cada tile do grid (fixa durante a sessão)
    const n = 2 * GRID_CELLS;
    gridTiles = Array.from({ length: n * n }, () => Math.random() < 0.06 ? 3 : Math.floor(Math.random() * 3));
  }
  bgStars = Array.from({ length: Math.round(VW * VH / 2600) }, () => ({ x: Math.random() * VW, y: Math.random() * VH, ph: Math.random() * 4 }));
}
window.addEventListener('resize', () => {
  resize();
  // Só reajusta a altura da gaveta: reconstruir os cards perderia a posição da rolagem.
  if (hud && drawerTrack) hud.drawer.style.height = DRAWER_OPEN_H + 'px';
  if (hud) { updateArrows(); updateZoomBtns(); }
});

// ============================================================ zoom do mundo

// Zoom do mundo: botões − e + ao lado da pausa, roda do mouse e teclas + e −. O canvas tem a resolução
// física da tela (S pixels por pixel de jogo), então cada nível é arredondado para S × zoom inteiro: o
// zoom continua pixel perfect. Fundo, setas dos setores, números de dano e HUD não mudam de tamanho.
const ZOOMS = [0.5, 0.75, 1, 1.5, 2];
let view = { k: 1, x: 0, y: 0 };   // transformação base atual: pixel de jogo (ou do mundo) → pixel do canvas
function zoomLevels() {
  const out = [];
  for (const z of ZOOMS) { const e = Math.max(1, Math.round(S * z)) / S; if (!out.includes(e)) out.push(e); }
  return out;
}
function zoomNow() {   // o nível válido mais perto do salvo (a escala muda quando a janela muda)
  const lv = zoomLevels(), z = save.settings.zoom || 1;
  return lv.reduce((b, e) => Math.abs(e - z) < Math.abs(b - z) ? e : b, lv[0]);
}
function stepZoom(dir) {
  const lv = zoomLevels(), i = lv.indexOf(zoomNow()), j = clamp(i + dir, 0, lv.length - 1);
  if (j === i) return;
  save.settings.zoom = lv[j]; writeSave(); updateZoomBtns();
}
function updateZoomBtns() {
  if (!hud || !hud.zoomIn) return;
  const lv = zoomLevels(), z = zoomNow();
  hud.zoomIn.classList.toggle('disabled', z >= lv[lv.length - 1]);
  hud.zoomOut.classList.toggle('disabled', z <= lv[0]);
}
// Matriz composta com a base atual: tf(1, 0, 0, 1, 0, 0) volta para a base.
function tf(a, b, c, d, e, f) { ctx.setTransform(view.k * a, view.k * b, view.k * c, view.k * d, view.k * e + view.x, view.k * f + view.y); }
function screenView() { view = { k: S, x: 0, y: 0 }; tf(1, 0, 0, 1, 0, 0); }
// O zoom é em volta do planeta (ox, oy): um ponto p da tela vai para o + (p − o) × z.
function worldView(ox, oy, z) { view = { k: S * z, x: Math.round(S * ox * (1 - z)), y: Math.round(S * oy * (1 - z)) }; tf(1, 0, 0, 1, 0, 0); }
let wheelT = 0;
ui.addEventListener('wheel', e => {
  if (screen !== 'game' || !run || e.target.closest('#drawer, .screen')) return;
  e.preventDefault();
  const now = performance.now();
  if (now - wheelT < 150) return;   // trackpad manda dezenas de eventos por gesto
  wheelT = now;
  stepZoom(e.deltaY < 0 ? 1 : -1);
}, { passive: false });
window.addEventListener('keydown', e => {
  if (screen !== 'game' || !run || run.paused) return;
  if (e.key === '+' || e.key === '=') stepZoom(1);
  else if (e.key === '-') stepZoom(-1);
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
    mode: invasionUnlocked() ? save.mode : 'laststand',
    core: save.core, skin: save.skin,
    levels: Object.fromEntries(STATS.map(s => [s.id, 0])),
    shards: 15, totalShards: 0, shardFrac: 0,   // 15 Shards iniciais (Seção 4.2): dá para 2 Upgrades logo no início
    wave: 0, waveTimer: 0, warn: 0, warnWave: 0, warnSectors: [], waveTypes: [],
    queue: [], unpaid: [], enemies: [], projectiles: [], fx: [], nums: [],
    satAngle: 45, sats: [], quadFlash: [0, 0, 0, 0],
    time: 0, kills: 0, crits: 0, mothershipsKilled: 0,
    boughtOffense: false, boughtHp: false, cleanStreak: 0,
    bossHitFree: false, planetFlash: 0, paused: false, over: false,
    bolts: [], shieldCharges: 0, shieldT: 0, shieldFlash: 0, refAng: 270,
  };
  r.sats.push({ priority: 'closest', cd: 0 });   // toda run começa com 1 Satellite
  run = r;
  if (r.mode === 'invasion') { startInvasion(); return; }
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
  if (id === 'shield') cMult = 1;   // cargas são inteiras: o Planet Core não muda
  let v = s.value ? s.value(level) : s.base + cAdd + s.inc * level;
  if (s.cap != null) v = Math.min(v, s.cap);
  v *= cMult;
  if (id === 'defRel') v = Math.min(v, 0.9);
  return v;
}
const stat = id => statFor(id, run.levels[id]);
const upgradeCost = (id, level) => STAT[id].costs ? STAT[id].costs[level] : Math.round(STAT[id].cost * Math.pow(1.15, level));
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
  if (id === 'shield') run.shieldCharges += plan.n;   // a carga do nível comprado já vem cheia
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
    run.waveTypes = ['mothership', ...new Set(MOTHER_OPENING), 'swarmer'];   // as naves vêm da Mothership
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
    stopAt: e.stopAt, fireEvery: e.fireEvery, fireT: 0.5,
  });
}
// Cacho de Swarmers: 4 nas primeiras Waves deles (6–9, antes da 1ª Boss Wave), depois 8 (GDD).
// Pedido do playtest: o cacho cheio chegava grande demais logo na estreia.
const swarmSize = w => w < 10 && run.mode !== 'invasion' ? 4 : 8;
function spawnSwarm(w, x, y) {
  for (let i = 0; i < swarmSize(w); i++) spawnEnemy('swarmer', w, x + rand(-0.7, 0.7), y + rand(-0.7, 0.7));
}
// Lançamentos da Mothership, um a cada 15 s (Seção 4.5): primeiro naves simples, que dão Shards
// ao jogador para ele se fortalecer durante a luta, e só depois os cachos de Swarmers.
const MOTHER_OPENING = ['grunt', 'grunt', 'scout', 'scout'];
const MOTHER_OPENING_COUNT = 4;   // naves por lançamento de abertura
const motherLaunchSize = m => MOTHER_OPENING[m.launches] ? MOTHER_OPENING_COUNT : swarmSize(m.w);
function motherLaunch(m) {
  const type = MOTHER_OPENING[m.launches++];
  if (!type) { spawnSwarm(m.w, m.x, m.y); return; }
  for (let i = 0; i < MOTHER_OPENING_COUNT; i++) spawnEnemy(type, m.w, m.x + rand(-0.7, 0.7), m.y + rand(-0.7, 0.7));
}
function spawnMothership(w, sector, rad = SPAWN_R) {
  const a = (sector * 60 + 30) * DEG;
  const hp = MOTHERSHIP.hp * Math.pow(1.09, w - 1);
  run.enemies.push({
    type: 'mothership', w, ang: a, rad, x: Math.cos(a) * rad, y: Math.sin(a) * rad,
    hp, maxHp: hp, laserDmg: MOTHERSHIP.laser * Math.pow(1.06, w - 1), r: MOTHERSHIP.r, shards: MOTHERSHIP.shards,
    state: 'enter', laserT: 8, swarmT: 15, launches: 0, warnT: 0, beamT: 0, t: 0, flash: 0,
  });
}

function processQueue() {
  while (run.queue.length && run.queue[0].at <= run.time) {
    const q = run.queue[0];
    const size = q.type === 'swarmer' ? swarmSize(q.w) : 1;
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

// Resource Bonus (Seção 4.4): chance de a kill pagar o dobro, com um "x2" sobre a nave.
function payKill(e, exact) {
  const double = Math.random() < stat('resBonus');
  addShards(e.shards * (double ? 2 : 1), exact);
  if (double && run.nums.length < 80) run.nums.push({ x: e.x, y: e.y + e.r, label: 'x2', t: 0 });
}

function addShards(amount, exact) {
  if (exact) { const v = Math.round(amount); run.shards += v; run.totalShards += v; return; }
  run.shardFrac += amount;
  const whole = Math.floor(run.shardFrac);
  if (whole > 0) { run.shardFrac -= whole; run.shards += whole; run.totalShards += whole; }
}

// ============================================================ simulação

function update(dt) {
  if (!run || run.paused || run.over) return;
  run.time += dt;
  if (run.mode === 'invasion') { updateSiege(dt); if (run.over) return; }
  else { checkWaveFlow(dt); processQueue(); }

  const maxHp = stat('hitpoints');
  run.hp = Math.min(maxHp, run.hp + stat('regen') * dt);

  // Inimigos
  for (let i = run.enemies.length - 1; i >= 0; i--) {
    const e = run.enemies[i];
    e.t += dt; e.flash = Math.max(0, e.flash - dt);
    if (e.type === 'mothership') { updateMothership(e, dt); continue; }
    const d = Math.hypot(e.bx, e.by);
    const step = e.type === 'gunner' ? Math.min(e.speed * dt, Math.max(0, d - e.stopAt)) : e.speed * dt;
    if (d > 0) { e.bx -= e.bx / d * step; e.by -= e.by / d * step; }
    if (e.type === 'gunner' && d <= e.stopAt + 1e-6) {
      e.fireT -= dt;
      if (e.fireT <= 0) { e.fireT = e.fireEvery; fireBolt(e); }
    }
    if (e.type === 'scout') {
      const off = 0.5 * Math.sin(2 * Math.PI * 1.5 * e.t);
      e.x = e.bx + Math.cos(e.perp) * off; e.y = e.by + Math.sin(e.perp) * off;
    } else { e.x = e.bx; e.y = e.by; }
    e.refCd = Math.max(0, (e.refCd || 0) - dt);
    if (reflectContact(e) && e.dead) continue;
    if (Math.hypot(e.x, e.y) < PLANET_R) {   // kamikaze: dano e some sem dar Shards
      e.dead = true;
      damagePlanet(e.dmg);
      addFx(e.type === 'brute' ? 'expBig' : 'expSmall', e.x, e.y);
      run.enemies.splice(i, 1);
      if (run.over) return;
    }
  }

  // Energy Shield: recarrega 1 carga a cada SHIELD_RECHARGE s enquanto faltar carga.
  if (run.shieldCharges < stat('shield')) {
    run.shieldT += dt;
    if (run.shieldT >= SHIELD_RECHARGE) { run.shieldT -= SHIELD_RECHARGE; run.shieldCharges++; }
  } else run.shieldT = 0;
  run.shieldFlash = Math.max(0, run.shieldFlash - dt);
  run.refAng = normDeg(run.refAng - REFLECT_SPEED * dt);   // horário

  // Gunner Bolts: linha reta até o planeta; o Reflector devolve os que cruzam o arco dele.
  for (let i = run.bolts.length - 1; i >= 0; i--) {
    const b = run.bolts[i];
    const d0 = Math.hypot(b.x, b.y);
    b.px = b.x; b.py = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt;
    const d1 = Math.hypot(b.x, b.y);
    if (d0 > REFLECT_R && d1 <= REFLECT_R && inReflectArc(Math.atan2(b.y, b.x) / DEG)) {
      run.bolts.splice(i, 1);
      reflectBolt(b);
      continue;
    }
    if (d1 < PLANET_R) {
      run.bolts.splice(i, 1);
      damagePlanet(b.dmg);
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
      if (m.warnT <= 0) {
        m.beamT = 0.45;
        if (inReflectArc(m.ang / DEG)) {   // bloqueado: o planeta não toma dano, a Mothership toma
          m.blocked = true;
          addRing(Math.cos(m.ang) * REFLECT_R, Math.sin(m.ang) * REFLECT_R, 1);
          hitEnemy(m, stat('reflect'), false);
        } else { m.blocked = false; damagePlanet(m.laserDmg); addShake(3); }
      }
    }
    if (m.beamT > 0) m.beamT -= dt;
    m.swarmT -= dt;
    if (m.swarmT <= 0 && aliveCount() + motherLaunchSize(m) <= MAX_ENEMIES) { m.swarmT = 15; motherLaunch(m); }
  }
  m.x = Math.cos(m.ang) * m.rad; m.y = Math.sin(m.ang) * m.rad;
}

// Nota da Target Priority: menor é melhor.
function priorityScore(e, priority) {
  switch (priority) {
    case 'weakest': return e.hp;
    case 'strongest': return -e.hp;
    case 'farthest': return -Math.hypot(e.x, e.y);
    default: return Math.hypot(e.x, e.y);
  }
}
const isValidTarget = (e, q, range) => Math.hypot(e.x, e.y) - e.r <= range && quadOf(Math.atan2(e.y, e.x) / DEG) === q;

function pickTarget(q, range, priority) {
  let best = null, bestScore = Infinity;
  for (const e of run.enemies) {
    if (!isValidTarget(e, q, range)) continue;
    const score = priorityScore(e, priority);
    if (score < bestScore) { bestScore = score; best = e; }
  }
  return best;
}

function shoot(sat, target) {
  const crit = Math.random() < stat('critChance');
  const dist = Math.hypot(target.x, target.y);
  const dmg = stat('damage') * (1 + stat('impetus') * dist) * (crit ? stat('critFactor') : 1);
  run.projectiles.push({ x: sat.x, y: sat.y, px: sat.x, py: sat.y, target, dmg, crit, t: Math.random() });
}

// Multishot (Seção 4.1): um sorteio por disparo; os extras vão para outros inimigos válidos,
// na ordem da Target Priority, nunca dois no mesmo alvo.
function fire(sat, target) {
  shoot(sat, target);
  if (Math.random() < stat('multiChance')) {
    const range = stat('attackRange');
    const extras = run.enemies
      .filter(e => e !== target && isValidTarget(e, sat.q, range))
      .sort((a, b) => priorityScore(a, sat.priority) - priorityScore(b, sat.priority))
      .slice(0, stat('multiTargets'));
    for (const e of extras) shoot(sat, e);
  }
  run.quadFlash[sat.q] = 1;
}

// ---------- Gunner Bolt e Reflect Shield (Seção 4.2)

function fireBolt(g) {
  const d = Math.hypot(g.x, g.y) || 1;
  run.bolts.push({ x: g.x, y: g.y, px: g.x, py: g.y, vx: -g.x / d * BOLT_SPEED, vy: -g.y / d * BOLT_SPEED, dmg: g.dmg, src: g });
}

const angDiff = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180);
const inReflectArc = deg => stat('reflect') > 0 && angDiff(deg, run.refAng) <= REFLECT_HALF_ARC;

// Volta teleguiado para quem atirou (ou o inimigo vivo mais perto), com o Reflect Damage.
function reflectBolt(b) {
  let target = b.src && !b.src.dead ? b.src : null;
  if (!target) {
    let bd = Infinity;
    for (const e of run.enemies) { const d = Math.hypot(e.x - b.x, e.y - b.y); if (d < bd) { bd = d; target = e; } }
  }
  addRing(b.x, b.y, 0.5);
  if (target) run.projectiles.push({ x: b.x, y: b.y, px: b.x, py: b.y, target, dmg: stat('reflect'), crit: false, t: 0, refl: true });
}

// Kamikaze cuja borda cruza o círculo do Reflector dentro do arco: dano fixo e empurrão de 1,5 u.
// Retorna true se houve contato.
function reflectContact(e) {
  if (e.refCd > 0 || e.type === 'gunner' || stat('reflect') <= 0) return false;
  const d = Math.hypot(e.x, e.y);
  if (d - e.r > REFLECT_R || d < REFLECT_R - 0.6) return false;
  if (!inReflectArc(Math.atan2(e.y, e.x) / DEG)) return false;
  e.refCd = 1;
  addRing(e.x, e.y, 0.6);
  hitEnemy(e, stat('reflect'), false);
  if (!e.dead) {
    const bd = Math.hypot(e.bx, e.by) || 1;
    e.bx += e.bx / bd * 1.5; e.by += e.by / bd * 1.5;
    e.x = e.bx; e.y = e.by;
  }
  return true;
}

function hitEnemy(e, dmg, crit) {
  if (e.dead) return;
  e.hp -= dmg; e.flash = 0.06;
  if (run.mode === 'invasion') {
    if (save.settings.dmgNumbers && run.nums.length < 80) run.nums.push({ x: e.x, y: e.y + e.r, v: dmg, crit, t: 0 });
    if (e.hp > 0) return;
    e.dead = true;
    run.enemies.splice(run.enemies.indexOf(e), 1);
    payKill(e);   // Shards vão para a IA, que gasta segundo o perfil
    addFx(e.type === 'mothership' ? 'expMother' : e.type === 'brute' ? 'expBig' : 'expSmall', e.x, e.y);
    return;
  }
  if (crit) { run.crits++; if (run.crits === 500) unlockAch('criticalMass'); }
  if (dmg > 10000 && stat('impetus') > 0) unlockAch('sniper');
  if (save.settings.dmgNumbers && run.nums.length < 80) run.nums.push({ x: e.x, y: e.y + e.r, v: dmg, crit, t: 0 });
  if (e.hp > 0) return;
  e.dead = true;
  run.enemies.splice(run.enemies.indexOf(e), 1);
  run.kills++;
  if (e.type === 'mothership') {
    payKill(e, true);
    addFx('expMother', e.x, e.y);
    addShake(4);
    run.mothershipsKilled++;
    save.totals.motherships++;
    unlockAch('giantSlayer');
    if (save.totals.motherships >= 3) unlockAch('tripleThreat');
    if (run.bossHitFree) unlockAch('untouchable');
    writeSave();
  } else {
    payKill(e);
    addFx(e.type === 'brute' ? 'expBig' : 'expSmall', e.x, e.y);
  }
  if (run.core === 'Magma' && run.kills === 1000) unlockAch('eruption');
}

function damagePlanet(raw) {
  if (run.shieldCharges > 0) {   // Energy Shield: uma carga anula o golpe inteiro
    run.shieldCharges--;
    run.shieldFlash = 0.25;
    if (!run.shieldCharges) addFx('shieldPop', 0, 0);
    return;
  }
  const dmg = Math.max(1, (raw - stat('defAbs')) * (1 - stat('defRel')));
  run.hp -= dmg;
  run.planetFlash = 0.08;
  addShake(1.5);
  if (run.mode === 'invasion') {
    run.plasma += 1;   // cada acerto devolve 1 Plasma
    if (run.hp <= 0) planetDown();
    return;
  }
  if (run.enemies.some(e => e.type === 'mothership')) run.bossHitFree = false;
  if (run.hp <= 0) { run.hp = 0; endRun(); }
}

const FX = {
  expSmall:  { img: 'expSmall',  cell: 32, frames: 5, fps: 15 },
  expBig:    { img: 'expBig',    cell: 32, frames: 5, fps: 15 },
  expMother: { img: 'expMother', cell: 64, frames: 6, fps: 12 },
  shieldPop: { img: 'shieldPop', cell: 48, frames: 5, fps: 12 },
};
// Anel que cresce e some (reflexo, escudo estourando), desenhado por código.
function addRing(x, y, r) { run.fx.push({ ring: true, x, y, r, t: 0, dur: 0.3 }); }
function addFx(kind, x, y) { const f = FX[kind]; run.fx.push({ ...f, x, y, t: 0, dur: f.frames / f.fps }); }
function addShake(v) { if (save.settings.shake) shake = Math.min(5, shake + v); }

function endRun() {
  run.over = true;
  if (run.mode === 'invasion') {
    run.newBest = run.planetsDown > save.bestPlanet;
    save.bestPlanet = Math.max(save.bestPlanet, run.planetsDown);
    writeSave();
    drawerTrack = null;
    setTimeout(() => showScreen('results'), 900);
    return;
  }
  run.newBest = run.wave > save.best;
  save.best = Math.max(save.best, run.wave);
  unlockAch('firstContact');
  writeSave();
  drawerTrack = null;
  setTimeout(() => showScreen('results'), 900);
}

// ============================================================ modo Invasion (Seção 4.7)

const invasionUnlocked = () => !!save.ach.holdingLine || location.hash.includes('invasion');
const fleetValue = id => Math.min(FLEET[id].cap ?? Infinity, FLEET[id].inc * run.fleet[id]);
const fleetCost = id => Math.round(FLEET[id].cost * Math.pow(1.15, run.fleet[id]));
const fleetCapped = id => FLEET[id].cap != null && FLEET[id].inc * (run.fleet[id] + 1) > FLEET[id].cap + 1e-9;
const isFortress = n => n % 5 === 0;

function startInvasion() {
  run.plasma = 20; run.planetsDown = 0; run.launched = 0; run.selSector = 0;
  run.fleet = Object.fromEntries(FLEET_UPGRADES.map(f => [f.id, 0]));
  setupPlanet(1);
}

// Monta o Target Planet n: Planet Core sorteado, Satellites e Shards iniciais pela fórmula,
// gastos na hora pelo perfil. As naves que já estão voando continuam.
function setupPlanet(n) {
  const core = CORES[Math.floor(Math.random() * CORES.length)];
  Object.assign(run, {
    planet: n, core: core.id, skin: core.skins[Math.floor(Math.random() * core.skins.length)],
    levels: Object.fromEntries(STATS.map(s => [s.id, 0])),
    shards: Math.round(20 * Math.pow(1.35, n - 1)), shardFrac: 0,
    siege: SIEGE_TIME, aiBonusT: 0, aiSpendT: 0, aiPtr: 0, shieldT: 0,
  });
  const sats = isFortress(n) ? 4 : Math.min(1 + Math.floor((n - 1) / 2), 4);
  run.sats = Array.from({ length: sats }, () => ({ priority: 'closest', cd: 0 }));
  if (isFortress(n)) run.levels.reflect = 3;
  aiSpend();
  run.hp = stat('hitpoints');
  run.shieldCharges = stat('shield');
}

function aiSpend() {
  const prof = AI_PROFILES[run.core];
  for (let guard = 0; guard < 200; guard++) {
    const id = prof[run.aiPtr % prof.length];
    if (atCap(id, run.levels[id])) { run.aiPtr++; continue; }
    const c = upgradeCost(id, run.levels[id]);
    if (c > run.shards) return;   // junta Shards para o próximo item
    const oldMax = stat('hitpoints');
    run.shards -= c;
    run.levels[id]++;
    if (id === 'hitpoints' && run.hp !== undefined) run.hp += stat('hitpoints') - oldMax;
    if (id === 'shield') run.shieldCharges++;
    run.aiPtr++;
  }
}

function updateSiege(dt) {
  run.siege -= dt;
  run.plasma += (3 + fleetValue('flow')) * dt;
  run.aiBonusT += dt;
  if (run.aiBonusT >= 30) { run.aiBonusT -= 30; run.shards += 5 + run.planet; }
  run.aiSpendT -= dt;
  if (run.aiSpendT <= 0) { run.aiSpendT = 0.5; aiSpend(); }
  if (run.siege <= 0) { run.siege = 0; endRun(); }
}

function planetDown() {
  const n = run.planet;
  run.planetsDown++;
  const reward = 10 * n * (isFortress(n) ? 2 : 1);
  run.plasma += reward;
  addFx('expMother', 0, 0);
  addShake(5);
  toast(`Planeta ${n} destruído  +${reward} Plasma`, ICON.trophy);
  setupPlanet(n + 1);
}

function deploy(type) {
  const ship = FLEET_SHIPS.find(f => f.type === type);
  if (run.over || ship.planet > run.planet || ship.cost > run.plasma) return;
  if (type === 'mothership' && run.enemies.some(e => e.type === 'mothership')) return;
  run.plasma -= ship.cost;
  run.launched++;
  const sec = run.selSector;
  const hull = 1 + fleetValue('hull'), war = 1 + fleetValue('warheads'), thr = 1 + fleetValue('thrusters');
  const before = run.enemies.length;
  if (type === 'mothership') spawnMothership(1, sec, DEPLOY_R);
  else {
    const a = (sec * 60 + 8 + Math.random() * 44) * DEG;
    const x = Math.cos(a) * DEPLOY_R, y = Math.sin(a) * DEPLOY_R;
    if (type === 'swarmer') spawnSwarm(1, x, y); else spawnEnemy(type, 1, x, y);
  }
  // Fleet Upgrades valem para as naves novas.
  for (let i = before; i < run.enemies.length; i++) {
    const e = run.enemies[i];
    e.hp *= hull; e.maxHp *= hull;
    if (e.type === 'mothership') e.laserDmg *= war; else { e.dmg *= war; e.speed *= thr; }
  }
  refreshDrawer(true);
}

function buyFleet(id) {
  if (fleetCapped(id)) return;
  const c = fleetCost(id);
  if (c > run.plasma) return;
  run.plasma -= c;
  run.fleet[id]++;
  refreshDrawer(true);
}

// Toque no espaço (fora da gaveta e dos botões) escolhe o Spawn Sector pelo ângulo em volta do planeta.
let lastOrigin = { ox: 0, oy: 0 };
function pickSector(clientX, clientY) {
  const r = ui.getBoundingClientRect();
  const x = (clientX - r.left) / P, y = (clientY - r.top) / P;
  const u = (x - lastOrigin.ox) / ISO_K, v = -(y - lastOrigin.oy) * 2 / ISO_K;   // u = x − y, v = x + y no chão
  const deg = normDeg(Math.atan2((v - u) / 2, (u + v) / 2) / DEG);
  run.selSector = Math.floor(deg / 60) % 6;
}
ui.addEventListener('pointerdown', e => {
  if (screen !== 'game' || !run || run.mode !== 'invasion' || run.paused) return;
  if (e.target.closest('button, #drawer, .screen')) return;   // botões, gaveta e telas por cima não escolhem setor
  pickSector(e.clientX, e.clientY);
});
window.addEventListener('keydown', e => {
  if (screen === 'game' && run && run.mode === 'invasion' && e.key >= '1' && e.key <= '6') run.selSector = +e.key - 1;
});

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
  // O centro sobe metade do FLOOR_DROP: assim o planeta (no plano de voo) e o chão (embaixo dele)
  // ficam centrados juntos na área livre.
  const free = drawerTrack ? VH - drawerH : VH;
  return { cx: Math.round(VW / 2), cy: Math.round(free / 2 - FLOOR_DROP / 2) };
}

// Sombra em pixels (elipse 2:1 desenhada linha a linha, sem antisserrilhado).
function pixelShadow(cx, cy, w) {
  const h = Math.max(1, Math.round(w / 2));
  for (let dy = -h + 1; dy < h; dy++) {
    const half = Math.round(w * Math.sqrt(1 - (dy / h) * (dy / h)));
    if (half > 0) ctx.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2, 1);
  }
}

function render(dt) {
  clock += dt;
  const { cx, cy: cyTarget } = planetScreen();
  camY += (cyTarget - camY) * Math.min(1, dt * 10);
  if (Math.abs(camY - cyTarget) < 0.5) camY = cyTarget;
  shake = Math.max(0, shake - dt * 12);
  const sx = shake ? Math.round(rand(-shake, shake)) : 0, sy = shake ? Math.round(rand(-shake, shake)) : 0;
  const ox = cx + sx, oy = Math.round(camY) + sy;
  // Chão (x, y) → tela, no plano de voo. O chão do grid fica FLOOR_DROP px abaixo (F).
  const W = (x, y) => [Math.round(ox + (x - y) * ISO_K), Math.round(oy - (x + y) * ISO_K / 2)];
  const F = (x, y) => { const p = W(x, y); p[1] += FLOOR_DROP; return p; };

  screenView();
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

  // Daqui até os números de dano, tudo é mundo e segue o zoom (nos menus, sem zoom).
  const z = run ? zoomNow() : 1;
  worldView(ox, oy, z);
  // Pedaço do mundo que aparece na tela com este zoom (para pular os tiles de fora).
  const vx0 = ox - (ox + 32) / z, vx1 = ox + (VW - ox + 32) / z, vy0 = oy - (oy + 32) / z, vy1 = oy + (VH - oy + 32) / z;
  // Grid isométrico (só visual): de trás para frente, com as bordas sumindo no espaço.
  const n = GRID_CELLS;
  for (let sum = 2 * n - 2; sum >= -2 * n; sum--) {
    for (let i = -n; i < n; i++) {
      const j = sum - i;
      if (j < -n || j >= n) continue;
      const ring = Math.max(Math.abs(i + 0.5), Math.abs(j + 0.5));
      const [x, y] = F((i + 0.5) * GRID_CELL, (j + 0.5) * GRID_CELL);
      if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
      ctx.globalAlpha = GRID_ALPHA * (ring < n - 3 ? 1 : Math.max(0.15, (n - ring) / 3.5));
      if (IMG.grid) ctx.drawImage(IMG.grid, gridTiles[(i + n) * 2 * n + (j + n)] * 32, 0, 32, 32, x - 16, y - GRID_TILE_TOP, 32, 32);
    }
  }
  ctx.globalAlpha = 1;
  if (!run) return;

  // Quadrants no chão: eixos pontilhados sobre as linhas centrais do grid + preenchimento quente do
  // Quadrant com Satellite, um quarto de elipse do tamanho do Attack Range.
  ctx.fillStyle = 'rgba(200,200,255,0.35)';
  for (let t = -GRID_CELLS * GRID_CELL; t <= GRID_CELLS * GRID_CELL; t += 0.25) {
    const [ax, ay] = F(t, 0), [bx, by] = F(0, t);
    ctx.fillRect(ax, ay, 1, 1); ctx.fillRect(bx, by, 1, 1);
  }
  if (save.settings.quadrants && !run.over) {
    const R = stat('attackRange');
    const occupied = new Set(run.sats.map(s => s.q));
    // A matriz leva coordenadas do chão direto para a tela: o arco em volta de (0,0) vira elipse.
    tf(ISO_K, -ISO_K / 2, -ISO_K, -ISO_K / 2, ox, oy + FLOOR_DROP);
    for (const q of occupied) {
      const flash = save.settings.reduceFlashes ? run.quadFlash[q] * 0.3 : run.quadFlash[q];
      ctx.fillStyle = `rgba(255,150,60,${0.14 + 0.1 * flash})`;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, q * Math.PI / 2, (q + 1) * Math.PI / 2); ctx.closePath(); ctx.fill();
    }
    tf(1, 0, 0, 1, 0, 0);
  }

  // Sombras no chão: mostram onde cada coisa está no plano, e portanto em qual Quadrant.
  ctx.fillStyle = 'rgba(4,2,16,0.45)';
  { const [x, y] = F(0, 0); pixelShadow(x, y, PLANET_R * ISO_K * 1.3); }
  for (const e of run.enemies) { const [x, y] = F(e.x, e.y); pixelShadow(x, y, Math.max(2, e.r * ISO_K * 1.1)); }
  if (!run.over) for (const s of run.sats) { if (s.x === undefined) continue; const [x, y] = F(s.x, s.y); pixelShadow(x, y, 4); }

  // Mundo ordenado por profundidade: quem está mais acima na tela está mais longe e é desenhado antes.
  // Assim um Satellite passa por trás do planeta na metade de cima da órbita.
  const items = [];
  for (const e of run.enemies) items.push({ k: 'enemy', o: e, p: W(e.x, e.y) });
  items.push({ k: 'planet', p: W(0, 0) });
  if (!run.over) for (const s of run.sats) if (s.x !== undefined) items.push({ k: 'sat', o: s, p: W(s.x, s.y) });
  for (const p of run.projectiles) items.push({ k: 'proj', o: p, p: W(p.x, p.y) });
  for (const b of run.bolts) items.push({ k: 'bolt', o: b, p: W(b.x, b.y) });
  if (!run.over && stat('reflect') > 0) items.push({ k: 'refl', p: W(Math.cos(run.refAng * DEG) * REFLECT_R, Math.sin(run.refAng * DEG) * REFLECT_R) });
  items.sort((a, b) => a.p[1] - b.p[1]);

  for (const it of items) {
    const [x, y] = it.p;
    if (it.k === 'enemy') {
      const e = it.o;
      let img, col = 0, row = 0, cell = 32;
      switch (e.type) {
        case 'grunt': img = IMG.grunt; col = Math.floor(e.t * 6) % 4; row = e.variant; break;
        case 'gunner': img = IMG.gunner; col = Math.floor(e.t * 6) % 4; break;
        case 'scout': img = IMG.scout; col = Math.floor(e.t * 12) % 4; break;
        case 'swarmer': img = IMG.swarmer; col = Math.floor(e.t * 4) % 2; break;
        case 'brute': img = IMG.brute; col = e.variant; break;
        case 'mothership': img = IMG.mothership; col = Math.floor(e.t * 5) % 5; cell = 64; break;
      }
      if (!img) continue;
      const src = e.flash > 0 && !save.settings.reduceFlashes ? whiteOf(img) : img;
      ctx.drawImage(src, col * cell, row * cell, cell, cell, x - cell / 2, y - cell / 2, cell, cell);
    } else if (it.k === 'refl') {
      // Reflector: arco de 40° na órbita de 2,5 u, no plano de voo (a matriz leva o chão para a tela)
      const a = run.refAng;
      tf(ISO_K, -ISO_K / 2, -ISO_K, -ISO_K / 2, ox, oy);
      ctx.strokeStyle = '#8fd8ff'; ctx.lineWidth = 0.16;
      ctx.beginPath(); ctx.arc(0, 0, REFLECT_R, (a - REFLECT_HALF_ARC) * DEG, (a + REFLECT_HALF_ARC) * DEG); ctx.stroke();
      tf(1, 0, 0, 1, 0, 0);
      if (IMG.reflector) ctx.drawImage(IMG.reflector, (Math.floor(clock * 2) % 2) * 32, 0, 32, 32, x - 16, y - 16, 32, 32);
    } else if (it.k === 'bolt') {
      // Gunner Bolt: projétil inimigo magenta com rastro
      const b = it.o, [bx, by] = W(b.px, b.py);
      const dx = x - bx, dy = y - by, d = Math.hypot(dx, dy) || 1;
      ctx.fillStyle = 'rgba(255,90,210,0.5)';
      for (let k = 1; k <= 3; k++) ctx.fillRect(Math.round(x - dx / d * k * 1.5), Math.round(y - dy / d * k * 1.5), 1, 1);
      if (IMG.bolt) ctx.drawImage(IMG.bolt, (Math.floor(clock * 8) % 2) * 32, 0, 32, 32, x - 16, y - 16, 32, 32);
    } else if (it.k === 'planet') {
      // Planeta girando (32 frames a 4 fps)
      const pImg = IMG[`planet_${run.core}_${run.skin}`];
      if (!pImg) continue;
      const f = Math.floor(run.time * 4) % 32;
      const src = run.planetFlash > 0 && !save.settings.reduceFlashes ? whiteOf(pImg) : pImg;
      ctx.drawImage(src, f * 32, 0, 32, 32, x - 16, y - 16, 32, 32);
      // Energy Shield: a bolha (uma linha da spritesheet por número de cargas)
      if (run.shieldCharges > 0 && !run.over && IMG.shield) {
        const src = run.shieldFlash > 0 && !save.settings.reduceFlashes ? whiteOf(IMG.shield) : IMG.shield;
        ctx.drawImage(src, (Math.floor(clock * 6) % 4) * 48, (Math.min(3, run.shieldCharges) - 1) * 48, 48, 48, x - 24, y - 24, 48, 48);
      }
    } else if (it.k === 'sat') {
      // Satellites (orientação fixa, luz piscando a 2 fps)
      if (IMG.satellite) ctx.drawImage(IMG.satellite, (Math.floor(clock * 2) % 2) * 32, 0, 32, 32, x - 16, y - 16, 32, 32);
    } else {
      // Projéteis + rastro curto, na direção do movimento já projetada na tela
      const p = it.o, [px, py] = W(p.px, p.py);
      const dx = x - px, dy = y - py, d = Math.hypot(dx, dy) || 1;
      ctx.fillStyle = p.refl ? 'rgba(143,216,255,0.6)' : 'rgba(255,170,60,0.55)';
      for (let k = 1; k <= 3; k++) ctx.fillRect(Math.round(x - dx / d * k * 1.2), Math.round(y - dy / d * k * 1.2), 1, 1);
      if (p.refl) { if (IMG.reflected) ctx.drawImage(IMG.reflected, (Math.floor(p.t * 8) % 2) * 32, 0, 32, 32, x - 16, y - 16, 32, 32); }
      else if (IMG.projectile) ctx.drawImage(IMG.projectile, (Math.floor(p.t * 8) % 2) * 32, 0, 32, 32, x - 16, y - 16, 32, 32);
    }
  }

  // Laser da Mothership (tiles 32x32 girados ao longo da linha na tela — única exceção à regra de não girar)
  const [px0, py0] = W(0, 0);
  for (const m of run.enemies) {
    if (m.type !== 'mothership' || (m.warnT <= 0 && m.beamT <= 0)) continue;
    const [mx, my] = W(m.x, m.y);
    const ang = Math.atan2(py0 - my, px0 - mx);
    const warn = m.warnT > 0;
    // Para na borda do sprite do planeta, ou no Reflector quando ele bloqueou o laser.
    const [rx, ry] = W(Math.cos(m.ang) * REFLECT_R, Math.sin(m.ang) * REFLECT_R);
    const len = !warn && m.blocked ? Math.hypot(rx - mx, ry - my) : Math.max(0, Math.hypot(px0 - mx, py0 - my) - 14);
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
    if (f.ring) {
      const [x, y] = W(f.x, f.y), k = f.t / f.dur;
      ctx.strokeStyle = `rgba(190,230,255,${1 - k})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, Math.max(1, f.r * ISO_K * (0.4 + k)), 0, Math.PI * 2); ctx.stroke();
      continue;
    }
    const img = IMG[f.img]; if (!img) continue;
    const [x, y] = W(f.x, f.y);
    const fr = Math.min(f.frames - 1, Math.floor(f.t * f.fps));
    ctx.drawImage(img, fr * f.cell, 0, f.cell, f.cell, x - f.cell / 2, y - f.cell / 2, f.cell, f.cell);
  }

  // Números de dano: de volta à tela (o texto não muda de tamanho), na posição com zoom.
  screenView();
  const Z = (x, y) => { const [a, b] = W(x, y); return [Math.round(ox + (a - ox) * z), Math.round(oy + (b - oy) * z)]; };
  if (run.nums.length) {   // os números de dano só entram com a opção ligada; o "x2" sempre
    ctx.font = '16px m5x7';
    ctx.textAlign = 'center';
    for (const d of run.nums) {
      const [x, y] = Z(d.x, d.y);
      const yy = Math.round(y - 8 - d.t * 14);
      ctx.globalAlpha = d.t > 0.45 ? 1 - (d.t - 0.45) / 0.25 : 1;
      const txt = d.label || fmt(d.v) + (d.crit ? '!' : '');
      ctx.fillStyle = '#000'; ctx.fillText(txt, x + 1, yy + 1);
      ctx.fillStyle = d.label ? '#7dffb2' : d.crit ? '#ffd25a' : '#ffffff'; ctx.fillText(txt, x, yy);
    }
    ctx.globalAlpha = 1;
  }

  // Setas dos Spawn Sectors na borda da tela. A direção do setor no chão é projetada na tela, e a seta
  // usada é a das 6 pré-desenhadas (30°, 90°… na tela) mais próxima dela: nada é girado.
  lastOrigin = { ox, oy };
  const invasion = run.mode === 'invasion';
  if ((run.warn > 0 || invasion) && IMG.arrows && !run.over) {
    const top = 24, bottom = (drawerTrack ? DRAWER_OPEN_H : DRAWER_STRIP_H) + 12, side = 12;
    for (const s of invasion ? [0, 1, 2, 3, 4, 5] : run.warnSectors) {
      const a = (s * 60 + 30) * DEG;
      let dx = Math.cos(a) - Math.sin(a), dy = (Math.cos(a) + Math.sin(a)) / 2;   // na tela, y para cima
      const len = Math.hypot(dx, dy); dx /= len; dy /= len;
      const row = ((Math.round((Math.atan2(dy, dx) / DEG - 30) / 60) % 6) + 6) % 6;
      dy = -dy;   // canvas tem y para baixo
      const tx = dx > 0 ? (VW - side - ox) / dx : dx < 0 ? (side - ox) / dx : Infinity;
      const ty = dy > 0 ? (VH - bottom - oy) / dy : dy < 0 ? (top - oy) / dy : Infinity;
      const t = Math.min(tx, ty);
      const x = Math.round(ox + dx * t), y = Math.round(oy + dy * t);
      const lit = invasion ? (s === run.selSector ? Math.floor(clock * 4) % 2 : 1) : Math.floor(clock * 4) % 2;
      ctx.globalAlpha = invasion && s !== run.selSector ? 0.35 : 1;
      ctx.drawImage(IMG.arrows, lit * 32, row * 32, 32, 32, x - 16, y - 16, 32, 32);
      ctx.globalAlpha = 1;
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
      <div class="title">Orbitfall Iso</div>
      <div class="subtitle" style="margin-top:4px">Defenda o planeta. Ou derrube um.</div>
      <div class="row" style="margin-top:6px">
        ${planetHtml(save.core, save.skin)}
        <span class="subtitle">Recorde: Wave ${save.best}${save.bestPlanet ? ` · ${save.bestPlanet} planetas` : ''}</span>
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
    // Layout em 3 faixas: topo (Voltar e título), meio (os Cores ou a explicação do Invasion, que ocupa o
    // espaço que sobrar) e rodapé fixo (o modo e o botão de começar). Com o rodapé fixo, o botão nunca
    // sai da tela, qualquer que seja a altura da janela.
    const s = el(`<div class="screen"></div>`);
    s.appendChild(topbar('Core Select'));
    const middle = el(`<div class="screen-middle"></div>`);
    s.appendChild(middle);

    // Modo: Last Stand ou Invasion (este liberado pela conquista Holding the Line).
    const unlockedInv = invasionUnlocked();
    if (!unlockedInv) save.mode = 'laststand';
    const invasion = save.mode === 'invasion';
    const footer = el(`<div class="screen-footer">
      <button class="btn mode${invasion ? '' : ' sel'}" data-mode="laststand">Last Stand</button>
      <button class="btn mode${invasion ? ' sel' : ''}" data-mode="invasion"${unlockedInv ? '' : ' disabled'}>Invasion${unlockedInv ? '' : ' (Wave 10)'}</button>
      <span class="spacer"></span>
      <button class="btn play">${invasion ? 'Começar invasão' : 'Começar run'}</button>
    </div>`);
    footer.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
      if (b.dataset.mode === 'invasion' && !unlockedInv) return;
      save.mode = b.dataset.mode; writeSave(); showScreen('cores');
    });
    $('.play', footer).onclick = () => { newRun(); showScreen('game'); };
    s.appendChild(footer);

    if (invasion) {
      middle.appendChild(el(`<div class="panel" style="max-width:240px;padding:6px;display:flex;flex-direction:column;gap:3px">
        <span class="h" style="margin:0">Invasion</span>
        <span>Agora você é a invasão. Toque perto da borda para escolher o Spawn Sector e lance naves pela aba Deploy.</span>
        <span class="subtitle">Derrube o planeta antes do Siege Timer (${SIEGE_TIME} s). Ache o Quadrant sem Satellite.</span>
        <span class="subtitle">Recorde: ${save.bestPlanet} planetas</span>
      </div>`));
      ui.appendChild(s);
      return;
    }

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
    middle.appendChild(wrap);
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
    camY = planetScreen().cy;   // começa centrada, sem deslizar do topo
    const h = el(`<div id="hud">
      <div class="hpbar">${iconHtml(STAT.hitpoints.icon)}<div class="bar"><i></i><b></b></div></div>
      <div class="wave-info"><span class="w"></span> <span class="t"></span></div>
      <div class="zoom-btns"><button class="btn zoom-out">-</button><button class="btn zoom-in">+</button></div>
      <button class="btn pause-btn">II</button>
      <div class="foes hidden"></div>
      <div class="boss-bar hidden"><span>Mothership</span><div class="bar"><i></i></div></div>
    </div>`);
    ui.appendChild(h);
    hud.hpFill = $('.hpbar .bar i', h); hud.hpText = $('.hpbar .bar b', h);
    hud.wave = $('.wave-info .w', h); hud.timer = $('.wave-info .t', h);
    hud.boss = $('.boss-bar', h); hud.bossFill = $('.boss-bar i', h);
    $('.pause-btn', h).onclick = () => pause(true);
    hud.zoomIn = $('.zoom-in', h); hud.zoomOut = $('.zoom-out', h);
    hud.zoomIn.onclick = () => stepZoom(1); hud.zoomOut.onclick = () => stepZoom(-1);
    updateZoomBtns();
    hud.foes = $('.foes', h); hud.foesKey = '';

    const d = el(`<div id="drawer">
      <div class="drawer-strip">
        <span class="money shards">${iconHtml(run.mode === 'invasion' ? ICON.plasma : ICON.shards)}<span class="sh">0</span></span><span class="spacer"></span>
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
    for (const t of run.mode === 'invasion' ? INV_TRACKS : TRACKS) {
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
    if (r.mode === 'invasion') {
      const s = el(`<div class="screen"><div class="dialog panel">
        <span class="h">Invasão encerrada</span>
        <div class="row result-body">${planetHtml(r.core, r.skin)}
        <div class="stats">
          <span>Planetas destruídos</span><span>${r.planetsDown}</span>
          <span>Naves lançadas</span><span>${fmt(r.launched)}</span>
          <span>Tempo</span><span>${mins}:${String(secs).padStart(2, '0')}</span>
        </div></div>
        <span class="${r.newBest ? 'badge' : 'subtitle'}">${r.newBest ? 'Novo recorde!' : `Recorde: ${save.bestPlanet} planetas`}</span>
        <div class="row" style="margin-top:4px">
          <button class="btn" data-again>Jogar de novo</button>
          <button class="btn" data-menu>Menu</button>
        </div>
      </div></div>`);
      $('[data-again]', s).onclick = () => { newRun(); showScreen('game'); };
      $('[data-menu]', s).onclick = () => showScreen('menu');
      ui.appendChild(s);
      return;
    }
    const s = el(`<div class="screen"><div class="dialog panel">
      <span class="h">Planeta destruído</span>
      <div class="row result-body">${planetHtml(r.core, r.skin)}
      <div class="stats">
        <span>Wave alcançada</span><span>${r.wave}</span>
        <span>Inimigos destruídos</span><span>${fmt(r.kills)}</span>
        <span>Tempo</span><span>${mins}:${String(secs).padStart(2, '0')}</span>
        <span>Shards coletados</span><span>${fmt(r.totalShards)}</span>
        <span>Motherships</span><span>${r.mothershipsKilled}</span>
      </div></div>
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
  $('.qty', hud.drawer).classList.toggle('hidden', drawerTrack === 'satellites' || run.mode === 'invasion');
  hud.cards.innerHTML = '';
  hud.cards.scrollLeft = 0;
  hud.cardEls = [];
  requestAnimationFrame(updateArrows);   // depois do layout dos cards novos
  if (!open) return;
  if (drawerTrack === 'deploy') {
    for (const f of FLEET_SHIPS) {
      const card = el(`<div class="card">
        <span class="row"><canvas width="16" height="16" class="ship"></canvas><span class="name">${f.name}</span></span>
        <span class="row"><span class="vals"></span><span class="spacer"></span><span class="money cost"></span></span>
      </div>`);
      const img = IMG[f.type], cell = f.type === 'mothership' ? 64 : 32;
      if (img) { const g = $('canvas', card).getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, cell, cell, 0, 0, 16, 16); }
      card.dataset.ship = f.type;
      attachTip(card, () => deploy(f.type));
      hud.cards.appendChild(card);
      hud.cardEls.push(card);
    }
    refreshDrawer(true);
    return;
  }
  if (drawerTrack === 'fleet') {
    for (const f of FLEET_UPGRADES) {
      const card = el(`<div class="card">
        <span class="row">${iconHtml(f.icon)}<span class="name">${f.name}</span><span class="spacer"></span><span class="lvl">Nv <span class="lv"></span></span></span>
        <span class="row"><span class="vals"></span><span class="spacer"></span><span class="money cost"></span></span>
      </div>`);
      card.dataset.fleet = f.id;
      attachTip(card, () => buyFleet(f.id));
      hud.cards.appendChild(card);
      hud.cardEls.push(card);
    }
    refreshDrawer(true);
    return;
  }
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
  else if (card.dataset.ship) {
    const f = FLEET_SHIPS.find(x => x.type === card.dataset.ship);
    name = f.name; desc = f.desc;
    next = f.planet > run.planet ? `Libera no planeta ${f.planet}` : `Custo: ${f.cost} Plasma`;
  } else if (card.dataset.fleet) {
    const f = FLEET[card.dataset.fleet], lvl = run.fleet[f.id];
    name = f.name; desc = f.desc;
    next = fleetCapped(f.id) ? 'Nível máximo' : `Nv ${lvl + 1}: ${f.fmt(f.inc * (lvl + 1))}`;
  } else {
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

// Invasion: o painel do canto mostra a defesa do Target Planet, para o jogador ler onde atacar.
function updateIntel() {
  const rows = [
    CORES.find(c => c.id === run.core).name,
    `Satellites ${run.sats.length}`,
    `Damage ${fmt(stat('damage'))} · ${stat('attackSpeed').toFixed(1)}/s`,
    stat('multiChance') > 0 ? `Multishot ${pct(stat('multiChance'))}` : '',
    stat('shield') > 0 ? `Shield ${run.shieldCharges}/${stat('shield')}` : '',
    stat('reflect') > 0 ? `Reflect ${fmt(stat('reflect'))}` : '',
    `Shards ${fmt(run.shards)}`,
  ].filter(Boolean);
  const key = rows.join('|');
  if (key === hud.foesKey) return;
  hud.foesKey = key;
  hud.foes.classList.remove('hidden');
  hud.foes.innerHTML = rows.map(r => `<div class="foe">${r}</div>`).join('');
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
  const inv = run.mode === 'invasion';
  hud.shards.textContent = fmt(inv ? Math.floor(run.plasma) : run.shards);
  if (force && hud.tipCard) showTip(hud.tipCard);
  for (const c of hud.cardEls || []) {
    if (c.dataset.ship) {
      const f = FLEET_SHIPS.find(x => x.type === c.dataset.ship), locked = f.planet > run.planet;
      $('.vals', c).innerHTML = locked ? `<span class="subtitle">Planeta ${f.planet}</span>` : '';
      $('.cost', c).innerHTML = locked ? '' : `${iconHtml(ICON.plasma)}${f.cost}`;
      const can = !locked && f.cost <= run.plasma;
      c.classList.toggle('poor', !can); c.classList.toggle('can', can);
      continue;
    }
    if (c.dataset.fleet) {
      const id = c.dataset.fleet, f = FLEET[id], lvl = run.fleet[id];
      $('.lv', c).textContent = lvl;
      const cur = f.fmt(f.inc * lvl);
      if (fleetCapped(id)) {
        $('.vals', c).innerHTML = cur; $('.cost', c).innerHTML = '<span class="subtitle">Máx</span>';
        c.classList.add('poor'); c.classList.remove('can');
        continue;
      }
      const cost = fleetCost(id);
      $('.vals', c).innerHTML = `${cur} &gt; <em>${f.fmt(f.inc * (lvl + 1))}</em>`;
      $('.cost', c).innerHTML = `${iconHtml(ICON.plasma)}${fmt(cost)}`;
      c.classList.toggle('poor', cost > run.plasma); c.classList.toggle('can', cost <= run.plasma);
      continue;
    }
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
  if (run.mode === 'invasion') {
    hud.wave.textContent = `Planeta ${run.planet}${isFortress(run.planet) ? ' · Fortress' : ''}`;
    hud.timer.textContent = `· ${Math.ceil(run.siege)}s`;
    hud.boss.classList.add('hidden');
    updateIntel();
    refreshDrawer(false);
    hud.hint.classList.add('hidden');
    return;
  }
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
  if (dev.includes('invasion')) save.mode = 'invasion';   // #play,invasion começa no Invasion
  if (dev.includes('play')) { newRun(); showScreen('game'); }
  for (const t of TRACKS) if (dev.includes(t.id)) { drawerTrack = t.id; buildDrawer(); }
  if (dev.includes('rich') && run) { run.shards = 5000; run.plasma = 5000; }
  const planetAt = dev.find(d => d.startsWith('planet='));   // #play,invasion,planet=5 começa na Fortress
  if (planetAt && run && run.mode === 'invasion') setupPlanet(+planetAt.slice(7));
  if (dev.includes('sats') && run) { save.hints.buy = true; while (run.sats.length < MAX_SATELLITES) { run.shards += satelliteCost(); buySatellite(); } }   // #play,sats: 4 Satellites
  const startAt = dev.find(d => d.startsWith('wave='));   // #play,wave=10 começa na Boss Wave
  if (startAt && run) prepareWave(+startAt.slice(5));
  const sim = dev.find(d => d.startsWith('sim='));   // #play,sim=40 avança a simulação 40 s
  if (sim && run) for (let i = 0; i < +sim.slice(4) * 60; i++) update(1 / 60);
  for (const name of ['cores', 'achievements', 'settings']) if (dev.includes(name)) showScreen(name);
  last = performance.now();
  requestAnimationFrame(frame);
});
