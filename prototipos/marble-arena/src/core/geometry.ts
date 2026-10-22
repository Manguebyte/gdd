// Geometria do chão: triângulo, captura e distância até a linha de referência.
// Tudo em 2D (plano XZ), porque as regras só olham onde a bolinha parou no chão.

import type { Triangle, Vec2 } from './types';

/**
 * Triângulo equilátero com o centroide em `center`.
 * A ponta aponta para o fundo da arena (−z) e a base fica voltada para o jogador (+z).
 */
export function makeEquilateralTriangle(center: Vec2, side: number): Triangle {
  const h = (side * Math.sqrt(3)) / 2;
  return {
    a: { x: center.x, z: center.z - (2 * h) / 3 },
    b: { x: center.x - side / 2, z: center.z + h / 3 },
    c: { x: center.x + side / 2, z: center.z + h / 3 },
  };
}

function cross(o: Vec2, a: Vec2, b: Vec2): number {
  return (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
}

/** Ponto dentro do triângulo (a borda conta como dentro). */
export function isPointInTriangle(p: Vec2, t: Triangle): boolean {
  const d1 = cross(t.a, t.b, p);
  const d2 = cross(t.b, t.c, p);
  const d3 = cross(t.c, t.a, p);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

export function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const lenSq = abx * abx + abz * abz;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / lenSq));
  return Math.hypot(p.x - (a.x + abx * t), p.z - (a.z + abz * t));
}

/** Menor distância do ponto até a borda do triângulo. */
export function distanceToTriangleEdges(p: Vec2, t: Triangle): number {
  return Math.min(distanceToSegment(p, t.a, t.b), distanceToSegment(p, t.b, t.c), distanceToSegment(p, t.c, t.a));
}

/**
 * Regra da captura (GDD §4.3): só vale quando o corpo inteiro da bolinha
 * saiu, ou seja, o centro está fora e a borda mais próxima está a pelo menos
 * um raio de distância.
 */
export function isFullyOutsideTriangle(center: Vec2, radius: number, t: Triangle): boolean {
  return !isPointInTriangle(center, t) && distanceToTriangleEdges(center, t) >= radius;
}

/** O contrário da captura: o corpo inteiro está dentro (usado para validar a arrumação). */
export function isFullyInsideTriangle(center: Vec2, radius: number, t: Triangle): boolean {
  return isPointInTriangle(center, t) && distanceToTriangleEdges(center, t) >= radius;
}

/**
 * Distância perpendicular absoluta até uma linha infinita que passa por `a` e `b`
 * (rodada de abertura, GDD §4.1: passar da linha é permitido).
 */
export function distanceToLine(p: Vec2, a: Vec2, b: Vec2): number {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  return Math.abs(cross(a, b, p)) / len;
}
