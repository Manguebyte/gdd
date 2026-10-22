// Testes com o Rapier de verdade, sem tela: o mesmo PhysicsManager do jogo.
import { beforeAll, describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../src/config/gameConfig';
import { makeEquilateralTriangle } from '../src/core/geometry';
import { rackPositions } from '../src/core/rack';
import { findCapturedStakes } from '../src/core/ScoringSystem';
import { shotImpulse, yawTowards } from '../src/core/shot';
import type { ShotParams } from '../src/core/types';
import { initPhysics, PhysicsManager } from '../src/physics/PhysicsManager';

const cfg = GAME_CONFIG;
const center = { x: cfg.triangle.centerX, z: cfg.triangle.centerZ };
const tri = makeEquilateralTriangle(center, cfg.triangle.side);
// Perto da tábua do jogador, com a arena inteira pela frente.
const START_Z = cfg.arena.depth / 2 - 5;

function setup() {
  const physics = new PhysicsManager(cfg);
  const stakes = rackPositions(cfg.stakes.count, center, cfg.marble.radius * 2 + cfg.stakes.gap);
  stakes.forEach((p, i) => physics.addMarble(`stake-${i}`, p));
  physics.addMarble('shooter', { x: cfg.shooter.startX, z: cfg.shooter.startZ });
  return { physics, stakeIds: stakes.map((_, i) => `stake-${i}`) };
}

function runShot(physics: PhysicsManager, params: ShotParams): number {
  physics.applyImpulse('shooter', shotImpulse(params, cfg.shot.maxImpulse, cfg.shot.maxPitchDeg));
  const maxSteps = cfg.turn.maxShotSeconds / cfg.physics.timeStep;
  let steps = 0;
  while (!physics.isSettled() && steps < maxSteps) {
    physics.stepOnce();
    steps++;
  }
  return steps * cfg.physics.timeStep;
}

function settleRack(physics: PhysicsManager) {
  for (let i = 0; i < 60; i++) physics.stepOnce();
}

const aimAtRack: ShotParams = {
  yawDeg: yawTowards({ x: cfg.shooter.startX, z: cfg.shooter.startZ }, center),
  power: 1,
  pitchDeg: 0,
};

beforeAll(async () => {
  await initPhysics();
});

describe('física do Marco 1', () => {
  it('casadas paradas continuam paradas e dentro do triângulo', () => {
    const { physics, stakeIds } = setup();
    settleRack(physics);
    for (let i = 0; i < 240; i++) physics.stepOnce();
    expect(physics.isSettled()).toBe(true);
    const stakes = stakeIds.map((id) => ({ id, position: physics.getGroundPosition(id)! }));
    expect(findCapturedStakes(stakes, tri, cfg.marble.radius)).toEqual([]);
    physics.dispose();
  });

  it('um tiro forte no triângulo tira casadas inteiras para fora', () => {
    const { physics, stakeIds } = setup();
    settleRack(physics);
    const seconds = runShot(physics, aimAtRack);
    expect(physics.isSettled()).toBe(true);
    expect(seconds).toBeLessThan(cfg.turn.maxShotSeconds);
    const stakes = stakeIds.map((id) => ({ id, position: physics.getGroundPosition(id)! }));
    const captured = findCapturedStakes(stakes, tri, cfg.marble.radius);
    console.log(`tiro cheio: ${captured.length} capturadas em ${seconds.toFixed(2)} s`);
    expect(captured.length).toBeGreaterThan(0);
    physics.dispose();
  });

  it('nenhuma bolinha escapa da arena nem atravessa o chão', () => {
    const { physics, stakeIds } = setup();
    settleRack(physics);
    runShot(physics, { ...aimAtRack, pitchDeg: 30 });
    const hw = cfg.arena.width / 2;
    const hd = cfg.arena.depth / 2;
    for (const id of [...stakeIds, 'shooter']) {
      const p = physics.getPosition(id)!;
      expect(Math.abs(p.x)).toBeLessThanOrEqual(hw);
      expect(Math.abs(p.z)).toBeLessThanOrEqual(hd);
      expect(p.y).toBeGreaterThan(0);
    }
    physics.dispose();
  });

  it('tiro mais forte vai mais longe', () => {
    const distances = [0.2, 0.4].map((power) => {
      const physics = new PhysicsManager(cfg);
      physics.addMarble('shooter', { x: 0, z: START_Z });
      runShot(physics, { yawDeg: 0, power, pitchDeg: 0 });
      const d = START_Z - physics.getPosition('shooter')!.z;
      physics.dispose();
      return d;
    });
    console.log(`distância com 20%: ${distances[0].toFixed(1)} cm, com 40%: ${distances[1].toFixed(1)} cm`);
    expect(distances[1]).toBeGreaterThan(distances[0] * 1.5);
  });

  it('o mesmo tiro dá o mesmo resultado (passo fixo)', () => {
    const results = [0, 1].map(() => {
      const { physics, stakeIds } = setup();
      settleRack(physics);
      runShot(physics, { ...aimAtRack, yawDeg: aimAtRack.yawDeg + 1.3, power: 0.8 });
      const out = [...stakeIds, 'shooter'].map((id) => physics.getPosition(id)!);
      physics.dispose();
      return out;
    });
    expect(results[0]).toEqual(results[1]);
  });

  it('com ângulo vertical a bolinha sai do chão e volta', () => {
    const physics = new PhysicsManager(cfg);
    physics.addMarble('shooter', { x: 0, z: START_Z });
    physics.applyImpulse('shooter', shotImpulse({ yawDeg: 0, power: 0.5, pitchDeg: 40 }, cfg.shot.maxImpulse, cfg.shot.maxPitchDeg));
    let maxY = 0;
    for (let i = 0; i < 600; i++) {
      physics.stepOnce();
      maxY = Math.max(maxY, physics.getPosition('shooter')!.y);
    }
    console.log(`altura máxima com 40° e 50%: ${maxY.toFixed(1)} cm`);
    expect(maxY).toBeGreaterThan(cfg.marble.radius + 2);
    expect(physics.getPosition('shooter')!.y).toBeLessThan(cfg.marble.radius + 0.1);
    physics.dispose();
  });
});
