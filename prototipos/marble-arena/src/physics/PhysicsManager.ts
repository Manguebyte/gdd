// Dono do mundo do Rapier: chão, paredes e bolinhas.
//
// Não conhece regras nem tela. Recebe tempo, dá passos FIXOS de simulação
// (mesmo tiro = mesmo resultado na mesma máquina) e responde perguntas
// ("onde está a bolinha X?", "tudo parou?"). Isso deixa a mesma classe servir
// ao jogo, aos testes e, no futuro, à IA simulando tiros e a um servidor.

import RAPIER from '@dimforge/rapier3d-compat';
import type { GameConfig } from '../config/gameConfig';
import type { Vec2, Vec3 } from '../core/types';

let initPromise: Promise<void> | null = null;

/** Carrega o WebAssembly do Rapier uma vez só. Precisa terminar antes de criar um PhysicsManager. */
export function initPhysics(): Promise<void> {
  initPromise ??= RAPIER.init();
  return initPromise;
}

interface MarbleBody {
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
}

export class PhysicsManager {
  /** Avisado a cada par de bolinhas que começa a se tocar (ids das bolinhas). */
  onContact: ((a: string, b: string) => void) | null = null;

  private readonly world: RAPIER.World;
  private readonly events = new RAPIER.EventQueue(true);
  private readonly marbles = new Map<string, MarbleBody>();
  private readonly idByCollider = new Map<number, string>();
  private accumulator = 0;
  private stillSteps = 0;

  constructor(private readonly cfg: GameConfig) {
    this.world = new RAPIER.World({ x: 0, y: -cfg.physics.gravity, z: 0 });
    this.world.timestep = cfg.physics.timeStep;
    this.buildArena();
  }

  /** Chão de terra batida e as quatro tábuas em volta da área jogável. */
  private buildArena(): void {
    const { arena, ground, wall } = this.cfg;
    const Rule = RAPIER.CoefficientCombineRule;

    // Chão: uma caixa grossa com o topo em y = 0. Restituição com regra Min,
    // para a terra "engolir" o quique mesmo que a bolinha de vidro seja elástica.
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(arena.width, 5, arena.depth)
        .setTranslation(0, -5, 0)
        .setFriction(ground.friction)
        .setRestitution(ground.restitution)
        .setRestitutionCombineRule(Rule.Min),
    );

