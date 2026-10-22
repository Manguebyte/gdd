import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../src/config/gameConfig';
import { isFullyInsideTriangle, makeEquilateralTriangle } from '../src/core/geometry';
import { rackPositions } from '../src/core/rack';

describe('arrumação das casadas', () => {
  const { triangle, stakes, marble } = GAME_CONFIG;
  const center = { x: triangle.centerX, z: triangle.centerZ };
  const tri = makeEquilateralTriangle(center, triangle.side);
  const spacing = marble.radius * 2 + stakes.gap;

  for (const count of [1, 3, 6, 7, 10, 15]) {
    it(`${count} casadas ficam inteiras dentro do triângulo, sem se encostar`, () => {
      const pts = rackPositions(count, center, spacing);
      expect(pts).toHaveLength(count);
      for (const p of pts) expect(isFullyInsideTriangle(p, marble.radius, tri)).toBe(true);
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++)
          expect(Math.hypot(pts[i].x - pts[j].x, pts[i].z - pts[j].z)).toBeGreaterThanOrEqual(marble.radius * 2);
    });
  }
});
