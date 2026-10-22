// Captura de casadas (GDD §4.3). Função pura: recebe onde as casadas
// pararam e devolve quais saíram inteiras do triângulo.

import { isFullyOutsideTriangle } from './geometry';
import type { Triangle, Vec2 } from './types';

export interface StakeAtRest {
  id: string;
  position: Vec2;
}

export function findCapturedStakes(stakes: StakeAtRest[], triangle: Triangle, radius: number): string[] {
  return stakes.filter((s) => isFullyOutsideTriangle(s.position, radius, triangle)).map((s) => s.id);
}
