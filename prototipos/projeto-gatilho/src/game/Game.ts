// src/game/Game.ts
// POR QUE: o estado do jogo (herói, inimigos, sala atual) num lugar só, sem
// saber de canvas nem de dispositivo; recebe o quadro de input já resolvido.
// ESTRATÉGIA: update(dt) roda uma vez por quadro: aplica o comando, move o
// herói, prende-o dentro dos limites da sala, move os inimigos e avança as salas.
import { GAME, type EnemyKind } from '../config/gameConfig';
import { SPECIALS, type Shape } from '../config/specials';
import { ROOM_HEIGHT, roomX, STAGE } from '../config/stage';
import { Cooldowns } from '../core/cooldowns';
import type { Command, InputFrame } from '../core/input';
import { areaTargets, singleTarget } from '../core/targeting';
import { add, clampLen, len, norm, scale, sub, type Vec2 } from '../core/vec';

export interface Hero {
  pos: Vec2;
  facing: Vec2;   // direção da mira, tamanho 1
  hp: number;
  invuln: number; // segundos de invulnerabilidade restantes
  dashTime: number;
  dashDir: Vec2;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  pos: Vec2;
  radius: number;
  hp: number;
  maxHp: number;
  attackCd: number;  // segundos até poder bater de novo
  hurtFlash: number; // segundos piscando depois de levar golpe
}

// Um golpe desenhado por alguns décimos de segundo (só visual).
export interface Effect { shape: Shape; origin: Vec2; facing: Vec2; target: Vec2 | null; time: number }

export interface Rect { x: number; y: number; w: number; h: number }

export class Game {
  hero: Hero;
  enemies: Enemy[] = [];
  effects: Effect[] = [];
  cooldowns = new Cooldowns();
  roomIndex = 0;
  waveIndex = 0;
  cleared = false;   // a sala atual já foi vencida (a porta está aberta)
  state: 'playing' | 'victory' = 'playing';
  private nextId = 1;

  constructor() {
    this.hero = this.newHero();
    this.spawnWave();
  }

  // Herói novo, na entrada da sala atual.
  private newHero(): Hero {
    return {
      pos: { x: roomX(this.roomIndex) + 60, y: ROOM_HEIGHT / 2 },
      facing: { x: 1, y: 0 }, hp: GAME.hero.maxHp, invuln: 0, dashTime: 0, dashDir: { x: 1, y: 0 },
    };
  }

  // Onde o herói pode andar: a sala atual; vencida, a próxima também (§5).
  bounds(): Rect {
    const i = this.roomIndex;
    const w = STAGE[i].width + (this.cleared && i + 1 < STAGE.length ? STAGE[i + 1].width : 0);
    return { x: roomX(i), y: 0, w, h: ROOM_HEIGHT };
  }

  // Um quadro de jogo. aimDir já vem convertido para o mundo pelo main.ts.
  update(dt: number, frame: InputFrame, command: Command, aimDir: Vec2 | null): void {
    if (this.state !== 'playing') return;
    const h = this.hero;
    h.invuln = Math.max(0, h.invuln - dt);
    this.cooldowns.tick(dt);
    for (const fx of this.effects) fx.time -= dt;
    this.effects = this.effects.filter((fx) => fx.time > 0);

    // Mira: analógico direito/mouse; sem mira, olha para onde anda (§2.5).
    if (aimDir && len(aimDir) > 0) h.facing = norm(aimDir);
    else if (len(frame.move) > 0) h.facing = norm(frame.move);

    if (command) this.execute(command, frame);

    // Esquiva tem velocidade própria; fora dela, anda com o input (no máximo velocidade cheia).
    if (h.dashTime > 0) {
      h.dashTime -= dt;
      h.pos = add(h.pos, scale(h.dashDir, GAME.hero.dashSpeed * dt));
    } else {
      h.pos = add(h.pos, scale(clampLen(frame.move, 1), GAME.hero.speed * dt));
    }
    h.pos = clampInside(h.pos, this.bounds(), GAME.hero.radius);

    this.updateEnemies(dt);
    this.updateProgress();
  }

