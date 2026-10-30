// src/input/gamepad.ts
// POR QUE: a Gamepad API não manda eventos de botão; o jogo precisa ler o
// controle a cada quadro e descobrir sozinho o que foi apertado agora.
// ESTRATÉGIA: compara os botões deste quadro com os do anterior ("apertou" =
// está segurado agora e não estava antes). Usa o "standard mapping", em que o
// índice de cada botão é o mesmo em controles de PlayStation e Xbox.
import { GAME } from '../config/gameConfig';
import { emptyFrame, type InputFrame, type Slot } from '../core/input';
import { len, norm, scale, type Vec2 } from '../core/vec';

// Índices do standard mapping (PlayStation / Xbox).
const BTN = { CROSS: 0, CIRCLE: 1, SQUARE: 2, TRIANGLE: 3, R1: 5, R2: 7 } as const;
// Ordem do briefing: X, △, □, ○ = slots 0..3.
const FACE_TO_SLOT: [number, Slot][] = [[BTN.CROSS, 0], [BTN.TRIANGLE, 1], [BTN.SQUARE, 2], [BTN.CIRCLE, 3]];

// Zona morta radial: ignora o analógico perto do centro e reescala o resto para 0..1.
function deadzone(v: Vec2, dz: number): Vec2 {
  const l = len(v);
  if (l < dz) return { x: 0, y: 0 };
  return scale(norm(v), Math.min(1, (l - dz) / (1 - dz)));
}

export class GamepadInput {
  activity = false;   // houve input do controle no último poll()
  connected = false;
  private prev: boolean[] = [];

  // Lê o primeiro controle conectado e monta o quadro.
  poll(): InputFrame {
    const f = emptyFrame();
    const pad = navigator.getGamepads().find((p) => p?.connected) ?? null;
    this.connected = pad !== null;
    this.activity = false;
    if (!pad) { this.prev = []; return f; }

    const dz = GAME.input.stickDeadzone;
    f.move = deadzone({ x: pad.axes[0] ?? 0, y: pad.axes[1] ?? 0 }, dz);
    const look = deadzone({ x: pad.axes[2] ?? 0, y: pad.axes[3] ?? 0 }, dz);
    f.aim = len(look) > 0 ? { kind: 'dir', dir: norm(look) } : null;

    // R2 é analógico (0..1): conta como segurado acima do limiar.
    const held = pad.buttons.map((b, i) => (i === BTN.R2 ? b.value > GAME.input.triggerThreshold : b.pressed));
    const pressed = (i: number) => held[i] && !this.prev[i];

    f.areaHeld = held[BTN.R1] ?? false;
    f.singleHeld = held[BTN.R2] ?? false;
    for (const [btn, slot] of FACE_TO_SLOT) if (pressed(btn)) f.slotPressed = slot;
    // O botão de face sempre se declara também como básico/esquiva;
    // resolveCommand (core/input.ts) é quem ignora isso com gatilho segurado.
    f.basicPressed = pressed(BTN.SQUARE);
    f.dashPressed = pressed(BTN.CROSS);

    this.activity = len(f.move) > 0 || f.aim !== null || held.some(Boolean);
    this.prev = held;
    return f;
  }
}
