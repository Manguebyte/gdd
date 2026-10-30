// src/config/specials.ts
// POR QUE: os 8 especiais são dados, não código: trocar um especial é editar esta tabela (§3.2, placeholder).
// ESTRATÉGIA: cada especial tem uma forma; formas de área acertam todos dentro,
// 'single' acerta o inimigo mais alinhado com a mira. A ordem do array é a do slot: X, △, □, ○.
import type { SpecialSet } from '../core/input';

export type Shape =
  | { kind: 'aroundHero'; radius: number }               // círculo em volta do herói
  | { kind: 'cone'; range: number; halfAngle: number }   // cone à frente
  | { kind: 'atAim'; distance: number; radius: number }  // círculo à frente, a `distance` do herói
  | { kind: 'single'; range: number };                   // um alvo só

export interface SpecialDef { id: string; name: string; damage: number; cooldown: number; shape: Shape }

export const SPECIALS: Record<SpecialSet, readonly SpecialDef[]> = {
  area: [ // R1 / botão direito do mouse
    { id: 'giro', name: 'Giro', damage: 20, cooldown: 4, shape: { kind: 'aroundHero', radius: 90 } },
    { id: 'leque', name: 'Leque', damage: 25, cooldown: 5, shape: { kind: 'cone', range: 160, halfAngle: Math.PI / 4 } },
    { id: 'impacto', name: 'Impacto', damage: 30, cooldown: 7, shape: { kind: 'atAim', distance: 140, radius: 70 } },
    { id: 'tremor', name: 'Tremor', damage: 40, cooldown: 12, shape: { kind: 'aroundHero', radius: 160 } },
  ],
  single: [ // R2 / botão esquerdo do mouse
    { id: 'estocada', name: 'Estocada', damage: 35, cooldown: 3, shape: { kind: 'single', range: 70 } },
    { id: 'disparo', name: 'Disparo', damage: 30, cooldown: 4, shape: { kind: 'single', range: 320 } },
    { id: 'golpe-pesado', name: 'Golpe Pesado', damage: 55, cooldown: 8, shape: { kind: 'single', range: 90 } },
    { id: 'execucao', name: 'Execução', damage: 80, cooldown: 14, shape: { kind: 'single', range: 90 } },
  ],
};
