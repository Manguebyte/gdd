// Amarra física, regras e estado. No Marco 1 é um modo "treino" de um jogador:
// mirar → atirar → esperar tudo parar → contar capturas → mirar de novo.
//
// Não conhece React nem Three.js: quem desenha lê `physics` e o store.
// O Marco 2 acrescenta aqui o TurnManager (vez de cada jogador), a rodada de
// abertura e a eliminação, sem mexer na física nem na tela.

import type { GameConfig } from '../config/gameConfig';
import { CollisionSystem } from '../core/CollisionSystem';
import { makeEquilateralTriangle } from '../core/geometry';
import { rackPositions } from '../core/rack';
import { findCapturedStakes } from '../core/ScoringSystem';
import { shotImpulse, yawTowards } from '../core/shot';
import type { MarbleDef, MarblePattern, Triangle, Vec2 } from '../core/types';
import { PhysicsManager } from '../physics/PhysicsManager';
import type { GameStoreApi } from './store';

export const SHOOTER_ID = 'shooter-p1';

// Cores das casadas: uma por bolinha, repetindo se houver mais de 10.
const STAKE_LOOKS: Array<{ color: string; accent: string; pattern: MarblePattern }> = [
  { color: '#3fa7ff', accent: '#ffd23f', pattern: 'olho-de-gato' },
  { color: '#2ecc71', accent: '#f4f4f4', pattern: 'olho-de-gato' },
  { color: '#ff8a3d', accent: '#7a2bd1', pattern: 'olho-de-gato' },
  { color: '#f2f2f2', accent: '#2f6bff', pattern: 'leitosa' },
  { color: '#ff4f7b', accent: '#ffe066', pattern: 'olho-de-gato' },
  { color: '#9b5de5', accent: '#00f5d4', pattern: 'olho-de-gato' },
  { color: '#fff3c4', accent: '#e85d04', pattern: 'leitosa' },
  { color: '#00bbf9', accent: '#f15bb5', pattern: 'olho-de-gato' },
  { color: '#c7f464', accent: '#1b4332', pattern: 'olho-de-gato' },
  { color: '#e9ecef', accent: '#2b9348', pattern: 'leitosa' },
];

export class GameManager {
  physics: PhysicsManager;
  readonly triangle: Triangle;
  private readonly collisions = new CollisionSystem();
  private readonly defs = new Map<string, MarbleDef>();
  private stakeIds: string[] = [];
  private shotTime = 0;

  constructor(
    readonly cfg: GameConfig,
    private readonly store: GameStoreApi,
  ) {
    this.triangle = makeEquilateralTriangle({ x: cfg.triangle.centerX, z: cfg.triangle.centerZ }, cfg.triangle.side);
    this.physics = this.createPhysics();
  }

  private createPhysics(): PhysicsManager {
    const physics = new PhysicsManager(this.cfg);
    physics.onContact = (a, b) => this.collisions.onContact(a, b);
    return physics;
  }

  get triangleCenter(): Vec2 {
    return { x: this.cfg.triangle.centerX, z: this.cfg.triangle.centerZ };
  }

  def(id: string): MarbleDef {
    const d = this.defs.get(id);
    if (!d) throw new Error(`Bolinha desconhecida: ${id}`);
    return d;
  }

  /** Monta uma rodada nova: mundo físico limpo, casadas no triângulo e a bolinha de tiro na área de tiro. */
  newRack(): void {
    this.physics.dispose();
    this.physics = this.createPhysics();
    this.defs.clear();

    const { cfg } = this;
    const spacing = cfg.marble.radius * 2 + cfg.stakes.gap;
    const positions = rackPositions(cfg.stakes.count, this.triangleCenter, spacing);
    this.stakeIds = positions.map((pos, i) => {
      const id = `stake-${i}`;
      this.defs.set(id, { id, role: 'stake', ...STAKE_LOOKS[i % STAKE_LOOKS.length] });
      this.physics.addMarble(id, pos);
      return id;
    });

    const start = { x: cfg.shooter.startX, z: cfg.shooter.startZ };
    this.defs.set(SHOOTER_ID, { id: SHOOTER_ID, role: 'shooter', ownerId: 'p1', color: '#d62828', accent: '#fdf0d5', pattern: 'leitosa' });
    this.physics.addMarble(SHOOTER_ID, start);

    this.shotTime = 0;
    this.store.setState((s) => ({
      phase: 'AIMING',
      shots: 0,
      captured: 0,
      stakesTotal: this.stakeIds.length,
      stakesRemaining: this.stakeIds.length,
      marbleIds: [...this.stakeIds, SHOOTER_ID],
      aim: { ...s.aim, yawDeg: yawTowards(start, this.triangleCenter), locked: false },
      toast: null,
    }));
  }

  /** Confirma o tiro com a mira atual. Ignorado se não for hora de mirar. */
  shoot(): void {
    const s = this.store.getState();
    if (s.phase !== 'AIMING' || s.aim.power <= 0) return;
    const { shot } = this.cfg;
    this.collisions.beginShot(SHOOTER_ID);
    this.physics.applyImpulse(SHOOTER_ID, shotImpulse(s.aim, shot.maxImpulse, shot.maxPitchDeg));
    this.shotTime = 0;
    this.store.setState({ phase: 'SHOT_IN_PROGRESS', shots: s.shots + 1 });
  }

  /** Chamado a cada quadro de tela com o tempo real que passou. */
  update(dt: number): void {
    this.physics.advance(dt);
    if (this.store.getState().phase !== 'SHOT_IN_PROGRESS') return;
    this.shotTime += dt;
    if (this.shotTime > this.cfg.turn.maxShotSeconds) this.physics.freezeAll();
    if (this.physics.isSettled()) this.resolveTurn();
  }

  /** Tudo parou: conta as casadas que saíram inteiras do triângulo, tira da arena e volta a mirar. */
  private resolveTurn(): void {
    this.store.setState({ phase: 'RESOLVING_TURN' });
    const stakes = this.stakeIds.map((id) => ({ id, position: this.physics.getGroundPosition(id)! }));
    const capturedIds = findCapturedStakes(stakes, this.triangle, this.cfg.marble.radius);
    for (const id of capturedIds) this.physics.removeMarble(id);
    this.stakeIds = this.stakeIds.filter((id) => !capturedIds.includes(id));

    const s = this.store.getState();
    const remaining = this.stakeIds.length;
    const hits = this.collisions.directHitIds.length;
    if (capturedIds.length > 0) s.showToast(capturedIds.length === 1 ? '+1 casada capturada!' : `+${capturedIds.length} casadas capturadas!`);
    else if (hits === 0) s.showToast('Não acertou nenhuma bolinha');
    else s.showToast('Nenhuma saiu inteira do triângulo');

    this.store.setState({
      phase: remaining === 0 ? 'GAME_OVER' : 'AIMING',
      captured: s.captured + capturedIds.length,
      stakesRemaining: remaining,
      marbleIds: [...this.stakeIds, SHOOTER_ID],
      aim: { ...s.aim, locked: false },
    });
  }
}
