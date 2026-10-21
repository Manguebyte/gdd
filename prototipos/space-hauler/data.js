// Space Hauler — números do protótipo.
// POR QUE: são os placeholders da Parte 1 §16 do SpaceHauler.md, os mesmos que o
// guia Unity põe nos assets GameConfig, DefenseDef, EnemyDef, AbilityDef e TripTypeDef.
// Mudar um número aqui é o equivalente a mudar o asset no Inspector.
(function (root) {
  'use strict';

  // GameConfig (guia Unity, Fase 2.1).
  const CONFIG = {
    shipBaseHull: 500,
    shipSpeed: 10,               // m/s
    shipRadius: 1.6,             // m: raio de colisão da nave (asteroides)
    tripLength: 900,             // m
    laneHalfWidth: 6,            // m: largura da nuvem de detritos (não há estrada no espaço)
    enemyDespawnDistance: 40,    // m: quem se afasta mais que isso da nave sai do jogo, sem sucata
    spawnBudgetBase: 0.25,       // pontos/s
    spawnBudgetPerDifficulty: 0.1,
    spawnDistanceMin: 20,        // m: inimigos nascem a esta distância da nave
    spawnDistanceMax: 26,
    bossSpawnAtProgress: 0.3,
    startingScrap: 100,
    sellRefund: 0.5,
    routeLayers: 6,              // inclui o trecho do chefe
    minNodesPerLayer: 2,
    maxNodesPerLayer: 3,
    stationChance: 0.25,         // chance de uma camada do meio ter uma Estação
    scrapBonusPerRisk: 0.25,
    carryHullBetweenTrips: true, // Definido: o casco não volta sozinho (só na Estação)
    bossBlocksArrival: true,     // Em aberto (Parte 1 §7)
  };

  // Carenagem (Parte 1 §3): upgrade da própria nave, em níveis, comprado com sucata.
  const PLATING = {
    desc: 'Blindagem da nave: cada nível dá +50 de casco máximo (e cura 50) e reduz em 12% o dano de colisão (asteroides e drones kamikaze).',
    maxLevel: 5,
    costPerLevel: 50,             // nível n custa 50 × n
    hullPerLevel: 50,             // + casco máximo (e cura o mesmo tanto, como um upgrade de vida)
    collisionReductionPerLevel: 0.12, // − dano de colisão (asteroides e drones kamikaze)
  };

  // Estação (Parte 1 §9): nó sem combate onde se repara o casco.
  const STATION = {
    hullPerScrap: 2,              // 1 de sucata repara 2 de casco
  };

  // Asteroides (Parte 1 §8): só no Cinturão de asteroides. Só as defesas de mineração
  // (laser de mineração e canhão de fragmentação) conseguem destruí-los.
  const ASTEROIDS = {
    perSecond: 0.4,               // quantos aparecem por segundo, à frente da nave
    aheadMin: 34, aheadMax: 42,   // m à frente da nave
    lateralSpread: 16,            // m para cada lado
    radiusMin: 0.8, radiusMax: 2.2,
    damagePerRadius: 16,          // dano = 16 × raio (um médio, raio 1,5, tira 24)
    hpPerRadius: 30,              // vida = 30 × raio (um médio tem 45)
    scrapPerRadius: 2,            // sucata ao destruir = 2 × raio, arredondado
  };

  // Anexos (Parte 1 §3): módulos presos à nave, fora dos hardpoints, comprados com sucata a
  // qualquer momento da run. O nível n custa costPerLevel × n.
  const ANNEXES = {
    shield: {
      id: 'shield', name: 'Gerador de escudo', maxLevel: 3, costPerLevel: 80,
      shieldPerLevel: 60,         // pontos de escudo por nível
      regenPerSecond: 12,         // recarga, depois de regenDelay segundos sem levar dano
      regenDelay: 3,
      desc: 'Escudo de energia que absorve o dano antes do casco: tiros, drones e asteroides (piratas a bordo já estão dentro dele). Recarrega sozinho depois de alguns segundos sem levar dano e enche no começo de cada trecho.',
    },
    podFront: {
      id: 'podFront', name: 'Casulo dianteiro', maxLevel: 1, costPerLevel: 120,
      desc: 'Casulo de armas preso nas diagonais da frente: +2 hardpoints, um de cada lado, que atiram para a frente e para o lado.',
      hardpoints: [
        { id: 'cdBb', label: 'Casulo dianteiro (bombordo)',  offset: [2.2, 2.4],   facing: 45,   arc: 180 },
        { id: 'cdEb', label: 'Casulo dianteiro (estibordo)', offset: [2.2, -2.4],  facing: -45,  arc: 180 },
      ],
    },
    podRear: {
      id: 'podRear', name: 'Casulo traseiro', maxLevel: 1, costPerLevel: 120,
      desc: 'Casulo de armas preso nas diagonais de trás: +2 hardpoints, um de cada lado, que atiram para trás e para o lado.',
      hardpoints: [
        { id: 'ctBb', label: 'Casulo traseiro (bombordo)',  offset: [-2.6, 2.4],  facing: 135,  arc: 180 },
        { id: 'ctEb', label: 'Casulo traseiro (estibordo)', offset: [-2.6, -2.4], facing: -135, arc: 180 },
      ],
    },
  };
  const ANNEX_ORDER = ['shield', 'podFront', 'podRear'];

  // Piloto (Parte 1 §3): upgrade da tripulação, em níveis. Cada nível deixa a nave mais rápida
  // e faz o piloto desviar sozinho dos asteroides que estão no caminho. O jogador continua sem
  // controlar a nave: quem desvia é o piloto.
  const PILOT = {
    maxLevel: 3, costPerLevel: 60,
    speedPerLevel: 0.1,           // +10% de velocidade de cruzeiro por nível
    dodgeSpeedPerLevel: 1.5,      // m/s de deslize lateral por nível (1,5 / 3 / 4,5)
    lookAhead: 16,                // m: até onde o piloto enxerga asteroides à frente
    margin: 0.5,                  // m de folga além do raio da rocha + raio da nave
    maxOffset: 5,                 // m: o máximo que ele sai do centro da rota
    desc: 'O piloto desvia sozinho dos asteroides que vão bater na nave e voa mais rápido. Cada nível desvia mais depressa. Mais rápido também quer dizer trechos mais curtos: menos inimigos e menos sucata.',
  };

  // Tipos de trecho (Parte 1 §8): o padrão de ataque e o risco de cada um.
  // spawnArc: de onde os inimigos vêm, em graus em volta da nave (0 = frente, 180 = trás).
  const TRIP_TYPES = {
    open:      { id: 'open',      name: 'Espaço aberto',          short: 'Perseguição por trás',     risk: 0, spawnArc: [145, 215], asteroids: false },
    asteroids: { id: 'asteroids', name: 'Cinturão de asteroides', short: 'Emboscada pela frente',    risk: 1, spawnArc: [-110, 110], asteroids: true },
    pirate:    { id: 'pirate',    name: 'Rota pirata',            short: 'Cerco de todos os lados',  risk: 2, spawnArc: [0, 360], asteroids: false },
  };
  const TRIP_TYPE_ORDER = ['open', 'asteroids', 'pirate'];
  const BOSS_TRIP_TYPE = 'open';  // placeholder: o último trecho é perseguição por trás

  // Os 6 hardpoints (Parte 1 §3). offset em metros a partir do centro da nave;
  // facing em graus (0 frente, 90 bombordo/esquerda, -90 estibordo/direita, 180 trás).
  // Nenhum cobre 360°: o jogador sempre fica com um lado mais fraco.
  const HARDPOINTS = [
    { id: 'proa',  label: 'Proa',              offset: [3, 0],      facing: 0,   arc: 180 },
    { id: 'bbFr',  label: 'Bombordo frente',   offset: [1.2, 1.3],  facing: 90,  arc: 180 },
    { id: 'bbTr',  label: 'Bombordo trás',     offset: [-1.2, 1.3], facing: 90,  arc: 180 },
    { id: 'ebFr',  label: 'Estibordo frente',  offset: [1.2, -1.3], facing: -90, arc: 180 },
    { id: 'ebTr',  label: 'Estibordo trás',    offset: [-1.2, -1.3], facing: -90, arc: 180 },
    { id: 'popa',  label: 'Popa',              offset: [-3, 0],     facing: 180, arc: 180 },
  ];

  // DefenseDef (guia Unity, Fase 4.9).
  const DEFENSES = {
    cannon: {
      id: 'cannon', kind: 'cannon', name: 'Autocanhão', button: 'Autocanhão', short: 'Tiro rápido, um alvo',
      desc: 'Rajada rápida no inimigo mais perto dentro do arco. A defesa padrão: boa contra caças e drones. Não acerta asteroides.',
      cost: 40, upgradeCostPerLevel: 40, maxLevel: 3,
      range: 9, damage: 6, fireInterval: 0.15, bonusPerLevel: 0.35,
      unlockAtBestTrips: 0,
    },
    plasma: {
      id: 'plasma', kind: 'plasma', name: 'Canhão de plasma', button: 'Plasma', short: 'Cone curto, queima vários',
      desc: 'Jato de plasma num cone curto que queima todos os inimigos dentro dele ao mesmo tempo. Ótimo contra quem encosta na nave. Não acerta asteroides.',
      cost: 60, upgradeCostPerLevel: 60, maxLevel: 3,
      range: 4.5, damage: 35, coneDegrees: 60, bonusPerLevel: 0.35,
      unlockAtBestTrips: 1,
    },
    harpoon: {
      id: 'harpoon', kind: 'harpoon', name: 'Arpão magnético', button: 'Arpão', short: 'Atordoa naves',
      desc: 'Arpão lento e forte que prende uma nave inimiga: ela fica atordoada, perde o embalo e fica para trás. Só acerta naves.',
      cost: 70, upgradeCostPerLevel: 70, maxLevel: 3,
      range: 12, damage: 40, fireInterval: 3, stunSeconds: 2.5, bonusPerLevel: 0.35,
      unlockAtBestTrips: 3,
    },
    field: {
      id: 'field', kind: 'field', name: 'Campo elétrico', button: 'Campo elétrico', short: 'Choque em quem encosta',
      desc: 'Passivo: dá choque contínuo em tudo que chega perto do hardpoint, inclusive nos piratas a bordo. Não acerta asteroides.',
      cost: 50, upgradeCostPerLevel: 50, maxLevel: 3,
      range: 2.5, damage: 15, bonusPerLevel: 0.35,
      unlockAtBestTrips: 0,
    },
    // Defesas de mineração (Parte 1 §4): as únicas que destroem asteroides.
    laser: {
      id: 'laser', kind: 'laser', name: 'Laser de mineração', button: 'Laser', short: 'Quebra asteroides',
      desc: 'Feixe contínuo feito para quebrar asteroides: mira primeiro na rocha que vai bater na nave. Sem rocha por perto, atira nas naves, com dano baixo.',
      cost: 55, upgradeCostPerLevel: 55, maxLevel: 3,
      range: 14, damage: 8, asteroidDamage: 60, bonusPerLevel: 0.35,
      unlockAtBestTrips: 0,
    },
    flak: {
      id: 'flak', kind: 'flak', name: 'Canhão de fragmentação', button: 'Fragmentação', short: 'Explode em área',
      desc: 'Projétil que explode em área: quebra asteroides e acerta todas as naves perto da explosão. Lento, mas pega um grupo inteiro.',
      cost: 65, upgradeCostPerLevel: 65, maxLevel: 3,
      range: 13, damage: 30, fireInterval: 1.2, blastRadius: 2, bonusPerLevel: 0.35,
      unlockAtBestTrips: 2,
    },
  };
  const DEFENSE_ORDER = ['cannon', 'plasma', 'harpoon', 'field', 'laser', 'flak'];

  // EnemyDef (guia Unity, Fase 3.9). postDistance: a que distância da nave o inimigo
  // fica rondando, do lado de onde veio.
  // speed é a velocidade de APROXIMAÇÃO, relativa à nave: os piratas acompanham a velocidade
  // de cruzeiro do comboio e só se aproximam com esta sobra (os mesmos 6, 8, 4 e 2 m/s
  // relativos do Fury Hauler). Assim quem vem pela frente não chega rápido demais.
  const ENEMIES = {
    fighter: {
      kind: 'fighter', name: 'Caça pirata', maxHp: 30, speed: 6, damage: 4, fireInterval: 1,
      isShip: true, stunnable: true, scrapReward: 8, spawnCost: 1, minDifficulty: 0,
      postDistance: 4.5, attackDistance: 1.5,
    },
    drone: {
      kind: 'drone', name: 'Drone kamikaze', maxHp: 50, speed: 8, damage: 45, contactRadius: 1.8,
      isShip: true, stunnable: true, scrapReward: 12, spawnCost: 2, minDifficulty: 1, collision: true,
    },
    boarder: {
      kind: 'boarder', name: 'Nave de abordagem', maxHp: 80, speed: 4,
      isShip: true, stunnable: true, scrapReward: 15, spawnCost: 3, minDifficulty: 2,
      spawn: 'pirate', spawnCount: 2, spawnInterval: 2, postDistance: 2.6,
    },
    pirate: {
      kind: 'pirate', name: 'Pirata a bordo', maxHp: 20, speed: 0, damage: 6,
      isShip: false, stunnable: false, scrapReward: 3,
    },
    cruiser: {
      kind: 'cruiser', name: 'Cruzador pirata', maxHp: 1500, speed: 2, damage: 15, fireInterval: 1.5,
      isShip: true, stunnable: false, scrapReward: 150,
      spawn: 'fighter', spawnInterval: 6, postDistance: 6, attackDistance: 1.5,
    },
  };
  const ENEMY_POOL = ['fighter', 'drone', 'boarder'];

  // AbilityDef (guia Unity, Fase 6.5). Placeholders: a lista está Em aberto (Parte 1 §6).
  const ABILITIES = [
    { id: 'afterburner', kind: 'afterburner', name: 'Pós-combustor', cooldown: 20, duration: 4, magnitude: 1.6,
      desc: 'A nave acelera ×1,6 por 4 s e deixa para trás quem está perseguindo.' },
    { id: 'debris', kind: 'debris', name: 'Detritos', cooldown: 15, duration: 5, magnitude: 1.5, size: 4, dropBehind: 5,
      desc: 'Solta uma nuvem de sucata atrás da nave: as naves que a atravessam ficam atordoadas por 1,5 s.' },
  ];

  const DATA = {
    CONFIG, PLATING, STATION, ASTEROIDS, ANNEXES, ANNEX_ORDER, PILOT, TRIP_TYPES, TRIP_TYPE_ORDER, BOSS_TRIP_TYPE,
    HARDPOINTS, DEFENSES, DEFENSE_ORDER, ENEMIES, ENEMY_POOL, ABILITIES,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.SH_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
