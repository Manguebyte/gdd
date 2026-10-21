// Space Hauler — regras do jogo, sem nada de tela.
// POR QUE: é um porte direto do guia Unity do SpaceHauler.md (ShipController,
// ShipHull, HullPlating, TripManager, EnemySpawner, AsteroidField, os Enemy, as
// Defense, ScrapWallet, AllocationController, AbilityController, RouteGenerator,
// Station, RunManager). Sem DOM, roda também no Node para testar balanceamento
// (ver autoPlay).
// ESTRATÉGIA: tudo acontece num plano 2D em metros: x = distância percorrida na
// rota, y = lado (positivo = bombordo/esquerda da nave). game.js só lê este
// estado e escuta os eventos (on) para desenhar efeitos.
(function (root) {
  'use strict';
  const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.SH_DATA;
  const {
    CONFIG, PLATING, STATION, ASTEROIDS, ANNEXES, PILOT, TRIP_TYPES, TRIP_TYPE_ORDER, BOSS_TRIP_TYPE,
    HARDPOINTS, DEFENSES, DEFENSE_ORDER, ENEMIES, ENEMY_POOL, ABILITIES,
  } = D;

  // Gerador de números com semente (para testes repetíveis no Node).
  function seededRandom(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const DEG = Math.PI / 180;
  const dirOf = (deg) => [Math.cos(deg * DEG), Math.sin(deg * DEG)];

  class Sim {
    constructor(opts = {}) {
      this.cfg = Object.assign({}, CONFIG, opts.config || {});
      this.rand = opts.rand || Math.random;
      this.meta = Object.assign({ runsStarted: 0, runsCompleted: 0, bestTrips: 0 }, opts.meta || {});
      this.saveMeta = opts.saveMeta || (() => {});
      this.unlockAll = !!opts.unlockAll;
      this.listeners = [];

      this.ship = { x: 0, y: 0, hull: this.cfg.shipBaseHull, plating: 0, pilot: 0, shield: 0, shieldIdle: 0, speedMult: 1, flash: 0, shieldFlash: 0 };
      this.annexes = {};     // id do anexo → nível comprado nesta run
      this.hardpoints = [];
      this.resetHardpoints();
      this.enemies = [];
      this.asteroids = [];
      this.clouds = [];
      this.scrap = 0;
      this.cooldowns = ABILITIES.map(() => 0);
      this.afterburnerTimer = 0;

      this.phase = 'menu';   // menu | route | trip | station | result
      this.running = false;
      this.settings = null;
      this.blockers = 0;
      this.budget = 0;
      this.asteroidBudget = 0;
      this.nextSpawn = null;
      this.bossSpawned = false;
      this.nextId = 0;
      this.time = 0;

      this.route = null;
      this.current = null;   // nó atual; null = ainda no planeta de origem
      this.visited = [];
      this.tripsDone = 0;
      this.shop = [];        // defesas liberadas nesta run
      this.result = null;
    }

    on(fn) { this.listeners.push(fn); }
    emit(type, data) { for (const fn of this.listeners) fn(type, data || {}); }
    range(a, b) { return a + (b - a) * this.rand(); }

    get progress() { return Math.min(1, Math.max(0, this.ship.x / this.cfg.tripLength)); }
    // Velocidade de cruzeiro: a base mais o bônus do Piloto. É a que os piratas acompanham.
    get cruiseSpeed() { return this.cfg.shipSpeed * (1 + PILOT.speedPerLevel * this.ship.pilot); }
    get shipSpeed() { return this.cruiseSpeed * this.ship.speedMult; }
    get maxHull() { return this.cfg.shipBaseHull + PLATING.hullPerLevel * this.ship.plating; }
    get collisionReduction() { return PLATING.collisionReductionPerLevel * this.ship.plating; }
    get maxShield() { return ANNEXES.shield.shieldPerLevel * (this.annexes.shield || 0); }

    // Volta aos 6 hardpoints de fábrica; os dos casulos entram quando o anexo é comprado.
    resetHardpoints() {
      this.hardpoints = [];
      for (const h of HARDPOINTS) this.addHardpoint(h);
    }
    addHardpoint(h) {
      const hp = Object.assign({}, h, { index: this.hardpoints.length, defense: null, saboteurs: 0 });
      this.hardpoints.push(hp);
      return hp;
    }

    // ------------------------------------------------------------------ Run (RunManager)

    // Começa uma run do zero: rota nova, nave vazia, sucata inicial.
    newRun() {
      this.route = generateRoute(this.cfg, this.rand);
      this.current = null;
      this.visited = [];
      this.tripsDone = 0;
      this.result = null;
      this.resetHardpoints();
      this.annexes = {};
      this.ship.plating = 0;
      this.ship.pilot = 0;
      this.ship.shield = 0;
      this.ship.hull = this.maxHull;
      this.ship.x = 0;
      this.scrap = this.cfg.startingScrap;
      this.shop = this.unlockedDefenses();
      this.meta.runsStarted++;
      this.saveMeta(this.meta);
      this.phase = 'route';
      this.emit('phase');
    }

    // Defesas cujo requisito de desbloqueio já foi atingido (placeholder, Parte 1 §10).
    unlockedDefenses() {
      return DEFENSE_ORDER.map((id) => DEFENSES[id])
        .filter((d) => this.unlockAll || d.unlockAtBestTrips <= this.meta.bestTrips);
    }

    canChoose(node) {
      if (this.phase !== 'route') return false;
      if (!this.current) return node.layer === 0;
      return node.layer === this.current.layer + 1 && this.current.next.includes(node.index);
    }

    chooseNode(node) {
      if (!this.canChoose(node)) return false;
      this.current = node;
      this.visited.push(node);
      if (node.type === 'station') {
        this.phase = 'station';   // sem combate: só reparo (e compras)
        this.emit('phase');
        return true;
      }
      if (!this.cfg.carryHullBetweenTrips) this.ship.hull = this.maxHull;
      this.phase = 'trip';
      this.startTrip(nodeSettings(node, this.cfg));
      return true;
    }

    // Abandona a run (pausa → desistir). Não conta como trecho concluído.
    abandon() {
      this.running = false;
      this.clearEnemies();
      this.asteroids = [];
      this.clouds = [];
      this.phase = 'menu';
      this.emit('phase');
    }

    // ------------------------------------------------------------------ Estação (Station)

    repairCost(amount) { return Math.ceil(amount / STATION.hullPerScrap); }
    missingHull() { return Math.max(0, this.maxHull - this.ship.hull); }

    // Repara até "amount" de casco pagando sucata. Devolve quanto reparou.
    repair(amount) {
      if (this.phase !== 'station') return 0;
      amount = Math.min(amount, this.missingHull(), this.scrap * STATION.hullPerScrap);
      if (amount <= 0) return 0;
      this.scrap -= this.repairCost(amount);
      this.ship.hull = Math.min(this.maxHull, this.ship.hull + amount);
      this.emit('repair', { amount });
      return amount;
    }

    leaveStation() {
      if (this.phase !== 'station') return;
      this.phase = 'route';
      this.emit('phase');
    }

    // ------------------------------------------------------------------ Trecho (TripManager)

    startTrip(settings) {
      this.settings = settings;
      this.blockers = 0;
      this.budget = 0;
      this.asteroidBudget = 0;
      this.nextSpawn = null;
      this.bossSpawned = false;
      this.ship.x = 0;
      this.ship.y = 0;
      this.ship.speedMult = 1;
      this.ship.shield = this.maxShield;   // o escudo é energia: enche no começo de cada trecho
      this.ship.shieldIdle = 0;
      this.afterburnerTimer = 0;
      this.cooldowns = ABILITIES.map(() => 0);
      this.clearEnemies();
      this.asteroids = [];
      this.clouds = [];
      for (const hp of this.hardpoints) if (hp.defense) hp.defense.cooldown = 0;
      this.running = true;
      this.emit('tripStarted', { settings });
    }

    endTrip(success) {
      if (!this.running) return;
      this.running = false;
      this.ship.speedMult = 1;
      this.afterburnerTimer = 0;
      this.clearEnemies();
      this.clouds = [];

      if (success) {
        this.tripsDone++;
        this.meta.bestTrips = Math.max(this.meta.bestTrips, this.tripsDone);
      }
      const node = this.current;
      if (success && node && node.isBoss) {
        this.meta.runsCompleted++;
        this.result = { win: true, trips: this.tripsDone };
        this.phase = 'result';
      } else if (success) {
        this.phase = 'route';
      } else {
        this.result = { win: false, trips: this.tripsDone, node: node ? node.label : '' };
        this.phase = 'result';
      }
      this.saveMeta(this.meta);
      this.emit('tripEnded', { success });
    }

    // Um passo da simulação. dt em segundos.
    update(dt) {
      this.time += dt;
      this.ship.flash = Math.max(0, this.ship.flash - dt);
      this.ship.shieldFlash = Math.max(0, this.ship.shieldFlash - dt);
      for (const e of this.enemies) e.flash = Math.max(0, e.flash - dt);
      for (const a of this.asteroids) a.flash = Math.max(0, (a.flash || 0) - dt);
      if (!this.running) return;

      const cfg = this.cfg;
      for (let i = 0; i < this.cooldowns.length; i++) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt);
      if (this.afterburnerTimer > 0) {
        this.afterburnerTimer -= dt;
        if (this.afterburnerTimer <= 0) this.ship.speedMult = 1;
      }

      this.updateShield(dt);
      this.ship.x += this.shipSpeed * dt;
      this.updatePilot(dt);
      this.updateSpawner(dt);
      this.updateAsteroids(dt);
      if (!this.running) return;

      // Inimigos podem nascer durante o laço (piratas, reforços do chefe):
      // o for...of também visita os novos, o que não tem problema.
      const list = this.enemies;
      for (const e of list) {
        if (!this.running) return;
        this.updateEnemy(e, dt);
      }
      if (!this.running) return;

      for (const hp of this.hardpoints) if (hp.defense) this.updateDefense(hp, dt);
      this.updateClouds(dt);
      this.enemies = this.enemies.filter((e) => !e.removed);

      if (this.ship.x >= cfg.tripLength && this.blockers === 0) this.endTrip(true);
    }

    // ------------------------------------------------------------------ Casco (ShipHull, HullPlating)

    // collision = true para asteroides e drones: a Carenagem reduz esse dano.
    // boarded = true para piratas a bordo: já estão dentro do escudo, então ele não segura.
    damageShip(amount, collision = false, boarded = false) {
      if (!this.running || amount <= 0) return;
      const s = this.ship;
      let final = collision ? amount * (1 - this.collisionReduction) : amount;
      if (!boarded && s.shield > 0) {
        // O escudo absorve primeiro (depois da Carenagem); só o que sobra chega ao casco.
        const absorbed = Math.min(s.shield, final);
        s.shield -= absorbed;
        final -= absorbed;
        s.shieldFlash = 0.15;
        if (amount >= 1) this.emit('shieldHit', { amount: absorbed, broke: s.shield <= 0 });
      }
      if (!boarded) s.shieldIdle = 0;
      if (final <= 0) return;
      s.hull = Math.max(0, s.hull - final);
      if (amount >= 1) { s.flash = 0.12; this.emit('shipHit', { amount: final, collision }); }
      if (s.hull <= 0) this.endTrip(false);
    }

    // Escudo (anexo Gerador de escudo): recarrega depois de um tempo sem levar dano.
    updateShield(dt) {
      const s = this.ship, max = this.maxShield;
      if (max <= 0) return;
      s.shieldIdle += dt;
      if (s.shieldIdle >= ANNEXES.shield.regenDelay) s.shield = Math.min(max, s.shield + ANNEXES.shield.regenPerSecond * dt);
    }

    // ------------------------------------------------------------------ Anexos e Piloto

    annexLevel(id) { return this.annexes[id] || 0; }
    annexCost(id) { return ANNEXES[id].costPerLevel * (this.annexLevel(id) + 1); }

    // Devolve 'ok', 'max' ou 'noScrap'. Como a Carenagem, pode ser comprado a qualquer momento.
    buyAnnex(id) {
      const def = ANNEXES[id], level = this.annexLevel(id);
      if (level >= def.maxLevel) return 'max';
      const cost = this.annexCost(id);
      if (this.scrap < cost) return 'noScrap';
      this.scrap -= cost;
      this.annexes[id] = level + 1;
      const added = (def.hardpoints || []).map((h) => this.addHardpoint(h));
      if (id === 'shield') { this.ship.shield += def.shieldPerLevel; this.ship.shieldIdle = 0; }
      this.emit('annex', { id, level: level + 1, hardpoints: added });
      return 'ok';
    }

    pilotCost() { return PILOT.costPerLevel * (this.ship.pilot + 1); }

    buyPilot() {
      if (this.ship.pilot >= PILOT.maxLevel) return 'max';
      const cost = this.pilotCost();
      if (this.scrap < cost) return 'noScrap';
      this.scrap -= cost;
      this.ship.pilot++;
      this.emit('pilot');
      return 'ok';
    }

    // O Piloto desvia dos asteroides que vão bater na nave, deslizando para o lado.
    // ESTRATÉGIA: olha as rochas até lookAhead metros à frente; se alguma está na linha da
    // nave, escolhe um y livre (o lado mais perto do centro da rota primeiro) e desliza até
    // ele na velocidade do nível. Sem perigo, volta devagar para o centro.
    updatePilot(dt) {
      const s = this.ship;
      if (s.pilot <= 0) return;
      const r0 = this.cfg.shipRadius + PILOT.margin;
      const ahead = this.asteroids.filter((a) => !a.gone && a.x > s.x - a.r && a.x - s.x < PILOT.lookAhead);
      const blocked = (y) => Math.abs(y) > PILOT.maxOffset || ahead.some((a) => Math.abs(a.y - y) < a.r + r0);
      let target = 0;
      const threat = ahead.filter((a) => Math.abs(a.y - s.y) < a.r + r0).sort((a, b) => a.x - b.x)[0];
      if (threat) {
        const sides = [threat.y + threat.r + r0, threat.y - threat.r - r0].sort((a, b) => Math.abs(a) - Math.abs(b));
        target = sides.find((y) => !blocked(y));
        if (target === undefined) target = sides.sort((a, b) => Math.abs(a - s.y) - Math.abs(b - s.y))[0];
        target = Math.max(-PILOT.maxOffset, Math.min(PILOT.maxOffset, target));
      } else if (blocked(0)) target = s.y; // o centro está ocupado: fica onde está
      const speed = PILOT.dodgeSpeedPerLevel * s.pilot * (threat ? 1 : 0.4);
      const step = speed * dt, diff = target - s.y;
      s.y += Math.abs(diff) <= step ? diff : Math.sign(diff) * step;
    }

    platingCost() { return PLATING.costPerLevel * (this.ship.plating + 1); }

    // Devolve 'ok', 'max' ou 'noScrap'. Pode ser comprada a qualquer momento da run.
    buyPlating() {
      if (this.ship.plating >= PLATING.maxLevel) return 'max';
      const cost = this.platingCost();
      if (this.scrap < cost) return 'noScrap';
      this.scrap -= cost;
      this.ship.plating++;
      this.ship.hull = Math.min(this.maxHull, this.ship.hull + PLATING.hullPerLevel);
      this.emit('plating');
      return 'ok';
    }

    hardpointGround(hp) {
      return [this.ship.x + hp.offset[0], this.ship.y + hp.offset[1]];
    }

    // O ponto (px, py) está dentro do arco de tiro do hardpoint?
    canTarget(hp, px, py) {
      if (hp.arc >= 360) return true;
      const [gx, gy] = this.hardpointGround(hp);
      const dx = px - gx, dy = py - gy;
      if (dx * dx + dy * dy < 1e-4) return true;
      const angle = Math.atan2(dy, dx) / DEG;
      const diff = ((angle - hp.facing + 540) % 360) - 180;
      return Math.abs(diff) <= hp.arc / 2;
    }

    // ------------------------------------------------------------------ Spawn (EnemySpawner)

    updateSpawner(dt) {
      const cfg = this.cfg, s = this.settings;
      if (s.hasBoss && !this.bossSpawned && this.progress >= cfg.bossSpawnAtProgress) {
        this.bossSpawned = true;
        this.spawnAround('cruiser');
        this.emit('boss');
      }
      this.budget += (cfg.spawnBudgetBase + cfg.spawnBudgetPerDifficulty * s.difficulty) * dt;
      if (!this.nextSpawn) {
        const eligible = ENEMY_POOL.filter((k) => ENEMIES[k].minDifficulty <= s.difficulty);
        this.nextSpawn = eligible.length ? eligible[Math.floor(this.rand() * eligible.length)] : null;
      }
      if (this.nextSpawn && this.budget >= ENEMIES[this.nextSpawn].spawnCost) {
        this.budget -= ENEMIES[this.nextSpawn].spawnCost;
        this.spawnAround(this.nextSpawn);
        this.nextSpawn = null;
      }
    }

    // Nasce em volta da nave, num ângulo sorteado dentro do arco do tipo de trecho.
    spawnAround(kind) {
      const cfg = this.cfg, [a0, a1] = this.settings.spawnArc;
      const angle = this.range(a0, a1);
      const [dx, dy] = dirOf(angle);
      const dist = this.range(cfg.spawnDistanceMin, cfg.spawnDistanceMax);
      return this.spawn(kind, this.ship.x + dx * dist, this.ship.y + dy * dist, angle);
    }

    // angle: de que lado o inimigo veio (ele ronda a nave desse lado).
    spawn(kind, x, y, angle = 180) {
      const def = ENEMIES[kind];
      const e = {
        id: ++this.nextId, kind, def, x, y,
        hp: def.maxHp, stun: 0, flash: 0, removed: false,
        fireTimer: def.fireInterval || 0, timer: def.spawnInterval || 0, left: def.spawnCount || 0,
        post: null, hardpoint: null, blocking: false, seed: this.rand() * Math.PI * 2,
      };
      if (def.postDistance) {
        // O posto fica do lado de onde veio, com uma folga de ±25° para não empilharem.
        const [px, py] = dirOf(angle + this.range(-25, 25));
        e.post = [px * def.postDistance, py * def.postDistance];
      }
      if (kind === 'cruiser' && this.cfg.bossBlocksArrival) { this.blockers++; e.blocking = true; }
      this.enemies.push(e);
      this.emit('spawn', { e });
      return e;
    }

    clearEnemies() {
      for (const e of this.enemies) this.removeEnemy(e, false);
      this.enemies = [];
    }

    // ------------------------------------------------------------------ Asteroides (AsteroidField)

    updateAsteroids(dt) {
      const s = this.ship;
      if (this.settings.asteroids) {
        this.asteroidBudget += ASTEROIDS.perSecond * dt;
        while (this.asteroidBudget >= 1) {
          this.asteroidBudget -= 1;
          const r = this.range(ASTEROIDS.radiusMin, ASTEROIDS.radiusMax);
          this.asteroids.push({
            id: ++this.nextId,
            x: s.x + this.range(ASTEROIDS.aheadMin, ASTEROIDS.aheadMax),
            y: this.range(-ASTEROIDS.lateralSpread, ASTEROIDS.lateralSpread),
            r, hp: ASTEROIDS.hpPerRadius * r, maxHp: ASTEROIDS.hpPerRadius * r, flash: 0,
            spin: this.range(-1, 1), seed: this.rand(),
          });
        }
      }
      for (const a of this.asteroids) {
        if (a.gone) continue;
        // Só as defesas de mineração destroem asteroides; os outros batem (e se desfazem) ou ficam para trás.
        if (Math.hypot(a.x - s.x, a.y - s.y) < a.r + this.cfg.shipRadius) {
          a.gone = true;
          this.emit('asteroidHit', { a });
          this.damageShip(ASTEROIDS.damagePerRadius * a.r, true);
          if (!this.running) return;
        } else if (a.x < s.x - 20) a.gone = true;
      }
      this.asteroids = this.asteroids.filter((a) => !a.gone);
    }

    // A rocha vai bater na nave se ninguém fizer nada? (está à frente e na linha dela)
    onCollisionCourse(a) {
      const s = this.ship;
      return a.x > s.x - a.r && Math.abs(a.y - s.y) < a.r + this.cfg.shipRadius + PILOT.margin;
    }

    // Asteroide mais perto no alcance e no arco do hardpoint, dando prioridade aos que vão bater.
    findAsteroid(hp, range) {
      const [gx, gy] = this.hardpointGround(hp);
      let best = null, bestScore = Infinity;
      for (const a of this.asteroids) {
        if (a.gone) continue;
        const sqr = (a.x - gx) ** 2 + (a.y - gy) ** 2;
        if (sqr > (range + a.r) ** 2 || !this.canTarget(hp, a.x, a.y)) continue;
        const score = sqr - (this.onCollisionCourse(a) ? 1e6 : 0);
        if (score < bestScore) { best = a; bestScore = score; }
      }
      return best;
    }

    damageAsteroid(a, amount) {
      if (a.gone) return;
      a.hp -= amount;
      a.flash = 0.06;
      if (a.hp > 0) return;
      a.gone = true;
      const gain = Math.round(ASTEROIDS.scrapPerRadius * a.r);
      this.scrap += gain;
      this.emit('asteroidDestroyed', { a, gain });
    }

    // ------------------------------------------------------------------ Inimigos (Enemy e filhos)

    isAlive(e) { return !e.removed && e.hp > 0; }

    moveTowards(e, tx, ty, dt) {
      const dx = tx - e.x, dy = ty - e.y;
      const dist = Math.hypot(dx, dy);
      const step = e.def.speed * dt;
      if (dist <= step) { e.x = tx; e.y = ty; return 0; }
      e.x += dx / dist * step;
      e.y += dy / dist * step;
      return dist - step;
    }

    updateEnemy(e, dt) {
      if (e.removed) return;
      if (e.stun > 0) e.stun -= dt;   // atordoado: perde o embalo e fica para trás
      else {
        // Acompanha a velocidade de CRUZEIRO da nave (sem o pós-combustor): só a aproximação
        // (def.speed) é do próprio inimigo. Piratas a bordo andam junto com o hardpoint.
        if (e.kind !== 'pirate') e.x += this.cruiseSpeed * dt;
        this.tickEnemy(e, dt);
      }
      if (!e.removed && Math.hypot(e.x - this.ship.x, e.y - this.ship.y) > this.cfg.enemyDespawnDistance) this.removeEnemy(e, false);
    }

    tickEnemy(e, dt) {
      const s = this.ship, def = e.def;
      switch (e.kind) {
        case 'fighter':
        case 'cruiser': {
          const remaining = this.moveTowards(e, s.x + e.post[0], s.y + e.post[1], dt);
          if (remaining <= def.attackDistance) {
            e.fireTimer -= dt;
            if (e.fireTimer <= 0) {
              e.fireTimer = def.fireInterval;
              this.emit('enemyShot', { e });
              this.damageShip(def.damage);
            }
          }
          if (e.kind === 'cruiser' && this.running) {
            e.timer -= dt;
            if (e.timer <= 0) { e.timer = def.spawnInterval; this.spawnAround(def.spawn); }
          }
          break;
        }
        case 'drone': {
          const remaining = this.moveTowards(e, s.x, s.y, dt);
          if (remaining <= def.contactRadius) {
            this.emit('explode', { x: e.x, y: e.y });
            this.removeEnemy(e, false);
            this.damageShip(def.damage, true);
          }
          break;
        }
        case 'boarder': {
          if (e.left <= 0) {   // vai embora pelo lado de onde veio
            const len = Math.hypot(e.post[0], e.post[1]) || 1;
            e.x += (e.post[0] / len) * def.speed * dt;
            e.y += (e.post[1] / len) * def.speed * dt;
            break;
          }
          if (this.moveTowards(e, s.x + e.post[0], s.y + e.post[1], dt) > 1) break;
          e.timer -= dt;
          if (e.timer > 0) break;
          e.timer = def.spawnInterval;
          e.left--;
          // O pirata sobe no hardpoint mais perto da nave de abordagem.
          let hp = this.hardpoints[0], best = Infinity;
          for (const h of this.hardpoints) {
            const [gx, gy] = this.hardpointGround(h);
            const d = (gx - e.x) ** 2 + (gy - e.y) ** 2;
            if (d < best) { best = d; hp = h; }
          }
          const [gx, gy] = this.hardpointGround(hp);
          const pirate = this.spawn(def.spawn, gx, gy);
          pirate.hardpoint = hp;
          hp.saboteurs++;
          this.emit('board', { e: pirate, from: e });
          break;
        }
        case 'pirate': {
          if (!e.hardpoint) break;
          const [gx, gy] = this.hardpointGround(e.hardpoint);
          e.x = gx; e.y = gy;
          this.damageShip(def.damage * dt, false, true);
          break;
        }
      }
    }

    damageEnemy(e, amount) {
      if (!this.isAlive(e)) return;
      e.hp -= amount;
      e.flash = 0.06;
      if (e.hp <= 0) this.removeEnemy(e, true);
    }

    stun(e, seconds) {
      if (!this.isAlive(e) || !e.def.stunnable) return;
      e.stun = Math.max(e.stun, seconds);
      this.emit('stun', { e });
    }

    removeEnemy(e, killedByPlayer) {
      if (e.removed) return;
      e.removed = true;
      if (killedByPlayer) {
        const mult = this.settings && this.settings.scrapMultiplier > 0 ? this.settings.scrapMultiplier : 1;
        const gain = Math.round(e.def.scrapReward * mult);
        this.scrap += gain;
        this.emit('kill', { e, gain });
      }
      if (e.hardpoint) { e.hardpoint.saboteurs = Math.max(0, e.hardpoint.saboteurs - 1); e.hardpoint = null; }
      if (e.blocking) { this.blockers = Math.max(0, this.blockers - 1); e.blocking = false; }
    }

    findNearest(hp, range, shipsOnly) {
      const [gx, gy] = this.hardpointGround(hp);
      let best = null, bestSqr = range * range;
      for (const e of this.enemies) {
        if (!this.isAlive(e) || (shipsOnly && !e.def.isShip)) continue;
        const sqr = (e.x - gx) ** 2 + (e.y - gy) ** 2;
        // Pirata a bordo está no casco, não lá fora: qualquer defesa mira nele, sem olhar o arco
        // (placeholder, Parte 1 §7).
        if (sqr > bestSqr || (!e.hardpoint && !this.canTarget(hp, e.x, e.y))) continue;
        best = e; bestSqr = sqr;
      }
      return best;
    }

    // ------------------------------------------------------------------ Defesas (Defense e filhas)

    updateDefense(hp, dt) {
      const d = hp.defense, def = d.def;
      d.firing = false;
      if (hp.saboteurs > 0) return;
      const dmg = def.damage * levelMult(d);
      const [gx, gy] = this.hardpointGround(hp);

      switch (def.kind) {
        case 'cannon': {
          d.cooldown -= dt;
          if (d.cooldown > 0) break;
          const target = this.findNearest(hp, def.range, false);
          if (!target) break;
          d.cooldown = def.fireInterval;
          d.aim = normalize(target.x - gx, target.y - gy, d.aim);
          this.emit('shot', { hardpoint: hp, target, kind: 'cannon' });
          this.damageEnemy(target, dmg);
          break;
        }
        case 'plasma': {
          const target = this.findNearest(hp, def.range, false);
          if (!target) break;
          const aim = normalize(target.x - gx, target.y - gy, dirOf(hp.facing));
          d.aim = aim;
          d.firing = true;
          const rangeSqr = def.range * def.range;
          const cosHalf = Math.cos(def.coneDegrees / 2 * DEG);
          for (const e of this.enemies) {
            if (!this.isAlive(e)) continue;
            const dx = e.x - gx, dy = e.y - gy, sqr = dx * dx + dy * dy;
            if (sqr > rangeSqr) continue;
            if (sqr > 1e-4 && (dx * aim[0] + dy * aim[1]) / Math.sqrt(sqr) < cosHalf) continue;
            this.damageEnemy(e, dmg * dt);
          }
          break;
        }
        case 'harpoon': {
          d.cooldown -= dt;
          if (d.cooldown > 0) break;
          const target = this.findNearest(hp, def.range, true);
          if (!target) break;
          d.cooldown = def.fireInterval;
          d.aim = normalize(target.x - gx, target.y - gy, d.aim);
          this.emit('shot', { hardpoint: hp, target, kind: 'harpoon' });
          this.damageEnemy(target, dmg);
          this.stun(target, def.stunSeconds * levelMult(d));
          break;
        }
        case 'field': {
          // Passivo: dá choque em todo inimigo perto do hardpoint, inclusive piratas a bordo.
          const rangeSqr = def.range * def.range;
          for (const e of this.enemies) {
            if (!this.isAlive(e)) continue;
            if ((e.x - gx) ** 2 + (e.y - gy) ** 2 > rangeSqr) continue;
            this.damageEnemy(e, dmg * dt);
            d.firing = true;
          }
          break;
        }
        case 'laser': {
          // Primeiro a rocha (de preferência a que vai bater); sem rocha, as naves, com dano baixo.
          const rock = this.findAsteroid(hp, def.range);
          const target = rock || this.findNearest(hp, def.range, false);
          if (!target) break;
          d.aim = normalize(target.x - gx, target.y - gy, d.aim);
          d.firing = true;
          d.beamTo = [target.x, target.y, !!rock];
          if (rock) this.damageAsteroid(rock, def.asteroidDamage * levelMult(d) * dt);
          else this.damageEnemy(target, dmg * dt);
          break;
        }
        case 'flak': {
          d.cooldown -= dt;
          if (d.cooldown > 0) break;
          // Mira na rocha que vai bater; senão na nave mais perto; senão em qualquer rocha.
          const rock = this.findAsteroid(hp, def.range);
          const ship = this.findNearest(hp, def.range, true);
          const target = rock && this.onCollisionCourse(rock) ? rock : ship || rock;
          if (!target) break;
          d.cooldown = def.fireInterval;
          d.aim = normalize(target.x - gx, target.y - gy, d.aim);
          const bx = target.x, by = target.y, r2 = def.blastRadius * def.blastRadius;
          this.emit('flak', { hardpoint: hp, x: bx, y: by });
          // A explosão acerta naves e rochas no raio (piratas a bordo estão no casco, não lá fora).
          for (const e of this.enemies) {
            if (this.isAlive(e) && e.def.isShip && (e.x - bx) ** 2 + (e.y - by) ** 2 <= r2) this.damageEnemy(e, dmg);
          }
          for (const a of this.asteroids) {
            if (!a.gone && (a.x - bx) ** 2 + (a.y - by) ** 2 <= (def.blastRadius + a.r) ** 2) this.damageAsteroid(a, dmg);
          }
          break;
        }
      }
    }

    // ------------------------------------------------------------------ Habilidades (AbilityController)

    cooldown01(i) {
      const total = ABILITIES[i].cooldown;
      return total <= 0 ? 0 : this.cooldowns[i] / total;
    }

    useAbility(i) {
      if (!this.running || this.cooldowns[i] > 0) return false;
      const ab = ABILITIES[i];
      if (ab.kind === 'afterburner') {
        this.ship.speedMult = ab.magnitude;
        this.afterburnerTimer = ab.duration;
      } else if (ab.kind === 'debris') {
        this.clouds.push({ x: this.ship.x - ab.dropBehind, y: this.ship.y, life: ab.duration, maxLife: ab.duration,
          size: ab.size, stun: ab.magnitude, hit: new Set() });
      }
      this.cooldowns[i] = ab.cooldown;
      this.emit('ability', { ab });
      return true;
    }

    updateClouds(dt) {
      const halfWidth = this.cfg.laneHalfWidth;
      for (const cloud of this.clouds) {
        cloud.life -= dt;
        for (const e of this.enemies) {
          if (!this.isAlive(e) || !e.def.isShip || cloud.hit.has(e.id)) continue;
          if (Math.abs(e.x - cloud.x) > cloud.size || Math.abs(e.y - cloud.y) > halfWidth) continue;
          cloud.hit.add(e.id);
          this.stun(e, cloud.stun);
        }
      }
      this.clouds = this.clouds.filter((c) => c.life > 0);
    }

    // ------------------------------------------------------------------ Alocação (AllocationController)

    upgradeCost(d) { return d.def.upgradeCostPerLevel * d.level; }
    sellValue(d) { return Math.round(d.totalSpent * this.cfg.sellRefund); }

    // Devolve 'ok', 'occupied', 'locked' ou 'noScrap'.
    buy(index, defId) {
      const hp = this.hardpoints[index], def = DEFENSES[defId];
      if (hp.defense) return 'occupied';
      if (!this.shop.includes(def)) return 'locked';
      if (this.scrap < def.cost) return 'noScrap';
      this.scrap -= def.cost;
      hp.defense = { def, level: 1, totalSpent: def.cost, cooldown: 0, aim: dirOf(hp.facing), firing: false };
      this.emit('build', { hardpoint: hp });
      return 'ok';
    }

    // Devolve 'ok', 'empty', 'max' ou 'noScrap'.
    upgrade(index) {
      const hp = this.hardpoints[index], d = hp.defense;
      if (!d) return 'empty';
      if (d.level >= d.def.maxLevel) return 'max';
      const cost = this.upgradeCost(d);
      if (this.scrap < cost) return 'noScrap';
      this.scrap -= cost;
      d.totalSpent += cost;
      d.level++;
      this.emit('build', { hardpoint: hp });
      return 'ok';
    }

    sell(index) {
      const hp = this.hardpoints[index], d = hp.defense;
      if (!d) return 0;
      const value = this.sellValue(d);
      this.scrap += value;
      hp.defense = null;
      this.emit('sell', { hardpoint: hp, value });
      return value;
    }
  }

  function levelMult(d) { return 1 + d.def.bonusPerLevel * (d.level - 1); }

  function normalize(x, y, fallback) {
    const len = Math.hypot(x, y);
    return len < 1e-4 ? fallback : [x / len, y / len];
  }

  // ------------------------------------------------------------------ Rota (RouteNode, RouteGenerator)

  function nodeLabel(node) {
    if (node.isBoss) return 'Planeta de destino';
    if (node.type === 'station') return 'Estação';
    return TRIP_TYPES[node.type].name;
  }

  function nodeSettings(node, cfg) {
    const type = TRIP_TYPES[node.isBoss ? BOSS_TRIP_TYPE : node.type];
    return {
      label: node.isBoss ? 'Último trecho: órbita do planeta de destino' : `${type.name} (risco ${type.risk})`,
      type: type.id,
      difficulty: node.layer + 1 + (node.isBoss ? 0 : type.risk),
      hasBoss: node.isBoss,
      spawnArc: type.spawnArc,
      asteroids: type.asteroids,
      scrapMultiplier: 1 + (node.isBoss ? 0 : type.risk) * cfg.scrapBonusPerRisk,
    };
  }

  function generateRoute(cfg, rand) {
    const nextInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
    const layerCount = Math.max(2, cfg.routeLayers);
    const layers = [];
    for (let l = 0; l < layerCount; l++) {
      const last = l === layerCount - 1;
      const count = last ? 1 : nextInt(cfg.minNodesPerLayer, cfg.maxNodesPerLayer);
      // No máximo uma Estação por camada, nunca na primeira nem na do chefe.
      const station = !last && l > 0 && rand() < cfg.stationChance ? nextInt(0, count - 1) : -1;
      const layer = [];
      for (let i = 0; i < count; i++) {
        const type = last ? 'boss' : i === station ? 'station' : TRIP_TYPE_ORDER[nextInt(0, TRIP_TYPE_ORDER.length - 1)];
        const node = { layer: l, index: i, isBoss: last, type, next: [] };
        node.risk = type === 'station' || last ? 0 : TRIP_TYPES[type].risk;
        node.label = nodeLabel(node);
        layer.push(node);
      }
      layers.push(layer);
    }

    const relPos = (i, count) => (i + 0.5) / count;
    const nearest = (pos, count) => Math.min(count - 1, Math.max(0, Math.floor(pos * count)));
    const addEdge = (node, j) => { if (!node.next.includes(j)) node.next.push(j); };

    for (let l = 0; l < layerCount - 1; l++) {
      const from = layers[l], to = layers[l + 1];
      for (const node of from) {
        const n = nearest(relPos(node.index, from.length), to.length);
        addEdge(node, n);
        if (rand() < 0.5) addEdge(node, Math.min(to.length - 1, Math.max(0, n + (rand() < 0.5 ? -1 : 1))));
      }
      for (const target of to) addEdge(from[nearest(relPos(target.index, to.length), from.length)], target.index);
      for (const node of from) node.next.sort((a, b) => a - b);
    }
    return { layers };
  }

  // ------------------------------------------------------------------ Piloto automático (#auto e testes)

  // Joga sozinho: monta defesas num plano fixo, melhora a mais barata, compra Carenagem
  // nos trechos com asteroides, repara na Estação e usa as habilidades. Serve para
  // testar o balanceamento no Node e para o atalho #auto.
  // Ordem dos hardpoints por tipo de trecho: primeiro o lado de onde os piratas vêm
  // (é a decisão central do jogo, Parte 1 §3). A arma é sempre o autocanhão, menos
  // os dois últimos hardpoints, que recebem plasma e campo elétrico se liberados.
  const AUTO_ORDER = {
    open:      ['popa', 'bbTr', 'ebTr', 'bbFr', 'ebFr', 'proa'],
    asteroids: ['proa', 'bbFr', 'ebFr', 'bbTr', 'ebTr', 'popa'],
    pirate:    ['popa', 'proa', 'bbFr', 'ebTr', 'ebFr', 'bbTr'],
  };
  const AUTO_LATE = ['plasma', 'field'];

  function autoPlay(sim) {
    if (sim.phase === 'route') {
      const options = sim.route.layers.flat().filter((n) => sim.canChoose(n));
      if (!options.length) return;
      // Machucado: prefere a Estação, se der.
      const station = options.find((n) => n.type === 'station');
      if (station && sim.ship.hull < sim.maxHull * 0.7) { sim.chooseNode(station); return; }
      sim.chooseNode(options[Math.floor(sim.rand() * options.length)]);
      return;
    }
    if (sim.phase === 'station') {
      sim.repair(Math.min(sim.missingHull(), Math.max(0, (sim.scrap - 60) * STATION.hullPerScrap)));
      sim.leaveStation();
      return;
    }
    if (sim.phase !== 'trip' || !sim.running) return;

    const order = AUTO_ORDER[sim.settings.type];
    // No Cinturão, a proa recebe o laser de mineração (se liberado) para quebrar as rochas.
    const laserAtBow = sim.settings.asteroids && sim.shop.includes(DEFENSES.laser);
    for (let i = 0; i < order.length; i++) {
      const hp = sim.hardpoints.find((h) => h.id === order[i]);
      if (hp.defense) continue;
      const late = i >= order.length - 2 ? DEFENSES[AUTO_LATE[i - (order.length - 2)]] : null;
      const def = i === 0 && laserAtBow ? DEFENSES.laser : late && sim.shop.includes(late) ? late : DEFENSES.cannon;
      if (sim.scrap >= def.cost) sim.buy(hp.index, def.id);
      return; // espera juntar para este hardpoint antes de pular para o próximo
    }
    if (sim.settings.asteroids && sim.ship.plating < 3 && sim.scrap >= sim.platingCost()) { sim.buyPlating(); return; }
    if (sim.settings.asteroids && sim.ship.pilot < 2 && sim.scrap >= sim.pilotCost()) { sim.buyPilot(); return; }
    if (!sim.annexLevel('shield') && sim.scrap >= sim.annexCost('shield')) { sim.buyAnnex('shield'); return; }
    // Hardpoints dos casulos: depois de tudo, autocanhão no que estiver vazio.
    const empty = sim.hardpoints.find((h) => !h.defense);
    if (empty) { if (sim.scrap >= DEFENSES.cannon.cost) sim.buy(empty.index, 'cannon'); return; }
    if (!sim.annexLevel('podRear') && sim.scrap >= sim.annexCost('podRear') + 100) { sim.buyAnnex('podRear'); return; }
    let cheapest = null;
    for (const hp of sim.hardpoints) {
      const d = hp.defense;
      if (!d || d.level >= d.def.maxLevel) continue;
      if (!cheapest || sim.upgradeCost(d) < sim.upgradeCost(cheapest.defense)) cheapest = hp;
    }
    if (cheapest && sim.scrap >= sim.upgradeCost(cheapest.defense)) sim.upgrade(cheapest.index);

    const s = sim.ship;
    const chasing = sim.enemies.some((e) => e.def.isShip && !e.removed && e.x < s.x - 2 && e.x > s.x - 14);
    if (chasing) sim.useAbility(1);
    const droneNear = sim.enemies.some((e) => e.kind === 'drone' && !e.removed && Math.hypot(e.x - s.x, e.y - s.y) < 8);
    if (droneNear || s.hull < sim.maxHull * 0.4) sim.useAbility(0);
  }

  const API = { Sim, generateRoute, seededRandom, autoPlay, levelMult };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.SH = API;
})(typeof window !== 'undefined' ? window : globalThis);
