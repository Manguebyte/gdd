import { describe, expect, it } from 'vitest';
import { shotDirection, shotImpulse, wrapDeg, yawTowards } from '../src/core/shot';

describe('tiro', () => {
  it('yaw 0 aponta para −z e yaw 90 para +x', () => {
    expect(shotDirection(0, 0).z).toBeCloseTo(-1);
    expect(shotDirection(90, 0).x).toBeCloseTo(1);
  });

  it('ângulo vertical de 45° divide o impulso entre subir e avançar', () => {
    const d = shotDirection(0, 45);
    expect(d.y).toBeCloseTo(-d.z);
  });

  it('força e ângulo são limitados às faixas do jogo', () => {
    const i = shotImpulse({ yawDeg: 0, power: 2, pitchDeg: 80 }, 1000, 45);
    expect(Math.hypot(i.x, i.y, i.z)).toBeCloseTo(1000);
    expect(i.y).toBeCloseTo(-i.z);
    const zero = shotImpulse({ yawDeg: 0, power: -1, pitchDeg: 0 }, 1000, 45);
    expect(Math.hypot(zero.x, zero.y, zero.z)).toBe(0);
  });

  it('yawTowards é o inverso de shotDirection', () => {
    for (const yaw of [-170, -90, -30, 0, 45, 135, 180]) {
      const d = shotDirection(yaw, 0);
      expect(wrapDeg(yawTowards({ x: 0, z: 0 }, { x: d.x, z: d.z }) - yaw)).toBeCloseTo(0);
    }
  });
});
