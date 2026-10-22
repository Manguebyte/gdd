import { describe, expect, it } from 'vitest';
import {
  distanceToLine,
  isFullyInsideTriangle,
  isFullyOutsideTriangle,
  isPointInTriangle,
  makeEquilateralTriangle,
} from '../src/core/geometry';

const tri = makeEquilateralTriangle({ x: 0, z: 0 }, 30);
const h = (30 * Math.sqrt(3)) / 2;

describe('triângulo', () => {
  it('aponta para −z e tem o centroide no centro pedido', () => {
    expect(tri.a.z).toBeLessThan(tri.b.z);
    expect((tri.a.x + tri.b.x + tri.c.x) / 3).toBeCloseTo(0);
    expect((tri.a.z + tri.b.z + tri.c.z) / 3).toBeCloseTo(0);
  });

  it('centro está dentro e um ponto longe está fora', () => {
    expect(isPointInTriangle({ x: 0, z: 0 }, tri)).toBe(true);
    expect(isPointInTriangle({ x: 50, z: 0 }, tri)).toBe(false);
  });
});

describe('captura (corpo inteiro fora)', () => {
  const r = 0.8;
  const baseZ = h / 3;

  it('centro fora mas encostando na linha não é captura', () => {
    expect(isFullyOutsideTriangle({ x: 0, z: baseZ + r / 2 }, r, tri)).toBe(false);
  });

  it('a um raio da linha já é captura', () => {
    expect(isFullyOutsideTriangle({ x: 0, z: baseZ + r }, r, tri)).toBe(true);
  });

  it('centro dentro nunca é captura', () => {
    expect(isFullyOutsideTriangle({ x: 0, z: baseZ - 0.1 }, r, tri)).toBe(false);
  });

  it('dentro por inteiro exige um raio de folga da borda', () => {
    expect(isFullyInsideTriangle({ x: 0, z: 0 }, r, tri)).toBe(true);
    expect(isFullyInsideTriangle({ x: 0, z: baseZ - r / 2 }, r, tri)).toBe(false);
  });
});

describe('distância até a linha de referência', () => {
  it('é perpendicular e absoluta (passar da linha vale)', () => {
    const a = { x: -100, z: -60 };
    const b = { x: 100, z: -60 };
    expect(distanceToLine({ x: 7, z: -55 }, a, b)).toBeCloseTo(5);
    expect(distanceToLine({ x: -40, z: -65 }, a, b)).toBeCloseTo(5);
  });
});
