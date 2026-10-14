// Paddock Boss — protótipo jogável em JavaScript puro.
// Segue a Parte 1 do GDD (PaddockBoss.md) e porta as regras do guia Unity: TrackPath, RaceSimulator,
// RaceEconomy, UpgradeService, RivalAI e Championship, com os números da §14 (GameBalance).
// A arte vem direto de Sprites/PaddockBoss/ (fonte única), sem cópias.
'use strict';

const ART = '../../Sprites/PaddockBoss/';
const UI = ART + 'ui/components/';
const REF_W = 1920, REF_H = 1080;   // mesma resolução de referência do Canvas Scaler do guia
const SAVE_KEY = 'paddockboss-save-v1';
const MAX_STEP = 0.05;              // passo máximo da simulação (RaceRunner.MaxStep)

// ============================================================ atalhos de desenvolvimento (#fast,rich,...)

const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ============================================================ dados de design (GDD §14 / GameBalance)

const BAL = {
  engineeringBonusPerLevel: 0.02,
  driverBonusPerLevel: 0.015,
  noiseAmplitude: 0.04,
  consistencyPerDriverLevel: 0.08,
  gridSpacing: 1.2,
  startingCompound: 'M',
  wornTireSpeedMultiplier: 0.88,
  deadTireSpeedMultiplier: 0.6,
  basePitServiceSeconds: 8,
  pitServiceReductionPerLevel: 0.5,
  minPitServiceSeconds: 2.5,
  startingMoney: 300,
  baseSponsorPerSecond: 2,
  marketingBonusPerLevel: 0.15,
  overtakeBonus: 15,
  lapBonusByPosition: [30, 25, 20, 16, 13, 10, 8, 6, 5, 4, 3, 2, 1, 0],
  prizeByPosition: [600, 450, 350, 280, 220, 170, 130, 100, 80, 60, 45, 30, 20, 10],
  pointsByPosition: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
  maxLevel: 20,
  aiThinkInterval: 2,
};
const byPosition = (table, pos) => table[pos - 1] || 0;

const COMPOUNDS = {
  S: { name: 'Macio', grip: 0.06, wear: 0.010, badge: 'tyre_badge_soft' },
  M: { name: 'Médio', grip: 0.03, wear: 0.006, badge: 'tyre_badge_medium' },
  H: { name: 'Duro',  grip: 0.00, wear: 0.004, badge: 'tyre_badge_hard' },
};

const UPGRADES = {
  eng:    { name: 'Engenharia',      base: 150, growth: 1.35, row: 'upgrade_row_engineering' },
  mkt:    { name: 'Propaganda',      base: 120, growth: 1.40, row: 'upgrade_row_marketing' },
  pit:    { name: 'Equipe de boxes', base: 100, growth: 1.35, row: 'upgrade_row_pitcrew' },
  driver: { name: 'Treino',          base: 130, growth: 1.35, row: 'upgrade_row_driver' },
};

// Equipes (guia Fase 1B + personalidades da 6B). Nomes e identidades estão Em aberto (GDD §9/§15):
// os daqui são provisórios. ai = [gana de gastar, pesos eng/mkt/pit/driver, limite de desgaste p/ box].
const TEAMS = [
  { id: 'player', name: 'Mangue Racing',  short: 'MNG', color: '#F2C230', eng: 0, mkt: 0, pit: 0, skill: [0, 0], drivers: ['J. Clarke', 'R. Bennett'] },
  { id: 'rival_1', name: 'Scuderia Rossa', short: 'ROS', color: '#E8483C', eng: 5, mkt: 2, pit: 2, skill: [3, 2], drivers: ['M. Rossi', 'L. Bianchi'],   ai: [0.9, [3, 1, 1, 1], 0.70] },
  { id: 'rival_2', name: 'Équipe Bleue',   short: 'BLE', color: '#3C7BE8', eng: 3, mkt: 4, pit: 1, skill: [2, 2], drivers: ['P. Moreau', 'A. Perrot'],   ai: [0.6, [1, 3, 0.5, 1], 0.80] },
  { id: 'rival_3', name: 'Verde Motori',   short: 'VER', color: '#3CC27A', eng: 2, mkt: 1, pit: 3, skill: [1, 3], drivers: ['N. Moretti', 'G. de Vries'], ai: [0.5, [1, 1, 3, 1], 0.75] },
  { id: 'rival_4', name: 'Viola Racing',   short: 'VIO', color: '#A64CE0', eng: 1, mkt: 1, pit: 1, skill: [2, 1], drivers: ['K. Lahti', 'T. Sato'],      ai: [0.5, [1, 0.5, 1, 3], 0.75] },
  { id: 'rival_5', name: 'Arancia GP',     short: 'ARA', color: '#F28A30', eng: 1, mkt: 0, pit: 2, skill: [0, 1], drivers: ['D. Harrison', 'E. Petrov'], ai: [0.2, [1, 1, 1, 1], 0.65] },
  { id: 'rival_6', name: 'Argento Werke',  short: 'ARG', color: '#9AA3AE', eng: 0, mkt: 1, pit: 0, skill: [1, 0], drivers: ['H. Müller', "B. O'Connor"], ai: [0.5, [1, 1, 1, 1], 0.75] },
];
const TEAM_DEF = Object.fromEntries(TEAMS.map(t => [t.id, t]));

