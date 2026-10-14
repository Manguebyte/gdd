// Star Expedition Co. — protótipo jogável em JavaScript puro.
// Segue a Parte 1 do GDD (StarExpeditionCo.md): Starter Pick, Expeditions com timer real e semente,
// Member Loss, Loot com Rare Items, Oficina com 4 Tech Tiers, Loja (vender/contratar), Cycles e tutorial.
// A arte vem direto de Sprites/StarExpeditionCo/ (fonte única), sem cópias.
'use strict';

const ART = '../../Sprites/StarExpeditionCo/';
const REF_W = 360, REF_H = 640;   // resolução de referência (GDD §10.2)
const SAVE_KEY = 'starexpeditionco-save-v1';
const VERSION = 'protótipo web 0.1';

// ============================================================ atalhos de desenvolvimento (#fast,rich,...)

const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
const SPEED = DEV.has('fast') ? 60 : 1;   // #fast: timers 60x mais rápidos

// ============================================================ dados de design (GDD §16)

const CLASSES = [
  { id: 'scout',     name: 'Batedor',    color: '#5EC46B', price: 60,  bonus: { success: 12 } },
  { id: 'engineer',  name: 'Engenheiro', color: '#F2A33A', price: 60,  bonus: { loot: 40 } },
  { id: 'guard',     name: 'Guarda',     color: '#8A96B8', price: 60,  bonus: { risk: 10 } },
  { id: 'scientist', name: 'Cientista',  color: '#B07CFF', price: 120, bonus: { rare: 4 } },
  { id: 'medic',     name: 'Médico',     color: '#4FC3C9', price: 120, bonus: { loss: 20 } },
  { id: 'pilot',     name: 'Piloto',     color: '#FF8A3D', price: 120, bonus: { duration: 25 } },
];
const CLASS = Object.fromEntries(CLASSES.map(c => [c.id, c]));
const ART_CLASS = { scout: 'Scout', engineer: 'Engineer', guard: 'Guard', scientist: 'Scientist', medic: 'Medic', pilot: 'Pilot' };

const GALAXIES = [
  { name: 'Cinturão Mangue', color: '#5EC46B' },
  { name: 'Nebulosa Âmbar',  color: '#F2A33A' },
  { name: 'Abismo de Vega',  color: '#B07CFF' },
];

// Loot Table: [itemId, chance %, min, max]. Rare Items só têm chance (sempre 1 unidade).
const PLANETS = [
  { id: 'kora',     name: 'Kora',             risk: 5,  dur: 60,    loot: [['iron_ore', 100, 3, 5], ['silica_sand', 70, 2, 3], ['alien_relic', 1]] },
  { id: 'rust9',    name: 'Rust-9',           risk: 10, dur: 120,   loot: [['iron_ore', 90, 4, 6], ['circuit_board', 35, 1, 2], ['alien_relic', 1.5]] },
  { id: 'glacia',   name: 'Glacia',           risk: 14, dur: 240,   loot: [['ice_crystal', 100, 3, 5], ['silica_sand', 60, 2, 4], ['alien_relic', 2]] },
  { id: 'tamarin',  name: 'Tamarin',          risk: 18, dur: 360,   loot: [['carbon_dust', 90, 3, 5], ['circuit_board', 45, 1, 2], ['star_pearl', 2]] },
  { id: 'duna',     name: 'Duna',             risk: 24, dur: 600,   loot: [['silica_sand', 100, 5, 8], ['power_cell', 35, 1, 2], ['alien_relic', 3]] },
  { id: 'coral',    name: 'Coral Prime',      risk: 30, dur: 900,   loot: [['ice_crystal', 80, 4, 6], ['carbon_dust', 80, 3, 5], ['power_cell', 45, 1, 2], ['star_pearl', 3]] },
  { id: 'ember',    name: 'Ember',            risk: 35, dur: 900,   loot: [['titanium_ore', 100, 3, 5], ['carbon_dust', 70, 3, 5], ['star_pearl', 3]] },
  { id: 'halcyon',  name: 'Halcyon',          risk: 40, dur: 1200,  loot: [['helium3', 90, 2, 4], ['power_cell', 50, 1, 2], ['living_crystal', 3]] },
  { id: 'mire',     name: 'Mire',             risk: 45, dur: 1800,  loot: [['titanium_ore', 90, 4, 6], ['alloy_plate', 40, 1, 2], ['star_pearl', 4]] },
  { id: 'vitra',    name: 'Vitra',            risk: 50, dur: 2400,  loot: [['silica_sand', 90, 6, 9], ['optical_lens', 40, 1, 2], ['living_crystal', 4]] },
  { id: 'obsidia',  name: 'Obsidia',          risk: 55, dur: 3000,  loot: [['titanium_ore', 80, 5, 7], ['alloy_plate', 50, 1, 3], ['living_crystal', 5]] },
  { id: 'lumen',    name: 'Lumen',            risk: 60, dur: 3600,  loot: [['helium3', 90, 3, 5], ['optical_lens', 50, 1, 2], ['fuel_rod', 30, 1, 1], ['living_crystal', 6]] },
  { id: 'vegarift', name: 'Vega Rift',        risk: 65, dur: 3600,  loot: [['plasma_moss', 100, 3, 5], ['fuel_rod', 45, 1, 2], ['dark_matter', 4]] },
  { id: 'hollow',   name: 'Hollow',           risk: 70, dur: 5400,  loot: [['void_dust', 90, 2, 4], ['nano_gel', 40, 1, 2], ['ancient_core', 4]] },
  { id: 'nyx',      name: 'Nyx',              risk: 75, dur: 7200,  loot: [['plasma_moss', 90, 4, 6], ['quantum_chip', 35, 1, 1], ['dark_matter', 5]] },
  { id: 'cinder',   name: 'Cinder Crown',     risk: 80, dur: 9000,  loot: [['titanium_ore', 90, 6, 9], ['graviton_coil', 35, 1, 1], ['ancient_core', 5]] },
  { id: 'echo',     name: 'Echo',             risk: 85, dur: 10800, loot: [['void_dust', 90, 4, 6], ['quantum_chip', 45, 1, 2], ['nano_gel', 45, 1, 2], ['dark_matter', 6]] },
  { id: 'gate',     name: 'Singularity Gate', risk: 90, dur: 14400, loot: [['void_dust', 100, 5, 8], ['graviton_coil', 50, 1, 2], ['singularity_seed', 5], ['ancient_core', 6]] },
];
PLANETS.forEach((p, i) => { p.idx = i; p.galaxy = Math.floor(i / 6); });
const PLANET = Object.fromEntries(PLANETS.map(p => [p.id, p]));

// Posições no mapa (0,0 embaixo à esquerda); Galaxies de índice ímpar espelham o x (igual ao gerador Unity).
const MAP_PATH = [[0.30, 0.10], [0.70, 0.26], [0.35, 0.42], [0.68, 0.58], [0.30, 0.74], [0.62, 0.90]];

