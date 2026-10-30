// src/render/renderer.ts
// POR QUE: até existir arte (§7), tudo é forma simples; o desenho só lê o estado.
// ESTRATÉGIA: translada o contexto pela câmera e desenha em coordenadas do mundo:
// salas, porta, inimigos, herói e os efeitos dos golpes.
import { GAME } from '../config/gameConfig';
import { ROOM_HEIGHT, roomX, STAGE } from '../config/stage';
import type { Game } from '../game/Game';
import type { Camera } from './camera';

export function render(ctx: CanvasRenderingContext2D, game: Game, cam: Camera): void {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, GAME.view.width, GAME.view.height);
  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // Salas: chão e contorno.
  STAGE.forEach((room, i) => {
    ctx.fillStyle = i % 2 ? '#2a2a33' : '#26262e';
    ctx.fillRect(roomX(i), 0, room.width, ROOM_HEIGHT);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(roomX(i), 0, room.width, ROOM_HEIGHT);
  });

  // Porta trancada: barra vermelha na saída da sala atual.
  if (!game.cleared && game.roomIndex + 1 < STAGE.length) {
    ctx.fillStyle = '#c62828';
    ctx.fillRect(roomX(game.roomIndex + 1) - 4, ROOM_HEIGHT / 2 - 60, 8, 120);
  }

  // Inimigos: círculos com barra de vida; brancos por um instante ao levar golpe.
  for (const e of game.enemies) {
    ctx.fillStyle = e.hurtFlash > 0 ? '#fff' : e.kind === 'boss' ? '#8e24aa' : e.kind === 'brute' ? '#e65100' : '#9e9d24';
    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(e.pos.x - e.radius, e.pos.y - e.radius - 8, e.radius * 2, 4);
    ctx.fillStyle = '#e53935';
    ctx.fillRect(e.pos.x - e.radius, e.pos.y - e.radius - 8, (e.radius * 2 * e.hp) / e.maxHp, 4);
  }

  // Herói: círculo, com um traço na direção da mira; pisca quando invulnerável.
  const h = game.hero;
  ctx.globalAlpha = h.invuln > 0 && Math.floor(performance.now() / 60) % 2 ? 0.4 : 1;
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.arc(h.pos.x, h.pos.y, GAME.hero.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(h.pos.x, h.pos.y);
  ctx.lineTo(h.pos.x + h.facing.x * 24, h.pos.y + h.facing.y * 24);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Golpes: a forma do especial, transparente, por alguns décimos de segundo.
  for (const fx of game.effects) {
    ctx.globalAlpha = Math.min(1, fx.time * 5) * 0.5;
    ctx.fillStyle = fx.shape.kind === 'single' ? '#ffd54f' : '#ff7043';
    ctx.beginPath();
    const s = fx.shape;
    if (s.kind === 'aroundHero') ctx.arc(fx.origin.x, fx.origin.y, s.radius, 0, Math.PI * 2);
    else if (s.kind === 'atAim') ctx.arc(fx.origin.x + fx.facing.x * s.distance, fx.origin.y + fx.facing.y * s.distance, s.radius, 0, Math.PI * 2);
    else if (s.kind === 'cone') {
      const a = Math.atan2(fx.facing.y, fx.facing.x);
      ctx.moveTo(fx.origin.x, fx.origin.y);
      ctx.arc(fx.origin.x, fx.origin.y, s.range, a - s.halfAngle, a + s.halfAngle);
      ctx.closePath();
    } else if (fx.target) {
      // Individual: uma linha grossa até o alvo e um círculo nele.
      ctx.arc(fx.target.x, fx.target.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.lineWidth = 6;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.moveTo(fx.origin.x, fx.origin.y);
      ctx.lineTo(fx.target.x, fx.target.y);
      ctx.stroke();
      ctx.lineWidth = 1;
      continue;
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}
