// Arrumação das casadas dentro do triângulo.

import type { Vec2 } from './types';

/**
 * Posições das casadas num triângulo compacto (1, 2, 3, 4... por fileira),
 * com a ponta para o fundo da arena e o conjunto centrado em `center`.
 * A última fileira pode ficar incompleta; ela é centralizada.
 * `spacing` é a distância entre centros vizinhos (2 × raio + folga).
 */
export function rackPositions(count: number, center: Vec2, spacing: number): Vec2[] {
  const rowStep = (spacing * Math.sqrt(3)) / 2;
  const points: Vec2[] = [];
  for (let row = 0; points.length < count; row++) {
    const inRow = Math.min(row + 1, count - points.length);
    for (let i = 0; i < inRow; i++) {
      points.push({ x: (i - (inRow - 1) / 2) * spacing, z: row * rowStep });
    }
  }
  const meanX = points.reduce((s, p) => s + p.x, 0) / points.length;
  const meanZ = points.reduce((s, p) => s + p.z, 0) / points.length;
  return points.map((p) => ({ x: p.x - meanX + center.x, z: p.z - meanZ + center.z }));
}