// Pistas: pontos de controle (unidades, cabe em ~40 × 25, como na Etapa 2C) suavizados em waypoints
// a cada ~1 unidade. O ponto 0 é a largada e fica no meio de uma reta. Nomes provisórios (Em aberto).
const TRACKS = [
  { id: 'track_a', name: 'Montebello', country: 'Itália', laps: 12,
    pts: [[16, 3.5], [26, 3.5], [32, 4.5], [36, 8], [36.5, 12.5], [33.5, 16], [28.5, 16.5], [25.5, 19.5], [27, 22.5], [23, 24], [14, 23.5], [8, 21.5], [5, 17.5], [9, 13.5], [7.5, 9.5], [5, 7], [8, 4]] },
  { id: 'track_b', name: 'Ardenas', country: 'Bélgica', laps: 12,
    pts: [[18, 4], [28, 4.5], [35, 7], [37.5, 12], [35, 16.5], [29, 17], [24, 13.5], [19, 14.5], [15, 20], [8, 22], [3.5, 17], [3.5, 10], [8, 5]] },
  { id: 'track_c', name: 'Costa Azul', country: 'França', laps: 12,
    pts: [[12, 4], [19, 4], [23, 6.5], [27, 4], [33, 4], [37, 7.5], [34, 11.5], [36.5, 16], [35, 21.5], [29, 23], [23, 19], [17, 22.5], [10, 22.5], [5, 19], [8.5, 14], [4.5, 10], [6, 5]] },
].map(t => ({ ...t, baseSpeed: 6, cornerSpeedFactor: 0.55, sharpCornerDegreesPerUnit: 15, cornerInfluence: 4, pitLaneLossSeconds: 6, width: 2.4 }));

// Catmull-Rom centrípeta fechada: transforma os pontos de controle num traçado liso e denso.
function smoothLoop(pts, spacing = 1) {
  const n = pts.length, out = [];
  const P = i => pts[(i + n) % n];
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    const tj = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-4;
    const t1 = tj(p0, p1), t2 = t1 + tj(p1, p2), t3 = t2 + tj(p2, p3);
    const steps = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / spacing));
    for (let s = 0; s < steps; s++) {
      const t = t1 + (t2 - t1) * s / steps;
      const L = (a, b, ta, tb) => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
      const A1 = L(p0, p1, 0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, 0, t2), B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  return out;
}

// ============================================================ TrackPath (guia Etapa 2A)

class TrackPath {
  constructor(points, sharp, influence) {
    this.p = points; this.influence = Math.max(0.01, influence);
    const n = points.length;
    this.cum = [0];
    for (let i = 0; i < n; i++) this.cum.push(this.cum[i] + dist(points[i], points[(i + 1) % n]));
    this.length = this.cum[n];
    this.corner = points.map((pt, i) => {
      const a = sub(pt, points[(i - 1 + n) % n]), b = sub(points[(i + 1) % n], pt);
      const avg = 0.5 * (len(a) + len(b));
      const deg = avg > 0 ? angleDeg(a, b) / avg : 0;
      return clamp01(deg / sharp);
    });
  }
  segmentAt(d) {
    d = ((d % this.length) + this.length) % this.length;
    let s = 0; const n = this.p.length;
    while (s < n - 1 && this.cum[s + 1] < d) s++;
    const segLen = this.cum[s + 1] - this.cum[s];
    return [s, segLen > 0 ? (d - this.cum[s]) / segLen : 0];
  }
  positionAt(d) {
    const [s, t] = this.segmentAt(d), a = this.p[s], b = this.p[(s + 1) % this.p.length];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  directionAt(d) {
    const [s] = this.segmentAt(d), v = sub(this.p[(s + 1) % this.p.length], this.p[s]), l = len(v) || 1;
    return [v[0] / l, v[1] / l];
  }
  cornerAt(d) {
    const [s, t] = this.segmentAt(d);
    const segLen = this.cum[s + 1] - this.cum[s], from = t * segLen, to = segLen - from;
    const prev = this.corner[s] * clamp01(1 - from / this.influence);
    const next = this.corner[(s + 1) % this.p.length] * clamp01(1 - to / this.influence);
    return Math.max(prev, next);
  }
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = v => Math.hypot(v[0], v[1]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const clamp01 = x => Math.max(0, Math.min(1, x));
const lerp = (a, b, t) => a + (b - a) * t;
function angleDeg(a, b) {
  const l = len(a) * len(b); if (!l) return 0;
  return Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / l))) * 180 / Math.PI;
}

// Ruído suave 0..1 (faz o papel do Mathf.PerlinNoise na oscilação de ritmo do piloto).
function smoothNoise(seed, x) {
  const h = i => { let v = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return v - Math.floor(v); };
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u);
}

