// src/core/targeting.ts
// POR QUE: decidir quem um golpe acerta é regra de jogo, e regra fica no Core, testada.
// ESTRATÉGIA: funções puras que recebem a origem, a direção da mira (tamanho 1) e a
// lista de alvos; um alvo é qualquer coisa com posição e raio (o raio conta: acertar a borda vale).
import type { Shape } from '../config/specials';
import { add, dist, dot, len, norm, scale, sub, type Vec2 } from './vec';

export interface Target { pos: Vec2; radius: number }

// Todos os alvos dentro de uma forma de área.
export function areaTargets<T extends Target>(shape: Shape, origin: Vec2, facing: Vec2, targets: readonly T[]): T[] {
  switch (shape.kind) {
    case 'aroundHero':
      return targets.filter((t) => dist(t.pos, origin) <= shape.radius + t.radius);
    case 'atAim': {
      const center = add(origin, scale(facing, shape.distance));
      return targets.filter((t) => dist(t.pos, center) <= shape.radius + t.radius);
    }
    case 'cone':
      return targets.filter((t) => {
        const d = sub(t.pos, origin);
        const l = len(d);
        if (l > shape.range + t.radius) return false;
        return l < 1e-6 || dot(norm(d), facing) >= Math.cos(shape.halfAngle);
      });
    case 'single':
      return []; // não é área: use singleTarget
  }
}

// O alvo mais alinhado com a mira, dentro do alcance e do cone de busca (§2.5). Empate: o mais perto.
export function singleTarget<T extends Target>(origin: Vec2, facing: Vec2, range: number, halfAngle: number, targets: readonly T[]): T | null {
  let best: T | null = null;
  let bestAngle = Infinity;
  let bestDist = Infinity;
  for (const t of targets) {
    const d = sub(t.pos, origin);
    const l = len(d);
    if (l > range + t.radius) continue;
    const angle = l < 1e-6 ? 0 : Math.acos(Math.max(-1, Math.min(1, dot(norm(d), facing))));
    if (angle > halfAngle) continue;
    if (angle < bestAngle - 1e-6 || (Math.abs(angle - bestAngle) <= 1e-6 && l < bestDist)) {
      best = t; bestAngle = angle; bestDist = l;
    }
  }
  return best;
}
