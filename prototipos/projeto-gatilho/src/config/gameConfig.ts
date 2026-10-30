// src/config/gameConfig.ts
// POR QUE: todo número de jogo num lugar só; balancear é mexer aqui (§11).
// Valores marcados como placeholder no GDD.
export const GAME = {
  view: { width: 960, height: 540 },
  input: {
    stickDeadzone: 0.25,     // analógico abaixo disso conta como solto
    triggerThreshold: 0.5,   // R2 é analógico: acima disso conta como segurado
  },
  hero: {
    radius: 14, speed: 220, maxHp: 100,
    hurtInvuln: 0.5,                              // invulnerável depois de levar dano (s)
    dashSpeed: 600, dashTime: 0.15, dashCooldown: 0.6,
  },
  basic: { damage: 10, range: 40, halfAngle: Math.PI / 4, cooldown: 0.35 },
  combat: { singleAimHalfAngle: (35 * Math.PI) / 180 }, // cone da busca de alvo individual (§2.5)
  enemies: {
    grunt: { hp: 30, radius: 12, speed: 90, contactDamage: 10, attackCooldown: 1 },
    brute: { hp: 90, radius: 18, speed: 60, contactDamage: 20, attackCooldown: 1.5 },
    boss: { hp: 600, radius: 32, speed: 70, contactDamage: 25, attackCooldown: 1.2 },
  },
} as const;

export type EnemyKind = keyof typeof GAME.enemies;
