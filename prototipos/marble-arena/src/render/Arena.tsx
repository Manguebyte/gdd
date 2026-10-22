// A arena desenhada: chão de terra, tábuas em volta, os riscos no chão
// (triângulo, linha de referência, área de tiro) e detalhes do entorno.
// Os riscos são só desenho, sem colisão: a bolinha passa por cima deles.

import { useMemo } from 'react';
import * as THREE from 'three';
import type { GameConfig } from '../config/gameConfig';
import type { Triangle, Vec2 } from '../core/types';
import { makeDirtTexture, seededRandom } from './materials';

const LINE_Y = 0.015;

/** Uma faixa fina deitada no chão, de `a` até `b`. */
function GroundStrip({ a, b, width, color, opacity = 1 }: { a: Vec2; b: Vec2; width: number; color: string; opacity?: number }) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) + width; // + largura para os cantos se fecharem
  return (
    <mesh position={[(a.x + b.x) / 2, LINE_Y, (a.z + b.z) / 2]} rotation={[0, Math.atan2(-dz, dx), 0]} receiveShadow>
      <boxGeometry args={[len, 0.03, width]} />
      <meshStandardMaterial color={color} roughness={1} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

function Plank({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#8a5a33" roughness={0.85} />
    </mesh>
  );
}

/** Pedras e tufos de capim espalhados fora das tábuas (sempre os mesmos, por causa da semente). */
function Surroundings({ cfg }: { cfg: GameConfig }) {
  const items = useMemo(() => {
    const rand = seededRandom(42);
    const hw = cfg.arena.width / 2 + cfg.wall.thickness;
    const hd = cfg.arena.depth / 2 + cfg.wall.thickness;
    const out: Array<{ kind: 'stone' | 'grass' | 'leaf'; x: number; z: number; s: number; r: number }> = [];
    while (out.length < 140) {
      const x = (rand() - 0.5) * cfg.arena.width * 2.4;
      const z = (rand() - 0.5) * cfg.arena.depth * 2.6;
      if (Math.abs(x) < hw + 4 && Math.abs(z) < hd + 4) continue;
      const roll = rand();
      out.push({ kind: roll < 0.35 ? 'stone' : roll < 0.8 ? 'grass' : 'leaf', x, z, s: 0.6 + rand() * 1.4, r: rand() * Math.PI * 2 });
    }
    return out;
  }, [cfg]);

  return (
    <group>
      {items.map((it, i) =>
        it.kind === 'stone' ? (
          <mesh key={i} position={[it.x, it.s * 0.8, it.z]} rotation={[it.r, it.r * 2, 0]} scale={[it.s * 3, it.s * 1.8, it.s * 2.6]} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#8d8a84" roughness={0.95} flatShading />
          </mesh>
        ) : it.kind === 'grass' ? (
          <group key={i} position={[it.x, 0, it.z]} rotation={[0, it.r, 0]} scale={it.s}>
            {[0, 1, 2, 3].map((k) => (
              <mesh key={k} position={[(k - 1.5) * 1.2, 3, (k % 2) * 0.8]} rotation={[0, 0, (k - 1.5) * 0.25]} castShadow>
                <coneGeometry args={[0.6, 6, 4]} />
                <meshStandardMaterial color={k % 2 ? '#6b8f3a' : '#87a94a'} roughness={0.9} flatShading />
              </mesh>
            ))}
          </group>
        ) : (
          <mesh key={i} position={[it.x, 0.05, it.z]} rotation={[-Math.PI / 2, 0, it.r]} scale={[it.s * 2.4, it.s * 1.3, 1]} receiveShadow>
            <circleGeometry args={[1, 7]} />
            <meshStandardMaterial color={i % 3 ? '#c9822b' : '#9c5a1c'} roughness={1} side={THREE.DoubleSide} />
          </mesh>
        ),
      )}
    </group>
  );
}

export function Arena({ cfg, triangle }: { cfg: GameConfig; triangle: Triangle }) {
  const dirt = useMemo(() => {
    const t = makeDirtTexture('#b58a5c', 7);
    t.repeat.set(cfg.arena.width / 60, cfg.arena.depth / 60);
    return t;
  }, [cfg]);
  const outerDirt = useMemo(() => {
    const t = makeDirtTexture('#9a7a52', 11);
    t.repeat.set(12, 12);
    return t;
  }, []);

  const hw = cfg.arena.width / 2;
  const hd = cfg.arena.depth / 2;
  const { thickness: th, height: wh } = cfg.wall;
  const sa = cfg.shootingArea;
  const saZ0 = sa.centerZ - sa.depth / 2;
  const saZ1 = sa.centerZ + sa.depth / 2;
  const saX = sa.width / 2;

  return (
    <group>
      {/* Chão jogável e o terreno em volta, um pouco mais escuro */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[cfg.arena.width, cfg.arena.depth]} />
        <meshStandardMaterial map={dirt} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[1600, 1600]} />
        <meshStandardMaterial map={outerDirt} roughness={1} />
      </mesh>

      {/* Tábuas: mesmas medidas das paredes da física */}
      <Plank position={[0, wh / 2, -hd - th / 2]} size={[cfg.arena.width + th * 2, wh, th]} />
      <Plank position={[0, wh / 2, hd + th / 2]} size={[cfg.arena.width + th * 2, wh, th]} />
      <Plank position={[-hw - th / 2, wh / 2, 0]} size={[th, wh, cfg.arena.depth]} />
      <Plank position={[hw + th / 2, wh / 2, 0]} size={[th, wh, cfg.arena.depth]} />

      {/* Triângulo riscado na terra */}
      <GroundStrip a={triangle.a} b={triangle.b} width={0.7} color="#5a3b22" />
      <GroundStrip a={triangle.b} b={triangle.c} width={0.7} color="#5a3b22" />
      <GroundStrip a={triangle.c} b={triangle.a} width={0.7} color="#5a3b22" />

      {/* Linha de referência da rodada de abertura (Marco 2), de ponta a ponta */}
      <GroundStrip a={{ x: -hw + 6, z: cfg.referenceLine.z }} b={{ x: hw - 6, z: cfg.referenceLine.z }} width={0.8} color="#f3ead8" opacity={0.85} />

      {/* Área de tiro: contorno claro */}
      <GroundStrip a={{ x: -saX, z: saZ0 }} b={{ x: saX, z: saZ0 }} width={0.5} color="#efe2c4" opacity={0.7} />
      <GroundStrip a={{ x: -saX, z: saZ1 }} b={{ x: saX, z: saZ1 }} width={0.5} color="#efe2c4" opacity={0.7} />
      <GroundStrip a={{ x: -saX, z: saZ0 }} b={{ x: -saX, z: saZ1 }} width={0.5} color="#efe2c4" opacity={0.7} />
      <GroundStrip a={{ x: saX, z: saZ0 }} b={{ x: saX, z: saZ1 }} width={0.5} color="#efe2c4" opacity={0.7} />

      <Surroundings cfg={cfg} />
    </group>
  );
}