function mulberry32(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// ============================================================ estado das equipes (TeamState) e compras (UpgradeService)

function newTeamState(def) {
  return { id: def.id, isPlayer: def.id === 'player', money: BAL.startingMoney, eng: def.eng, mkt: def.mkt, pit: def.pit, skill: [...def.skill], points: 0 };
}
const def = team => TEAM_DEF[team.id];
const levelOf = (team, type, driver = 0) => type === 'driver' ? team.skill[driver] : team[type];
const costOf = (team, type, driver = 0) => Math.round(UPGRADES[type].base * Math.pow(UPGRADES[type].growth, levelOf(team, type, driver)));
const sponsorPerSecond = team => BAL.baseSponsorPerSecond * (1 + team.mkt * BAL.marketingBonusPerLevel);
const pitService = team => Math.max(BAL.minPitServiceSeconds, BAL.basePitServiceSeconds - team.pit * BAL.pitServiceReductionPerLevel);

function tryBuy(team, type, driver = 0) {
  const cost = costOf(team, type, driver);
  if (levelOf(team, type, driver) >= BAL.maxLevel || team.money < cost) return false;
  team.money -= cost;
  if (type === 'driver') team.skill[driver]++; else team[type]++;
  return true;
}

// ============================================================ RaceSimulator + RaceEconomy + RivalAI (guia Fases 3–6)

class Race {
  constructor(track, teams, seed) {
    this.track = track;
    this.path = new TrackPath(track.waypoints, track.sharpCornerDegreesPerUnit, track.cornerInfluence);
    this.time = 0; this.finished = false;
    this.rng = mulberry32(seed);
    this.cars = [];
    for (const team of teams) for (let d = 0; d < 2; d++) {
      this.cars.push({
        id: this.cars.length, team, driver: d, seed: this.rng() * 1000,
        distance: 0, laps: 0, lapStart: 0, lastLap: 0, bestLap: 0, speed: 0,
        compound: BAL.startingCompound, wear: 0, pitRequested: false, pitCompound: 'M', pitLeft: 0, stops: 0,
        done: false, finishTime: 0, pos: 0, prevPos: 0, warned: false,
      });
    }
    const grid = [...this.cars];
    for (let i = grid.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [grid[i], grid[j]] = [grid[j], grid[i]]; }
    grid.forEach((c, i) => { c.distance = -(i + 1) * BAL.gridSpacing; c.gridSlot = i; });
    this.standings = [...this.cars];
    this.sort();
    this.sponsorBuffer = new Map(teams.map(t => [t, 0]));
    this.aiTimer = 0;
    this.fastestLap = 0;
    this.on = {};   // eventos: overtake, lap, pitStart, pitEnd, carFinished, raceFinished, money
  }
  get raceDistance() { return this.track.laps * this.path.length; }
  get leaderLap() { return Math.min(this.standings[0].laps + 1, this.track.laps); }
  emit(name, ...args) { if (this.on[name]) this.on[name](...args); }

  tick(dt) {
    if (this.finished || dt <= 0) return;
    this.time += dt;
    const lapEvents = [], finishEvents = [];
    for (const car of this.cars) {
      if (car.done) continue;
      if (car.pitLeft > 0) { this.tickPit(car, dt); continue; }
      car.speed = this.computeSpeed(car);
      car.distance += car.speed * dt;
      car.wear = Math.min(1, car.wear + COMPOUNDS[car.compound].wear * dt);
      this.checkLap(car, lapEvents, finishEvents);
    }
    this.updateStandings();
    for (const car of lapEvents) { this.pay(car.team, byPosition(BAL.lapBonusByPosition, car.pos), `Volta em P${car.pos}`, car); this.emit('lap', car); }
    for (const car of finishEvents) { this.pay(car.team, byPosition(BAL.prizeByPosition, car.pos), `Chegada em P${car.pos}`, car); this.emit('carFinished', car); }
    this.tickSponsors(dt);
    this.tickAI(dt);
    if (this.cars.every(c => c.done)) { this.finished = true; this.emit('raceFinished'); }
  }

  // velocidade = base da pista × curva × desempenho × pneu × oscilação do piloto (GDD §3)
  computeSpeed(car) {
    const t = car.team, skill = t.skill[car.driver];
    const trackSpeed = this.track.baseSpeed * lerp(1, this.track.cornerSpeedFactor, this.path.cornerAt(car.distance));
    const perf = 1 + t.eng * BAL.engineeringBonusPerLevel + skill * BAL.driverBonusPerLevel + COMPOUNDS[car.compound].grip;
    const tire = car.wear < 1 ? lerp(1, BAL.wornTireSpeedMultiplier, car.wear) : BAL.deadTireSpeedMultiplier;
    const consistency = clamp01(skill * BAL.consistencyPerDriverLevel);
    const noise = (smoothNoise(car.seed, this.time * 0.25) * 2 - 1) * BAL.noiseAmplitude * (1 - consistency);
    return trackSpeed * perf * tire * (1 + noise);
  }

  checkLap(car, lapEvents, finishEvents) {
    const lapsOnTrack = Math.floor(car.distance / this.path.length);
    if (lapsOnTrack <= car.laps) return;
    car.laps = lapsOnTrack;
    car.lastLap = this.time - car.lapStart;
    car.lapStart = this.time;
    // A 1ª "volta" sai de trás da linha (grid); só voltas lançadas contam como mais rápida.
    if (car.laps > 1 && (!car.bestLap || car.lastLap < car.bestLap)) car.bestLap = car.lastLap;
    if (car.laps > 1 && (!this.fastestLap || car.lastLap < this.fastestLap)) { this.fastestLap = car.lastLap; this.emit('fastestLap', car); }
    if (car.laps >= this.track.laps) {
      const overshoot = car.distance - this.raceDistance;
      car.finishTime = this.time - (car.speed > 0 ? overshoot / car.speed : 0);
      car.done = true; car.distance = this.raceDistance; car.speed = 0;
      finishEvents.push(car);
      return;
    }
    lapEvents.push(car);
    if (car.pitRequested) this.startPit(car);
  }

  requestPit(car, compound) { if (!car.done) { car.pitRequested = true; car.pitCompound = compound; } }
  cancelPit(car) { car.pitRequested = false; }

  startPit(car) {
    car.pitRequested = false;
    car.distance = car.laps * this.path.length;
    car.speed = 0;
    car.pitLeft = this.track.pitLaneLossSeconds + pitService(car.team);
    car.pitTotal = car.pitLeft;
    this.emit('pitStart', car);
  }
  tickPit(car, dt) {
    car.speed = 0;
    car.pitLeft -= dt;
    if (car.pitLeft > 0) return;
    car.pitLeft = 0; car.compound = car.pitCompound; car.wear = 0; car.stops++; car.warned = false;
    this.emit('pitEnd', car);
  }

  updateStandings() {
    for (const c of this.cars) c.prevPos = c.pos;
    this.sort();
    for (const car of this.cars) {
      if (car.pos >= car.prevPos) continue;
      for (const other of this.cars) {
        if (other === car || other.pitLeft > 0 || other.done) continue;
        if (other.prevPos < car.prevPos && other.pos > car.pos) this.pay(car.team, BAL.overtakeBonus, 'Ultrapassagem', car);
      }
    }
  }
  sort() {
    this.standings.sort((a, b) => {
      if (a.done !== b.done) return a.done ? -1 : 1;
      const r = a.done ? a.finishTime - b.finishTime : b.distance - a.distance;
      return r || a.id - b.id;
    });
    this.standings.forEach((c, i) => c.pos = i + 1);
  }

  // RaceEconomy: patrocínio contínuo (em inteiros, com resto guardado) e pagamentos com motivo.
  tickSponsors(dt) {
    for (const [team, buf] of this.sponsorBuffer) {
      const b = buf + sponsorPerSecond(team) * dt, whole = Math.floor(b);
      team.money += whole; this.sponsorBuffer.set(team, b - whole);
    }
  }
  pay(team, amount, reason, car) {
    if (amount <= 0) return;
    team.money += amount;
    this.emit('money', team, amount, reason, car);
  }

  // RivalAI: pensa a cada aiThinkInterval; box se o pneu não aguenta até o fim e passou do limite;
  // compra uma área sorteada pelos pesos se o caixa tiver folga.
  tickAI(dt) {
    this.aiTimer -= dt;
    if (this.aiTimer > 0) return;
    this.aiTimer = BAL.aiThinkInterval;
    for (const car of this.cars) if (!car.team.isPlayer) this.aiPit(car);
    for (const team of this.sponsorBuffer.keys()) if (!team.isPlayer) this.aiSpend(team);
  }
  aiPit(car) {
    if (car.done || car.pitLeft > 0 || car.pitRequested) return;
    const lapsLeft = this.track.laps - car.laps;
    if (lapsLeft <= 1) return;
    const lapTime = car.lastLap > 0 ? car.lastLap : this.path.length / (this.track.baseSpeed * 0.75);
    const lastsToEnd = car.wear + COMPOUNDS[car.compound].wear * lapsLeft * lapTime < 1;
    if (lastsToEnd || car.wear < def(car.team).ai[2]) return;
    const after = lapsLeft - 1;
    const compound = ['S', 'M'].find(c => COMPOUNDS[c].wear * after * lapTime < 0.9) || 'H';
    this.requestPit(car, compound);
  }
  aiSpend(team) {
    const [eager, weights] = def(team).ai;
    const types = ['eng', 'mkt', 'pit', 'driver'];
    const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
    let roll = this.rng() * total, type = types[3];
    for (let i = 0; i < 4; i++) { roll -= Math.max(0, weights[i]); if (roll <= 0) { type = types[i]; break; } }
    const driver = team.skill[0] <= team.skill[1] ? 0 : 1;
    if (team.money >= costOf(team, type, driver) * lerp(2, 1, eager)) tryBuy(team, type, driver);
  }
}

// ============================================================ campeonato e save (guia Fase 7)

let season;   // { race: índice da próxima etapa, teams: TeamState[], last: resultado da última corrida | null }

function newSeason() { return { race: 0, teams: TEAMS.map(newTeamState), last: null }; }
function saveSeason() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(season)); } catch (e) {} }
function loadSeason() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.teams && s.teams.length === TEAMS.length) return s; } catch (e) {}
  return null;
}
const teamStandings = () => [...season.teams].sort((a, b) => b.points - a.points || b.money - a.money);