const ITEMS = [
  ['iron_ore', 'Minério de Ferro', 'raw', 2], ['silica_sand', 'Areia de Sílica', 'raw', 2],
  ['ice_crystal', 'Cristal de Gelo', 'raw', 3], ['carbon_dust', 'Pó de Carbono', 'raw', 4],
  ['titanium_ore', 'Minério de Titânio', 'raw', 6], ['helium3', 'Hélio-3', 'raw', 8],
  ['plasma_moss', 'Musgo de Plasma', 'raw', 10], ['void_dust', 'Pó do Vazio', 'raw', 14],
  ['circuit_board', 'Placa de Circuito', 'comp', 10], ['power_cell', 'Célula de Energia', 'comp', 14],
  ['alloy_plate', 'Placa de Liga', 'comp', 22], ['optical_lens', 'Lente Óptica', 'comp', 26],
  ['fuel_rod', 'Barra de Combustível', 'comp', 34], ['nano_gel', 'Nanogel', 'comp', 45],
  ['quantum_chip', 'Chip Quântico', 'comp', 60], ['graviton_coil', 'Bobina de Gráviton', 'comp', 80],
  ['alien_relic', 'Relíquia Alienígena', 'rare', 80], ['star_pearl', 'Pérola Estelar', 'rare', 120],
  ['living_crystal', 'Cristal Vivo', 'rare', 200], ['dark_matter', 'Fragmento de Matéria Escura', 'rare', 350],
  ['ancient_core', 'Núcleo Ancestral', 'rare', 450], ['singularity_seed', 'Semente da Singularidade', 'rare', 1200],
].map(([id, name, cat, price]) => ({ id, name, cat, price }));

// Recipes (§16.5): ingredientes como [itemId, qtd]; o Equipment do Tier anterior entra como ingrediente.
const RECIPES = [
  { tier: 1, id: 'field_scanner',    name: 'Scanner de Campo',          bonus: { success: 5 },          ing: [['iron_ore', 6], ['circuit_board', 1]] },
  { tier: 1, id: 'padded_suit',      name: 'Traje Acolchoado',          bonus: { risk: 4 },             ing: [['silica_sand', 8], ['carbon_dust', 4]] },
  { tier: 1, id: 'salvage_kit',      name: 'Kit de Coleta',             bonus: { loot: 15 },            ing: [['iron_ore', 6], ['silica_sand', 4]] },
  { tier: 1, id: 'emergency_beacon', name: 'Sinalizador de Emergência', bonus: { loss: 8 },             ing: [['ice_crystal', 6], ['power_cell', 1]] },
  { tier: 2, id: 'deep_scanner',     name: 'Scanner Profundo',          bonus: { success: 10 },         ing: [['field_scanner', 1], ['titanium_ore', 8], ['optical_lens', 1]] },
  { tier: 2, id: 'alloy_armor',      name: 'Armadura de Liga',          bonus: { risk: 8 },             ing: [['padded_suit', 1], ['alloy_plate', 2], ['titanium_ore', 6]] },
  { tier: 2, id: 'drill_rig',        name: 'Perfuratriz',               bonus: { loot: 30 },            ing: [['salvage_kit', 1], ['helium3', 5], ['power_cell', 2]] },
  { tier: 2, id: 'stasis_pod',       name: 'Cápsula de Estase',         bonus: { loss: 15 },            ing: [['emergency_beacon', 1], ['helium3', 4], ['star_pearl', 1]] },
  { tier: 3, id: 'quantum_scanner',  name: 'Scanner Quântico',          bonus: { success: 16 },         ing: [['deep_scanner', 1], ['quantum_chip', 1], ['optical_lens', 2]] },
  { tier: 3, id: 'shield_harness',   name: 'Arnês de Escudo',           bonus: { risk: 13 },            ing: [['alloy_armor', 1], ['fuel_rod', 2], ['plasma_moss', 6]] },
  { tier: 3, id: 'nano_forge',       name: 'Nanoforja',                 bonus: { loot: 50, rare: 2 },   ing: [['drill_rig', 1], ['nano_gel', 2], ['living_crystal', 1]] },
  { tier: 3, id: 'phase_cloak',      name: 'Manto de Fase',             bonus: { loss: 22, risk: 4 },   ing: [['stasis_pod', 1], ['void_dust', 5], ['fuel_rod', 1]] },
  { tier: 4, id: 'oracle_array',     name: 'Matriz Oráculo',            bonus: { success: 24 },         ing: [['quantum_scanner', 1], ['quantum_chip', 2], ['dark_matter', 1]] },
  { tier: 4, id: 'graviton_aegis',   name: 'Égide de Gráviton',         bonus: { risk: 20 },            ing: [['shield_harness', 1], ['graviton_coil', 2], ['ancient_core', 1]] },
  { tier: 4, id: 'matter_weaver',    name: 'Tecelã de Matéria',         bonus: { loot: 75, rare: 3 },   ing: [['nano_forge', 1], ['graviton_coil', 1], ['dark_matter', 1], ['nano_gel', 2]] },
  { tier: 4, id: 'lazarus_module',   name: 'Módulo Lázaro',             bonus: { loss: 30, risk: 8 },   ing: [['phase_cloak', 1], ['ancient_core', 1], ['living_crystal', 2]] },
];
const EQUIP_PRICE = { 1: 30, 2: 90, 3: 250, 4: 600 };
RECIPES.forEach(r => ITEMS.push({ id: r.id, name: r.name, cat: 'equip', price: EQUIP_PRICE[r.tier], tier: r.tier, bonus: r.bonus }));
const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const CAT_ORDER = { raw: 0, comp: 1, rare: 2, equip: 3 };

// Tech Tier liberado ao ALCANÇAR o Planet (índice): Ember, Vega Rift, Cinder Crown.
const TIER_UNLOCK = { 2: 6, 3: 12, 4: 15 };

const K = {
  successBase: 95, successMin: 5, successMax: 98,
  lossBase: 25, lossPerRisk: 0.4, lossMax: 90,
  durationCutMax: 60, durationMin: 30,
  riskPerCycle: 8, lootPerCycle: 25, rarePerCycle: 2,
  hireGrowth: 1.25,
  tutorialDuration: 30,
};

const FIRST_NAMES = ['Ana', 'Bia', 'Caio', 'Davi', 'Edu', 'Fe', 'Gil', 'Ian', 'Jade', 'Kai',
  'Lia', 'Leo', 'Mei', 'Nina', 'Otto', 'Paz', 'Rui', 'Sol', 'Tito', 'Uri',
  'Vera', 'Zoe', 'Ravi', 'Iara', 'Noah', 'Maya', 'Theo', 'Luna', 'Omar', 'Ines'];
const LAST_NAMES = ['Moura', 'Kato', 'Silva', 'Okafor', 'Lind', 'Rocha', 'Tanaka', 'Costa', 'Novak', 'Reyes',
  'Arruda', 'Kim', 'Lopes', 'Ivanov', 'Duarte', 'Sato', 'Brito', 'Nunes', 'Pereira', 'Mendes'];

// ============================================================ utilidades

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const fmtInt = n => Math.floor(n).toLocaleString('pt-BR');
const pct = n => Math.round(n) + '%';

