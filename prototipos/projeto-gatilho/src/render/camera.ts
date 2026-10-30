// src/render/camera.ts
// POR QUE: a fase é maior que a tela; a câmera segue o herói sem mostrar o lado de fora da sala.
// ESTRATÉGIA: a câmera é só o canto superior esquerdo da tela no mundo.
// Converter mundo↔tela é somar/subtrair esse canto (sem zoom no MVP).
import type { Rect } from '../game/Game';
import type { Vec2 } from '../core/vec';

export class Camera {
  x = 0;
  y = 0;
  constructor(private w: number, private h: number) {}

  // Centraliza no alvo, presa dentro dos limites (se o limite for menor que a tela, centraliza nele).
  follow(target: Vec2, b: Rect): void {
    this.x = b.w <= this.w ? b.x + (b.w - this.w) / 2 : Math.min(b.x + b.w - this.w, Math.max(b.x, target.x - this.w / 2));
    this.y = b.h <= this.h ? b.y + (b.h - this.h) / 2 : Math.min(b.y + b.h - this.h, Math.max(b.y, target.y - this.h / 2));
  }

  // Ponto da tela (mouse) para o mundo.
  toWorld(p: Vec2): Vec2 {
    return { x: p.x + this.x, y: p.y + this.y };
  }
}
