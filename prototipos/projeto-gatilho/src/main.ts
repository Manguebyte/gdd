// src/main.ts
// POR QUE: junta tudo: lê o input, atualiza o jogo, desenha; uma vez por quadro do monitor.
// ESTRATÉGIA: requestAnimationFrame com dt em segundos, limitado a 50 ms para
// o jogo não "teleportar" depois de a aba ficar em segundo plano.
import { GAME } from './config/gameConfig';
import { len, norm, sub, type Vec2 } from './core/vec';
import { Game } from './game/Game';
import { GamepadInput } from './input/gamepad';
import { InputManager } from './input/InputManager';
import { KeyboardMouseInput } from './input/keyboardMouse';
import { Camera } from './render/camera';
import { render } from './render/renderer';
import { drawHud } from './ui/hud';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
const input = new InputManager(new KeyboardMouseInput(canvas), new GamepadInput());
const camera = new Camera(GAME.view.width, GAME.view.height);
const game = new Game();

let last = performance.now();
function tick(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const { frame, command } = input.poll();
  camera.follow(game.hero.pos, game.bounds());

  // Mouse: direção do herói até o cursor no mundo. Analógico: a direção já vem pronta.
  let aimDir: Vec2 | null = null;
  if (frame.aim?.kind === 'dir') aimDir = frame.aim.dir;
  else if (frame.aim?.kind === 'point') {
    const d = sub(camera.toWorld(frame.aim.screen), game.hero.pos);
    if (len(d) > 1) aimDir = norm(d); // cursor em cima do herói: mantém a mira anterior
  }

  game.update(dt, frame, command, aimDir);
  render(ctx, game, camera);
  drawHud(ctx, game, input);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
