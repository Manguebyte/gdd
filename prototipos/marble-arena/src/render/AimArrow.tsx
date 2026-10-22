// Mira (GDD §5): a seta sai da bolinha de tiro na direção EXATA do impulso
// (inclui o ângulo vertical) e cresce com a força. Uma linha fina no chão
// estende a direção horizontal para ajudar a mirar de longe.
// Também tem o plano invisível que transforma o mouse em direção.

import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { yawTowards } from '../core/shot';
import { SHOOTER_ID, type GameManager } from '../game/GameManager';
import { gameStore } from '../game/store';

const DEG = Math.PI / 180;
const MIN_LEN = 5;
const MAX_LEN = 36;

export function AimArrow({ game }: { game: GameManager }) {
  const root = useRef<THREE.Group>(null);
  const pivot = useRef<THREE.Group>(null);
  const shaft = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Mesh>(null);
  const guide = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const color = useRef(new THREE.Color());
  const r = game.cfg.marble.radius;

  // Lê o store direto (sem re-render do React) e posiciona a seta.
  useFrame((state) => {
    const s = gameStore.getState();
    const p = game.physics.getPosition(SHOOTER_ID);
    const visible = s.phase === 'AIMING' && p !== null;
    root.current!.visible = visible;
    if (!visible || !p) return;

    root.current!.position.set(p.x, p.y, p.z);
    // Ordem YXZ: primeiro inclina para cima (X), depois gira no chão (Y).
    pivot.current!.rotation.set(s.aim.pitchDeg * DEG, -s.aim.yawDeg * DEG, 0, 'YXZ');
    guide.current!.rotation.set(0, -s.aim.yawDeg * DEG, 0);

    const len = MIN_LEN + s.aim.power * (MAX_LEN - MIN_LEN);
    shaft.current!.scale.set(1, len, 1);
    shaft.current!.position.set(0, 0, -(r + len / 2));
    head.current!.position.set(0, 0, -(r + len + 1.2));

    // Verde (fraco) → amarelo → vermelho (forte)
    color.current.setHSL(0.33 * (1 - s.aim.power), 0.85, 0.5);
    (shaft.current!.material as THREE.MeshStandardMaterial).color.copy(color.current);
    (head.current!.material as THREE.MeshStandardMaterial).color.copy(color.current);

    const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.08;
    ring.current!.scale.set(pulse, pulse, 1);
  });

  return (
    <group ref={root}>
      <group ref={pivot}>
        <mesh ref={shaft} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 1, 12]} />
          <meshStandardMaterial emissive="#222" />
        </mesh>
        <mesh ref={head} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1.1, 2.4, 16]} />
          <meshStandardMaterial emissive="#222" />
        </mesh>
      </group>
      <group ref={guide} position={[0, -r + 0.03, 0]}>
        <mesh position={[0, 0, -(r + 60)]}>
          <boxGeometry args={[0.18, 0.02, 120]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>
      <mesh ref={ring} position={[0, -r + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 1.6, r * 2.1, 32]} />
        <meshBasicMaterial color="#d62828" transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Plano invisível no chão: o mouse em cima dele aponta a mira; clique trava/destrava a direção. */
export function AimSurface({ game }: { game: GameManager }) {
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const s = gameStore.getState();
    if (s.phase !== 'AIMING' || s.aim.locked) return;
    if (e.buttons & 6) return; // botão direito/do meio apertado: é a câmera girando, não a mira
    const p = game.physics.getGroundPosition(SHOOTER_ID);
    if (!p) return;
    if (Math.hypot(e.point.x - p.x, e.point.z - p.z) < game.cfg.marble.radius * 2) return; // em cima da bolinha a direção pula
    s.setYaw(yawTowards(p, { x: e.point.x, z: e.point.z }));
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.button !== 0) return;
    const s = gameStore.getState();
    if (s.phase === 'AIMING') s.setLocked(!s.aim.locked);
  };
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} onPointerMove={onMove} onClick={onClick}>
      <planeGeometry args={[2000, 2000]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
