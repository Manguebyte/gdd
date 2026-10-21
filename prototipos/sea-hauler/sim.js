// Sea Hauler — regras do jogo, sem nada de tela.
// POR QUE: é um porte direto do guia Unity do SeaHauler.md (ShipController,
// SailController, ShipHull, ShipUpgrades, LegManager, EnemySpawner, ReefField,
// SquallSystem, os Enemy, as Weapon, GoldWallet, AllocationController,
// AbilityController, RouteGenerator, Port, RunManager). Sem DOM, roda também no
// Node para testar balanceamento (ver autoPlay).
// ESTRATÉGIA: tudo acontece num plano 2D em metros: x = distância percorrida na
// rota, y = lado (positivo = bombordo/esquerda do navio). game.js só lê este
// estado e escuta os eventos (on) para desenhar efeitos.
(function (root) {
  'use strict';
  const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.SEA_DATA;
  const {
    CONFIG, SAILS, START_SAIL, COPPER, RIGGING, CREW, GUNPORTS, PORT, ROCKS, SQUALLS,
    LEG_TYPES, LEG_TYPE_ORDER, BOSS_LEG_TYPE, SHIPS, SHIP_ORDER, START_SHIP, WEAPONS, WEAPON_ORDER,
    ENEMIES, ENEMY_POOL, ABILITIES,
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
  const FULL = SAILS.length - 1, REEFED = 0;

  class Sim {
    constructor(opts = {}) {
      this.cfg = Object.assign({}, CONFIG, opts.config || {});
      this.rand = opts.rand || Math.random;
      this.meta = Object.assign({ runsStarted: 0, runsCompleted: 0, bestLegs: 0 }, opts.meta || {});
      this.saveMeta = opts.saveMeta || (() => {});
      this.unlockAll = !!opts.unlockAll;
      this.listeners = [];

      this.ship = {
        x: 0, y: 0, cls: SHIPS[START_SHIP], hull: SHIPS[START_SHIP].hull, flash: 0,
        sail: START_SAIL, speed: SHIPS[START_SHIP].speeds[START_SAIL], torn: 0,
        copper: 0, rigging: 0, crew: 0,
      };
      this.gunports = [];
      this.setClass(SHIPS[START_SHIP]);
      this.enemies = [];
      this.rocks = [];
      this.barrels = [];
      this.gold = 0;
      this.cooldowns = ABILITIES.map(() => 0);
      this.broadsideTimer = 0;
      this.squall = null;     // { timer, warning } da próxima rajada (só na Tempestade)

      this.phase = 'menu';   // menu | route | leg | port | result
      this.running = false;
      this.settings = null;
      this.blockers = 0;
      this.budget = 0;
      this.rockBudget = 0;
      this.nextSpawn = null;
      this.bossSpawned = false;
      this.nextId = 0;
      this.time = 0;
      this.escaped = 0;       // inimigos que ficaram para trás neste trecho (sem ouro)

      this.route = null;
      this.current = null;   // nó atual; null = ainda no porto de origem
      this.visited = [];
      this.legsDone = 0;
      this.shop = [];        // armas liberadas nesta run
      this.result = null;
    }

    on(fn) { this.listeners.push(fn); }
    emit(type, data) { for (const fn of this.listeners) fn(type, data || {}); }
    range(a, b) { return a + (b - a) * this.rand(); }

    get progress() { return Math.min(1, Math.max(0, this.ship.x / this.cfg.legLength)); }
    get maxHull() { return this.ship.cls.hull + COPPER.hullPerLevel * this.ship.copper; }
    get collisionReduction() { return COPPER.collisionReductionPerLevel * this.ship.copper; }
    get fireRateMult() { return this.broadsideTimer > 0 ? ABILITIES[1].magnitude : 1; }
    get openedCount() { return this.gunports.filter((g) => g.isOpen && !g.open).length; }

    // ------------------------------------------------------------------ Velas (SailController)

    // Velocidade de uma posição das velas, já com o Velame no Pano cheio.
    sailSpeed(i) {
      return this.ship.cls.speeds[i] + (i === FULL ? RIGGING.fullSpeedPerLevel * this.ship.rigging : 0);
    }

    // ------------------------------------------------------------------ Classe do navio (ShipClassDef)

    // Troca as portinholas pelas da classe (todas vazias, abertas ou fechadas como na classe).
    setClass(cls) {
      this.ship.cls = cls;
      this.gunports = cls.gunports.map((g, i) => Object.assign({}, g, { index: i, isOpen: g.open, weapon: null, saboteurs: 0 }));
    }

    // Classes maiores que a atual, que o Porto vende.
    shipsForSale() {
      const at = SHIP_ORDER.indexOf(this.ship.cls.id);
      return SHIP_ORDER.slice(at + 1).map((id) => SHIPS[id]);
    }

    // Compra um navio maior no Porto. As armas voltam como ouro (o valor de venda),
    // as melhorias continuam e o navio novo chega com o casco inteiro (placeholder,
    // Parte 1 §10). Devolve 'ok', 'notPort', 'notBigger' ou 'noGold'.
    buyShip(id) {
      if (this.phase !== 'port') return 'notPort';
      const cls = SHIPS[id];
      if (!this.shipsForSale().includes(cls)) return 'notBigger';
      const refund = this.gunports.reduce((sum, g) => sum + (g.weapon ? this.sellValue(g.weapon) : 0), 0);
      if (this.gold + refund < cls.cost) return 'noGold';
      this.gold += refund - cls.cost;
      this.setClass(cls);
      this.ship.hull = this.maxHull;
      this.emit('shipBought', { cls, refund });
      return 'ok';
    }
    // A posição que vale de verdade: velas rasgadas ficam em Rizadas.
    get effectiveSail() { return this.ship.torn > 0 ? REEFED : this.ship.sail; }

    // Escolhe a posição das velas (0 Rizadas, 1 Meio pano, 2 Pano cheio).
    setSail(i) {
      i = Math.max(0, Math.min(FULL, i));
      if (i === this.ship.sail) return false;
      this.ship.sail = i;
      this.emit('sail', { sail: i });
      return true;
    }

    // ------------------------------------------------------------------ Run (RunManager)

    // Começa uma run do zero: rota nova, navio vazio, ouro inicial.
    newRun() {
      this.route = generateRoute(this.cfg, this.rand);
      this.current = null;
      this.visited = [];
      this.legsDone = 0;
      this.result = null;
      this.setClass(SHIPS[START_SHIP]);
      Object.assign(this.ship, { copper: 0, rigging: 0, crew: 0, sail: START_SAIL, torn: 0, x: 0 });
      this.ship.hull = this.maxHull;
      this.gold = this.cfg.startingGold;
      this.shop = this.unlockedWeapons();
      this.meta.runsStarted++;
      this.saveMeta(this.meta);
      this.phase = 'route';
      this.emit('phase');
    }

    // Armas cujo requisito de desbloqueio já foi atingido (placeholder, Parte 1 §11).
    unlockedWeapons() {
      return WEAPON_ORDER.map((id) => WEAPONS[id])
        .filter((w) => this.unlockAll || w.unlockAtBestLegs <= this.meta.bestLegs);
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
      if (node.type === 'port') {
        this.phase = 'port';   // sem combate: reparo e compras
        this.emit('phase');
        return true;
      }
      if (!this.cfg.carryHullBetweenLegs) this.ship.hull = this.maxHull;
      this.phase = 'leg';
      this.startLeg(nodeSettings(node, this.cfg));
      return true;
    }

    // Abandona a run (pausa → desistir). Não conta como trecho concluído.
    abandon() {
      this.running = false;
      this.clearEnemies();
      this.rocks = [];
      this.barrels = [];
      this.phase = 'menu';
      this.emit('phase');
    }

    // ------------------------------------------------------------------ Porto (Port)

    repairCost(amount) { return Math.ceil(amount / PORT.hullPerGold); }
    missingHull() { return Math.max(0, this.maxHull - this.ship.hull); }

    // Repara até "amount" de casco pagando ouro. Devolve quanto reparou.
    repair(amount) {
      if (this.phase !== 'port') return 0;
      amount = Math.min(amount, this.missingHull(), this.gold * PORT.hullPerGold);
      if (amount <= 0) return 0;
      this.gold -= this.repairCost(amount);
      this.ship.hull = Math.min(this.maxHull, this.ship.hull + amount);
      this.emit('repair', { amount });
      return amount;
    }

    leavePort() {
      if (this.phase !== 'port') return;
      this.phase = 'route';
      this.emit('phase');
    }

    // ------------------------------------------------------------------ Trecho (LegManager)

    startLeg(settings) {
      this.settings = settings;
      this.blockers = 0;
      this.budget = 0;
      this.rockBudget = 0;
      this.nextSpawn = null;
      this.bossSpawned = false;
      this.escaped = 0;
      this.ship.x = 0;
      this.ship.torn = 0;
      this.ship.speed = this.sailSpeed(this.ship.sail);
      this.broadsideTimer = 0;
      this.cooldowns = ABILITIES.map(() => 0);
      this.clearEnemies();
      this.rocks = [];
      this.barrels = [];
      this.squall = settings.squalls ? { timer: this.range(SQUALLS.intervalMin, SQUALLS.intervalMax), warned: false } : null;
      for (const g of this.gunports) if (g.weapon) g.weapon.cooldown = 0;
      this.running = true;
      this.emit('legStarted', { settings });
    }

    endLeg(success) {
      if (!this.running) return;
      this.running = false;
      this.broadsideTimer = 0;
      this.clearEnemies();
      this.barrels = [];

      if (success) {
        this.legsDone++;
        this.meta.bestLegs = Math.max(this.meta.bestLegs, this.legsDone);
      }
      const node = this.current;
      if (success && node && node.isBoss) {
        this.meta.runsCompleted++;
        this.result = { win: true, legs: this.legsDone };
        this.phase = 'result';
      } else if (success) {
        this.phase = 'route';
      } else {
        this.result = { win: false, legs: this.legsDone, node: node ? node.label : '' };
        this.phase = 'result';
      }
      this.saveMeta(this.meta);
      this.emit('legEnded', { success });
    }

    // Um passo da simulação. dt em segundos.
    update(dt) {
      this.time += dt;
      this.ship.flash = Math.max(0, this.ship.flash - dt);
      for (const e of this.enemies) e.flash = Math.max(0, e.flash - dt);
      if (!this.running) return;

      const cfg = this.cfg, s = this.ship;
      for (let i = 0; i < this.cooldowns.length; i++) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt);
      this.broadsideTimer = Math.max(0, this.broadsideTimer - dt);
      if (s.torn > 0) { s.torn -= dt; if (s.torn <= 0) this.emit('sailsMended'); }

      // As velas não mudam a velocidade de uma vez: o navio ganha ou perde embalo.
      const target = this.sailSpeed(this.effectiveSail);
      const step = cfg.sailAcceleration * dt;
      s.speed = Math.abs(target - s.speed) <= step ? target : s.speed + Math.sign(target - s.speed) * step;
      s.x += s.speed * dt;

      // Tripulação: carpinteiros consertam um pouco do casco o tempo todo.
      if (s.crew > 0) s.hull = Math.min(this.maxHull, s.hull + CREW.repairPerSecondPerLevel * s.crew * dt);

      this.updateSpawner(dt);
      this.updateRocks(dt);
      this.updateSquall(dt);
      if (!this.running) return;

      // Inimigos podem nascer durante o laço (piratas, reforços do chefe):
      // o for...of também visita os novos, o que não tem problema.
      const list = this.enemies;
      for (const e of list) {
        if (!this.running) return;
        this.updateEnemy(e, dt);
      }
      if (!this.running) return;

      for (const g of this.gunports) if (g.weapon) this.updateWeapon(g, dt);
      this.updateBarrels(dt);
      this.enemies = this.enemies.filter((e) => !e.removed);

      if (s.x >= cfg.legLength && this.blockers === 0) this.endLeg(true);
    }

    // ------------------------------------------------------------------ Casco (ShipHull)

    // collision = true para rochedos e brulotes: o Forro de cobre reduz esse dano.
    damageShip(amount, collision = false) {
      if (!this.running || amount <= 0) return;
      const s = this.ship;
      const final = collision ? amount * (1 - this.collisionReduction) : amount;
      s.hull = Math.max(0, s.hull - final);
      if (amount >= 1) { s.flash = 0.12; this.emit('shipHit', { amount: final, collision }); }
      if (s.hull <= 0) this.endLeg(false);
    }

    // ------------------------------------------------------------------ Melhorias (ShipUpgrades)

    upgradeCostOf(kind) {
      const s = this.ship;
      if (kind === 'copper') return COPPER.costPerLevel * (s.copper + 1);
      if (kind === 'rigging') return RIGGING.costPerLevel * (s.rigging + 1);
      if (kind === 'crew') return CREW.costPerLevel * (s.crew + 1);
      return 0;
    }
    upgradeMax(kind) { return { copper: COPPER, rigging: RIGGING, crew: CREW }[kind].maxLevel; }

    // Compra um nível de Forro de cobre, Velame ou Tripulação. Vale a qualquer
    // momento da run (no meio do trecho e no Porto). Devolve 'ok', 'max' ou 'noGold'.
    buyUpgrade(kind) {
      const s = this.ship;
      if (s[kind] >= this.upgradeMax(kind)) return 'max';
      const cost = this.upgradeCostOf(kind);
      if (this.gold < cost) return 'noGold';
      this.gold -= cost;
      s[kind]++;
      if (kind === 'copper') s.hull = Math.min(this.maxHull, s.hull + COPPER.hullPerLevel);
      this.emit('shipUpgrade', { kind });
      return 'ok';
    }

    openCost() { return GUNPORTS.costs[Math.min(this.openedCount, GUNPORTS.costs.length - 1)]; }

    // Abre uma portinhola fechada. Devolve 'ok', 'open' ou 'noGold'.
    openGunport(index) {
      const g = this.gunports[index];
      if (g.isOpen) return 'open';
      const cost = this.openCost();
      if (this.gold < cost) return 'noGold';
      this.gold -= cost;
      g.isOpen = true;
      this.emit('gunportOpened', { gunport: g });
      return 'ok';
    }

    gunportGround(g) {
      return [this.ship.x + g.offset[0], this.ship.y + g.offset[1]];
    }

    // O ponto (px, py) está dentro do arco de tiro da portinhola?
    canTarget(g, px, py) {
      if (g.arc >= 360) return true;
      const [gx, gy] = this.gunportGround(g);
      const dx = px - gx, dy = py - gy;
      if (dx * dx + dy * dy < 1e-4) return true;
      const angle = Math.atan2(dy, dx) / DEG;
      const diff = ((angle - g.facing + 540) % 360) - 180;
      return Math.abs(diff) <= g.arc / 2;
    }

    // ------------------------------------------------------------------ Spawn (EnemySpawner)

    updateSpawner(dt) {
      const cfg = this.cfg, st = this.settings;
      if (st.hasBoss && !this.bossSpawned && this.progress >= cfg.bossSpawnAtProgress) {
        this.bossSpawned = true;
        this.spawnAround('galleon');
        this.emit('boss');
      }
      this.budget += (cfg.spawnBudgetBase + cfg.spawnBudgetPerDifficulty * st.difficulty) * st.spawnMult * dt;
      if (!this.nextSpawn) {
        const eligible = ENEMY_POOL.filter((k) => ENEMIES[k].minDifficulty <= st.difficulty);
        this.nextSpawn = eligible.length ? eligible[Math.floor(this.rand() * eligible.length)] : null;
      }
      if (this.nextSpawn && this.budget >= ENEMIES[this.nextSpawn].spawnCost) {
        this.budget -= ENEMIES[this.nextSpawn].spawnCost;
        this.spawnAround(this.nextSpawn);
        this.nextSpawn = null;
      }
    }

    // Nasce em volta do navio, num ângulo sorteado dentro do arco do tipo de trecho.
    spawnAround(kind) {
      const cfg = this.cfg, [a0, a1] = this.settings.spawnArc;
      const angle = this.range(a0, a1);
      const [dx, dy] = dirOf(angle);
      const dist = this.range(cfg.spawnDistanceMin, cfg.spawnDistanceMax);
      return this.spawn(kind, this.ship.x + dx * dist, this.ship.y + dy * dist, angle);
    }

    // angle: de que lado o inimigo veio (ele ronda o navio desse lado).
    spawn(kind, x, y, angle = 180) {
      const def = ENEMIES[kind];
      const e = {
        id: ++this.nextId, kind, def, x, y,
        hp: def.maxHp, torn: 0, flash: 0, removed: false,
        fireTimer: def.fireInterval || 0, timer: def.spawnInterval || 0, left: def.spawnCount || 0,
        post: null, gunport: null, blocking: false, seed: this.rand() * Math.PI * 2,
      };
      if (def.postDistance) {
        // O posto fica do lado de onde veio, com uma folga de ±25° para não empilharem.
        const [px, py] = dirOf(angle + this.range(-25, 25));
        e.post = [px * def.postDistance, py * def.postDistance];
      }
      if (kind === 'galleon' && this.cfg.bossBlocksArrival) { this.blockers++; e.blocking = true; }
      this.enemies.push(e);
      this.emit('spawn', { e });
      return e;
    }

    clearEnemies() {
      for (const e of this.enemies) this.removeEnemy(e, false);
      this.enemies = [];
    }

    // ------------------------------------------------------------------ Rochedos (ReefField)

    updateRocks(dt) {
      const s = this.ship;
      if (this.settings.rocks) {
        // A densidade é por distância: correr não faz aparecer menos rochedos por metro.
        this.rockBudget += ROCKS.perSecond * (s.speed / this.cfg.seaSpeed) * dt;
        while (this.rockBudget >= 1) {
          this.rockBudget -= 1;
          this.rocks.push({
            id: ++this.nextId,
            x: s.x + this.range(ROCKS.aheadMin, ROCKS.aheadMax),
            y: this.range(-ROCKS.lateralSpread, ROCKS.lateralSpread),
            r: this.range(ROCKS.radiusMin, ROCKS.radiusMax),
            seed: this.rand(),
          });
        }
      }
      for (const r of this.rocks) {
        if (r.gone) continue;
        // Não podem ser destruídos: só batem ou ficam para trás. Quanto mais rápido, pior a batida.
        if (Math.hypot(r.x - s.x, r.y - s.y) < r.r + s.cls.radius) {
          r.gone = true;
          this.emit('rockHit', { r });
          this.damageShip(ROCKS.damagePerRadius * r.r * (s.speed / this.cfg.seaSpeed), true);
          if (!this.running) return;
        } else if (r.x < s.x - 20) r.gone = true;
      }
      this.rocks = this.rocks.filter((r) => !r.gone);
    }

    // ------------------------------------------------------------------ Rajadas (SquallSystem)

    updateSquall(dt) {
      const q = this.squall;
      if (!q) return;
      q.timer -= dt;
      if (!q.warned && q.timer <= SQUALLS.warning) { q.warned = true; this.emit('squallWarning'); }
      if (q.timer > 0) return;
      // Só rasga quem está de Pano cheio (e com as velas inteiras).
      const caught = this.ship.sail === FULL && this.ship.torn <= 0;
      if (caught) {
        this.ship.torn = SQUALLS.tornSeconds;
        this.damageShip(SQUALLS.damage);
      }
      this.emit('squall', { caught });
      this.squall = { timer: this.range(SQUALLS.intervalMin, SQUALLS.intervalMax), warned: false };
    }

    // ------------------------------------------------------------------ Inimigos (Enemy e filhos)

    isAlive(e) { return !e.removed && e.hp > 0; }

    moveTowards(e, tx, ty, dt) {
      const dx = tx - e.x, dy = ty - e.y;
      const dist = Math.hypot(dx, dy);
      const step = e.def.approach * dt;
      if (dist <= step) { e.x = tx; e.y = ty; return 0; }
      e.x += dx / dist * step;
      e.y += dy / dist * step;
      return dist - step;
    }

    updateEnemy(e, dt) {
      if (e.removed) return;
      if (e.torn > 0) e.torn -= dt;   // velas rasgadas: perde o embalo e fica para trás
      else {
        // Navega no ritmo do mar (não no do navio): só a aproximação é do próprio inimigo.
        // De Pano cheio o navio passa desse ritmo e deixa para trás quem vem com pouca sobra.
        // Piratas a bordo andam junto com a portinhola.
        // O Galeão guarda a entrada do porto: nunca fica para trás, nem de Pano cheio.
        if (e.kind === 'galleon') e.x += Math.max(this.cfg.seaSpeed, this.ship.speed) * dt;
        else if (e.kind !== 'boarder') e.x += this.cfg.seaSpeed * dt;
        this.tickEnemy(e, dt);
      }
      // O Galeão nunca fica para trás: ele guarda a entrada do porto (fugir dele não adianta).
      if (!e.removed && e.kind !== 'galleon' && Math.hypot(e.x - this.ship.x, e.y - this.ship.y) > this.cfg.enemyDespawnDistance) {
        if (e.x < this.ship.x) { this.escaped++; this.emit('escaped', { e }); }
        this.removeEnemy(e, false);
      }
    }

    tickEnemy(e, dt) {
      const s = this.ship, def = e.def;
      switch (e.kind) {
        case 'schooner':
        case 'galleon': {
          const remaining = this.moveTowards(e, s.x + e.post[0], s.y + e.post[1], dt);
          if (remaining <= def.attackDistance) {
            e.fireTimer -= dt;
            if (e.fireTimer <= 0) {
              e.fireTimer = def.fireInterval;
              this.emit('enemyShot', { e });
              this.damageShip(def.damage);
            }
          }
          if (e.kind === 'galleon' && this.running) {
            e.timer -= dt;
            if (e.timer <= 0) { e.timer = def.spawnInterval; this.spawnAround(def.spawn); }
          }
          break;
        }
        case 'fireship': {
          const remaining = this.moveTowards(e, s.x, s.y, dt);
          if (remaining <= def.contactRadius) {
            this.emit('explode', { x: e.x, y: e.y });
            this.removeEnemy(e, false);
            this.damageShip(def.damage, true);
          }
          break;
        }
        case 'sloop': {
          if (e.left <= 0) {   // vai embora pelo lado de onde veio
            const len = Math.hypot(e.post[0], e.post[1]) || 1;
            e.x += (e.post[0] / len) * def.approach * dt;
            e.y += (e.post[1] / len) * def.approach * dt;
            break;
          }
          if (this.moveTowards(e, s.x + e.post[0], s.y + e.post[1], dt) > 1) break;
          e.timer -= dt;
          if (e.timer > 0) break;
          e.timer = def.spawnInterval;
          e.left--;
          // O pirata sobe na portinhola aberta mais perto da chalupa.
          let port = null, best = Infinity;
          for (const g of this.gunports) {
            if (!g.isOpen) continue;
            const [gx, gy] = this.gunportGround(g);
            const d = (gx - e.x) ** 2 + (gy - e.y) ** 2;
            if (d < best) { best = d; port = g; }
          }
          const [gx, gy] = this.gunportGround(port);
          const pirate = this.spawn(def.spawn, gx, gy);
          pirate.gunport = port;
          port.saboteurs++;
          this.emit('board', { e: pirate, from: e });
          break;
        }
        case 'boarder': {
          if (!e.gunport) break;
          const [gx, gy] = this.gunportGround(e.gunport);
          e.x = gx; e.y = gy;
          this.damageShip(def.damage * dt);
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

    tear(e, seconds) {
      if (!this.isAlive(e) || !e.def.tearable) return;
      e.torn = Math.max(e.torn, seconds);
      this.emit('tear', { e });
    }

    removeEnemy(e, killedByPlayer) {
      if (e.removed) return;
      e.removed = true;
      if (killedByPlayer) {
        const mult = this.settings && this.settings.goldMultiplier > 0 ? this.settings.goldMultiplier : 1;
        const gain = Math.round(e.def.goldReward * mult);
        this.gold += gain;
        this.emit('kill', { e, gain });
      }
      if (e.gunport) { e.gunport.saboteurs = Math.max(0, e.gunport.saboteurs - 1); e.gunport = null; }
      if (e.blocking) { this.blockers = Math.max(0, this.blockers - 1); e.blocking = false; }
    }

    findNearest(g, range, shipsOnly) {
      const [gx, gy] = this.gunportGround(g);
      let best = null, bestSqr = range * range;
      for (const e of this.enemies) {
        if (!this.isAlive(e) || (shipsOnly && !e.def.isShip)) continue;
        const sqr = (e.x - gx) ** 2 + (e.y - gy) ** 2;
        // Pirata a bordo está no convés, não lá fora: qualquer arma mira nele, sem olhar o arco
        // (placeholder, Parte 1 §8).
        if (sqr > bestSqr || (!e.gunport && !this.canTarget(g, e.x, e.y))) continue;
        best = e; bestSqr = sqr;
      }
      return best;
    }

    // ------------------------------------------------------------------ Armas (Weapon e filhas)

    updateWeapon(g, dt) {
      const w = g.weapon, def = w.def;
      w.firing = false;
      if (g.saboteurs > 0) return;
      const dmg = def.damage * levelMult(w);
      const [gx, gy] = this.gunportGround(g);
      // A Bordada faz as armas recarregarem mais rápido (o tempo de recarga corre mais).
      const reload = dt * this.fireRateMult;

      switch (def.kind) {
        case 'longgun': {
          w.cooldown -= reload;
          if (w.cooldown > 0) break;
          const target = this.findNearest(g, def.range, false);
          if (!target) break;
          w.cooldown = def.fireInterval;
          w.aim = normalize(target.x - gx, target.y - gy, w.aim);
          this.emit('shot', { gunport: g, target, kind: 'longgun' });
          this.damageEnemy(target, dmg);
          break;
        }
        case 'carronade': {
          w.cooldown -= reload;
          if (w.cooldown > 0) break;
          const target = this.findNearest(g, def.range, false);
          if (!target) break;
          w.cooldown = def.fireInterval;
          const aim = normalize(target.x - gx, target.y - gy, dirOf(g.facing));
          w.aim = aim;
          this.emit('volley', { gunport: g, aim, range: def.range, cone: def.coneDegrees });
          // Metralha: acerta todo mundo dentro do cone, de uma vez.
          const rangeSqr = def.range * def.range;
          const cosHalf = Math.cos(def.coneDegrees / 2 * DEG);
          for (const e of this.enemies) {
            if (!this.isAlive(e)) continue;
            const dx = e.x - gx, dy = e.y - gy, sqr = dx * dx + dy * dy;
            if (sqr > rangeSqr) continue;
            if (sqr > 1e-4 && (dx * aim[0] + dy * aim[1]) / Math.sqrt(sqr) < cosHalf) continue;
            this.damageEnemy(e, dmg);
          }
          break;
        }
        case 'chainshot': {
          w.cooldown -= reload;
          if (w.cooldown > 0) break;
          const target = this.findNearest(g, def.range, true);
          if (!target) break;
          w.cooldown = def.fireInterval;
          w.aim = normalize(target.x - gx, target.y - gy, w.aim);
          this.emit('shot', { gunport: g, target, kind: 'chainshot' });
          this.damageEnemy(target, dmg);
          this.tear(target, def.tearSeconds * levelMult(w));
          break;
        }
        case 'marines': {
          // Contínuo: fogo de mosquete em todo inimigo perto da portinhola, inclusive piratas a bordo.
          const rangeSqr = def.range * def.range;
          let first = null;
          for (const e of this.enemies) {
            if (!this.isAlive(e)) continue;
            if ((e.x - gx) ** 2 + (e.y - gy) ** 2 > rangeSqr) continue;
            if (!first) first = e;
            this.damageEnemy(e, dmg * dt);
            w.firing = true;
          }
          if (first) w.aim = normalize(first.x - gx, first.y - gy, w.aim);
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
      if (ab.kind === 'barrels') {
        this.barrels.push({ x: this.ship.x - ab.dropBehind, y: this.ship.y, life: ab.duration, maxLife: ab.duration,
          size: ab.size, damage: ab.damage, tear: ab.tear, hit: new Set() });
      } else if (ab.kind === 'broadside') {
        this.broadsideTimer = ab.duration;
        // Quem estava recarregando atira já.
        for (const g of this.gunports) if (g.weapon) g.weapon.cooldown = 0;
      }
      this.cooldowns[i] = ab.cooldown;
      this.emit('ability', { ab });
      return true;
    }

    // Barris de pólvora: ficam boiando onde caíram; navio inimigo que passa por eles explode a carga.
    updateBarrels(dt) {
      const halfWidth = this.cfg.laneHalfWidth;
      for (const b of this.barrels) {
        b.life -= dt;
        for (const e of this.enemies) {
          if (!this.isAlive(e) || !e.def.isShip || b.hit.has(e.id)) continue;
          if (Math.abs(e.x - b.x) > b.size || Math.abs(e.y - b.y) > halfWidth) continue;
          b.hit.add(e.id);
          this.emit('barrelBlast', { x: e.x, y: e.y });
          this.tear(e, b.tear);
          this.damageEnemy(e, b.damage);
        }
      }
      this.barrels = this.barrels.filter((b) => b.life > 0);
    }

    // ------------------------------------------------------------------ Alocação (AllocationController)

    upgradeCost(w) { return w.def.upgradeCostPerLevel * w.level; }
    sellValue(w) { return Math.round(w.totalSpent * this.cfg.sellRefund); }

    // Devolve 'ok', 'occupied', 'closed', 'locked' ou 'noGold'.
    buy(index, weaponId) {
      const g = this.gunports[index], def = WEAPONS[weaponId];
      if (!g.isOpen) return 'closed';
      if (g.weapon) return 'occupied';
      if (!this.shop.includes(def)) return 'locked';
      if (this.gold < def.cost) return 'noGold';
      this.gold -= def.cost;
      g.weapon = { def, level: 1, totalSpent: def.cost, cooldown: 0, aim: dirOf(g.facing), firing: false };
      this.emit('build', { gunport: g });
      return 'ok';
    }

    // Devolve 'ok', 'empty', 'max' ou 'noGold'.
    upgrade(index) {
      const g = this.gunports[index], w = g.weapon;
      if (!w) return 'empty';
      if (w.level >= w.def.maxLevel) return 'max';
      const cost = this.upgradeCost(w);
      if (this.gold < cost) return 'noGold';
      this.gold -= cost;
      w.totalSpent += cost;
      w.level++;
      this.emit('build', { gunport: g });
      return 'ok';
    }

    sell(index) {
      const g = this.gunports[index], w = g.weapon;
      if (!w) return 0;
      const value = this.sellValue(w);
      this.gold += value;
      g.weapon = null;
      this.emit('sell', { gunport: g, value });
      return value;
    }
  }

  function levelMult(w) { return 1 + w.def.bonusPerLevel * (w.level - 1); }

  function normalize(x, y, fallback) {
    const len = Math.hypot(x, y);
    return len < 1e-4 ? fallback : [x / len, y / len];
  }

  // ------------------------------------------------------------------ Rota (RouteNode, RouteGenerator)

  function nodeLabel(node) {
    if (node.isBoss) return 'Porto de destino';
    if (node.type === 'port') return 'Porto';
    return LEG_TYPES[node.type].name;
  }

  function nodeSettings(node, cfg) {
    const type = LEG_TYPES[node.isBoss ? BOSS_LEG_TYPE : node.type];
    return {
      label: node.isBoss ? 'Último trecho: a entrada do porto de destino' : `${type.name} (risco ${type.risk})`,
      type: type.id,
      difficulty: node.layer + 1 + (node.isBoss ? 0 : type.risk),
      hasBoss: node.isBoss,
      spawnArc: type.spawnArc,
      spawnMult: type.spawnMult,
      rocks: type.rocks,
      squalls: type.squalls,
      goldMultiplier: 1 + (node.isBoss ? 0 : type.risk) * cfg.goldBonusPerRisk,
    };
  }

  function generateRoute(cfg, rand) {
    const nextInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
    const layerCount = Math.max(2, cfg.routeLayers);
    const layers = [];
    for (let l = 0; l < layerCount; l++) {
      const last = l === layerCount - 1;
      const count = last ? 1 : nextInt(cfg.minNodesPerLayer, cfg.maxNodesPerLayer);
      // No máximo um Porto por camada, nunca na primeira nem na do chefe.
      const port = !last && l > 0 && rand() < cfg.portChance ? nextInt(0, count - 1) : -1;
      const layer = [];
      for (let i = 0; i < count; i++) {
        const type = last ? 'boss' : i === port ? 'port' : LEG_TYPE_ORDER[nextInt(0, LEG_TYPE_ORDER.length - 1)];
        const node = { layer: l, index: i, isBoss: last, type, next: [] };
        node.risk = type === 'port' || last ? 0 : LEG_TYPES[type].risk;
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

  // Joga sozinho: monta armas num plano fixo, abre portinholas, melhora a arma mais
  // barata, compra Forro de cobre nos Recifes, repara no Porto, usa as habilidades e
  // mexe nas velas (Pano cheio quando só há perseguidores; Meio pano na Tempestade e nos
  // Recifes). Serve para testar o balanceamento no Node e para o atalho #auto.
  // Ordem das portinholas por tipo de trecho: primeiro as viradas para o lado de onde os
  // piratas vêm (a direção do meio do arco de spawn); na Enseada (360°), na ordem da classe.
  // Funciona com qualquer classe de navio, porque só olha o facing de cada portinhola.
  const AUTO_FACE = { open: 180, reefs: 0, storm: 180, cove: null };
  function autoOrder(sim, type) {
    const face = AUTO_FACE[type] === undefined ? 180 : AUTO_FACE[type];
    const list = sim.gunports.slice();
    if (face === null) return list;
    const off = (g) => Math.abs(((g.facing - face + 540) % 360) - 180);
    return list.sort((a, b) => off(a) - off(b) || Math.abs(a.offset[0] - (face === 0 ? 9 : -9)) - Math.abs(b.offset[0] - (face === 0 ? 9 : -9)));
  }
  const AUTO_LATE = ['carronade', 'marines'];

  function autoPlay(sim) {
    if (sim.phase === 'route') {
      const options = sim.route.layers.flat().filter((n) => sim.canChoose(n));
      if (!options.length) return;
      // Machucado: prefere o Porto, se der.
      const port = options.find((n) => n.type === 'port');
      const next = sim.shipsForSale()[0];
      const canBuy = next && sim.gold >= next.cost;
      if (port && (sim.ship.hull < sim.maxHull * 0.7 || canBuy)) { sim.chooseNode(port); return; }
      sim.chooseNode(options[Math.floor(sim.rand() * options.length)]);
      return;
    }
    if (sim.phase === 'port') {
      // Troca pelo próximo navio se o ouro (com a venda das armas) der e sobrar uma reserva.
      const next = sim.shipsForSale()[0];
      if (next) {
        const refund = sim.gunports.reduce((sum, g) => sum + (g.weapon ? sim.sellValue(g.weapon) : 0), 0);
        if (sim.gold + refund >= next.cost + 120) sim.buyShip(next.id);
      }
      sim.repair(Math.min(sim.missingHull(), Math.max(0, (sim.gold - 60) * PORT.hullPerGold)));
      sim.leavePort();
      return;
    }
    if (sim.phase !== 'leg' || !sim.running) return;

    // Velas: Meio pano onde correr dói (rochedos, rajadas); Pano cheio quando o casco
    // está baixo e no Mar aberto (todo mundo vem por trás); senão, Meio pano.
    const type = sim.settings.type;
    const low = sim.ship.hull < sim.maxHull * 0.4;
    sim.setSail(type === 'reefs' || type === 'storm' ? 1 : (low || type === 'open') ? 2 : 1);

    const order = autoOrder(sim, type);
    for (let i = 0; i < order.length; i++) {
      const g = order[i];
      if (g.weapon) continue;
      if (!g.isOpen) {
        if (sim.gold >= sim.openCost()) sim.openGunport(g.index);
        return;
      }
      const late = i >= 4 && i < 6 ? WEAPONS[AUTO_LATE[i - 4]] : null;
      const def = late && sim.shop.includes(late) ? late : WEAPONS.longgun;
      if (sim.gold >= def.cost) sim.buy(g.index, def.id);
      return; // espera juntar para esta portinhola antes de pular para a próxima
    }
    if (type === 'reefs' && sim.ship.copper < 3 && sim.gold >= sim.upgradeCostOf('copper')) { sim.buyUpgrade('copper'); return; }
    if (sim.ship.crew < 1 && sim.gold >= sim.upgradeCostOf('crew')) { sim.buyUpgrade('crew'); return; }
    let cheapest = null;
    for (const g of sim.gunports) {
      const w = g.weapon;
      if (!w || w.level >= w.def.maxLevel) continue;
      if (!cheapest || sim.upgradeCost(w) < sim.upgradeCost(cheapest.weapon)) cheapest = g;
    }
    if (cheapest && sim.gold >= sim.upgradeCost(cheapest.weapon)) sim.upgrade(cheapest.index);

    const s = sim.ship;
    const chasing = sim.enemies.some((e) => e.def.isShip && !e.removed && e.x < s.x - 2 && e.x > s.x - 14);
    if (chasing) sim.useAbility(0);
    const near = sim.enemies.filter((e) => e.def.isShip && !e.removed && Math.hypot(e.x - s.x, e.y - s.y) < 10).length;
    if (near >= 3 || s.hull < sim.maxHull * 0.4) sim.useAbility(1);
  }

  const API = { Sim, generateRoute, seededRandom, autoPlay, levelMult };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.SEA = API;
})(typeof window !== 'undefined' ? window : globalThis);
