// src/core/targeting.test.ts
import { describe, expect, it } from 'vitest';
import { Cooldowns } from './cooldowns';
import { areaTargets, singleTarget } from './targeting';

const at = (x: number, y: number) => ({ pos: { x, y }, radius: 10 });
const right = { x: 1, y: 0 };

describe('areaTargets', () => {
  it('círculo em volta do herói pega todos perto, em qualquer direção', () => {
    const ts = [at(50, 0), at(-50, 0), at(300, 0)];
    expect(areaTargets({ kind: 'aroundHero', radius: 90 }, { x: 0, y: 0 }, right, ts)).toHaveLength(2);
  });
  it('cone ignora quem está atrás', () => {
    const ts = [at(100, 0), at(-100, 0)];
    expect(areaTargets({ kind: 'cone', range: 160, halfAngle: Math.PI / 4 }, { x: 0, y: 0 }, right, ts)).toEqual([ts[0]]);
  });
});

describe('singleTarget', () => {
  it('prefere o mais alinhado com a mira, não o mais perto', () => {
    const ts = [at(40, 30), at(200, 0)];
    expect(singleTarget({ x: 0, y: 0 }, right, 320, Math.PI / 5, ts)).toBe(ts[1]);
  });
  it('sem ninguém no alcance, não há alvo', () => {
    expect(singleTarget({ x: 0, y: 0 }, right, 70, Math.PI / 5, [at(200, 0)])).toBeNull();
  });
});

describe('Cooldowns', () => {
  it('fica pronto depois do tempo', () => {
    const c = new Cooldowns();
    c.start('giro', 4);
    c.tick(3.9);
    expect(c.ready('giro')).toBe(false);
    c.tick(0.2);
    expect(c.ready('giro')).toBe(true);
  });
});
