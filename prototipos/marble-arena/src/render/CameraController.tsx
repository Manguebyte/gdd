// Câmera (GDD §7): visão de cima inclinada, girando em volta de um alvo.
// Botão direito arrasta para girar, roda do mouse dá zoom. Tudo é suavizado:
// o controle mexe no "desejado" e a câmera persegue o desejado a cada quadro.
// Durante o tiro, se a câmera de acompanhamento estiver ligada, o alvo segue a
// bolinha de tiro; quando tudo para, volta sozinho para a visão geral.

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { clamp } from '../core/shot';
import { SHOOTER_ID, type GameManager } from '../game/GameManager';
import { gameStore } from '../game/store';

const DEG = Math.PI / 180;
const OVERVIEW = { yaw: 0, elevation: 50 * DEG, distance: 175 };
const LIMITS = { minElevation: 22 * DEG, maxElevation: 85 * DEG, minDistance: 35, maxDistance: 340 };
const FOLLOW_DISTANCE = 80;

/** Fração para aproximar `atual` de `desejado` com suavização independente do FPS. */
function damp(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt);
}

export function CameraController({ game }: { game: GameManager }) {
  const { camera, gl } = useThree();
  const desired = useRef({ ...OVERVIEW });
  const current = useRef({ ...OVERVIEW });
  const target = useRef(new THREE.Vector3(0, 0, 10));
  const tmp = useRef(new THREE.Vector3());

  // Mouse: botão direito ou do meio gira, roda dá zoom; tecla Home volta à visão geral.
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const down = (e: PointerEvent) => {
      if (e.button !== 2 && e.button !== 1) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      desired.current.yaw -= (e.clientX - lastX) * 0.006;
      desired.current.elevation = clamp(desired.current.elevation + (e.clientY - lastY) * 0.004, LIMITS.minElevation, LIMITS.maxElevation);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      desired.current.distance = clamp(desired.current.distance * Math.exp(e.deltaY * 0.001), LIMITS.minDistance, LIMITS.maxDistance);
    };
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Home' || e.code === 'KeyC') desired.current = { ...OVERVIEW };
    };
    const noMenu = (e: Event) => e.preventDefault();
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('contextmenu', noMenu);
    window.addEventListener('keydown', key);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('contextmenu', noMenu);
      window.removeEventListener('keydown', key);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const s = gameStore.getState();
    const shooter = game.physics.getPosition(SHOOTER_ID);
    const center = game.triangleCenter;
    const following = s.followCam && s.phase === 'SHOT_IN_PROGRESS' && shooter !== null;

    // Alvo: segue a bolinha no tiro; mirando, fica entre o triângulo e a bolinha de tiro.
    if (following) tmp.current.set(shooter!.x, 0, shooter!.z);
    else if (shooter) tmp.current.set(center.x + (shooter.x - center.x) * 0.35, 0, center.z + (shooter.z - center.z) * 0.35);
    else tmp.current.set(center.x, 0, center.z);
    target.current.lerp(tmp.current, damp(following ? 6 : 2.5, dt));

    const want = desired.current;
    const cur = current.current;
    const k = damp(6, dt);
    cur.yaw += (want.yaw - cur.yaw) * k;
    cur.elevation += (want.elevation - cur.elevation) * k;
    const wantDistance = following ? Math.min(want.distance, FOLLOW_DISTANCE) : want.distance;
    cur.distance += (wantDistance - cur.distance) * damp(3, dt);

    const horizontal = Math.cos(cur.elevation) * cur.distance;
    camera.position.set(
      target.current.x + Math.sin(cur.yaw) * horizontal,
      target.current.y + Math.sin(cur.elevation) * cur.distance,
      target.current.z + Math.cos(cur.yaw) * horizontal,
    );
    camera.lookAt(target.current);
  });

  return null;
}