function fmtDur(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

// Gerador com semente (mulberry32): o resultado fica fixo desde o envio (GDD §2).
function rngFrom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const icon = (name, cls = 'ico16') => `<img class="${cls}" src="${ART}UI/SPR_UI_Icon_${name}.png" alt="">`;
const itemIcon = (id, cls = 'ico32') => `<img class="${cls}" src="${ART}Items/SPR_Item_${id}.png" alt="" title="${ITEM[id].name}">`;
const portrait = (m, cls = '') =>
  `<div class="portrait ${cls}" style="background-image:url('${ART}Crew/SPR_Crew_${ART_CLASS[m.cls]}_${m.v}.png');animation-delay:-${(m.id * 0.37) % 1}s"></div>`;

const BONUS_LABEL = {
  success: v => `Sucesso +${v}`,
  risk: v => `Risco −${v}`,
  loot: v => `Loot +${v}%`,
  rare: v => `Raro +${v} p.p.`,
  loss: v => `Perda −${v} p.p.`,
  duration: v => `Duração −${v}%`,
};
const bonusText = b => Object.entries(b).map(([k, v]) => BONUS_LABEL[k](v)).join(', ');

// ============================================================ estado e save

let S;   // estado salvo
const ui = { tab: 'map', galaxy: 0, sheet: null, sel: new Set(), tier: 1, starter: null, clockBack: false };

function newState() {
  return {
    v: 1, credits: 0, cycle: 1, progress: 0, tier: 1, cycleReady: false,
    roster: [], nextId: 1, inv: {}, exps: [],
    tut: 0, notify: false, shopSeen: false, lastSeen: Date.now(),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return Object.assign(newState(), JSON.parse(raw));
  } catch (e) { console.warn('save ilegível, começando do zero', e); }
  return newState();
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* sem storage: segue sem salvar */ }
}

// Relógio do aparelho com proteção contra volta (GDD §4.4): se a hora voltar, os timers congelam
// na última hora vista até o relógio alcançá-la.
function now() {
  const real = Date.now();
  if (real < S.lastSeen) { ui.clockBack = true; return S.lastSeen; }
  ui.clockBack = false;
  S.lastSeen = real;
  return real;
}

// ============================================================ regras (GDD §16.2)

const member = id => S.roster.find(m => m.id === id);
const expAt = planetId => S.exps.find(e => e.planet === planetId);
const busyPlanet = m => { const e = S.exps.find(e => e.squad.includes(m.id)); return e && PLANET[e.planet]; };

function squadBonus(members) {
  const b = { success: 0, risk: 0, loot: 0, rare: 0, loss: 0, duration: 0 };
  for (const m of members) {
    for (const [k, v] of Object.entries(CLASS[m.cls].bonus)) b[k] += v;
    if (m.equip) for (const [k, v] of Object.entries(ITEM[m.equip].bonus)) b[k] += v;
  }
  return b;
}

const planetRisk = p => p.risk + K.riskPerCycle * (S.cycle - 1);

function forecast(p, members) {
  const b = squadBonus(members);
  const risk = planetRisk(p);
  const eff = Math.max(0, risk - b.risk);
  return {
    b, risk, eff,
    success: clamp(K.successBase - eff + b.success, K.successMin, K.successMax),
    loss: clamp(K.lossBase + K.lossPerRisk * eff - b.loss, 0, K.lossMax),
    dur: Math.max(K.durationMin, p.dur * (1 - Math.min(K.durationCutMax, b.duration) / 100)),
  };
}

function hirePrice(cls) {
  const p = CLASS[cls].price * Math.pow(K.hireGrowth, S.roster.length - 1);
  return Math.max(5, Math.round(p / 5) * 5);
}

function newName() {
  const used = new Set(S.roster.map(m => m.name));
  for (let i = 0; i < 50; i++) {
    const n = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    if (!used.has(n)) return n;
  }
  return `${pick(FIRST_NAMES)} ${10 + Math.floor(Math.random() * 89)}`;
}

function addMember(cls, v = 1 + Math.floor(Math.random() * 3), name = newName()) {
  const m = { id: S.nextId++, cls, v, name, equip: null };
  S.roster.push(m);
  return m;
}

const addItem = (id, n) => { S.inv[id] = (S.inv[id] || 0) + n; if (S.inv[id] <= 0) delete S.inv[id]; };
const has = id => S.inv[id] || 0;

// Tech Tiers ficam liberados para sempre, mesmo quando o Cycle zera o progresso.
function updateTier() {
  for (const t of [2, 3, 4]) if (S.progress >= TIER_UNLOCK[t]) S.tier = Math.max(S.tier, t);
}

// ============================================================ ações

function send(planetId) {
  const p = PLANET[planetId];
  const squad = [...ui.sel].map(member).filter(m => m && !busyPlanet(m));
  if (!squad.length || expAt(planetId) || p.idx > S.progress) return;
  const f = forecast(p, squad);
  const tutorial = S.tut === 1 && planetId === 'kora';
  const dur = (tutorial ? K.tutorialDuration : f.dur) / SPEED;
  const t = now();
  S.exps.push({
    planet: planetId, squad: squad.map(m => m.id), start: t, end: t + dur * 1000,
    seed: (Math.random() * 2 ** 32) >>> 0, success: f.success, loss: f.loss,
    bonus: f.b, risk: f.risk, cycle: S.cycle, tutorial, notified: false,
  });
  ui.sel.clear();
  closeSheet();
  if (tutorial) S.tut = 2;
  save();
  renderAll();
}

function claim(planetId) {
  const e = expAt(planetId);
  if (!e || now() < e.end) return;
  const p = PLANET[planetId];
  const r = rngFrom(e.seed);
  const squad = e.squad.map(member).filter(Boolean);
  const res = { planet: p, success: false, loot: [], lost: null, unlocked: null };

  if (e.tutorial) {
    // 1ª Expedition: Success garantido com Loot fixo (GDD §9).
    res.success = true;
    res.loot = [['iron_ore', 8], ['silica_sand', 5]];
  } else if (r() * 100 < e.success) {
    res.success = true;
    const lootMul = 1 + (e.bonus.loot + K.lootPerCycle * (e.cycle - 1)) / 100;
    for (const [id, chance, min, max] of p.loot) {
      if (ITEM[id].cat === 'rare') {
        const c = chance * (1 + e.risk / 100) + e.bonus.rare + K.rarePerCycle * (e.cycle - 1);
        if (r() * 100 < c) res.loot.push([id, 1]);
      } else if (r() * 100 < chance) {
        const q = Math.round((min + Math.floor(r() * (max - min + 1))) * lootMul);
        if (q > 0) res.loot.push([id, q]);
      }
    }
    if (!res.loot.length) res.loot.push([p.loot[0][0], p.loot[0][2]]);
  } else if (squad.length && r() * 100 < e.loss) {
    // Member Loss: um membro sorteado não volta, e o Equipment dele se perde junto (GDD §3.4).
    res.lost = squad[Math.floor(r() * squad.length)];
    S.roster = S.roster.filter(m => m !== res.lost);
  }

  for (const [id, q] of res.loot) addItem(id, q);
  S.exps = S.exps.filter(x => x !== e);

  // O Claim (Success ou Failure) no Planet mais avançado libera o próximo (GDD §4.1).
  if (p.idx === S.progress) {
    if (S.progress < PLANETS.length - 1) {
      S.progress++;
      res.unlocked = PLANETS[S.progress];
      const before = S.tier;
      updateTier();
      if (S.tier > before) res.tier = S.tier;
    } else {
      S.cycleReady = true;
    }
  }
  closeSheet();
  if (S.tut === 3) S.tut = 4;
  emergencyRecruit();
  save();
  renderAll();
  showResult(res);
}

function craft(id) {
  const rec = RECIPES.find(r => r.id === id);
  if (!rec || rec.tier > S.tier || !rec.ing.every(([i, n]) => has(i) >= n)) return;
  for (const [i, n] of rec.ing) addItem(i, -n);
  addItem(id, 1);
  toast(`Craftado: ${rec.name}`);
  save();
  renderAll();
}

