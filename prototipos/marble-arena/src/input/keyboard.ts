// Teclado do tiro. Separado da tela para o Marco 4 trocar por controles de
// toque (ou pela IA) sem mexer no GameManager: tudo vira chamada no store.

import type { GameManager } from '../game/GameManager';
import type { GameStoreApi } from '../game/store';

/** Liga os atalhos de teclado. Devolve a função que desliga. */
export function bindKeyboard(game: GameManager, store: GameStoreApi): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return; // os sliders cuidam das próprias setas
    const s = store.getState();
    const fine = e.shiftKey ? 0.2 : 1;
    switch (e.code) {
      case 'KeyA':
      case 'ArrowLeft':
        s.setLocked(true);
        s.rotateYaw(-1 * fine);
        break;
      case 'KeyD':
      case 'ArrowRight':
        s.setLocked(true);
        s.rotateYaw(1 * fine);
        break;
      case 'KeyW':
      case 'ArrowUp':
        s.setPower(s.aim.power + 0.02 * fine);
        break;
      case 'KeyS':
      case 'ArrowDown':
        s.setPower(s.aim.power - 0.02 * fine);
        break;
      case 'KeyE':
        s.setPitch(s.aim.pitchDeg + 1 * fine);
        break;
      case 'KeyQ':
        s.setPitch(s.aim.pitchDeg - 1 * fine);
        break;
      case 'KeyL':
        s.setLocked(!s.aim.locked);
        break;
      case 'KeyF':
        s.toggleFollowCam();
        break;
      case 'Space':
      case 'Enter':
        game.shoot();
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
