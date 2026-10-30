// src/core/cooldowns.ts
// POR QUE: cada especial tem a sua recarga (§2.3), e o básico e a esquiva também.
// ESTRATÉGIA: um mapa id → segundos restantes; quem não está no mapa está pronto.
export class Cooldowns {
  private left = new Map<string, number>();

  // Desconta o tempo do quadro; quem chega a zero sai do mapa (fica pronto).
  tick(dt: number): void {
    for (const [id, t] of this.left) {
      if (t - dt <= 0) this.left.delete(id);
      else this.left.set(id, t - dt);
    }
  }
  ready(id: string): boolean { return !this.left.has(id); }
  start(id: string, seconds: number): void { this.left.set(id, seconds); }
  remaining(id: string): number { return this.left.get(id) ?? 0; }
  clear(): void { this.left.clear(); }
}
