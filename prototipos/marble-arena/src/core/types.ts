// Tipos compartilhados pelas regras, pela física e pela tela.
// Nada aqui importa Three.js, Rapier ou React: as regras precisam rodar sozinhas
// (testes, IA simulando tiros, um servidor no futuro multiplayer online).

/** Ponto no chão da arena (plano XZ). */
export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Triangle {
  a: Vec2;
  b: Vec2;
  c: Vec2;
}

export type MarbleRole = 'shooter' | 'stake';

/** Padrões visuais das bolinhas (GDD §10). */
export type MarblePattern = 'olho-de-gato' | 'leitosa';

export interface MarbleDef {
  id: string;
  role: MarbleRole;
  /** Dono da bolinha de tiro; casadas não têm dono. */
  ownerId?: string;
  color: string;
  accent: string;
  pattern: MarblePattern;
}

/** Os três controles do tiro (GDD §5). */
export interface ShotParams {
  /** Direção horizontal em graus: 0 = para o fundo da arena (−z), 90 = para a direita (+x). */
  yawDeg: number;
  /** Força de 0 a 1. */
  power: number;
  /** Ângulo vertical em graus, de 0 (rasteiro) até `maxPitchDeg`. */
  pitchDeg: number;
}

/** Máquina de estados da partida (GDD §13). O Marco 1 usa só AIMING, SHOT_IN_PROGRESS, RESOLVING_TURN e GAME_OVER. */
export type GamePhase =
  | 'MAIN_MENU'
  | 'MATCH_SETUP'
  | 'OPENING_ROUND'
  | 'MAIN_GAME'
  | 'AIMING'
  | 'SHOT_IN_PROGRESS'
  | 'RESOLVING_TURN'
  | 'GAME_OVER';

/** Resultado de um tiro depois que tudo parou. */
export interface ShotResult {
  capturedIds: string[];
  /** Bolinhas que a bolinha de tiro tocou diretamente (base da eliminação no Marco 2). */
  directHitIds: string[];
}