    const hw = arena.width / 2;
    const hd = arena.depth / 2;
    const t = wall.thickness / 2;
    const h = wall.height / 2;
    const walls: Array<[number, number, number, number]> = [
      // [centro x, centro z, meia largura x, meia profundidade z]
      [0, -hd - t, hw + wall.thickness, t],
      [0, hd + t, hw + wall.thickness, t],
      [-hw - t, 0, t, hd],
      [hw + t, 0, t, hd],
    ];
    for (const [x, z, hx, hz] of walls) {
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(hx, h, hz)
          .setTranslation(x, h, z)
          .setFriction(wall.friction)
          .setRestitution(wall.restitution)
          .setRestitutionCombineRule(Rule.Min),
      );
    }
  }

  /** Cria uma bolinha parada, apoiada no chão em `pos`. */
  addMarble(id: string, pos: Vec2): void {
    const m = this.cfg.marble;
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(pos.x, m.radius, pos.z)
        .setAngularDamping(m.angularDamping)
        .setCcdEnabled(true)
        .setCanSleep(true),
    );
    const collider = this.world.createCollider(
      RAPIER.ColliderDesc.ball(m.radius)
        .setDensity(m.density)
        .setFriction(m.friction)
        .setRestitution(m.restitution)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body,
    );
    this.marbles.set(id, { body, collider });
    this.idByCollider.set(collider.handle, id);
  }

  removeMarble(id: string): void {
    const m = this.marbles.get(id);
    if (!m) return;
    this.idByCollider.delete(m.collider.handle);
    this.world.removeRigidBody(m.body);
    this.marbles.delete(id);
  }

  hasMarble(id: string): boolean {
    return this.marbles.has(id);
  }

  /** Massa da bolinha em gramas (vem da densidade × volume). */
  marbleMass(): number {
    const first = this.marbles.values().next().value as MarbleBody | undefined;
    if (first) return first.body.mass();
    const r = this.cfg.marble.radius;
    return this.cfg.marble.density * (4 / 3) * Math.PI * r * r * r;
  }

  applyImpulse(id: string, impulse: Vec3): void {
    const m = this.marbles.get(id);
    if (!m) return;
    m.body.applyImpulse(impulse, true);
    this.stillSteps = 0;
  }

  /**
   * Avança a simulação por `dt` segundos de tempo real usando passos fixos.
   * O que sobra fica no acumulador para o próximo quadro. Devolve quantos passos deu.
   */
  advance(dt: number): number {
    const step = this.cfg.physics.timeStep;
    this.accumulator = Math.min(this.accumulator + dt, step * this.cfg.physics.maxStepsPerFrame);
    let steps = 0;
    while (this.accumulator >= step) {
      this.stepOnce();
      this.accumulator -= step;
      steps++;
    }
    return steps;
  }

  /** Um passo fixo: resistência ao rolamento, passo do Rapier, eventos de contato e checagem de repouso. */
  stepOnce(): void {
    this.applyRollingResistance();
    this.world.step(this.events);
    this.events.drainCollisionEvents((h1, h2, started) => {
      if (!started || !this.onContact) return;
      const a = this.idByCollider.get(h1);
      const b = this.idByCollider.get(h2);
      if (a !== undefined && b !== undefined) this.onContact(a, b);
    });
    this.stillSteps = this.allStill() ? this.stillSteps + 1 : 0;
  }

  /**
   * O Rapier não tem atrito de rolamento: uma esfera perfeita rolaria para sempre.
   * Aqui tiramos `rr × g × dt` da velocidade horizontal de toda bolinha apoiada
   * no chão, e o mesmo tanto (em proporção) da rotação, para ela continuar rolando
   * sem deslizar. Bolinha bem devagar é parada de vez e posta para dormir.
   */
  private applyRollingResistance(): void {
    const m = this.cfg.marble;
    const dt = this.cfg.physics.timeStep;
    const decel = m.rollingResistance * this.cfg.physics.gravity * dt;
    for (const { body } of this.marbles.values()) {
      if (body.isSleeping()) continue;
      const p = body.translation();
      if (p.y > m.radius + 0.05) continue; // no ar: só gravidade
      const v = body.linvel();
      const w = body.angvel();
      const hs = Math.hypot(v.x, v.z);
      const ws = Math.hypot(w.x, w.y, w.z);
      if (hs < m.stopLinearSpeed && Math.abs(v.y) < m.stopLinearSpeed && ws < m.stopAngularSpeed) {
        body.setLinvel({ x: 0, y: 0, z: 0 }, false);
        body.setAngvel({ x: 0, y: 0, z: 0 }, false);
        body.sleep();
        continue;
      }
      if (hs === 0) continue;
      const k = Math.max(0, hs - decel) / hs;
      body.setLinvel({ x: v.x * k, y: v.y, z: v.z * k }, true);
      body.setAngvel({ x: w.x * k, y: w.y * k, z: w.z * k }, true);
    }
  }

  private allStill(): boolean {
    const m = this.cfg.marble;
    for (const { body } of this.marbles.values()) {
      if (body.isSleeping()) continue;
      const v = body.linvel();
      const w = body.angvel();
      if (Math.hypot(v.x, v.y, v.z) >= m.stopLinearSpeed || Math.hypot(w.x, w.y, w.z) >= m.stopAngularSpeed) return false;
    }
    return true;
  }

  /** Tudo parado há `settleSteps` passos seguidos: o tiro acabou. */
  isSettled(): boolean {
    return this.stillSteps >= this.cfg.turn.settleSteps;
  }

  /** Para tudo na hora (tiro que estourou o tempo máximo). */
  freezeAll(): void {
    for (const { body } of this.marbles.values()) {
      body.setLinvel({ x: 0, y: 0, z: 0 }, false);
      body.setAngvel({ x: 0, y: 0, z: 0 }, false);
      body.sleep();
    }
    this.stillSteps = this.cfg.turn.settleSteps;
  }

  getPosition(id: string): Vec3 | null {
    const m = this.marbles.get(id);
    if (!m) return null;
    const p = m.body.translation();
    return { x: p.x, y: p.y, z: p.z };
  }

  /** Rotação como quatérnio {x, y, z, w}, para a tela girar a bolinha. */
  getRotation(id: string): { x: number; y: number; z: number; w: number } | null {
    const m = this.marbles.get(id);
    return m ? m.body.rotation() : null;
  }

  getGroundPosition(id: string): Vec2 | null {
    const p = this.getPosition(id);
    return p ? { x: p.x, z: p.z } : null;
  }

  getSpeed(id: string): number {
    const m = this.marbles.get(id);
    if (!m) return 0;
    const v = m.body.linvel();
    return Math.hypot(v.x, v.y, v.z);
  }

  /** Libera a memória do WebAssembly. O objeto não pode ser usado depois. */
  dispose(): void {
    this.events.free();
    this.world.free();
    this.marbles.clear();
    this.idByCollider.clear();
  }
}