// ============================================================ arte

const IMG = {};
function loadImages(list) {
  return Promise.all(list.map(([key, src]) => new Promise(res => {
    const im = new Image(); im.onload = () => { IMG[key] = im; res(); }; im.onerror = () => { console.warn('sem arte:', src); res(); }; im.src = src;
  })));
}

// Sprite branco tingido com a cor da equipe (GDD §9): multiply mantém pneus e sombras escuros,
// destination-in devolve o recorte do carro. Já sai reduzido, para o desenho por quadro ficar barato.
function tintCar(img, color, h = 140) {
  const w = Math.round(img.width * h / img.height);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, w, h);
  if (color) {
    g.globalCompositeOperation = 'multiply'; g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(img, 0, 0, w, h);
  }
  return c;
}

// ============================================================ tela

const $ = id => document.getElementById(id);
const fmtMoney = v => '$ ' + Math.floor(v).toLocaleString('pt-BR');
const fmtTime = s => { const m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`; };
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

let race = null, track = null, player = null;
let timeScale = DEV.has('fast') ? 4 : 1;
const selectedCompound = ['M', 'M'];
const feed = [];
const carSprites = {};
let scale = 1;

function fit() {
  scale = Math.min(innerWidth / REF_W, innerHeight / REF_H);
  const app = $('app');
  app.style.transform = `scale(${scale})`;
  app.style.left = `${(innerWidth - REF_W * scale) / 2}px`;
  app.style.top = `${(innerHeight - REF_H * scale) / 2}px`;
  sizeCanvas();
}

// ------------------------------------------------------------ mapa

const map = { canvas: null, g: null, w: 0, h: 0, s: 1, ox: 0, oy: 0, bg: null };

function sizeCanvas() {
  const c = $('map'), r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
  map.canvas = c; map.g = c.getContext('2d'); map.w = c.width; map.h = c.height;
  if (track) { fitTrack(); map.bg = null; }
}

// Encaixa a pista no mapa com margem (Etapa 8B: "a pista sempre cabe").
function fitTrack() {
  const xs = track.waypoints.map(p => p[0]), ys = track.waypoints.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 3.5;
  map.s = Math.min(map.w / (maxX - minX + pad * 2), map.h / (maxY - minY + pad * 2));
  map.ox = map.w / 2 - (minX + maxX) / 2 * map.s;
  map.oy = map.h / 2 - (minY + maxY) / 2 * map.s;
}
const toPx = p => [map.ox + p[0] * map.s, map.oy + p[1] * map.s];

// Fundo (papel + pista + largada) desenhado uma vez num canvas próprio.
function drawBackground() {
  const c = document.createElement('canvas'); c.width = map.w; c.height = map.h;
  const g = c.getContext('2d'), s = map.s;
  const paper = IMG.paper;
  if (paper) {
    const k = Math.max(map.w / paper.width, map.h / paper.height);
    g.drawImage(paper, (map.w - paper.width * k) / 2, (map.h - paper.height * k) / 2, paper.width * k, paper.height * k);
  } else { g.fillStyle = '#efe2c4'; g.fillRect(0, 0, map.w, map.h); }

  const line = () => { g.beginPath(); track.waypoints.forEach((p, i) => { const [x, y] = toPx(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
  g.lineJoin = g.lineCap = 'round';
  line(); g.strokeStyle = 'rgba(60,45,20,.18)'; g.lineWidth = (track.width + 1.4) * s; g.stroke();   // sombra no papel
  line(); g.strokeStyle = '#efe4c9'; g.lineWidth = (track.width + 0.5) * s; g.stroke();             // borda clara
  line(); g.strokeStyle = '#262624'; g.lineWidth = (track.width + 0.2) * s; g.stroke();
  line(); g.strokeStyle = '#3e3e3a'; g.lineWidth = track.width * s; g.stroke();
  g.setLineDash([0.6 * s, 0.9 * s]);
  line(); g.strokeStyle = 'rgba(243,230,204,.25)'; g.lineWidth = 0.08 * s; g.stroke();
  g.setLineDash([]);

  // Pit lane: faixa fina paralela à reta de largada, do lado de dentro.
  const p0 = race.path.positionAt(0), d0 = race.path.directionAt(0), nrm = [-d0[1], d0[0]];
  const pitSide = pitSideSign();
  const a = toPx([p0[0] - d0[0] * 6 + nrm[0] * 2.3 * pitSide, p0[1] - d0[1] * 6 + nrm[1] * 2.3 * pitSide]);
  const b = toPx([p0[0] + d0[0] * 6 + nrm[0] * 2.3 * pitSide, p0[1] + d0[1] * 6 + nrm[1] * 2.3 * pitSide]);
  g.strokeStyle = 'rgba(38,38,36,.55)'; g.lineWidth = 0.9 * s; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();

  // Faixa quadriculada atravessada na linha de largada.
  if (IMG.startLine) {
    const [x, y] = toPx(p0);
    g.save(); g.translate(x, y); g.rotate(Math.atan2(d0[1], d0[0]) + Math.PI / 2);
    const w = track.width * s, h = w * 0.11;
    g.drawImage(IMG.startLine, -w / 2, -h / 2, w, h);
    g.restore();
  }
  map.bg = c;
}

// Lado de dentro da pista em relação à reta de largada (onde fica o box).
function pitSideSign() {
  const p0 = race.path.positionAt(0), d0 = race.path.directionAt(0), nrm = [-d0[1], d0[0]];
  const cx = track.waypoints.reduce((s, p) => s + p[0], 0) / track.waypoints.length;
  const cy = track.waypoints.reduce((s, p) => s + p[1], 0) / track.waypoints.length;
  return Math.sign((cx - p0[0]) * nrm[0] + (cy - p0[1]) * nrm[1]) || 1;
}

function drawMap() {
  const g = map.g; if (!g || !race) return;
  if (!map.bg) drawBackground();
  g.drawImage(map.bg, 0, 0);
  const s = map.s, carLen = 2.0 * s, side = pitSideSign();
  // Os líderes por último, para ficarem por cima; os do jogador sempre no topo.
  const order = [...race.standings].reverse().sort((a, b) => (a.team.isPlayer - b.team.isPlayer));
  for (const car of order) {
    let d = car.distance, lateral = ((car.id % 3) - 1) * 0.42;
    if (car.gridSlot != null && car.laps === 0 && d < 0) lateral = car.gridSlot % 2 ? 0.5 : -0.5;
    let alpha = 1;
    if (car.pitLeft > 0) { lateral = 2.3 * side; alpha = 0.85; d = car.laps * race.path.length - 4 + 8 * (1 - car.pitLeft / car.pitTotal); }
    const p = race.path.positionAt(d), dir = race.path.directionAt(d);
    const pos = toPx([p[0] - dir[1] * lateral, p[1] + dir[0] * lateral]);
    const spr = carSprites[car.team.id];
    if (!spr) continue;
    const w = carLen * spr.width / spr.height;
    g.save(); g.globalAlpha = alpha;
    g.translate(pos[0], pos[1]); g.rotate(Math.atan2(dir[1], dir[0]) + Math.PI / 2);
    if (car.team.isPlayer && carSprites.highlight) g.drawImage(carSprites.highlight, -w / 2 * 1.0, -carLen / 2, w, carLen);
    g.drawImage(spr, -w / 2, -carLen / 2, w, carLen);
    g.restore();
    if (car.team.isPlayer) {
      // Número do carro do jogador (1/2), como no conceito de arte.
      g.fillStyle = car.driver ? '#a8231f' : '#194e34';
      g.beginPath(); g.arc(pos[0], pos[1] - carLen * 0.75, 0.55 * s, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f3e6cc'; g.font = `700 ${Math.round(0.8 * s)}px 'Barlow Condensed', sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(car.driver + 1), pos[0], pos[1] - carLen * 0.75 + 1);
    }
  }
}

