'use strict';
/* Charuto Racer — dados do protótipo: ajustes (GameConfig), peças, equipes e pistas.
   Os números são os placeholders do CharutoRacer.md (Parte 1 e Fase 1 do guia Unity);
   onde o protótipo mudou algo, o comentário diz o porquê e o README registra. */

const KMH = 100000 / 3600; // km/h -> cm/s (1 unidade do mundo = 1 cm)

const CFG = {
  // Tela e estrada
  screenWidth: 320, screenHeight: 180,
  segmentLength: 200, rumbleLength: 3, roadWidth: 1200, lanes: 3,
  fieldOfView: 100, cameraHeight: 600, drawDistance: 220, fogDensity: 3, pitLaneWidth: 0.6,
  // Carros na estrada. O guia usa 360; 300 deixa o carro do jogador com ~80 px em vez de ~96.
  carWorldWidth: 300, carLength: 400,
  // Carro base (sem peças)
  baseMaxSpeedKmh: 180, baseAccelerationKmh: 40, baseGrip: 0.4, baseGearCount: 4,
  // Pilotagem. referenceSpeedKmh: a força centrífuga cresce com a velocidade absoluta, não com a
  // fração da velocidade máxima do carro (senão um motor melhor nunca exigiria pneus melhores).
  brakingKmh: 120, coastDecelKmh: 25, offRoadDecelKmh: 90, offRoadMaxSpeedKmh: 80,
  steerSpeed: 2, centrifugal: 0.3, maxOffsetX: 2.5, automaticAccelFactor: 1, referenceSpeedKmh: 200,
  // Combustível, pneus e nitro. fuelPerKm sobe de 7 (guia) para 12 porque as corridas do protótipo
  // têm ~7–8 km: com 12 %/km um tanque quase não chega ao fim usando os 3 nitros (Parte 1 §4.3).
  fuelCapacity: 100, fuelPerKm: 12, tireWearPerKm: 0.07,
  nitroCharges: 3, nitroDuration: 4, nitroSpeedBoost: 1.25, nitroAccelBoost: 1.6,
  // Dano
  crashDamage: 12, carBumpDamage: 3, crashSpeedFactor: 0.2, damageSpeedPenalty: 0.35,
  // Box
  pitEntryX: 1.05, pitMaxEntryKmh: 90, pitRefuelPerSecond: 25, pitTireChangeSeconds: 3,
  // IA e corrida
  aiCurveSlowdown: 0.35, countdown: 3,
  // Economia e campeonato
  startingMoney: 2000,
  prizeByPosition: [5000, 3500, 2500, 1800, 1300, 1000, 800, 600, 500, 400],
  pointsByPosition: [9, 6, 4, 3, 2, 1],
  repairCostPerPercent: 40,
};
CFG.cameraDepth = 1 / Math.tan((CFG.fieldOfView / 2) * Math.PI / 180);
CFG.playerZ = CFG.cameraHeight * CFG.cameraDepth;

const CATEGORIES = ['Motor', 'Câmbio', 'Pneus', 'Chassi'];

