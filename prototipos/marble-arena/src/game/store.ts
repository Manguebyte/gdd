// Estado da partida que a interface mostra, num store do Zustand.
//
// O store é "vanilla" (não depende do React): o GameManager escreve nele de
// fora do React, e os componentes leem com `useGame`. Posição de bolinha NÃO
// mora aqui, porque muda 60 vezes por segundo; a tela lê direto da física.

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { GAME_CONFIG } from '../config/gameConfig';
import { clamp, wrapDeg } from '../core/shot';
import type { GamePhase } from '../core/types';

export interface AimState {
  yawDeg: number;
  power: number;
  pitchDeg: number;
  /** Direção travada: o mouse para de mexer na mira. */
  locked: boolean;
}

export interface Toast {
  id: number;
  text: string;
}

export interface GameStore {
  phase: GamePhase;
  shots: number;
  captured: number;
  stakesTotal: number;
  stakesRemaining: number;
  /** Bolinhas ainda na arena, na ordem de criação (a tela cria um componente por id). */
  marbleIds: string[];
  aim: AimState;
  followCam: boolean;
  toast: Toast | null;

  setYaw(deg: number): void;
  rotateYaw(delta: number): void;
  setPower(power: number): void;
  setPitch(deg: number): void;
  setLocked(locked: boolean): void;
  toggleFollowCam(): void;
  showToast(text: string): void;
}

let toastId = 0;

export const gameStore = createStore<GameStore>()((set) => ({
  phase: 'AIMING',
  shots: 0,
  captured: 0,
  stakesTotal: 0,
  stakesRemaining: 0,
  marbleIds: [],
  aim: { yawDeg: 0, power: GAME_CONFIG.shot.defaultPower, pitchDeg: GAME_CONFIG.shot.defaultPitchDeg, locked: false },
  followCam: false,
  toast: null,

  setYaw: (deg) => set((s) => ({ aim: { ...s.aim, yawDeg: wrapDeg(deg) } })),
  rotateYaw: (delta) => set((s) => ({ aim: { ...s.aim, yawDeg: wrapDeg(s.aim.yawDeg + delta) } })),
  setPower: (power) => set((s) => ({ aim: { ...s.aim, power: clamp(power, 0, 1) } })),
  setPitch: (deg) => set((s) => ({ aim: { ...s.aim, pitchDeg: clamp(deg, 0, GAME_CONFIG.shot.maxPitchDeg) } })),
  setLocked: (locked) => set((s) => ({ aim: { ...s.aim, locked } })),
  toggleFollowCam: () => set((s) => ({ followCam: !s.followCam })),
  showToast: (text) => set({ toast: { id: ++toastId, text } }),
}));

export type GameStoreApi = typeof gameStore;

/** Hook para os componentes React lerem um pedaço do estado. */
export function useGame<T>(selector: (s: GameStore) => T): T {
  return useStore(gameStore, selector);
}
