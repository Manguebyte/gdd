// Materiais procedurais (GDD §10): nada de textura externa. Terra e bolinhas
// leitosas são desenhadas num <canvas> na hora de carregar.

import * as THREE from 'three';
import type { MarbleDef } from '../core/types';

/** Gerador pseudoaleatório com semente, para o chão sair igual toda vez. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Terra batida: base areia, manchas, grãos claros e escuros e algumas pedrinhas.
 * As manchas são desenhadas também do outro lado das bordas, para a textura
 * repetir sem emenda visível.
 */
export function makeDirtTexture(base = '#b58a5c', seed = 7): THREE.CanvasTexture {
  const rand = seededRandom(seed);
  const tex = canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 70; i++) {
      const cx = rand() * 512;
      const cy = rand() * 512;
      const r = 20 + rand() * 60;
      const dark = rand() < 0.5;
      for (const ox of [-512, 0, 512]) {
        for (const oy of [-512, 0, 512]) {
          const x = cx + ox;
          const y = cy + oy;
          if (x + r < 0 || x - r > 512 || y + r < 0 || y - r > 512) continue;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, dark ? 'rgba(90,60,35,0.18)' : 'rgba(230,200,150,0.15)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
      }
    }
    for (let i = 0; i < 9000; i++) {
      const v = rand();
      ctx.fillStyle = v < 0.5 ? `rgba(70,45,25,${0.15 + rand() * 0.25})` : `rgba(245,225,185,${0.1 + rand() * 0.25})`;
      ctx.fillRect(rand() * 512, rand() * 512, 1 + rand() * 1.5, 1 + rand() * 1.5);
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(${120 + rand() * 60},${110 + rand() * 50},${95 + rand() * 40},0.9)`;
      ctx.beginPath();
      ctx.ellipse(rand() * 512, rand() * 512, 1.5 + rand() * 3, 1 + rand() * 2.5, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Espiral da bolinha leitosa: faixas onduladas da cor de destaque sobre a cor base. */
function makeSwirlTexture(color: string, accent: string, seed: number): THREE.CanvasTexture {
  const rand = seededRandom(seed);
  return canvasTexture(256, 128, (ctx) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = accent;
    ctx.lineCap = 'round';
    for (let band = 0; band < 3; band++) {
      const phase = rand() * Math.PI * 2;
      const amp = 18 + rand() * 22;
      const yBase = 30 + band * 34;
      ctx.lineWidth = 5 + rand() * 9;
      ctx.beginPath();
      for (let x = 0; x <= 256; x += 4) {
        const y = yBase + Math.sin((x / 256) * Math.PI * 4 + phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

export interface MarbleMaterials {
  shell: THREE.Material;
  /** Material das "pétalas" de dentro (só olho-de-gato). */
  core: THREE.Material | null;
}

const cache = new Map<string, MarbleMaterials>();

/** Materiais de uma bolinha. Vidro transparente com pétalas coloridas, ou vidro leitoso com espiral. */
export function marbleMaterials(def: MarbleDef): MarbleMaterials {
  const key = `${def.pattern}|${def.color}|${def.accent}`;
  const hit = cache.get(key);
  if (hit) return hit;

  let mats: MarbleMaterials;
  if (def.pattern === 'olho-de-gato') {
    const tint = new THREE.Color('#ffffff').lerp(new THREE.Color(def.color), 0.4);
    mats = {
      shell: new THREE.MeshPhysicalMaterial({
        color: tint,
        transmission: 1,
        thickness: 1.2,
        roughness: 0.03,
        ior: 1.5,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.4,
      }),
      core: new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.35, emissive: def.color, emissiveIntensity: 0.3 }),
    };
  } else {
    mats = {
      shell: new THREE.MeshPhysicalMaterial({
        map: makeSwirlTexture(def.color, def.accent, key.length * 31 + def.color.charCodeAt(1)),
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        sheen: 0.3,
        envMapIntensity: 1.1,
      }),
      core: null,
    };
  }
  cache.set(key, mats);
  return mats;
}
