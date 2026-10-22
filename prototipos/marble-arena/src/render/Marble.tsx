// Uma bolinha na tela. Não guarda posição: a cada quadro copia posição e
// rotação do corpo físico, então a física é a única fonte de verdade.

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type * as THREE from 'three';
import type { MarbleDef } from '../core/types';
import type { GameManager } from '../game/GameManager';
import { marbleMaterials } from './materials';

export function Marble({ game, def }: { game: GameManager; def: MarbleDef }) {
  const ref = useRef<THREE.Group>(null);
  const mats = useMemo(() => marbleMaterials(def), [def]);
  const r = game.cfg.marble.radius;

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = game.physics.getPosition(def.id);
    const q = game.physics.getRotation(def.id);
    if (!p || !q) return;
    g.position.set(p.x, p.y, p.z);
    g.quaternion.set(q.x, q.y, q.z, q.w);
  });

  return (
    <group ref={ref}>
      <mesh castShadow material={mats.shell}>
        <sphereGeometry args={[r, 32, 24]} />
      </mesh>
      {mats.core &&
        [0, 1, 2].map((k) => (
          // Olho-de-gato: três "pétalas" achatadas cruzadas no meio do vidro
          <mesh key={k} rotation={[0, (k * Math.PI) / 3, 0]} scale={[0.16, 0.86, 0.86]} material={mats.core!}>
            <sphereGeometry args={[r, 16, 12]} />
          </mesh>
        ))}
    </group>
  );
}
