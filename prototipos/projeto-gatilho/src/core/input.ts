// src/core/input.ts
// POR QUE: o mesmo botão (□) é ataque básico sozinho e especial com gatilho.
// Essa decisão é a regra central do jogo e precisa ser igual no controle e no PC,
// então mora aqui, sem saber de que dispositivo veio o input.
// ESTRATÉGIA: cada dispositivo preenche um InputFrame "burro" (o que está
// segurado e o que foi apertado neste quadro). ModifierLatch decide qual gatilho
// vale e resolveCommand transforma o quadro num comando só.
import type { Vec2 } from './vec';

// Os dois conjuntos de especiais (§2.3): R1/mouse direito = área, R2/mouse esquerdo = individual.
export type SpecialSet = 'area' | 'single';
// Slot 0..3 = X/1, △/2, □/3, ○/4 (§2.2).
export type Slot = 0 | 1 | 2 | 3;

export type Aim =
  | { kind: 'point'; screen: Vec2 } // mouse: um ponto do canvas
  | { kind: 'dir'; dir: Vec2 }      // analógico direito: uma direção
  | null;                           // sem mira: o herói olha para onde anda

export interface InputFrame {
  move: Vec2;               // -1..1 em cada eixo
  aim: Aim;
  areaHeld: boolean;        // R1 ou botão direito do mouse
  singleHeld: boolean;      // R2 ou botão esquerdo do mouse
  slotPressed: Slot | null; // botão de face ou tecla 1–4 apertado NESTE quadro
  basicPressed: boolean;    // □ ou Espaço apertado neste quadro
  dashPressed: boolean;     // X ou Shift apertado neste quadro
}

export type Command =
  | { kind: 'special'; set: SpecialSet; slot: Slot }
  | { kind: 'basic' }
  | { kind: 'dash' }
  | null;

// Um quadro sem nada apertado.
export const emptyFrame = (): InputFrame => ({
  move: { x: 0, y: 0 }, aim: null, areaHeld: false, singleHeld: false,
  slotPressed: null, basicPressed: false, dashPressed: false,
});

// POR QUE: com R1 e R2 apertados juntos, precisa haver uma resposta fixa (§2.4, regra 2).
// ESTRATÉGIA: guarda o gatilho atual; ele continua valendo enquanto estiver
// segurado, mesmo que o outro seja apertado depois.
export class ModifierLatch {
  private current: SpecialSet | null = null;

  // Chamado uma vez por quadro; devolve o gatilho que vale agora.
  update(areaHeld: boolean, singleHeld: boolean): SpecialSet | null {
    const held = (s: SpecialSet) => (s === 'area' ? areaHeld : singleHeld);
    if (this.current && held(this.current)) return this.current;
    this.current = areaHeld ? 'area' : singleHeld ? 'single' : null;
    return this.current;
  }

  // Esquece o gatilho (ao trocar de dispositivo ou recomeçar a sala).
  reset(): void { this.current = null; }
}

// A regra central (§2.4, regra 1): com gatilho, botão de face é especial e nada mais.
export function resolveCommand(frame: InputFrame, modifier: SpecialSet | null): Command {
  if (modifier) {
    return frame.slotPressed !== null ? { kind: 'special', set: modifier, slot: frame.slotPressed } : null;
  }
  if (frame.basicPressed) return { kind: 'basic' };
  if (frame.dashPressed) return { kind: 'dash' };
  return null;
}
