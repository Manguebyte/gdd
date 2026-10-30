// src/core/input.test.ts
import { describe, expect, it } from 'vitest';
import { emptyFrame, ModifierLatch, resolveCommand, type InputFrame } from './input';

// □ no controle: slot 2 e ataque básico ao mesmo tempo; quem decide é a regra.
const square = (): InputFrame => ({ ...emptyFrame(), slotPressed: 2, basicPressed: true });

describe('resolveCommand', () => {
  it('□ sozinho é ataque básico', () => {
    expect(resolveCommand(square(), null)).toEqual({ kind: 'basic' });
  });
  it('R1 + □ é o especial de área 3, nunca o básico', () => {
    expect(resolveCommand(square(), 'area')).toEqual({ kind: 'special', set: 'area', slot: 2 });
  });
  it('R2 + X é o especial individual 1, nunca a esquiva', () => {
    const f = { ...emptyFrame(), slotPressed: 0 as const, dashPressed: true };
    expect(resolveCommand(f, 'single')).toEqual({ kind: 'special', set: 'single', slot: 0 });
  });
  it('gatilho sem botão de face não faz nada', () => {
    expect(resolveCommand(emptyFrame(), 'area')).toBeNull();
  });
  it('tecla 1–4 sem botão do mouse não faz nada', () => {
    expect(resolveCommand({ ...emptyFrame(), slotPressed: 3 }, null)).toBeNull();
  });
});

describe('ModifierLatch', () => {
  it('o primeiro gatilho continua valendo', () => {
    const l = new ModifierLatch();
    expect(l.update(true, false)).toBe('area');
    expect(l.update(true, true)).toBe('area');
  });
  it('soltando o primeiro, passa a valer o outro', () => {
    const l = new ModifierLatch();
    l.update(false, true);
    l.update(true, true);
    expect(l.update(true, false)).toBe('area');
  });
  it('sem gatilho, nenhum vale', () => {
    expect(new ModifierLatch().update(false, false)).toBeNull();
  });
});
