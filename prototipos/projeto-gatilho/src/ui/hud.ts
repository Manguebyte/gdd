// src/ui/hud.ts
// POR QUE: o jogador precisa ver, antes de apertar, o que cada botão faz com o gatilho segurado (§8).
// ESTRATÉGIA: desenha em coordenadas de tela, depois do mundo. Cada conjunto de
// especiais é um losango de 4 slots na posição do botão no controle; o losango
// do gatilho segurado cresce e acende. Os rótulos mudam com o dispositivo ativo.
import { GAME } from '../config/gameConfig';
import { SPECIALS } from '../config/specials';
import type { SpecialSet } from '../core/input';
import type { Game } from '../game/Game';
import type { InputManager } from '../input/InputManager';

// Posição de cada slot no losango (X embaixo, △ em cima, □ à esquerda, ○ à direita).
const SLOT_OFFSET = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
const PAD_GLYPH = ['X', '△', '□', '○'];
const KEY_GLYPH = ['1', '2', '3', '4'];
const SET_LABEL: Record<SpecialSet, [string, string]> = {
  area: ['R1 · Área', 'Mouse Dir. · Área'],
  single: ['R2 · Individual', 'Mouse Esq. · Individual'],
};

export function drawHud(ctx: CanvasRenderingContext2D, game: Game, input: InputManager): void {
  const { width: W, height: H } = GAME.view;
  const pad = input.device === 'gamepad';

  // Vida.
  ctx.fillStyle = '#000a';
  ctx.fillRect(16, 16, 204, 20);
  ctx.fillStyle = '#43a047';
  ctx.fillRect(18, 18, (200 * Math.max(0, game.hero.hp)) / GAME.hero.maxHp, 16);

  // Os dois losangos.
  drawSet(ctx, 'area', W / 2 - 150, H - 70, input.modifier === 'area', pad, game);
  drawSet(ctx, 'single', W / 2 + 150, H - 70, input.modifier === 'single', pad, game);

  if (game.state === 'victory') {
    ctx.fillStyle = '#000a';
    ctx.fillRect(0, H / 2 - 40, W, 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Fase concluída!', W / 2, H / 2 + 11);
  }
}

// Um losango: 4 slots com nome, botão e recarga.
function drawSet(ctx: CanvasRenderingContext2D, set: SpecialSet, cx: number, cy: number, active: boolean, pad: boolean, game: Game): void {
  const scale = active ? 1.25 : 1;
  const gap = 34 * scale;
  const r = 20 * scale;
  ctx.globalAlpha = active ? 1 : 0.7;
  ctx.textAlign = 'center';

  ctx.fillStyle = active ? '#fff' : '#aaa';
  ctx.font = '12px sans-serif';
  ctx.fillText(SET_LABEL[set][pad ? 0 : 1], cx, cy - gap - r - 8);

  SPECIALS[set].forEach((def, slot) => {
    const x = cx + SLOT_OFFSET[slot].x * gap;
    const y = cy + SLOT_OFFSET[slot].y * gap;
    // Fundo do slot.
    ctx.fillStyle = active ? (set === 'area' ? '#bf360c' : '#f9a825') : '#333';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // Recarga: um "relógio" escuro que some no sentido horário.
    const left = game.cooldowns.remaining(def.id);
    if (left > 0) {
      ctx.fillStyle = '#000b';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (left / def.cooldown));
      ctx.closePath();
      ctx.fill();
    }
    // Botão e nome.
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(14 * scale)}px sans-serif`;
    ctx.fillText((pad ? PAD_GLYPH : KEY_GLYPH)[slot], x, y + 5 * scale);
    if (active) {
      ctx.font = '10px sans-serif';
      ctx.fillText(def.name, x, y + r + 11);
    }
  });
  ctx.globalAlpha = 1;
}
