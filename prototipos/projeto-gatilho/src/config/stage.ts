// src/config/stage.ts
// POR QUE: a fase é uma fileira de salas da mesma altura, rolando para a direita (§5, placeholder).
// ESTRATÉGIA: cada sala só diz a largura e as ondas; a posição x sai da soma
// das larguras anteriores, então reordenar salas é mexer nesta lista.
import type { EnemyKind } from './gameConfig';

export interface Wave { kind: EnemyKind; count: number }
export interface RoomDef { width: number; waves: Wave[][] } // cada onda pode misturar tipos

export const ROOM_HEIGHT = 480;

export const STAGE: RoomDef[] = [
  { width: 900, waves: [[{ kind: 'grunt', count: 3 }]] },
  { width: 1000, waves: [[{ kind: 'grunt', count: 4 }], [{ kind: 'grunt', count: 5 }]] },
  { width: 1000, waves: [[{ kind: 'grunt', count: 3 }, { kind: 'brute', count: 1 }], [{ kind: 'brute', count: 2 }]] },
  { width: 1100, waves: [[{ kind: 'boss', count: 1 }]] },
];

// x da borda esquerda da sala i.
export const roomX = (i: number): number => STAGE.slice(0, i).reduce((s, r) => s + r.width, 0);
