// src/input/InputManager.ts
// POR QUE: o jogador pode largar o controle e pegar o mouse no meio da fase;
// a HUD precisa mostrar os ícones certos e o jogo não pode misturar os dois.
// ESTRATÉGIA: o dispositivo que teve input por último vira o "ativo" (§2.4,
// regra 6); só o quadro dele vai para a regra do Core.
import { ModifierLatch, resolveCommand, type Command, type InputFrame, type SpecialSet } from '../core/input';
import type { GamepadInput } from './gamepad';
import type { KeyboardMouseInput } from './keyboardMouse';

export type Device = 'keyboardMouse' | 'gamepad';

export class InputManager {
  device: Device = 'keyboardMouse';
  modifier: SpecialSet | null = null; // gatilho que vale agora (a HUD acende o losango dele)
  private latch = new ModifierLatch();

  constructor(private km: KeyboardMouseInput, private pad: GamepadInput) {}

  // Uma vez por quadro: lê os dois dispositivos e devolve o quadro e o comando do ativo.
  poll(): { frame: InputFrame; command: Command } {
    const kmFrame = this.km.poll();
    const padFrame = this.pad.poll();
    if (this.pad.activity && this.device !== 'gamepad') this.switchTo('gamepad');
    else if (this.km.activity && !this.pad.activity && this.device !== 'keyboardMouse') this.switchTo('keyboardMouse');

    const frame = this.device === 'gamepad' ? padFrame : kmFrame;
    this.modifier = this.latch.update(frame.areaHeld, frame.singleHeld);
    return { frame, command: resolveCommand(frame, this.modifier) };
  }

  // Esquece o gatilho do dispositivo antigo ao trocar.
  private switchTo(d: Device): void {
    this.device = d;
    this.latch.reset();
  }
}