function equip(memberId, itemId) {
  const m = member(memberId);
  if (!m || busyPlanet(m) || !has(itemId)) return;
  if (m.equip) addItem(m.equip, 1);   // trocar devolve o anterior ao inventário
  addItem(itemId, -1);
  m.equip = itemId;
  save();
  renderAll();
}

function unequip(memberId) {
  const m = member(memberId);
  if (!m || busyPlanet(m) || !m.equip) return;
  addItem(m.equip, 1);
  m.equip = null;
  save();
  renderAll();
}

function sell(id, all) {
  const n = all ? has(id) : Math.min(1, has(id));
  if (!n) return;
  addItem(id, -n);
  S.credits += n * ITEM[id].price;
  save();
  renderAll();
}

function hire(cls) {
  const price = hirePrice(cls);
  if (S.credits < price) return;
  S.credits -= price;
  const m = addMember(cls);
  toast(`${m.name} entrou na companhia!`);
  save();
  renderAll();
}

function newCycle() {
  if (!S.cycleReady || S.exps.length) return;
  S.cycle++;
  S.progress = 0;
  S.cycleReady = false;
  ui.galaxy = 0;
  closeSheet();
  save();
  renderAll();
  showModal(`<div class="title amber">Ciclo ${S.cycle}</div><div class="sep"></div>
    <div>Os Planets voltaram a ficar bloqueados, agora com Risco +${K.riskPerCycle * (S.cycle - 1)}
    e Loot +${K.lootPerCycle * (S.cycle - 1)}%.</div><br><div class="dim">Tripulação, Equipment, inventário, Credits e Tech Tiers continuam com você.</div>
    <br><button class="btn wide" data-a="closeModal">Bora</button>`);
}

// Roster vazio e sem Credits para contratar ninguém: o jogo dá um Scout grátis (GDD §3.5).
function emergencyRecruit() {
  if (S.roster.length || S.tut === 0) return;
  const cheapest = Math.min(...CLASSES.map(c => hirePrice(c.id)));
  if (S.credits >= cheapest) return;
  const m = addMember('scout');
  setTimeout(() => showModal(`<div class="row">${icon('Alert')}<span class="amber">Recruta de Emergência</span></div><div class="sep"></div>
    <div>A companhia ficou sem tripulação. A sede mandou <span class="amber">${m.name}</span>, Batedor, sem custo.</div>
    <br><button class="btn wide" data-a="closeModal">Ok</button>`), 50);
}

function starterPick(i) {
  const c = ui.starter[i];
  addMember(c.cls, c.v, c.name);
  S.tut = 1;
  ui.starter = null;
  save();
  renderAll();
}

// ============================================================ renderização

function renderAll() {
  renderTop();
  renderTabs();
  renderContent();
  if (ui.sheet) renderSheet();
  applyTutorial();
}

function renderTop() {
  // Só reescreve se mudou: o tick chama isto 4x por segundo e trocar o DOM engoliria cliques na engrenagem.
  const html = `
    <img class="ico16 gear" data-a="settings" src="${ART}UI/SPR_UI_Icon_Settings.png" alt="">
    <div class="row">${icon('Cycle')}<span>Ciclo ${S.cycle}</span></div>
    ${ui.clockBack ? `<div class="row clock-warn">${icon('Alert')}relógio voltou</div>` : ''}
    <div class="grow"></div>
    <div class="row amber">${icon('Credits')}<span>${fmtInt(S.credits)} Créd.</span></div>`;
  if (html !== renderTop.last) $('#topbar').innerHTML = renderTop.last = html;
}

const TABS = [['map', 'Map', 'Mapa'], ['crew', 'Crew', 'Tripulação'], ['workshop', 'Workshop', 'Oficina'], ['shop', 'Shop', 'Loja']];

function shopDot() {
  return !S.shopSeen && S.tut >= 7 && S.credits >= Math.min(...CLASSES.map(c => hirePrice(c.id)));
}

function renderTabs() {
  $('#tabbar').innerHTML = TABS.map(([id, ico, label]) => `
    <div class="tab ${ui.tab === id ? 'on' : ''}" data-tab="${id}">
      ${icon(ico, 'ico24')}<span>${label}</span>
      ${id === 'shop' && shopDot() ? '<div class="dot"></div>' : ''}
    </div>`).join('');
}

function renderContent() {
  const c = $('#content');
  const keepScroll = ui.tab === renderContent.lastTab ? c.querySelector('.scroll')?.scrollTop || 0 : 0;
  renderContent.lastTab = ui.tab;
  if (ui.tab === 'map') c.innerHTML = renderMap();
  if (ui.tab === 'crew') c.innerHTML = renderCrew();
  if (ui.tab === 'workshop') c.innerHTML = renderWorkshop();
  if (ui.tab === 'shop') c.innerHTML = renderShop();
  const sc = c.querySelector('.scroll');
  if (sc) sc.scrollTop = keepScroll;
  updateTimers();
}

function planetState(p) {
  const e = expAt(p.id);
  if (p.idx > S.progress) return 'locked';
  if (!e) return 'idle';
  return now() >= e.end ? 'done' : 'running';
}

function renderMap() {
  const g = ui.galaxy;
  const maxG = PLANETS[S.progress].galaxy;
  const planets = PLANETS.filter(p => p.galaxy === g).map((p, i) => {
    const [px, py] = MAP_PATH[i];
    const x = Math.round((g % 2 ? 1 - px : px) * REF_W);
    const y = Math.round(72 + (0.90 - py) / 0.80 * 400);
    const st = planetState(p);
    const e = expAt(p.id);
    return `<div class="planet ${st === 'locked' ? 'locked' : ''}" style="left:${x}px;top:${y}px" data-planet="${p.id}">
      <div class="globe">
        <canvas class="globe-cv" width="64" height="64" data-surface="${p.id}"></canvas>
        ${st === 'locked' ? `<img class="ico16 lock" src="${ART}UI/SPR_UI_Icon_Lock.png" alt="">` : ''}
        ${st === 'running' || st === 'done' ? `<div class="orbit"><img class="ico16" src="${ART}Ships/SPR_Ship_Scout.png" alt=""></div>` : ''}
        ${st === 'done' ? `<img class="ico16 badge" src="${ART}UI/SPR_UI_Icon_Alert.png" alt="">` : ''}
      </div>
      <div class="label">${p.name}</div>
      ${st === 'running' ? `<div class="label timer">${icon('Timer')}<span data-end="${e.end}"></span></div>` : ''}
      ${st === 'done' ? `<div class="label green">Concluída!</div>` : ''}
    </div>`;
  }).join('');
  return `<div class="map" style="background-image:url('${ART}Backgrounds/SPR_Bg_Galaxy${g + 1}.png')">
    <div class="map-head">
      <button class="btn sec" data-a="galaxy" data-d="-1" ${g === 0 ? 'disabled' : ''}>&lt;</button>
      <div class="gname" style="color:${GALAXIES[g].color}">${g + 1} — ${GALAXIES[g].name}</div>
      <button class="btn sec" data-a="galaxy" data-d="1" ${g >= maxG ? 'disabled' : ''}>&gt;</button>
    </div>
    ${planets}
    ${S.cycleReady ? `<div class="cycle-banner"><button class="btn big" data-a="newCycle" ${S.exps.length ? 'disabled' : ''}>
      ${icon('Cycle')}<span>Novo Ciclo${S.exps.length ? ' (aguarde as expedições)' : ''}</span></button></div>` : ''}
  </div>`;
}