// ------------------------------------------------------------ painéis (DOM)

function buildRaceUI() {
  $('track-card').innerHTML = `<div class="name">${track.name}</div>
    <div class="info">Etapa ${season.race + 1}/${TRACKS.length} · ${track.laps} voltas · ${track.country}</div>`;
  updateSpeedBtn();

  // Investimentos: 4 áreas do MVP, treino por piloto, + 1 vaga trancada (fora do MVP).
  const up = $('upgrades'); up.innerHTML = '';
  const slots = [['eng', 0], ['mkt', 0], ['pit', 0], ['driver', 0], ['driver', 1], [null]];
  for (const [type, driver] of slots) {
    const b = el('button', 'upg');
    if (!type) {
      b.classList.add('locked'); b.disabled = true;
      b.style.backgroundImage = `url('${UI}upgrade_rows/upgrade_row_locked.png')`;
      b.innerHTML = `<div class="patch"><div class="t">Túnel de vento <small>· fora do MVP</small></div></div>`;
    } else {
      b.style.backgroundImage = `url('${UI}upgrade_rows/${UPGRADES[type].row}.png')`;
      b.innerHTML = `<div class="patch"><div class="t"></div><div class="c"></div><div class="bar"><i></i></div></div>`;
      b.onclick = () => {
        if (tryBuy(player, type, driver)) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); updateUI(); }
      };
      b.dataset.type = type; b.dataset.driver = driver;
    }
    up.appendChild(b);
  }

  // Cartões dos dois carros do jogador.
  const cars = $('cars'); cars.innerHTML = '';
  for (let d = 0; d < 2; d++) {
    const card = el('div', 'car panel');
    card.innerHTML = `
      <div class="top"><img src="${UI}helmets/helmet_${d ? 'red' : 'green'}.png" alt="">
        <div><small style="color:${d ? 'var(--red)' : 'var(--green)'}">CARRO ${d + 1}</small><b>${def(player).drivers[d]}</b></div>
        <div class="pos"></div></div>
      <div class="wear-l"><span>PNEU <span class="cmp"></span></span><b class="pct"></b></div>
      <div class="wear"><i></i></div>
      <div class="compounds">${['S', 'M', 'H'].map(c => `<button data-c="${c}" title="${COMPOUNDS[c].name}"><img src="${UI}tyre_badges/${COMPOUNDS[c].badge}.png" alt="${COMPOUNDS[c].name}"></button>`).join('')}<span class="sel-name"></span></div>
      <button class="boxbtn"><span></span></button>
      <div class="hint"></div>
      <div class="best"><span>Melhor volta <b class="bl">—</b></span><span>Paradas <b class="st">0</b></span></div>`;
    card.querySelectorAll('.compounds button').forEach(btn => btn.onclick = () => {
      selectedCompound[d] = btn.dataset.c;
      const car = playerCar(d);
      if (car.pitRequested) car.pitCompound = selectedCompound[d];
      updateUI();
    });
    card.querySelector('.boxbtn').onclick = () => {
      const car = playerCar(d);
      if (car.done || car.pitLeft > 0) return;
      if (car.pitRequested) race.cancelPit(car); else race.requestPit(car, selectedCompound[d]);
      updateUI();
    };
    cars.appendChild(card);
  }
  $('notifications').innerHTML = '';
  feed.length = 0;
}