// Parte 1 §6.2 (nomes e preços candidatos) e Fase 1.5 (bônus).
const PARTS = [
  { id: 'motor_4c_15', cat: 0, tier: 1, price: 0, name: '4 cilindros 1.5 L' },
  { id: 'motor_v8_15', cat: 0, tier: 2, price: 4500, name: 'V8 1.5 L', speed: 25, accel: 5 },
  { id: 'motor_v12_30', cat: 0, tier: 3, price: 12000, name: 'V12 3.0 L', speed: 55, accel: 8, fuel: 1.25 },
  { id: 'motor_v8_30', cat: 0, tier: 4, price: 25000, name: 'V8 3.0 L de corrida', speed: 70, accel: 15, fuel: 1.1 },
  { id: 'cambio_4', cat: 1, tier: 1, price: 0, name: '4 marchas', gears: 4 },
  { id: 'cambio_5', cat: 1, tier: 2, price: 3000, name: '5 marchas', gears: 5, accel: 4 },
  { id: 'cambio_5c', cat: 1, tier: 3, price: 8000, name: '5 marchas, relação curta', gears: 5, accel: 8 },
  { id: 'cambio_6', cat: 1, tier: 4, price: 16000, name: '6 marchas', gears: 6, accel: 10, speed: 5 },
  { id: 'pneu_estreito', cat: 2, tier: 1, price: 0, name: 'Estreitos com sulco' },
  { id: 'pneu_largo', cat: 2, tier: 2, price: 3500, name: 'Largos, borracha macia', grip: 0.15, wear: 1.1 },
  { id: 'pneu_composto', cat: 2, tier: 3, price: 9000, name: 'Largos, composto de corrida', grip: 0.3, wear: 1.2 },
  { id: 'pneu_slick', cat: 2, tier: 4, price: 18000, name: 'Lisos (slick)', grip: 0.45, wear: 1.4 },
  { id: 'chassi_tubular', cat: 3, tier: 1, price: 0, name: 'Tubular' },
  { id: 'chassi_tubular_leve', cat: 3, tier: 2, price: 4000, name: 'Tubular leve', accel: 3, grip: 0.05 },
  { id: 'chassi_monocoque', cat: 3, tier: 3, price: 10000, name: 'Monocoque', accel: 5, grip: 0.05, durability: 0.3 },
  { id: 'chassi_aerofolio', cat: 3, tier: 4, price: 20000, name: 'Monocoque com aerofólio', speed: -5, grip: 0.2, durability: 0.3 },
];

// Parte 1 §7: 9 adversários fictícios (placeholders), cores nacionais de corrida da época (§9, candidato).
const PLAYER = { driver: 'Você', team: 'Equipe Charuto', body: '#f2c230', accent: '#1f7a3a', helmet: '#1f7a3a' };
const TEAMS = [
  { driver: 'R. Hawthorne', team: 'Albion Racing', body: '#1f6b3a', accent: '#e8e2c4', helmet: '#e8e2c4', speed: 225, accel: 44 },
  { driver: 'G. Moretti', team: 'Scuderia Rossa', body: '#c41e24', accent: '#f2d23c', helmet: '#f2d23c', speed: 220, accel: 43 },
  { driver: 'P. Duval', team: 'Équipe Bleue', body: '#2452a8', accent: '#f2f2f2', helmet: '#f2f2f2', speed: 214, accel: 41 },
  { driver: 'K. Brandt', team: 'Silberpfeil', body: '#b9bec4', accent: '#3a3f45', helmet: '#3a3f45', speed: 210, accel: 40 },
  { driver: 'T. Nakamura', team: 'Nakamura Kōgyō', body: '#efede6', accent: '#c8102e', helmet: '#c8102e', speed: 204, accel: 39 },
  { driver: 'A. Fonseca', team: 'Fonseca & Filhos', body: '#7a1d2b', accent: '#2f8a4a', helmet: '#efede6', speed: 199, accel: 38 },
  { driver: 'S. van Dijk', team: 'Oranje Racing', body: '#ee7b1c', accent: '#f2f2f2', helmet: '#1c2f6b', speed: 194, accel: 37 },
  { driver: 'M. Herrera', team: 'Herrera Hermanos', body: '#f2f2f2', accent: '#1e7f45', helmet: '#c8102e', speed: 190, accel: 35 },
  { driver: 'D. MacLeod', team: 'Écurie Caledonia', body: '#1b2a55', accent: '#f2f2f2', helmet: '#f2f2f2', speed: 186, accel: 34 },
];