function renderCrew() {
  const cards = S.roster.map(m => {
    const c = CLASS[m.cls], bp = busyPlanet(m);
    return `<div class="card crew-card" data-member="${m.id}">
      ${portrait(m)}
      <div>${m.name}</div>
      <div style="color:${c.color}">${c.name}</div>
      <div class="dim">${bonusText(c.bonus)}</div>
      <div class="eq">${m.equip ? itemIcon(m.equip, 'ico16') + `<span>${ITEM[m.equip].name}</span>` : '<span class="dim">sem Equipment</span>'}</div>
      ${bp ? `<div class="amber">Em expedição: ${bp.name}</div>` : '<div class="green">Livre</div>'}
    </div>`;
  }).join('');
  return `<div class="scroll">
    <div class="row between"><span class="title">Tripulação</span><span class="dim">${S.roster.length} membros</span></div>
    <div class="sep"></div>
    <div class="crew-grid">${cards || '<div class="dim">Ninguém na companhia.</div>'}</div>
    <br><div class="dim" style="text-align:center">Contrate mais especialistas na Loja.</div>
  </div>`;
}

function renderWorkshop() {
  const tabs = [1, 2, 3, 4].map(t =>
    `<button class="btn ${ui.tier === t ? '' : 'sec'}" data-a="tier" data-t="${t}">${t > S.tier ? icon('Lock') : ''}<span>Tier ${t}</span></button>`).join('');
  let body;
  if (ui.tier > S.tier) {
    body = `<div class="card" style="padding:8px;text-align:center">${icon('Lock')}<br>Libera em <span class="amber">${PLANETS[TIER_UNLOCK[ui.tier]].name}</span></div>`;
  } else {
    body = RECIPES.filter(r => r.tier === ui.tier).map(r => {
      const ok = r.ing.every(([i, n]) => has(i) >= n);
      const ing = r.ing.map(([i, n]) =>
        `<div class="ing">${itemIcon(i, 'ico16')}<span class="${has(i) >= n ? 'green' : 'red'}">${has(i)}/${n}</span></div>`).join('');
      return `<div class="card recipe">
        <div class="row">${itemIcon(r.id)}<div class="grow"><div>${r.name}</div><div class="amber">${bonusText(r.bonus)}</div></div>
          <span class="dim">tem ${has(r.id)}</span></div>
        <div class="row wrap" style="gap:8px;margin:4px 0">${ing}</div>
        <button class="btn wide" data-a="craft" data-craft="${r.id}" ${ok ? '' : 'disabled'}>Craftar</button>
      </div>`;
    }).join('');
  }
  return `<div class="scroll"><div class="title">Oficina</div><div class="sep"></div>
    <div class="tier-tabs">${tabs}</div>${body}</div>`;
}

function renderShop() {
  const items = Object.keys(S.inv).sort((a, b) => CAT_ORDER[ITEM[a].cat] - CAT_ORDER[ITEM[b].cat] || ITEM[a].price - ITEM[b].price);
  const sellRows = items.map(id => `
    <div class="sell-row">${itemIcon(id)}
      <div class="grow"><div class="${ITEM[id].cat === 'rare' ? 'violet' : ''}">${ITEM[id].name}</div>
        <div class="dim">x${has(id)} · ${ITEM[id].price} cada</div></div>
      <button class="btn sec" data-a="sell" data-id="${id}">Vender 1</button>
      <button class="btn sec" data-a="sell" data-id="${id}" data-all="1">Tudo</button>
    </div>`).join('');
  const hires = CLASSES.map(c => {
    const price = hirePrice(c.id);
    return `<div class="card hire-card">
      ${portrait({ id: c.price + c.id.length, cls: c.id, v: 1 })}
      <div style="color:${c.color}">${c.name}</div>
      <div class="dim">${bonusText(c.bonus)}</div>
      <button class="btn" data-a="hire" data-cls="${c.id}" ${S.credits >= price ? '' : 'disabled'}>${icon('Credits')}<span>${price}</span></button>
    </div>`;
  }).join('');
  return `<div class="scroll"><div class="title">Loja</div>
    <div class="section">Vender</div>
    ${sellRows || '<div class="dim">Inventário vazio. Mande uma expedição!</div>'}
    <div class="section">Contratar</div>
    <div class="dim" style="margin-bottom:4px">O preço sobe ${Math.round((K.hireGrowth - 1) * 100)}% a cada membro no Roster.</div>
    <div class="hire-grid">${hires}</div>
    <div class="section">Ofertas</div>
    <div class="dim">Ad-Free e Founder Pack ficam para o build Android.</div>
  </div>`;
}

// ---------- sheet (painel de baixo)

function openSheet(kind, arg) {
  ui.sheet = { kind, arg };
  if (kind === 'planet') ui.sel.clear();
  renderSheet();
  applyTutorial();
}

function closeSheet() {
  ui.sheet = null;
  $('#sheet').classList.add('hidden');
  $('#overlay').classList.add('hidden');
}

function renderSheet() {
  const { kind, arg } = ui.sheet;
  let html = '';
  if (kind === 'planet') html = sheetPlanet(PLANET[arg]);
  if (kind === 'member') {
    if (!member(arg)) return closeSheet();
    html = sheetMember(member(arg));
  }
  if (kind === 'settings') html = sheetSettings();
  const sh = $('#sheet');
  const body = sh.querySelector('.sheet-body');
  const keep = body ? body.scrollTop : 0;
  sh.innerHTML = `<div class="sheet-body">${html}</div>`;
  sh.querySelector('.sheet-body').scrollTop = keep;
  sh.classList.remove('hidden');
  $('#overlay').classList.remove('hidden');
  updateTimers();
}