const playerCar = d => race.cars.find(c => c.team.isPlayer && c.driver === d);

function gapText(leader, car) {
  if (car === leader) return 'LÍDER';
  if (leader.done && car.done) return `+${(car.finishTime - leader.finishTime).toFixed(1)}s`;
  const lapsBehind = (leader.distance - car.distance) / race.path.length;
  if (lapsBehind >= 1) return `+${Math.floor(lapsBehind)} v`;
  return `+${((leader.distance - car.distance) / (track.baseSpeed * 0.75)).toFixed(1)}s`;
}

function updateUI() {
  if (!race) return;
  const lap = race.leaderLap;
  $('lap-text').textContent = race.finished ? 'BANDEIRADA' : lap === track.laps ? `ÚLTIMA VOLTA ${lap} / ${track.laps}` : `VOLTA ${lap} / ${track.laps}`;

  const leader = race.standings[0];
  $('standings').innerHTML = race.standings.map(c => {
    const d = def(c.team);
    const box = c.pitLeft > 0 ? '<span class="pit">BOX</span>' : c.done ? '🏁' : c.stops;
    return `<div class="row${c.team.isPlayer ? ' me' : ''}"><span>${c.pos}</span>
      <span class="drv"><i style="background:${d.color}"></i>${d.drivers[c.driver]} <small>${d.short}</small></span>
      <span>${gapText(leader, c)}</span><span><img src="${UI}tyre_badges/${COMPOUNDS[c.compound].badge}.png" alt="${c.compound}"></span><span>${box}</span></div>`;
  }).join('');

  $('money').innerHTML = `<div class="amount"><img src="${UI}icons/icon_money.png" alt=""><div>CAIXA<br><b>${fmtMoney(player.money)}</b></div></div>
    <div class="feed"><div>patrocínio +${sponsorPerSecond(player).toFixed(1).replace('.', ',')}/s</div>${feed.slice(0, 3).map(f => `<div>+${f.amount} ${f.reason}</div>`).join('')}</div>`;

  document.querySelectorAll('.upg[data-type]').forEach(b => {
    const type = b.dataset.type, driver = +b.dataset.driver, lvl = levelOf(player, type, driver), cost = costOf(player, type, driver);
    const max = lvl >= BAL.maxLevel;
    const title = type === 'driver' ? `Treino ${def(player).drivers[driver].split(' ').pop()}` : UPGRADES[type].name;
    const effect = { eng: `+${lvl * 2}% vel.`, mkt: `+${(lvl * 15)}% patroc.`, pit: `serviço ${pitService(player).toFixed(1).replace('.', ',')}s`, driver: `+${(lvl * 1.5).toFixed(1).replace('.', ',')}% vel.` }[type];
    b.querySelector('.t').innerHTML = `${title} <small>Nv ${lvl} · ${effect}</small>`;
    b.querySelector('.c').textContent = max ? 'MÁX' : fmtMoney(cost);
    b.querySelector('.bar i').style.width = `${lvl / BAL.maxLevel * 100}%`;
    b.classList.toggle('poor', !max && player.money < cost);
    b.classList.toggle('max', max);
  });

  document.querySelectorAll('.car').forEach((card, d) => {
    const car = playerCar(d), life = 1 - car.wear;
    card.querySelector('.pos').textContent = `P${car.pos}`;
    card.querySelector('.cmp').textContent = COMPOUNDS[car.compound].name.toUpperCase();
    card.querySelector('.pct').textContent = `${Math.round(life * 100)}%`;
    card.querySelector('.wear i').style.width = `${life * 100}%`;
    card.querySelector('.wear').classList.toggle('low', life < 0.25);
    card.querySelectorAll('.compounds button').forEach(b => b.classList.toggle('sel', b.dataset.c === selectedCompound[d]));
    card.querySelector('.sel-name').textContent = COMPOUNDS[selectedCompound[d]].name;
    card.querySelector('.bl').textContent = car.bestLap ? fmtTime(car.bestLap) : '—';
    card.querySelector('.st').textContent = car.stops;
    const btn = card.querySelector('.boxbtn'), hint = card.querySelector('.hint');
    btn.classList.remove('plain');
    if (car.done) {
      btn.disabled = true; btn.style.backgroundImage = `url('${UI}box_buttons/box_button_green.png')`;
      btn.classList.add('plain'); btn.firstElementChild.textContent = `CHEGOU P${car.pos}`; hint.textContent = '';
    } else if (car.pitLeft > 0) {
      btn.disabled = true; btn.style.backgroundImage = `url('${UI}box_buttons/box_button_red.png')`;
      btn.classList.add('plain'); btn.firstElementChild.textContent = `NO BOX ${car.pitLeft.toFixed(1)}s`; hint.textContent = `trocando para ${COMPOUNDS[car.pitCompound].name}`;
    } else if (car.pitRequested) {
      btn.disabled = false; btn.style.backgroundImage = `url('${UI}box_buttons/box_button_red.png')`;
      btn.firstElementChild.textContent = 'CANCELAR'; hint.textContent = `entra no fim da volta · ${COMPOUNDS[car.pitCompound].name}`;
    } else {
      btn.disabled = false; btn.style.backgroundImage = `url('${UI}box_buttons/box_button_green.png')`;
      btn.firstElementChild.textContent = 'BOX';
      hint.textContent = `parada ≈ ${(track.pitLaneLossSeconds + pitService(player)).toFixed(1).replace('.', ',')}s`;
    }
  });
}

