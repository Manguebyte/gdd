// Todos os números de jogo num lugar só (GDD Parte 1 §14). São placeholders de
// protótipo: balancear é mexer aqui, não no código dos sistemas.
//
// Escala: 1 unidade = 1 cm. A gravidade fica em cm/s² para a bolinha cair e
// quicar como uma bolinha de verdade de 1,6 cm.

export interface GameConfig {
  physics: {
    /** Passo fixo da simulação, em segundos. */
    timeStep: number;
    /** Máximo de passos por quadro de tela (evita "espiral da morte" num quadro lento). */
    maxStepsPerFrame: number;
    /** Gravidade em cm/s². */
    gravity: number;
  };
  marble: {
    radius: number;
    /** Densidade em g/cm³ (vidro ≈ 2,5). A massa sai do volume da esfera. */
    density: number;
    friction: number;
    restitution: number;
    /** Coeficiente de resistência ao rolamento: desacelera `rr × g` cm/s² no chão. */
    rollingResistance: number;
    angularDamping: number;
    /** Abaixo destas velocidades a bolinha é considerada parada. */
    stopLinearSpeed: number;
    stopAngularSpeed: number;
  };
  ground: { friction: number; restitution: number };
  wall: { friction: number; restitution: number; height: number; thickness: number };
  arena: {
    /** Largura (x) e profundidade (z) da área jogável, em cm. O jogador fica do lado +z. */
    width: number;
    depth: number;
  };
  triangle: { centerX: number; centerZ: number; side: number };
  stakes: { count: number; gap: number };
  shootingArea: { centerZ: number; depth: number; width: number };
  referenceLine: { z: number };
  shooter: { startX: number; startZ: number };
  shot: {
    /** Impulso com força 100%, em g·cm/s. */
    maxImpulse: number;
    maxPitchDeg: number;
    defaultPower: number;
    defaultPitchDeg: number;
  };
  turn: {
    /** Quantos passos seguidos com tudo parado para encerrar o tiro. */
    settleSteps: number;
    /** Tempo máximo de um tiro; depois disso tudo é parado à força. */
    maxShotSeconds: number;
  };
}

export const GAME_CONFIG: GameConfig = {
  physics: { timeStep: 1 / 120, maxStepsPerFrame: 8, gravity: 981 },
  marble: {
    radius: 0.8,
    density: 2.5,
    friction: 0.4,
    restitution: 0.9,
    rollingResistance: 0.05,
    angularDamping: 0.3,
    stopLinearSpeed: 1.0,
    stopAngularSpeed: 1.5,
  },
  ground: { friction: 0.6, restitution: 0.15 },
  wall: { friction: 0.3, restitution: 0.45, height: 4, thickness: 3 },
  arena: { width: 180, depth: 130 },
  triangle: { centerX: 0, centerZ: -5, side: 36 },
  stakes: { count: 10, gap: 3 },
  shootingArea: { centerZ: 46, depth: 14, width: 120 },
  referenceLine: { z: -48 },
  shooter: { startX: 0, startZ: 46 },
  shot: { maxImpulse: 1900, maxPitchDeg: 45, defaultPower: 0.5, defaultPitchDeg: 0 },
  turn: { settleSteps: 30, maxShotSeconds: 20 },
};