function sheetPlanet(p) {
  const st = planetState(p);
  const e = expAt(p.id);
  const loot = p.loot.map(([id]) => `<div class="slot">${itemIcon(id)}</div>`).join('');
  let head = `<div class="sheet-head">
      <canvas class="globe-cv" width="64" height="64" data-surface="${p.id}" style="width:64px;height:64px"></canvas>
      <div><div class="title">${p.name}</div><div style="color:${GALAXIES[p.galaxy].color}">${GALAXIES[p.galaxy].name}</div>
        <div class="row" style="margin-top:4px">${icon('Risk')}<span>Risco ${planetRisk(p)}</span>${icon('Timer')}<span>${fmtDur(p.dur)}</span></div></div>
      <img class="ico16 close" data-a="closeSheet" src="${ART}UI/SPR_UI_Icon_Close.png" alt="">
    </div>
    <div class="dim">Loot possível</div><div class="row wrap" style="margin:3px 0 6px">${loot}</div>`;

  if (st === 'running' || st === 'done') {
    const squad = e.squad.map(member).filter(Boolean).map(m =>
      `<div class="row">${portrait(m, 'small')}<span>${m.name}</span><span style="color:${CLASS[m.cls].color}">${CLASS[m.cls].name}</span></div>`).join('');
    return head + `<div class="sep"></div><div class="section">Squad em expedição</div>${squad}<div class="sep"></div>
      ${st === 'running'
        ? `<div class="row" style="justify-content:center">${icon('Timer')}<span class="amber" data-end="${e.end}"></span></div>`
        : `<button class="btn wide big" data-a="claim" data-p="${p.id}">${icon('Check')}<span>Abrir resultado</span></button>`}`;
  }

  const sel = [...ui.sel].map(member).filter(Boolean);
  const free = S.roster.filter(m => !busyPlanet(m));
  const list = S.roster.map(m => {
    const bp = busyPlanet(m), on = ui.sel.has(m.id);
    return `<div class="pick ${on ? 'on' : ''} ${bp ? 'busy' : ''}" ${bp ? '' : `data-a="sel" data-id="${m.id}"`}>
      <div class="chk">${on ? '' : ''}</div>${portrait(m, 'small')}
      <div class="grow"><div>${m.name} <span style="color:${CLASS[m.cls].color}">${CLASS[m.cls].name}</span></div>
        <div class="dim">${bp ? 'Em ' + bp.name : bonusText(CLASS[m.cls].bonus) + (m.equip ? ' · ' + ITEM[m.equip].name : '')}</div></div>
      ${m.equip ? itemIcon(m.equip, 'ico16') : ''}
    </div>`;
  }).join('');
  const tutorial = S.tut === 1 && p.id === 'kora';
  let stats = '<div class="dim" style="text-align:center">Selecione de 1 a 3 tripulantes.</div>';
  if (sel.length) {
    const f = forecast(p, sel);
    const dur = tutorial ? K.tutorialDuration : f.dur;
    const sc = f.success >= 70 ? 'green' : f.success >= 40 ? 'amber' : 'red';
    stats = `
      <div class="row between"><span class="row">${icon('Success')}Chance de sucesso</span><span class="${sc}">${pct(tutorial ? 100 : f.success)}</span></div>
      <div class="row between"><span class="row">${icon('Loss')}Perda na falha</span><span class="red">${pct(f.loss)}</span></div>
      <div class="row between"><span class="row">${icon('Risk')}Risco efetivo</span><span>${f.eff}</span></div>
      <div class="row between"><span class="row">${icon('Timer')}Duração final</span><span>${fmtDur(dur / SPEED)}</span></div>`;
  }
  return head + `<div class="sep"></div>
    <div class="row between"><span class="section" style="margin:0">Squad</span><span class="dim">${sel.length}/3</span></div>
    <div style="margin:4px 0">${list || '<div class="dim">Sem tripulação.</div>'}</div>
    ${free.length ? '' : '<div class="dim">Todo mundo está ocupado.</div>'}
    <div class="sep"></div>${stats}<div style="height:8px"></div>
    <button class="btn wide big" data-a="send" data-p="${p.id}" ${sel.length ? '' : 'disabled'}>Enviar</button>`;
}

function sheetMember(m) {
  const c = CLASS[m.cls], bp = busyPlanet(m);
  const eqs = Object.keys(S.inv).filter(id => ITEM[id].cat === 'equip');
  const list = bp ? `<div class="amber">Em expedição em ${bp.name}: não dá para trocar o Equipment agora.</div>`
    : eqs.length ? eqs.map(id => `<div class="sell-row">${itemIcon(id)}
        <div class="grow"><div>${ITEM[id].name} <span class="dim">x${has(id)}</span></div><div class="amber">${bonusText(ITEM[id].bonus)}</div></div>
        <button class="btn" data-a="equip" data-m="${m.id}" data-equip="${id}">Equipar</button></div>`).join('')
    : '<div class="dim">Nenhum Equipment no inventário. Crafte na Oficina.</div>';
  return `<div class="sheet-head">${portrait(m)}
      <div><div class="title">${m.name}</div><div style="color:${c.color}">${c.name}</div><div class="dim">${bonusText(c.bonus)}</div></div>
      <img class="ico16 close" data-a="closeSheet" src="${ART}UI/SPR_UI_Icon_Close.png" alt=""></div>
    <div class="section">Equipment</div>
    ${m.equip ? `<div class="sell-row">${itemIcon(m.equip)}<div class="grow"><div>${ITEM[m.equip].name}</div>
      <div class="amber">${bonusText(ITEM[m.equip].bonus)}</div></div>
      ${bp ? '' : `<button class="btn sec" data-a="unequip" data-m="${m.id}">Desequipar</button>`}</div>` : '<div class="dim">Slot vazio.</div>'}
    <div class="sep"></div><div class="section">Inventário</div>${list}`;
}

function sheetSettings() {
  const perm = 'Notification' in window ? Notification.permission : 'indisponível';
  return `<div class="sheet-head"><span class="title">Ajustes</span>
      <img class="ico16 close" data-a="closeSheet" src="${ART}UI/SPR_UI_Icon_Close.png" alt=""></div>
    <div class="row between"><span>Avisar quando a equipe voltar</span>
      <button class="btn ${S.notify ? '' : 'sec'}" data-a="toggleNotify">${S.notify ? 'Ligado' : 'Desligado'}</button></div>
    <div class="dim">Permissão do navegador: ${perm}. No navegador o aviso só sai com a aba aberta.</div>
    <div class="sep"></div>
    <div class="dim">Atalhos de dev na URL: #fast (timers 60x), #rich (+5000 Créd.), #unlock (libera tudo), #reset.</div>
    ${SPEED > 1 ? '<div class="amber">Modo #fast ligado.</div>' : ''}
    <div class="sep"></div>
    <button class="btn sec wide" data-a="reset">Apagar progresso</button>
    <br><br><div class="dim" style="text-align:center">Star Expedition Co. · ${VERSION}</div>`;
}

// ---------- modal

function showModal(inner) {
  const m = $('#modal');
  m.innerHTML = `<div class="panel">${inner}</div>`;
  m.classList.remove('hidden');
  applyTutorial();
}

function closeModal() {
  $('#modal').classList.add('hidden');
  if (S.tut === 2) return;   // o passo da notificação abre o próprio modal
  applyTutorial();
}

function showResult(res) {
  let body;
  if (res.success) {
    const list = res.loot.map(([id, q]) => `<div class="sell-row">${itemIcon(id)}
      <span class="grow ${ITEM[id].cat === 'rare' ? 'violet' : ''}">${ITEM[id].name}${ITEM[id].cat === 'rare' ? ' ★' : ''}</span><span>x${q}</span></div>`).join('');
    body = `<div class="row">${icon('Success')}<span class="title green">Sucesso!</span></div>
      <div class="dim">${res.planet.name}</div><div class="sep"></div>${list}
      <div class="dim" style="margin-top:4px">Dobrar (anúncio) fica para o build Android.</div>`;
  } else {
    body = `<div class="row">${icon('Loss')}<span class="title red">Falhou</span></div>
      <div class="dim">${res.planet.name}</div><div class="sep"></div>
      <div>A expedição falhou.</div>
      ${res.lost ? `<br><div class="row">${portrait(res.lost, 'small')}<span class="red">${res.lost.name} não voltou.</span></div>` : '<br><div class="dim">Todos voltaram.</div>'}`;
  }
  if (res.unlocked) body += `<div class="sep"></div><div class="row">${icon('Map')}<span>Novo Planet liberado: <span class="amber">${res.unlocked.name}</span></span></div>`;
  if (res.unlocked && res.unlocked.idx % 6 === 0) body += `<div class="amber">Nova Galaxy: ${GALAXIES[res.unlocked.galaxy].name}!</div>`;
  if (res.tier) body += `<div class="row">${icon('Workshop', 'ico16')}<span>Oficina: <span class="amber">Tier ${res.tier}</span> liberado!</span></div>`;
  if (S.cycleReady && res.planet.idx === PLANETS.length - 1) body += `<div class="amber">A última Galaxy caiu. O Novo Ciclo está disponível no Mapa.</div>`;
  showModal(body + `<br><button class="btn wide" data-a="closeModal">Continuar</button>`);
}