function updateSpeedBtn() { $('speed-btn').firstElementChild.textContent = `${timeScale}×`; }
$('speed-btn').onclick = () => { timeScale = timeScale >= 4 ? 1 : timeScale * 2; updateSpeedBtn(); };

// Cards de notificação (no máximo 3; o mais velho sai). Ícones já vêm desenhados no sprite.
function notify(kind, title, text) {
  const box = $('notifications');
  const n = el('button', `note ${kind}`, `<div class="txt"><b>${title}</b><span>${text}</span></div>`);
  n.style.backgroundImage = `url('${UI}notifications/notification_${kind}.png')`;
  n.onclick = () => n.remove();
  box.prepend(n);
  while (box.children.length > 3) box.lastElementChild.remove();
  setTimeout(() => n.remove(), 7000);
}

// ------------------------------------------------------------ fluxo: temporada → corrida → resultado

function startRace() {
  track = TRACKS[season.race];
  track.waypoints = track.waypoints || smoothLoop(track.pts);
  player = season.teams.find(t => t.isPlayer);
  if (DEV.has('rich')) player.money += 5000;
  selectedCompound[0] = selectedCompound[1] = 'M';
  race = new Race(track, season.teams, (Math.random() * 2 ** 31) | 0);
  race.on.money = (team, amount, reason) => {
    if (!team.isPlayer) return;
    feed.unshift({ amount, reason });
    if (feed.length > 6) feed.pop();
  };
  race.on.fastestLap = car => { if (car.team.isPlayer && car.laps > 1) notify('green', 'Volta mais rápida', `${def(car.team).drivers[car.driver]} · ${fmtTime(car.lastLap)}`); };
  race.on.pitStart = car => { if (car.team.isPlayer) notify('blue', `Carro ${car.driver + 1} no box`, `${car.pitLeft.toFixed(1).replace('.', ',')}s · ${COMPOUNDS[car.pitCompound].name}`); };
  race.on.lap = car => {
    if (car.team.isPlayer && !car.warned && car.wear >= 0.75) {
      car.warned = true; notify('red', `Carro ${car.driver + 1}: pneu gasto`, `${Math.round((1 - car.wear) * 100)}% restante · chame o box`);
    }
    if (car === race.standings[0] && car.laps === track.laps - 1) notify('blue', 'Última volta', `${def(car.team).drivers[car.driver]} lidera`);
  };
  race.on.carFinished = car => { if (car.team.isPlayer) notify('green', `Carro ${car.driver + 1} chegou P${car.pos}`, `+${fmtMoney(byPosition(BAL.prizeByPosition, car.pos))} de prêmio`); };
  race.on.raceFinished = () => setTimeout(finishRace, 1200);
  $('overlay').classList.add('hidden');
  buildRaceUI();
  map.bg = null; sizeCanvas();
  updateUI();
}