  // Executa um comando do Core: básico, esquiva ou um dos 8 especiais.
  private execute(c: NonNullable<Command>, frame: InputFrame): void {
    const h = this.hero;
    const cd = this.cooldowns;
    switch (c.kind) {
      case 'dash':
        if (!cd.ready('dash')) return;
        cd.start('dash', GAME.hero.dashCooldown);
        this.dash(frame);
        return;
      case 'basic': {
        if (!cd.ready('basic')) return;
        cd.start('basic', GAME.basic.cooldown);
        const shape: Shape = { kind: 'cone', range: GAME.basic.range, halfAngle: GAME.basic.halfAngle };
        this.hit(areaTargets(shape, h.pos, h.facing, this.enemies), GAME.basic.damage);
        this.effects.push({ shape, origin: h.pos, facing: h.facing, target: null, time: 0.12 });
        return;
      }
      case 'special': {
        const def = SPECIALS[c.set][c.slot];
        if (!cd.ready(def.id)) return; // §2.4, regra 4: em recarga não faz nada
        if (def.shape.kind === 'single') {
          const t = singleTarget(h.pos, h.facing, def.shape.range, GAME.combat.singleAimHalfAngle, this.enemies);
          if (!t) return; // §2.4, regra 5: sem alvo não gasta a recarga
          this.hit([t], def.damage);
          this.effects.push({ shape: def.shape, origin: h.pos, facing: h.facing, target: t.pos, time: 0.2 });
        } else {
          this.hit(areaTargets(def.shape, h.pos, h.facing, this.enemies), def.damage);
          this.effects.push({ shape: def.shape, origin: h.pos, facing: h.facing, target: null, time: 0.25 });
        }
        cd.start(def.id, def.cooldown);
        return;
      }
    }
  }

  // Esquiva na direção do movimento (ou da mira, parado), invulnerável enquanto dura.
  private dash(frame: InputFrame): void {
    const h = this.hero;
    h.dashTime = GAME.hero.dashTime;
    h.dashDir = len(frame.move) > 0 ? norm(frame.move) : h.facing;
    h.invuln = Math.max(h.invuln, GAME.hero.dashTime);
  }

  // Aplica dano e tira da lista quem morreu.
  private hit(targets: Enemy[], damage: number): void {
    for (const e of targets) {
      e.hp -= damage;
      e.hurtFlash = 0.1;
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
  }

  // Cria os inimigos da onda atual na metade direita da sala, longe da entrada.
  private spawnWave(): void {
    const room = STAGE[this.roomIndex];
    const x0 = roomX(this.roomIndex);
    for (const { kind, count } of room.waves[this.waveIndex]) {
      const def = GAME.enemies[kind];
      for (let n = 0; n < count; n++) {
        this.enemies.push({
          id: this.nextId++, kind, radius: def.radius, hp: def.hp, maxHp: def.hp, attackCd: def.attackCooldown, hurtFlash: 0,
          pos: { x: x0 + room.width * (0.55 + Math.random() * 0.4), y: def.radius + Math.random() * (ROOM_HEIGHT - 2 * def.radius) },
        });
      }
    }
  }

  // Inimigos andam até o herói e batem por contato, com intervalo (§4, placeholder).
  private updateEnemies(dt: number): void {
    const h = this.hero;
    for (const e of this.enemies) {
      const def = GAME.enemies[e.kind];
      e.attackCd = Math.max(0, e.attackCd - dt);
      e.hurtFlash = Math.max(0, e.hurtFlash - dt);
      const d = sub(h.pos, e.pos);
      const l = len(d);
      const reach = e.radius + GAME.hero.radius;
      if (l > reach) {
        e.pos = add(e.pos, scale(norm(d), Math.min(def.speed * dt, l - reach)));
      } else if (e.attackCd === 0) {
        e.attackCd = def.attackCooldown;
        if (h.invuln === 0) {
          h.hp -= def.contactDamage;
          h.invuln = GAME.hero.hurtInvuln;
        }
      }
    }
  }

  // Onda vencida → próxima onda; última onda → sala vencida; entrar na próxima sala → novas ondas.
  private updateProgress(): void {
    const h = this.hero;
    if (h.hp <= 0) return this.restartRoom();
    const room = STAGE[this.roomIndex];
    if (!this.cleared && this.enemies.length === 0) {
      if (this.waveIndex + 1 < room.waves.length) {
        this.waveIndex++;
        this.spawnWave();
      } else {
        this.cleared = true;
        if (this.roomIndex === STAGE.length - 1) this.state = 'victory';
      }
    }
    const next = this.roomIndex + 1;
    // Só conta como "entrou" com o herói inteiro do lado de lá da porta.
    if (this.cleared && next < STAGE.length && h.pos.x > roomX(next) + GAME.hero.radius * 2) {
      this.roomIndex = next;
      this.waveIndex = 0;
      this.cleared = false;
      this.spawnWave();
    }
  }

  // §6, proposta: morrer recomeça a sala atual; as anteriores continuam vencidas.
  private restartRoom(): void {
    this.enemies = [];
    this.effects = [];
    this.cooldowns.clear();
    this.waveIndex = 0;
    this.cleared = false;
    this.hero = this.newHero();
    this.spawnWave();
  }
}

// Prende um círculo de raio r dentro do retângulo.
export function clampInside(p: Vec2, r: Rect, radius: number): Vec2 {
  return {
    x: Math.min(r.x + r.w - radius, Math.max(r.x + radius, p.x)),
    y: Math.min(r.y + r.h - radius, Math.max(r.y + radius, p.y)),
  };
}