function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.remove('hidden');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.add('hidden'), 1800);
}

// ============================================================ Planets girando (GDD §10.3)
// A superfície é uma textura plana repetível; cada coluna da esfera lê a coluna da textura na
// longitude certa (asin), o que comprime as bordas e dá a ilusão de giro. Só drawImage: funciona
// abrindo o index.html direto do disco, sem servidor (getImageData seria bloqueado em file://).

const SURF = {};
const GLOBE = 64, GR = 30.5;
let globeMask, globeShade;

function buildGlobeLayers() {
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = GLOBE; return c; };
  globeMask = mk(); globeShade = mk();
  const mctx = globeMask.getContext('2d'), sctx = globeShade.getContext('2d');
  const md = mctx.createImageData(GLOBE, GLOBE), sd = sctx.createImageData(GLOBE, GLOBE);
  const L = [-0.55, -0.6, 0.58];   // luz de cima à esquerda (GDD §10.1)
  for (let y = 0; y < GLOBE; y++) for (let x = 0; x < GLOBE; x++) {
    const dx = (x + 0.5 - GLOBE / 2) / GR, dy = (y + 0.5 - GLOBE / 2) / GR, d2 = dx * dx + dy * dy;
    const i = (y * GLOBE + x) * 4;
    if (d2 <= 1) {
      md.data[i + 3] = 255;
      const nz = Math.sqrt(1 - d2);
      const lit = dx * L[0] + dy * L[1] + nz * L[2];
      // Sombreamento em faixas (pixel art: sem gradiente contínuo).
      if (lit < -0.05) { sd.data[i + 3] = 150; }
      else if (lit < 0.3) { sd.data[i + 3] = 80; }
      else if (lit > 0.85) { sd.data.set([255, 255, 255, 45], i); }
    } else if (d2 <= (1 + 1.3 / GR) ** 2) {
      md.data[i + 3] = 255;
      sd.data.set([14, 16, 24, 255], i);   // contorno de 1 px #0E1018
    }
  }
  mctx.putImageData(md, 0, 0);
  sctx.putImageData(sd, 0, 0);
}

function surface(id) {
  if (!SURF[id]) { SURF[id] = new Image(); SURF[id].src = `${ART}Planets/SPR_Planet_${id}_Surface.png`; }
  return SURF[id];
}

function drawGlobes(t) {
  for (const cv of document.querySelectorAll('canvas.globe-cv')) {
    const id = cv.dataset.surface, img = surface(id);
    if (!img.complete || !img.naturalWidth) continue;
    const ctx = cv.getContext('2d');
    const W = img.naturalWidth, H = img.naturalHeight;
    const off = Math.floor(t / (110 + PLANET[id].idx * 7));   // 1 texel por passo, velocidade varia por Planet
    ctx.imageSmoothingEnabled = false;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, GLOBE, GLOBE);
    for (let x = 0; x < GLOBE; x++) {
      const nx = (x + 0.5 - GLOBE / 2) / GR;
      if (Math.abs(nx) > 1.05) continue;
      const lon = Math.asin(clamp(nx, -1, 1));
      const u = ((Math.floor((lon / (2 * Math.PI) + 0.25) * W) + off) % W + W) % W;
      ctx.drawImage(img, u, 0, 1, H, x, 0, 1, GLOBE);
    }
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(globeMask, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(globeShade, 0, 0);
  }
}

// ============================================================ tutorial (GDD §9)

const TUT_TEXT = {
  1: () => ui.sheet?.kind === 'planet' && ui.sheet.arg === 'kora' ? 'Escolha o tripulante e toque em Enviar.' : 'Toque em Kora para montar a primeira expedição.',
  3: () => { const e = expAt('kora'); return e && now() >= e.end ? 'A equipe voltou! Toque em Kora e abra o resultado.' : 'A expedição está em andamento. Aguarde a equipe voltar...'; },
  4: () => 'Vá à Oficina e crafte o Kit de Coleta.',
  5: () => 'Na Tripulação, equipe o Kit de Coleta.',
  6: () => 'Volte ao Mapa.',
};

function tutTarget() {
  const sh = ui.sheet;
  switch (S.tut) {
    case 1:
      if (sh?.kind === 'planet' && sh.arg === 'kora') return ui.sel.size ? '[data-a="send"]' : '#sheet [data-a="sel"]';
      return ui.tab !== 'map' ? '[data-tab="map"]' : '[data-planet="kora"] .globe';
    case 3: {
      const e = expAt('kora');
      if (!e || now() < e.end) return null;
      if (sh?.kind === 'planet' && sh.arg === 'kora') return '[data-a="claim"]';
      return ui.tab !== 'map' ? '[data-tab="map"]' : '[data-planet="kora"] .globe';
    }
    case 4: return ui.tab !== 'workshop' ? '[data-tab="workshop"]' : ui.tier !== 1 ? '[data-t="1"]' : '[data-craft="salvage_kit"]';
    case 5:
      if (sh?.kind === 'member') return '[data-equip="salvage_kit"]';
      return ui.tab !== 'crew' ? '[data-tab="crew"]' : '.crew-card';
    case 6: return '[data-tab="map"]';
  }
  return null;
}

// Cada passo se completa sozinho se o jogador já tiver feito a ação (GDD §9).
function advanceTutorial() {
  const before = S.tut;
  if (S.tut === 1 && (S.exps.length || S.progress > 0)) S.tut = 2;
  if (S.tut === 3 && S.progress > 0 && !expAt('kora')) S.tut = 4;
  if (S.tut === 4 && (has('salvage_kit') || S.roster.some(m => m.equip))) S.tut = 5;
  if (S.tut === 5 && S.roster.some(m => m.equip)) S.tut = 6;
  if (S.tut === 6 && ui.tab === 'map' && !ui.sheet) { S.tut = 7; toast('Tutorial concluído. Boa sorte, comandante!'); }
  if (S.tut !== before) save();
  if (S.tut === 2 && $('#modal').classList.contains('hidden')) askNotify();
}

function askNotify() {
  showModal(`<div class="row">${icon('Alert')}<span class="amber">Avisos</span></div><div class="sep"></div>
    <div>Quer ser avisado quando sua equipe voltar?</div><br>
    <div class="row"><button class="btn sec grow" data-a="notify" data-yes="0">Agora não</button>
    <button class="btn grow" data-a="notify" data-yes="1">Quero</button></div>`);
}

function applyTutorial() {
  advanceTutorial();
  document.querySelectorAll('.tut-target').forEach(el => el.classList.remove('tut-target'));
  const hint = $('#hint'), arrow = $('#tut-arrow');
  const modalOpen = !$('#modal').classList.contains('hidden');
  const fn = TUT_TEXT[S.tut];
  if (!fn || modalOpen || ui.starter) { hint.classList.add('hidden'); arrow.classList.add('hidden'); return; }
  hint.textContent = fn();
  hint.classList.remove('hidden');
  const sel = tutTarget();
  const el = sel && document.querySelector(sel);
  if (!el) { arrow.classList.add('hidden'); return; }
  el.classList.add('tut-target');
  const app = $('#app').getBoundingClientRect(), r = el.getBoundingClientRect(), k = app.width / REF_W;
  const x = (r.left - app.left + r.width / 2) / k - 8;
  let y = (r.top - app.top) / k - 18;
  arrow.style.transform = '';
  if (y < 34) { y = (r.bottom - app.top) / k + 2; arrow.style.transform = 'scaleY(-1)'; }
  arrow.style.left = Math.round(x) + 'px';
  arrow.style.top = Math.round(y) + 'px';
  arrow.classList.remove('hidden');
}

