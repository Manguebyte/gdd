// Fury Hauler — números do protótipo.
// POR QUE: são os placeholders da Parte 1 §15 do FuryHauler.md, os mesmos que o
// guia Unity põe nos assets GameConfig, DefenseDef, EnemyDef e AbilityDef.
// Mudar um número aqui é o equivalente a mudar o asset no Inspector.
(function (root) {
  'use strict';

  // GameConfig (guia Unity, Fase 2.1).
  const CONFIG = {
    truckMaxHp: 500,
    truckSpeed: 10,              // m/s
    maxDamageReduction: 0.6,
    tripLength: 900,             // m
    roadHalfWidth: 6,            // m
    enemyDespawnBehind: 35,      // m
    spawnBudgetBase: 0.25,       // pontos/s
    spawnBudgetPerDifficulty: 0.1,
    spawnBehindMin: 18,
    spawnBehindMax: 24,
    bossSpawnAtProgress: 0.3,
    startingScrap: 100,
    sellRefund: 0.5,
    routeLayers: 6,              // inclui o trecho do chefe
    minNodesPerLayer: 2,
    maxNodesPerLayer: 3,
    maxRisk: 2,
    scrapBonusPerRisk: 0.25,
    carryTruckHpBetweenTrips: true, // Em aberto (Parte 1 §3)
    bossBlocksArrival: true,        // Em aberto (Parte 1 §7)
  };

  // Os 6 slots placeholder (guia Unity, Fase 2.6). offset em metros a partir do
  // centro do caminhão; facing em graus (0 frente, 90 esquerda, -90 direita, 180 trás).
  const SLOTS = [
    { id: 'teto', label: 'Teto', offset: [0.5, 0], facing: 0, arc: 360 },
    { id: 'esqFrente', label: 'Esquerda frente', offset: [1.5, 1.2], facing: 90, arc: 180 },
    { id: 'esqTras', label: 'Esquerda trás', offset: [-1.5, 1.2], facing: 90, arc: 180 },
    { id: 'dirFrente', label: 'Direita frente', offset: [1.5, -1.2], facing: -90, arc: 180 },
    { id: 'dirTras', label: 'Direita trás', offset: [-1.5, -1.2], facing: -90, arc: 180 },
    { id: 'traseira', label: 'Traseira', offset: [-3, 0], facing: 180, arc: 180 },
  ];

  // DefenseDef (guia Unity, Fase 4.9).
  const DEFENSES = {
    mg: {
      id: 'mg', kind: 'mg', name: 'Metralhadora', short: 'Tiro rápido, um alvo',
      cost: 40, upgradeCostPerLevel: 40, maxLevel: 3,
      range: 9, damage: 6, fireInterval: 0.15, bonusPerLevel: 0.35,
      unlockAtBestTrips: 0,
    },
    flame: {
      id: 'flame', kind: 'flame', name: 'Lança-chamas', short: 'Cone curto, queima vários',
      cost: 60, upgradeCostPerLevel: 60, maxLevel: 3,
      range: 4.5, damage: 35, coneDegrees: 60, bonusPerLevel: 0.35,
      unlockAtBestTrips: 1,
    },
    harpoon: {
      id: 'harpoon', kind: 'harpoon', name: 'Arpão', short: 'Derruba veículos',
      cost: 70, upgradeCostPerLevel: 70, maxLevel: 3,
      range: 12, damage: 40, fireInterval: 3, stunSeconds: 2.5, bonusPerLevel: 0.35,
      unlockAtBestTrips: 3,
    },
    armor: {
      id: 'armor', kind: 'armor', name: 'Blindagem', short: '-10% de dano, espinhos',
      cost: 50, upgradeCostPerLevel: 50, maxLevel: 3,
      range: 2.5, damage: 15, damageReduction: 0.1, bonusPerLevel: 0.35,
      unlockAtBestTrips: 0,
    },
  };
  const DEFENSE_ORDER = ['mg', 'flame', 'harpoon', 'armor'];

  // EnemyDef (guia Unity, Fase 3.9). sideDistance vem do prefab de cada tipo.
  const ENEMIES = {
    biker: {
      kind: 'biker', name: 'Motoqueiro', maxHp: 30, speed: 16, damage: 4, fireInterval: 1,
      isVehicle: true, stunnable: true, scrapReward: 8, spawnCost: 1, minDifficulty: 0,
      sideDistance: 4, attackDistance: 1.5,
    },
    rammer: {
      kind: 'rammer', name: 'Carro-bomba', maxHp: 50, speed: 18, damage: 60, contactRadius: 1.8,
      isVehicle: true, stunnable: true, scrapReward: 12, spawnCost: 2, minDifficulty: 1,
    },
    boarder: {
      kind: 'boarder', name: 'Buggy de abordagem', maxHp: 80, speed: 14,
      isVehicle: true, stunnable: true, scrapReward: 15, spawnCost: 3, minDifficulty: 2,
      spawn: 'raider', spawnCount: 2, spawnInterval: 2, sideDistance: 2.2,
    },
    raider: {
      kind: 'raider', name: 'Saqueador', maxHp: 20, speed: 0, damage: 6,
      isVehicle: false, stunnable: false, scrapReward: 3,
    },
    boss: {
      kind: 'boss', name: 'Caminhão de guerra', maxHp: 1500, speed: 12, damage: 15, fireInterval: 1.5,
      isVehicle: true, stunnable: false, scrapReward: 150,
      spawn: 'biker', spawnInterval: 6, sideDistance: 5, attackDistance: 1.5,
    },
  };
  const ENEMY_POOL = ['biker', 'rammer', 'boarder'];

  // AbilityDef (guia Unity, Fase 6.5). Placeholders: a lista está Em aberto (Parte 1 §6).
  const ABILITIES = [
    { id: 'nitro', kind: 'nitro', name: 'Nitro', cooldown: 20, duration: 4, magnitude: 1.6 },
    { id: 'oil', kind: 'oil', name: 'Óleo', cooldown: 15, duration: 5, magnitude: 1.5, size: 4, dropBehind: 5 },
  ];

  const DATA = { CONFIG, SLOTS, DEFENSES, DEFENSE_ORDER, ENEMIES, ENEMY_POOL, ABILITIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.FH_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