function finishRace() {
  const results = race.standings.map(c => ({
    team: c.team.id, driver: c.driver, pos: c.pos, time: c.finishTime,
    prize: byPosition(BAL.prizeByPosition, c.pos), points: byPosition(BAL.pointsByPosition, c.pos),
  }));
  for (const r of results) season.teams.find(t => t.id === r.team).points += r.points;
  season.last = { track: track.name, results };
  season.race++;
  saveSeason();
  race = null;
  showSeason();
}

function resultsTable(results) {
  const first = results[0].time;
  return `<div class="tbl">${results.map(r => {
    const d = TEAM_DEF[r.team];
    return `<div class="${r.team === 'player' ? 'me' : ''}"><span>${r.pos}</span><span>${d.drivers[r.driver]} <em>${d.short}</em></span>
      <span>${r.pos === 1 ? fmtTime(r.time) : '+' + (r.time - first).toFixed(1) + 's'}</span><span>${r.points ? r.points + ' pts' : ''}</span></div>`;
  }).join('')}</div>`;
}
function championshipTable() {
  return `<div class="tbl">${teamStandings().map((t, i) => {
    const d = TEAM_DEF[t.id];
    return `<div class="${t.isPlayer ? 'me' : ''}"><span>${i + 1}</span><span><span style="color:${d.color}">■</span> ${d.name}</span><span><em>${fmtMoney(t.money)}</em></span><span>${t.points} pts</span></div>`;
  }).join('')}</div>`;
}

function showSeason() {
  const m = $('modal'), done = season.race >= TRACKS.length;
  const pl = season.teams.find(t => t.isPlayer);
  let head, body, actions;
  if (done) {
    const champ = teamStandings()[0], pos = teamStandings().indexOf(pl) + 1;
    head = `<div class="mh${champ.isPlayer ? '' : ' red'}"><b>FIM DA TEMPORADA</b><span>Campeã: ${TEAM_DEF[champ.id].name} · Mangue Racing terminou em ${pos}º</span></div>`;
    actions = `<button class="big green" id="go">NOVA TEMPORADA</button>`;
  } else {
    const t = TRACKS[season.race];
    head = `<div class="mh"><b>ETAPA ${season.race + 1}/${TRACKS.length}: ${t.name.toUpperCase()}</b><span>${t.country} · ${t.laps} voltas · todos largam de pneu Médio, grid sorteado</span></div>`;
    actions = `<button class="big green" id="go">LARGAR</button>`;
  }
  const last = season.last
    ? `<div><h3>Resultado · ${season.last.track}</h3>${resultsTable(season.last.results)}</div>`
    : `<div><h3>Como jogar</h3><p>Você não pilota: a corrida anda sozinha. O dinheiro entra por patrocínio, voltas e ultrapassagens.<br><br>
       Compre <b>Engenharia</b>, <b>Propaganda</b>, <b>Equipe de boxes</b> e <b>Treino</b> durante a prova: vale na hora e fica para a temporada inteira.<br><br>
       O pneu gasta e o carro perde ritmo: escolha o composto e aperte <b>BOX</b>; o carro entra ao fim da volta.</p></div>`;
  body = `<div class="cols">${last}<div><h3>Campeonato de equipes</h3>${championshipTable()}
    <p style="margin-top:10px;color:var(--muted)">Pontos 25-18-15-12-10-8-6-4-2-1 por carro, somados por equipe. O dinheiro fica de uma etapa para outra.</p></div></div>`;
  m.innerHTML = head + body + `<div class="actions">${actions}</div>`;
  $('overlay').classList.remove('hidden');
  $('go').onclick = () => {
    if (done) { season = newSeason(); saveSeason(); showSeason(); return; }
    startRace();
  };
}

// ------------------------------------------------------------ laço principal

let lastT = 0, uiTimer = 0;
function frame(t) {
  const dt = Math.min(0.1, (t - lastT) / 1000 || 0); lastT = t;
  if (race && !race.finished) {
    let remaining = dt * timeScale;
    while (remaining > 0) { const step = Math.min(remaining, MAX_STEP); race.tick(step); remaining -= step; }
    uiTimer -= dt;
    if (uiTimer <= 0) { uiTimer = 0.1; updateUI(); }
  }
  drawMap();
  requestAnimationFrame(frame);
}

async function boot() {
  await loadImages([
    ['paper', ART + 'track/map_background.png'],
    ['startLine', ART + 'track/start_line.png'],
    ['car1', ART + 'cars/car60s_white_v1.png'],
    ['car2', ART + 'cars/car60s_white_v2.png'],
    ['hl1', ART + 'cars/car60s_highlight_v1.png'],
    // A tabela e o caixa são redesenhados 10×/s: sem pré-carga, na 1ª visita (rede) a imagem nem chega a aparecer.
    ...Object.values(COMPOUNDS).map(c => [c.badge, `${UI}tyre_badges/${c.badge}.png`]),
    ['money', UI + 'icons/icon_money.png'],
  ]);
  // Equipes de índice par usam a variação 1 do carro; ímpar, a 2. O jogador usa a 1 com contorno.
  TEAMS.forEach((t, i) => { const src = IMG[i % 2 ? 'car2' : 'car1']; if (src) carSprites[t.id] = tintCar(src, t.color); });
  if (IMG.hl1) carSprites.highlight = tintCar(IMG.hl1, '#194e34');
  season = loadSeason() || newSeason();
  addEventListener('resize', fit);
  fit();
  if (season.race >= TRACKS.length || !DEV.has('go')) showSeason();
  else {
    startRace();
    if (DEV.has('warp')) { for (let i = 0; i < 90 / MAX_STEP; i++) race.tick(MAX_STEP); updateUI(); }
  }
  requestAnimationFrame(frame);
}
boot();
