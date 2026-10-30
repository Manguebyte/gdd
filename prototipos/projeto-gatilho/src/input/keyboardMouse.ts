// src/input/keyboardMouse.ts
// POR QUE: o navegador entrega teclado e mouse como eventos, mas o jogo quer
// perguntar "o que está apertado agora?" uma vez por quadro.
// ESTRATÉGIA: os eventos só anotam estado (teclas e botões segurados, teclas
// apertadas desde o último quadro); poll() monta o InputFrame e limpa as anotações.
import { emptyFrame, type InputFrame, type Slot } from '../core/input';
import type { Vec2 } from '../core/vec';

const DIGIT_TO_SLOT: Record<string, Slot> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
const MOUSE_LEFT = 0;
const MOUSE_RIGHT = 2;

export class KeyboardMouseInput {
  activity = false; // houve input deste dispositivo no último poll()
  private pendingActivity = false;
  private down = new Set<string>();     // teclas seguradas (KeyboardEvent.code)
  private pressed = new Set<string>();  // teclas apertadas desde o último poll()
  private buttons = new Set<number>();  // botões do mouse segurados
  private mouse: Vec2 | null = null;    // posição no canvas, em pixels lógicos

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code in DIGIT_TO_SLOT) e.preventDefault(); // Espaço rola a página
      if (e.repeat) return; // segurar a tecla não repete o golpe
      this.down.add(e.code);
      this.pressed.add(e.code);
      this.pendingActivity = true;
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    // mousedown/mouseup (e não pointerdown) disparam para CADA botão, mesmo com outro já apertado.
    canvas.addEventListener('mousedown', (e) => { this.buttons.add(e.button); this.pendingActivity = true; });
    window.addEventListener('mouseup', (e) => this.buttons.delete(e.button));
    canvas.addEventListener('mousemove', (e) => { this.mouse = this.toCanvas(e); this.pendingActivity = true; });
    // O botão direito é um gatilho, não o menu do navegador.
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    // Ao trocar de aba, o navegador não manda os keyup: soltar tudo evita tecla "presa".
    window.addEventListener('blur', () => { this.down.clear(); this.buttons.clear(); });
  }

  // Monta o quadro atual e zera o que é "apertado neste quadro".
  poll(): InputFrame {
    const f = emptyFrame();
    const k = (code: string) => this.down.has(code);
    f.move = { x: (k('KeyD') ? 1 : 0) - (k('KeyA') ? 1 : 0), y: (k('KeyS') ? 1 : 0) - (k('KeyW') ? 1 : 0) };
    f.aim = this.mouse ? { kind: 'point', screen: this.mouse } : null;
    f.areaHeld = this.buttons.has(MOUSE_RIGHT);
    f.singleHeld = this.buttons.has(MOUSE_LEFT);
    for (const code of this.pressed) if (code in DIGIT_TO_SLOT) f.slotPressed = DIGIT_TO_SLOT[code];
    f.basicPressed = this.pressed.has('Space');
    f.dashPressed = this.pressed.has('ShiftLeft') || this.pressed.has('ShiftRight');
    this.pressed.clear();
    this.activity = this.pendingActivity;
    this.pendingActivity = false;
    return f;
  }

  // Converte a posição do mouse na janela para pixels lógicos do canvas (o CSS estica o canvas).
  private toCanvas(e: MouseEvent): Vec2 {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * this.canvas.width) / r.width, y: ((e.clientY - r.top) * this.canvas.height) / r.height };
  }
}