// Trechos: [entrada, meio, saída, curva (-6..6), morro (-60..60)] — formato do TrackSection (Fase 1.2).
// Objetos: k = sprite, w = largura no mundo (cm), off = posição lateral (±1 = borda do asfalto),
// first/every/count = repetição, mirror = os dois lados, hit = causa batida, jit = variação lateral.
// Parte 1 §8: os 8 temas são os candidatos da tabela (pistas fictícias "no estilo de"; Em aberto no GDD).
const TRACKS = [
  {
    name: 'Ashbury Park', gp: 'GP da Inglaterra', laps: 4,
    theme: {
      skyTop: '#6f9fd0', skyBottom: '#c9dbe8', fog: '#9fb6a8',
      grass: ['#4f9a3a', '#468d33'], rumble: ['#f2f2f2', '#c42a2a'], road: ['#6b6b6b', '#636363'], lane: '#d8d8d8',
      far: ['hills', '#7f9cb0', '#93adbf'], near: ['forest', '#3d6e3a', '#4b8045'], clouds: 6,
    },
    sections: [[0, 70, 0, 0, 0], [25, 40, 25, 2, 0], [20, 30, 20, 0, 20], [25, 40, 25, -4, -20], [0, 50, 0, 0, 0], [25, 30, 25, 5, 0],
      [20, 40, 20, -2, 15], [20, 30, 20, 3, -15], [0, 80, 0, 0, 0], [25, 40, 25, -5, 0], [20, 60, 20, 1, 0], [0, 60, 0, 0, 0]],
    roadside: [
      { k: 'oak', w: 520, off: -2.0, first: 70, every: 9, jit: 0.6 },
      { k: 'oak', w: 520, off: 2.3, first: 75, every: 13, jit: 0.8 },
      { k: 'hay', w: 260, off: 1.25, first: 90, every: 27, hit: true },
      { k: 'hay', w: 260, off: -1.25, first: 160, every: 41, hit: true },
      { k: 'sign1', w: 520, off: -1.45, first: 120, every: 70, hit: true },
      { k: 'marshal', w: 120, off: -1.3, first: 200, every: 150 },
    ],
  },
  {
    name: 'Porto Azzurro', gp: 'GP da Riviera', laps: 6,
    theme: {
      skyTop: '#3d8fd6', skyBottom: '#b5dcf2', fog: '#8fb8cf',
      grass: ['#a9a59a', '#9e9a8f'], rumble: ['#f2f2f2', '#c42a2a'], road: ['#5f5f62', '#59595c'], lane: '#e2e2e2',
      far: ['sea', '#2e7fb8', '#5aa2d1'], near: ['city', '#d9b48c', '#c98f6a'], clouds: 3,
    },
    sections: [[0, 60, 0, 0, 0], [15, 20, 15, -6, 0], [10, 40, 10, 0, 10], [15, 25, 15, 5, 10], [10, 20, 10, 6, 0], [0, 40, 0, 0, -10],
      [15, 20, 15, -5, -10], [0, 60, 0, 0, 0], [15, 30, 15, -6, 0], [10, 30, 10, 3, 0], [15, 20, 15, 6, 0], [0, 60, 0, 0, 0]],
    roadside: [
      { k: 'building', w: 1400, off: -2.0, first: 60, every: 6 },
      { k: 'lamp', w: 90, off: -1.25, first: 64, every: 12, hit: true },
      { k: 'lamp', w: 90, off: 1.25, first: 64, every: 12, hit: true },
      { k: 'palm', w: 420, off: 1.9, first: 66, every: 10, jit: 0.3 },
      { k: 'sign3', w: 520, off: 1.45, first: 100, every: 55, hit: true },
    ],
  },
  {
    name: 'Autodromo di Vallerossa', gp: 'GP da Itália', laps: 4,
    theme: {
      skyTop: '#4f8fd8', skyBottom: '#d6e6f2', fog: '#b4c3a2',
      grass: ['#6fa33e', '#669838'], rumble: ['#f2f2f2', '#2a7a3a'], road: ['#6e6e6e', '#666666'], lane: '#e0e0e0',
      far: ['hills', '#9aa98a', '#adbb9c'], near: ['poplars', '#3f6e36', '#507f42'], clouds: 2,
    },
    sections: [[0, 120, 0, 0, 0], [30, 50, 30, 2, 0], [0, 100, 0, 0, 0], [25, 30, 25, -3, 0], [0, 80, 0, 0, 0], [20, 30, 20, 4, 0],
      [20, 20, 20, -4, 0], [0, 120, 0, 0, 0], [30, 60, 30, 2, 0], [0, 80, 0, 0, 0]],
    roadside: [
      { k: 'cypress', w: 220, off: -1.8, first: 60, every: 7, jit: 0.2 },
      { k: 'cypress', w: 220, off: 1.8, first: 63, every: 7, jit: 0.2 },
      { k: 'sign2', w: 520, off: 1.45, first: 130, every: 60, hit: true },
      { k: 'hay', w: 260, off: -1.25, first: 240, every: 50, hit: true },
    ],
  },
  {
    name: 'Schwarzwaldring', gp: 'GP da Alemanha', laps: 5,
    theme: {
      skyTop: '#7d9bb8', skyBottom: '#cfd8df', fog: '#7c8f84',
      grass: ['#3f7a35', '#386f2f'], rumble: ['#f2f2f2', '#3a3a3a'], road: ['#666666', '#5f5f5f'], lane: '#d0d0d0',
      far: ['mountains', '#6c7f8f', '#8496a5'], near: ['forest', '#24472a', '#2f5a33'], clouds: 5,
    },
    sections: [[0, 60, 0, 0, 0], [20, 30, 20, 0, 40], [25, 30, 25, -3, 0], [20, 30, 20, 0, -60], [25, 30, 25, 4, 20], [20, 20, 20, -5, 30],
      [20, 40, 20, 0, -40], [25, 40, 25, 3, 0], [20, 30, 20, -2, 20], [20, 30, 20, 0, -10], [0, 60, 0, 0, 0]],
    roadside: [
      { k: 'pine', w: 380, off: -1.7, first: 60, every: 4, jit: 0.9 },
      { k: 'pine', w: 380, off: 1.7, first: 62, every: 5, jit: 0.9 },
      { k: 'sign1', w: 520, off: -1.45, first: 150, every: 80, hit: true },
    ],
  },
  {
    name: 'Circuit des Ardennes', gp: 'GP da Bélgica', laps: 4,
    theme: {
      skyTop: '#8a9aa8', skyBottom: '#d3d8dc', fog: '#97a39a',
      grass: ['#558f3c', '#4d8436'], rumble: ['#f2f2f2', '#d6b12a'], road: ['#686868', '#616161'], lane: '#d6d6d6',
      far: ['hills', '#7d8f88', '#91a29a'], near: ['hills', '#4a7a3f', '#5a8a4c'], clouds: 9,
    },
    sections: [[0, 60, 0, 0, 0], [25, 20, 25, -3, -20], [20, 40, 20, 3, 40], [0, 80, 0, 0, 0], [30, 40, 30, -2, 0], [25, 30, 25, 4, -20],
      [0, 60, 0, 0, 0], [25, 40, 25, -5, 0], [30, 60, 30, 2, 20], [20, 30, 20, 0, -20], [0, 60, 0, 0, 0]],
    roadside: [
      { k: 'pine', w: 380, off: -2.0, first: 60, every: 8, jit: 1.0 },
      { k: 'oak', w: 520, off: 2.2, first: 66, every: 11, jit: 1.0 },
      { k: 'hay', w: 260, off: 1.25, first: 120, every: 33, hit: true },
      { k: 'sign2', w: 520, off: -1.45, first: 200, every: 90, hit: true },
      { k: 'marshal', w: 120, off: 1.3, first: 260, every: 170 },
    ],
  },
  {
    name: 'Duinwijk', gp: 'GP da Holanda', laps: 5,
    theme: {
      skyTop: '#5d9bd6', skyBottom: '#d9e9f2', fog: '#c8c6a8',
      grass: ['#d8c48a', '#cdb97f'], rumble: ['#f2f2f2', '#e07a1c'], road: ['#6a6a6a', '#636363'], lane: '#e0e0e0',
      far: ['sea', '#4a8fbf', '#6aa7cf'], near: ['dunes', '#d1bd84', '#e0cf98'], clouds: 7,
    },
    sections: [[0, 60, 0, 0, 0], [20, 30, 20, 5, 0], [20, 20, 20, 0, 15], [20, 30, 20, -4, -15], [0, 50, 0, 0, 0], [20, 40, 20, -3, 0],
      [20, 30, 20, 6, 0], [0, 70, 0, 0, 0], [20, 30, 20, -2, 10], [20, 30, 20, 0, -10], [0, 50, 0, 0, 0]],
    roadside: [
      { k: 'tuft', w: 260, off: -1.6, first: 60, every: 5, jit: 1.2 },
      { k: 'tuft', w: 260, off: 1.9, first: 62, every: 6, jit: 1.2 },
      { k: 'sign3', w: 520, off: 1.45, first: 110, every: 60, hit: true },
      { k: 'hay', w: 260, off: -1.25, first: 140, every: 45, hit: true },
    ],
  },
  {
    name: 'Glen Harbor', gp: 'GP dos Estados Unidos', laps: 5,
    theme: {
      skyTop: '#6a9ed6', skyBottom: '#e3d9c6', fog: '#b39a7a',
      grass: ['#7c9a3e', '#728f38'], rumble: ['#f2f2f2', '#2452a8'], road: ['#6a6a6a', '#636363'], lane: '#e0e0e0',
      far: ['hills', '#a08a78', '#b39c88'], near: ['forest', '#b8562a', '#d07a2e'], clouds: 4,
    },
    sections: [[0, 60, 0, 0, 0], [25, 30, 25, 3, 20], [20, 40, 20, -4, 0], [20, 20, 20, 5, -20], [0, 70, 0, 0, 0], [25, 30, 25, -3, 25],
      [20, 40, 20, 2, -25], [25, 30, 25, -5, 0], [0, 60, 0, 0, 0], [25, 50, 25, 3, 0], [0, 60, 0, 0, 0]],
    roadside: [
      { k: 'autumn', w: 520, off: -1.9, first: 60, every: 7, jit: 0.8 },
      { k: 'autumn2', w: 520, off: 2.1, first: 64, every: 9, jit: 0.8 },
      { k: 'sign2', w: 520, off: 1.45, first: 130, every: 70, hit: true },
      { k: 'hay', w: 260, off: -1.25, first: 180, every: 50, hit: true },
    ],
  },
  {
    name: 'Valle Alto', gp: 'GP do México', laps: 5,
    theme: {
      skyTop: '#3f86d0', skyBottom: '#f0d9b0', fog: '#c7a882',
      grass: ['#a7a24e', '#9c9746'], rumble: ['#f2f2f2', '#1e7f45'], road: ['#6d6a66', '#66635f'], lane: '#e6e0d6',
      far: ['mesas', '#b8805a', '#c9946c'], near: ['hills', '#8f8a46', '#a19b52'], clouds: 2,
    },
    sections: [[0, 80, 0, 0, 0], [20, 30, 20, -4, 0], [0, 50, 0, 0, 0], [20, 20, 20, 6, 0], [20, 30, 20, -3, 15], [0, 60, 0, 0, 0],
      [25, 40, 25, 4, -15], [20, 30, 20, -6, 0], [0, 70, 0, 0, 0], [25, 30, 25, 2, 0], [0, 60, 0, 0, 0]],
    roadside: [
      { k: 'cactus', w: 220, off: -1.6, first: 80, every: 9, jit: 1.0 },
      { k: 'palm', w: 420, off: 2.0, first: 84, every: 13, jit: 0.6 },
      { k: 'rock', w: 380, off: -1.35, first: 130, every: 37, hit: true },
      { k: 'sign3', w: 520, off: 1.45, first: 160, every: 60, hit: true },
    ],
  },
];

// Decoração comum a todas as pistas: pórtico da largada, arquibancadas e placa do box.
const START_DECOR = [
  { k: 'gantry', w: 3000, off: 0, first: 3, every: 1, count: 1 },
  { k: 'stand', w: 1500, off: -2.3, first: 6, every: 12, count: 4 },
  { k: 'pitboard', w: 260, off: 1.95, first: 4, every: 1, count: 1 },
  { k: 'pitboard', w: 260, off: 1.95, first: 50, every: 1, count: 1 },
];
const PIT_START = 4, PIT_END = 55;
