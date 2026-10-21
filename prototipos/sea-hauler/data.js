// Sea Hauler — números do protótipo.
// POR QUE: são os placeholders da Parte 1 §17 do SeaHauler.md, os mesmos que o
// guia Unity põe nos assets GameConfig, WeaponDef, EnemyDef, AbilityDef e LegTypeDef.
// Mudar um número aqui é o equivalente a mudar o asset no Inspector.
(function (root) {
  'use strict';

  // GameConfig (guia Unity, Fase 2.1).
  const CONFIG = {
    shipBaseHull: 500,
    seaSpeed: 10,                // m/s: o ritmo de cruzeiro dos piratas (eles não acompanham o Pano cheio)
    sailAcceleration: 3,         // m/s²: quanto a velocidade do navio muda por segundo ao trocar as velas
    shipRadius: 1.6,             // m: raio de colisão do navio (rochedos)
    legLength: 900,              // m
    laneHalfWidth: 6,            // m: largura da área dos barris de pólvora
    enemyDespawnDistance: 40,    // m: quem fica mais longe que isso do navio sai do jogo, sem ouro
    spawnBudgetBase: 0.4,       // pontos/s
    spawnBudgetPerDifficulty: 0.15,
    spawnDistanceMin: 20,        // m: inimigos nascem a esta distância do navio
    spawnDistanceMax: 26,
    bossSpawnAtProgress: 0.3,
    startingGold: 100,
    sellRefund: 0.5,
    routeLayers: 6,              // inclui o trecho do chefe
    minNodesPerLayer: 2,
    maxNodesPerLayer: 3,
    portChance: 0.25,            // chance de uma camada do meio ter um Porto
    goldBonusPerRisk: 0.25,
    carryHullBetweenLegs: true,  // Definido: o casco só volta no Porto (e devagar, com a Tripulação)
    bossBlocksArrival: true,     // Em aberto (Parte 1 §8)
  };

  // As 3 posições das velas (Parte 1 §3). O jogador troca em tempo real.
  // A velocidade do Pano cheio sobe com o Velame.
  const SAILS = [
    { id: 'reefed', name: 'Rizadas',    short: 'Devagar: mais combate, rochedos doem menos', speed: 6 },
    { id: 'half',   name: 'Meio pano',  short: 'O ritmo dos piratas',                         speed: 10 },
    { id: 'full',   name: 'Pano cheio', short: 'Foge de quem vem por trás',                    speed: 13 },
  ];
  const START_SAIL = 1;

  // Melhorias do próprio navio (Parte 1 §5), em níveis, compradas com ouro.
  const COPPER = {        // Forro de cobre: + casco máximo e − dano de colisão
    maxLevel: 5, costPerLevel: 50,   // nível n custa 50 × n
    hullPerLevel: 50,                // + casco máximo (e cura o mesmo tanto)
    collisionReductionPerLevel: 0.12, // − dano de colisão (rochedos e brulotes)
  };
  const RIGGING = {       // Velame: Pano cheio mais rápido
    maxLevel: 3, costPerLevel: 60, fullSpeedPerLevel: 1.5,
  };
  const CREW = {          // Tripulação: carpinteiros que consertam o casco durante o trecho
    maxLevel: 3, costPerLevel: 60, repairPerSecondPerLevel: 0.2,
  };
  const GUNPORTS = {      // Portinholas: abrir as que começam fechadas
    costs: [60, 80, 100, 120],       // a 1ª aberta custa 60, a 2ª 80...
  };

  // Porto (Parte 1 §10): nó sem combate onde se repara o casco.
  const PORT = {
    hullPerGold: 2,                  // 1 de ouro repara 2 de casco
  };

  // Rochedos (Parte 1 §9): só nos Recifes. Não podem ser destruídos.
  const ROCKS = {
    perSecond: 0.4,                  // quantos aparecem por segundo de viagem a Meio pano
    aheadMin: 34, aheadMax: 42,      // m à frente do navio
    lateralSpread: 16,               // m para cada lado
    radiusMin: 0.8, radiusMax: 2.2,
    damagePerRadius: 16,             // dano = 16 × raio × (velocidade / ritmo do mar)
  };

  // Rajadas (Parte 1 §9): só na Tempestade. Pegam o navio de Pano cheio e rasgam as velas.
  const SQUALLS = {
    intervalMin: 9, intervalMax: 13, // s entre uma rajada e outra
    warning: 2.5,                    // s de aviso antes de bater
    tornSeconds: 8,                  // velas rasgadas: o navio fica em Rizadas
    damage: 20,                      // dano no casco quando rasga
  };

  // Tipos de trecho (Parte 1 §9): o padrão de ataque e o risco de cada um.
  // spawnArc: de onde os inimigos vêm, em graus em volta do navio (0 = frente, 180 = trás).
  const LEG_TYPES = {
    open:  { id: 'open',  name: 'Mar aberto',     short: 'Perseguição por trás',             risk: 0, spawnArc: [145, 215], rocks: false, squalls: false, spawnMult: 1 },
    reefs: { id: 'reefs', name: 'Recifes',        short: 'Emboscada pela frente, rochedos',  risk: 1, spawnArc: [-110, 110], rocks: true,  squalls: false, spawnMult: 1 },
    cove:  { id: 'cove',  name: 'Enseada pirata', short: 'Cerco de todos os lados',          risk: 2, spawnArc: [0, 360],   rocks: false, squalls: false, spawnMult: 1 },
    storm: { id: 'storm', name: 'Tempestade',     short: 'Rajadas rasgam o Pano cheio',      risk: 1, spawnArc: [100, 260], rocks: false, squalls: true,  spawnMult: 0.6 },
  };
  const LEG_TYPE_ORDER = ['open', 'reefs', 'cove', 'storm'];
  const BOSS_LEG_TYPE = 'open';  // placeholder: o último trecho é perseguição por trás

  // As 8 portinholas (Parte 1 §4). offset em metros a partir do centro do navio;
  // facing em graus (0 frente, 90 bombordo/esquerda, -90 estibordo/direita, 180 trás).
  // Nenhuma cobre 360°. As bordadas (3 de cada lado) são o forte do navio.
  // open: começa aberta; as outras se abrem com ouro (Portinholas).
  const GUNPORT_LIST = [
    { id: 'proa', label: 'Proa (caça-proa)',   offset: [3.2, 0],     facing: 0,   arc: 180, open: true },
    { id: 'bb1',  label: 'Bombordo frente',    offset: [1.7, 1.0],   facing: 90,  arc: 180, open: false },
    { id: 'bb2',  label: 'Bombordo meio',      offset: [0.1, 1.0],   facing: 90,  arc: 180, open: true },
    { id: 'bb3',  label: 'Bombordo trás',      offset: [-1.5, 1.0],  facing: 90,  arc: 180, open: false },
    { id: 'eb1',  label: 'Estibordo frente',   offset: [1.7, -1.0],  facing: -90, arc: 180, open: false },
    { id: 'eb2',  label: 'Estibordo meio',     offset: [0.1, -1.0],  facing: -90, arc: 180, open: true },
    { id: 'eb3',  label: 'Estibordo trás',     offset: [-1.5, -1.0], facing: -90, arc: 180, open: false },
    { id: 'popa', label: 'Popa (caça-popa)',   offset: [-3.1, 0],    facing: 180, arc: 180, open: true },
  ];

  // WeaponDef (guia Unity, Fase 4.1).
  const WEAPONS = {
    longgun: {
      id: 'longgun', kind: 'longgun', name: 'Canhão longo', short: 'Bala redonda, longe, um alvo',
      cost: 40, upgradeCostPerLevel: 40, maxLevel: 3,
      range: 10, damage: 20, fireInterval: 0.5, bonusPerLevel: 0.35,
      unlockAtBestLegs: 0,
    },
    carronade: {
      id: 'carronade', kind: 'carronade', name: 'Carronada', short: 'Metralha curta em cone',
      cost: 60, upgradeCostPerLevel: 60, maxLevel: 3,
      range: 4.5, damage: 30, fireInterval: 0.9, coneDegrees: 60, bonusPerLevel: 0.35,
      unlockAtBestLegs: 1,
    },
    chainshot: {
      id: 'chainshot', kind: 'chainshot', name: 'Bala encadeada', short: 'Rasga velas, inimigo fica para trás',
      cost: 70, upgradeCostPerLevel: 70, maxLevel: 3,
      range: 12, damage: 35, fireInterval: 3, tearSeconds: 3, bonusPerLevel: 0.35,
      unlockAtBestLegs: 3,
    },
    marines: {
      id: 'marines', kind: 'marines', name: 'Fuzileiros', short: 'Mosquetes em quem encosta',
      cost: 50, upgradeCostPerLevel: 50, maxLevel: 3,
      range: 3, damage: 15, bonusPerLevel: 0.35,
      unlockAtBestLegs: 0,
    },
  };
  const WEAPON_ORDER = ['longgun', 'carronade', 'chainshot', 'marines'];

  // EnemyDef (guia Unity, Fase 3.1). postDistance: a que distância do navio o inimigo
  // fica rondando, do lado de onde veio.
  // approach é a velocidade de APROXIMAÇÃO, relativa ao ritmo do mar: os piratas navegam a
  // seaSpeed e só se aproximam com esta sobra. Com Pano cheio o navio passa desse ritmo,
  // e quem vem por trás com pouca sobra fica para trás (fugiu: sem ouro).
  const ENEMIES = {
    schooner: {
      kind: 'schooner', name: 'Escuna pirata', maxHp: 30, approach: 6, damage: 4, fireInterval: 1,
      isShip: true, tearable: true, goldReward: 8, spawnCost: 1, minDifficulty: 0,
      postDistance: 5, attackDistance: 1.5,
    },
    fireship: {
      kind: 'fireship', name: 'Brulote', maxHp: 50, approach: 8, damage: 45, contactRadius: 2,
      isShip: true, tearable: true, goldReward: 12, spawnCost: 2, minDifficulty: 1, collision: true,
    },
    sloop: {
      kind: 'sloop', name: 'Chalupa de abordagem', maxHp: 80, approach: 4,
      isShip: true, tearable: true, goldReward: 15, spawnCost: 3, minDifficulty: 2,
      spawn: 'boarder', spawnCount: 2, spawnInterval: 2, postDistance: 2.8,
    },
    boarder: {
      kind: 'boarder', name: 'Pirata a bordo', maxHp: 20, approach: 0, damage: 6,
      isShip: false, tearable: false, goldReward: 3,
    },
    galleon: {
      kind: 'galleon', name: 'Galeão pirata', maxHp: 1500, approach: 2, damage: 15, fireInterval: 1.5,
      isShip: true, tearable: false, goldReward: 150,
      spawn: 'schooner', spawnInterval: 6, postDistance: 7, attackDistance: 1.5,
    },
  };
  const ENEMY_POOL = ['schooner', 'fireship', 'sloop'];

  // AbilityDef (guia Unity, Fase 6.1). Placeholders: a lista está Em aberto (Parte 1 §7).
  const ABILITIES = [
    { id: 'barrels', kind: 'barrels', name: 'Barris', cooldown: 15, duration: 5, damage: 40, tear: 1.5, size: 4, dropBehind: 5 },
    { id: 'broadside', kind: 'broadside', name: 'Bordada', cooldown: 25, duration: 4, magnitude: 2 },
  ];

  const DATA = {
    CONFIG, SAILS, START_SAIL, COPPER, RIGGING, CREW, GUNPORTS, PORT, ROCKS, SQUALLS,
    LEG_TYPES, LEG_TYPE_ORDER, BOSS_LEG_TYPE, GUNPORT_LIST, WEAPONS, WEAPON_ORDER,
    ENEMIES, ENEMY_POOL, ABILITIES,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.SEA_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