// ============================================================ Starter Pick (GDD §3.3)

function renderStarter() {
  if (!ui.starter) {
    const names = new Set();
    while (names.size < 3) names.add(newName());
    ui.starter = ['scout', 'engineer', 'guard'].map((cls, i) => ({ id: 100 + i, cls, v: 1 + Math.floor(Math.random() * 3), name: [...names][i] }));
  }
  const cards = ui.starter.map((m, i) => {
    const c = CLASS[m.cls];
    return `<div class="card">${portrait(m)}<div>${m.name}</div><div style="color:${c.color}">${c.name}</div>
      <div class="dim" style="min-height:22px">${bonusText(c.bonus)}</div>
      <button class="btn" data-a="starter" data-i="${i}">Escolher</button></div>`;
  }).join('');
  const el = document.createElement('div');
  el.className = 'fullscreen';
  el.id = 'starter';
  el.style.backgroundImage = `url('${ART}Backgrounds/SPR_Bg_Galaxy1.png')`;
  el.innerHTML = `<img src="${ART}UI/SPR_UI_Logo.png" alt="Star Expedition Co." style="width:256px;height:96px">
    <div class="panel" style="width:336px;text-align:center">Você acaba de fundar a Star Expedition Co., com uma nave emprestada e
      nenhum Credit. Escolha seu primeiro tripulante:</div>
    <div class="starter-row">${cards}</div>`;
  $('#app').appendChild(el);
}

// ============================================================ entrada

function onClick(ev) {
  const t = ev.target;
  if (t.id === 'overlay') return closeSheet(), applyTutorial();
  const tab = t.closest('[data-tab]');
  if (tab) {
    ui.tab = tab.dataset.tab;
    if (ui.tab === 'shop') S.shopSeen = S.shopSeen || shopDot();
    closeSheet();
    renderAll();
    return;
  }
  const pl = t.closest('[data-planet]');
  if (pl && !t.closest('[data-a]')) {
    const p = PLANET[pl.dataset.planet];
    if (p.idx > S.progress) return toast(`Bloqueado: faça o Claim em ${PLANETS[p.idx - 1].name}.`);
    return openSheet('planet', p.id);
  }
  const card = t.closest('[data-member]');
  if (card) return openSheet('member', +card.dataset.member);

  const a = t.closest('[data-a]');
  if (!a || a.disabled) return;
  const d = a.dataset;
  switch (d.a) {
    case 'galaxy': ui.galaxy = clamp(ui.galaxy + +d.d, 0, PLANETS[S.progress].galaxy); renderAll(); break;
    case 'sel':
      if (ui.sel.has(+d.id)) ui.sel.delete(+d.id);
      else if (ui.sel.size < 3) ui.sel.add(+d.id);
      else toast('A Squad vai de 1 a 3 tripulantes.');
      renderSheet(); applyTutorial(); break;
    case 'send': send(d.p); break;
    case 'claim': claim(d.p); break;
    case 'craft': craft(d.craft); break;
    case 'equip': equip(+d.m, d.equip); break;
    case 'unequip': unequip(+d.m); break;
    case 'sell': sell(d.id, !!d.all); break;
    case 'hire': hire(d.cls); break;
    case 'tier': ui.tier = +d.t; renderAll(); break;
    case 'newCycle': newCycle(); break;
    case 'starter': $('#starter').remove(); starterPick(+d.i); break;
    case 'settings': openSheet('settings'); break;
    case 'closeSheet': closeSheet(); applyTutorial(); break;
    case 'closeModal': closeModal(); renderAll(); break;
    case 'notify':
      S.tut = 3;
      S.notify = d.yes === '1';
      if (S.notify && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
      save(); closeModal(); renderAll(); break;
    case 'toggleNotify':
      S.notify = !S.notify;
      if (S.notify && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission().then(renderAll);
      save(); renderAll(); break;
    case 'reset':
      if (confirm('Apagar todo o progresso?')) { localStorage.removeItem(SAVE_KEY); location.hash = ''; location.reload(); }
      break;
  }
}

document.addEventListener('keydown', e => {
  // Esc faz o papel do botão voltar do Android (GDD §11.1): fecha o painel ou volta ao Mapa.
  if (e.key !== 'Escape') return;
  if (!$('#modal').classList.contains('hidden') && S.tut !== 2) closeModal();
  else if (ui.sheet) closeSheet();
  else if (ui.tab !== 'map') ui.tab = 'map';
  renderAll();
});

// ============================================================ laço

let lastStates = '';

function updateTimers() {
  const t = now();
  document.querySelectorAll('[data-end]').forEach(el => { el.textContent = fmtDur((+el.dataset.end - t) / 1000); });
}

function tick() {
  const t = now();
  // Expedition concluída com a aba aberta: re-renderiza e, se pedido, notifica (GDD §13.4).
  const states = S.exps.map(e => e.planet + (t >= e.end ? '1' : '0')).join();
  if (states !== lastStates) {
    lastStates = states;
    for (const e of S.exps) {
      if (t >= e.end && !e.notified) {
        e.notified = true;
        if (S.notify && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          try { new Notification('Expedição concluída!', { body: `A equipe voltou de ${PLANET[e.planet].name}. Toque para ver o resultado.` }); } catch (err) { /* sem suporte */ }
        }
      }
    }
    save();
    renderAll();
  }
  updateTimers();
  renderTop();
  applyTutorial();
}

function fit() {
  const w = innerWidth, h = innerHeight, dpr = devicePixelRatio || 1;
  // Fator inteiro em pixels FÍSICOS (GDD §10.2): num celular de 412 px CSS com dpr 2,625 dá 3x
  // (1081 px físicos), que enche a tela e continua nítido. Abaixo de 1x físico, encolhe livre.
  const kDev = Math.min(w * dpr / REF_W, h * dpr / REF_H);
  const k = (kDev >= 1 ? Math.floor(kDev) : kDev) / dpr;
  const app = $('#app');
  app.style.transform = `scale(${k})`;
  app.style.left = Math.round((w - REF_W * k) / 2) + 'px';
  app.style.top = Math.round((h - REF_H * k) / 2) + 'px';
  applyTutorial();
}

function frame(t) {
  drawGlobes(t);
  requestAnimationFrame(frame);
}

function boot() {
  if (DEV.has('reset')) localStorage.removeItem(SAVE_KEY);
  S = load();
  if (DEV.has('rich')) S.credits += 5000;
  if (DEV.has('unlock')) { S.progress = PLANETS.length - 1; S.tier = 4; if (S.tut < 7) S.tut = S.tut ? 7 : 0; }
  ui.galaxy = PLANETS[S.progress].galaxy;
  buildGlobeLayers();
  document.getElementById('app').addEventListener('click', onClick);
  addEventListener('resize', fit);
  addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  fit();
  renderAll();
  if (S.tut === 0) renderStarter();
  setInterval(tick, 250);
  setInterval(save, 5000);
  requestAnimationFrame(frame);
}

boot();
