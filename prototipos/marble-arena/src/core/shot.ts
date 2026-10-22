// Conversão dos três controles do tiro (direção, força, ângulo) em impulso físico.

import type { ShotParams, Vec2, Vec3 } from './types';

const DEG = Math.PI / 180;

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Normaliza um ângulo para o intervalo (−180, 180]. */
export function wrapDeg(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** Vetor unitário da direção inicial do tiro (yaw 0 = −z, yaw 90 = +x; pitch sobe). */
export function shotDirection(yawDeg: number, pitchDeg: number): Vec3 {
  const yaw = yawDeg * DEG;
  const pitch = pitchDeg * DEG;
  return {
    x: Math.sin(yaw) * Math.cos(pitch),
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * Math.cos(pitch),
  };
}

/** Impulso do tiro: direção × força × impulso máximo. Força e ângulo fora da faixa são limitados. */
export function shotImpulse(params: ShotParams, maxImpulse: number, maxPitchDeg: number): Vec3 {
  const power = clamp(params.power, 0, 1);
  const dir = shotDirection(params.yawDeg, clamp(params.pitchDeg, 0, maxPitchDeg));
  const k = power * maxImpulse;
  return { x: dir.x * k, y: dir.y * k, z: dir.z * k };
}

/** Yaw que aponta de `from` para `to` no chão (usado pela mira do mouse e pela IA). */
export function yawTowards(from: Vec2, to: Vec2): number {
  return Math.atan2(to.x - from.x, -(to.z - from.z)) / DEG;
}
