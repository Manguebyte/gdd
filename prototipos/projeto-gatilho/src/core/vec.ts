// src/core/vec.ts
// POR QUE: o jogo é 2D; estas funções pequenas evitam repetir Math.hypot pelo código.
export interface Vec2 { x: number; y: number }

export const vec = (x = 0, y = 0): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec2, b: Vec2): number => len(sub(a, b));

// Vetor de tamanho 1 na mesma direção (ou zero, se o vetor for zero).
export const norm = (a: Vec2): Vec2 => {
  const l = len(a);
  return l > 1e-6 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 };
};

// Corta o tamanho em `max` (a diagonal do WASD não anda mais rápido).
export const clampLen = (a: Vec2, max: number): Vec2 => {
  const l = len(a);
  return l > max ? scale(a, max / l) : a;
};
