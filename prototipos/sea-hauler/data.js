// Sea Hauler — números do protótipo.
// POR QUE: são os placeholders da Parte 1 §17 do SeaHauler.md, os mesmos que o
// guia Unity põe nos assets GameConfig, WeaponDef, EnemyDef, AbilityDef e LegTypeDef.
// Mudar um número aqui é o equivalente a mudar o asset no Inspector.
(function (root) {
  'use strict';

  // GameConfig (guia Unity, Fase 2.1).
  const CONFIG = {
    seaSpeed: 10,                // m/s: o ritmo de cruzeiro dos piratas (eles não acompanham o Pano cheio)
    sailAcceleration: 3,         // m/s²: quanto a velocidade do navio muda por segundo ao trocar as velas
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
    portChance: 0.4,             // chance de uma camada do meio ter um Porto
    goldBonusPerRisk: 0.25,
    carryHullBetweenLegs: true,  // Definido: o casco só volta no Porto (e devagar, com a Tripulação)
    bossBlocksArrival: true,     // Em aberto (Parte 1 §8)
  };

  // As 3 posições das velas (Parte 1 §3). O jogador troca em tempo real.
  // A velocidade de cada posição vem da classe do navio (SHIPS); o Pano cheio sobe com o Velame.
  const SAILS = [
    { id: 'reefed', name: 'Rizadas',    short: 'Devagar: mais combate, rochedos doem menos' },
    { id: 'half',   name: 'Meio pano',  short: 'Perto do ritmo dos piratas' },
    { id: 'full',   name: 'Pano cheio', short: 'Foge de quem vem por trás' },
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

  // Porto (Parte 1 §10): nó sem combate onde se repara o casco e se troca de navio.
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

  // As classes de navio (Parte 1 §3): a run começa na Corveta, e no Porto dá para
  // comprar uma classe maior (as armas voltam como ouro, as melhorias continuam).
  // O maior aguenta e atira mais, mas corre menos: fugir fica mais difícil.
  // gunports: offset em metros a partir do centro do navio; facing em graus (0 frente,
  // 90 bombordo/esquerda, -90 estibordo/direita, 180 trás). Nenhuma cobre 360°.
  // open: começa aberta; as outras se abrem com ouro (Portinholas).
  // draw: medidas do desenho vetorial (o protótipo) e os sprites PixelLab da classe.
  const port = (id, label, x, y, facing, open) => ({ id, label, offset: [x, y], facing, arc: 180, open });
  const SHIPS = {
    corvette: {
      id: 'corvette', name: 'Corveta', short: 'Rápida e leve: foge bem, aguenta pouco',
      cost: 0, hull: 350, radius: 1.3, speeds: [7, 11, 15],
      gunports: [
        port('proa', 'Proa (caça-proa)', 2.6, 0, 0, true),
        port('bb1', 'Bombordo frente', 0.9, 0.8, 90, false),
        port('bb2', 'Bombordo trás', -0.7, 0.8, 90, true),
        port('eb1', 'Estibordo frente', 0.9, -0.8, -90, false),
        port('eb2', 'Estibordo trás', -0.7, -0.8, -90, true),
        port('popa', 'Popa (caça-popa)', -2.5, 0, 180, true),
      ],
      draw: { L: 5.4, W: 1.5, H: 12, masts: [{ x: 1.6, h: 62 }, { x: 0.2, h: 70 }, { x: -1.2, h: 54 }], yard: 1.1, hullSprite: 'corvette', rigSprite: 'corvette-rig' },
    },
    frigate: {
      id: 'frigate', name: 'Fragata', short: 'O meio-termo',
      cost: 250, hull: 500, radius: 1.6, speeds: [6, 10, 13],
      gunports: [
        port('proa', 'Proa (caça-proa)', 3.2, 0, 0, true),
        port('bb1', 'Bombordo frente', 1.7, 1.0, 90, false),
        port('bb2', 'Bombordo meio', 0.1, 1.0, 90, true),
        port('bb3', 'Bombordo trás', -1.5, 1.0, 90, false),
        port('eb1', 'Estibordo frente', 1.7, -1.0, -90, false),
        port('eb2', 'Estibordo meio', 0.1, -1.0, -90, true),
        port('eb3', 'Estibordo trás', -1.5, -1.0, -90, false),
        port('popa', 'Popa (caça-popa)', -3.1, 0, 180, true),
      ],
      draw: { L: 6.8, W: 1.9, H: 14, masts: [{ x: 2.3, h: 74 }, { x: 0.8, h: 84 }, { x: -0.8, h: 64 }], yard: 1.3, hullSprite: 'ship', rigSprite: 'rig' },
    },
    lineship: {
      id: 'lineship', name: 'Navio de linha', short: 'Aguenta muito, mas é lento',
      cost: 450, hull: 800, radius: 2.0, speeds: [5, 9, 11.5],
      gunports: [
        port('proa', 'Proa (caça-proa)', 4.0, 0, 0, true),
        port('bb1', 'Bombordo 1', 2.4, 1.2, 90, false),
        port('bb2', 'Bombordo 2', 0.8, 1.2, 90, true),
        port('bb3', 'Bombordo 3', -0.8, 1.2, 90, true),
        port('bb4', 'Bombordo 4', -2.4, 1.2, 90, false),
        port('eb1', 'Estibordo 1', 2.4, -1.2, -90, false),
        port('eb2', 'Estibordo 2', 0.8, -1.2, -90, true),
        port('eb3', 'Estibordo 3', -0.8, -1.2, -90, true),
        port('eb4', 'Estibordo 4', -2.4, -1.2, -90, false),
        port('popa', 'Popa (caça-popa)', -3.9, 0, 180, true),
      ],
      draw: { L: 8.4, W: 2.3, H: 18, masts: [{ x: 2.9, h: 86 }, { x: 1.0, h: 96 }, { x: -1.1, h: 76 }], yard: 1.6, hullSprite: 'line', rigSprite: 'line-rig' },
    },
  };
  const SHIP_ORDER = ['corvette', 'frigate', 'lineship'];
  const START_SHIP = 'corvette';

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
    LEG_TYPES, LEG_TYPE_ORDER, BOSS_LEG_TYPE, SHIPS, SHIP_ORDER, START_SHIP, WEAPONS, WEAPON_ORDER,
    ENEMIES, ENEMY_POOL, ABILITIES,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.SEA_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
