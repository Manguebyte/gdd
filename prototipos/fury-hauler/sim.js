// Fury Hauler — regras do jogo, sem nada de tela.
// POR QUE: é um porte direto do guia Unity do FuryHauler.md (TruckController,
// TruckHealth, TripManager, EnemySpawner, os Enemy, as Defense, ScrapWallet,
// AllocationController, AbilityController, RouteGenerator, RunManager). Sem
// DOM, roda também no Node para testar balanceamento (ver autoPlay).
// ESTRATÉGIA: tudo acontece no "chão" em metros: x = distância na estrada,
// y = lado (positivo = esquerda do caminhão). game.js só lê este estado e
// escuta os eventos (on) para desenhar efeitos.
(function (root) {
  'use strict';
  const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.FH_DATA;
  const { CONFIG, SLOTS, DEFENSES, DEFENSE_ORDER, ENEMIES, ENEMY_POOL, ABILITIES } = D;

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

      this.truck = { x: 0, y: 0, hp: this.cfg.truckMaxHp, speedMult: 1, flash: 0 };
      this.slots = SLOTS.map((s, i) => Object.assign({}, s, { index: i, defense: null, saboteurs: 0 }));
      this.enemies = [];
      this.oils = [];
      this.scrap = 0;
      this.cooldowns = ABILITIES.map(() => 0);
      this.nitroTimer = 0;

      this.phase = 'menu';   // menu | route | trip | result
      this.running = false;
      this.settings = null;
      this.blockers = 0;
      this.budget = 0;
      this.nextSpawn = null;
      this.bossSpawned = false;
      this.nextId = 0;
      this.time = 0;

      this.route = null;
      this.current = null;   // nó atual; null = ainda no ponto A
      this.visited = [];
      this.tripsDone = 0;
      this.shop = [];        // defesas liberadas nesta run
      this.result = null;
    }

    on(fn) { this.listeners.push(fn); }
    emit(type, data) { for (const fn of this.listeners) fn(type, data || {}); }
    range(a, b) { return a + (b - a) * this.rand(); }
    intRange(a, b) { return a + Math.floor(this.rand() * (b - a + 1)); } // inclusivo

    get progress() { return Math.min(1, Math.max(0, this.truck.x / this.cfg.tripLength)); }
    get truckSpeed() { return this.cfg.truckSpeed * this.truck.speedMult; }

    // ------------------------------------------------------------------ Run (RunManager)

    // Começa uma run do zero: rota nova, caminhão vazio, sucata inicial.
    newRun() {
      this.route = generateRoute(this.cfg, this.rand);
      this.current = null;
      this.visited = [];
      this.tripsDone = 0;
      this.result = null;
      for (const slot of this.slots) { slot.defense = null; slot.saboteurs = 0; }
      this.truck.hp = this.cfg.truckMaxHp;
      this.truck.x = 0;
      this.scrap = this.cfg.startingScrap;
      this.shop = this.unlockedDefenses();
      this.meta.runsStarted++;
      this.saveMeta(this.meta);
      this.phase = 'route';
      this.emit('phase');
    }

    // Defesas cujo requisito de desbloqueio já foi atingido (placeholder, Parte 1 §9).
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
      if (!this.cfg.carryTruckHpBetweenTrips) this.truck.hp = this.cfg.truckMaxHp;
      this.phase = 'trip';
      this.startTrip(nodeSettings(node, this.cfg));
      return true;
    }

    // Abandona a run (pausa → desistir). Não conta como trecho concluído.
    abandon() {
      this.running = false;
      this.clearEnemies();
      this.oils = [];
      this.phase = 'menu';
      this.emit('phase');
    }

    // ------------------------------------------------------------------ Trecho (TripManager)

    startTrip(settings) {
      this.settings = settings;
      this.blockers = 0;
      this.budget = 0;
      this.nextSpawn = null;
      this.bossSpawned = false;
      this.truck.x = 0;
      this.truck.speedMult = 1;
      this.nitroTimer = 0;
      this.cooldowns = ABILITIES.map(() => 0);
      this.clearEnemies();
      this.oils = [];
      for (const slot of this.slots) if (slot.defense) slot.defense.cooldown = 0;
      this.running = true;
      this.emit('tripStarted', { settings });
    }

    endTrip(success) {
      if (!this.running) return;
      this.running = false;
      this.truck.speedMult = 1;
      this.nitroTimer = 0;
      this.clearEnemies();
      this.oils = [];

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
        this.result = { win: false, trips: this.tripsDone, node: node ? node.name : '' };
        this.phase = 'result';
      }
      this.saveMeta(this.meta);
      this.emit('tripEnded', { success });
    }

    // Um passo da simulação. dt em segundos.
    update(dt) {
      this.time += dt;
      this.truck.flash = Math.max(0, this.truck.flash - dt);
      for (const e of this.enemies) e.flash = Math.max(0, e.flash - dt);
      if (!this.running) return;

      const cfg = this.cfg;
      for (let i = 0; i < this.cooldowns.length; i++) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt);
      if (this.nitroTimer > 0) {
        this.nitroTimer -= dt;
        if (this.nitroTimer <= 0) this.truck.speedMult = 1;
      }

      this.truck.x += this.truckSpeed * dt;
      this.updateSpawner(dt);

      // Inimigos podem nascer durante o laço (saqueadores, reforços do chefe):
      // o for...of também visita os novos, o que não tem problema.
      const list = this.enemies;
      for (const e of list) {
        if (!this.running) return;
        this.updateEnemy(e, dt);
      }
      if (!this.running) return;

      for (const slot of this.slots) if (slot.defense) this.updateDefense(slot, dt);
      this.updateOils(dt);
      this.enemies = this.enemies.filter((e) => !e.removed);

      if (this.truck.x >= cfg.tripLength && this.blockers === 0) this.endTrip(true);
    }

    // ------------------------------------------------------------------ Caminhão (TruckHealth)

    armorReduction() {
      let sum = 0;
      for (const slot of this.slots) {
        const d = slot.defense;
        if (d && d.def.kind === 'armor' && slot.saboteurs === 0) sum += d.def.damageReduction * levelMult(d);
      }
      return Math.min(sum, this.cfg.maxDamageReduction);
    }

    damageTruck(amount) {
      if (!this.running || amount <= 0) return;
      const t = this.truck;
      const final = amount * (1 - this.armorReduction());
      t.hp = Math.max(0, t.hp - final);
      if (amount >= 1) { t.flash = 0.12; this.emit('truckHit', { amount: final }); }
      if (t.hp <= 0) this.endTrip(false);
    }

    slotGround(slot) {
      return [this.truck.x + slot.offset[0], this.truck.y + slot.offset[1]];
    }

    // O ponto (px, py) está dentro do leque de tiro do slot?
    canTarget(slot, px, py) {
      if (slot.arc >= 360) return true;
      const [gx, gy] = this.slotGround(slot);
      const dx = px - gx, dy = py - gy;
      if (dx * dx + dy * dy < 1e-4) return true;
      const angle = Math.atan2(dy, dx) / DEG;
      const diff = ((angle - slot.facing + 540) % 360) - 180;
      return Math.abs(diff) <= slot.arc / 2;
    }

    // ------------------------------------------------------------------ Spawn (EnemySpawner)

    updateSpawner(dt) {
      const cfg = this.cfg, s = this.settings;
      if (s.hasBoss && !this.bossSpawned && this.progress >= cfg.bossSpawnAtProgress) {
        this.bossSpawned = true;
        this.spawnBehind('boss');
        this.emit('boss');
      }
      this.budget += (cfg.spawnBudgetBase + cfg.spawnBudgetPerDifficulty * s.difficulty) * dt;
      if (!this.nextSpawn) {
        const eligible = ENEMY_POOL.filter((k) => ENEMIES[k].minDifficulty <= s.difficulty);
        this.nextSpawn = eligible.length ? eligible[Math.floor(this.rand() * eligible.length)] : null;
      }
      if (this.nextSpawn && this.budget >= ENEMIES[this.nextSpawn].spawnCost) {
        this.budget -= ENEMIES[this.nextSpawn].spawnCost;
        this.spawnBehind(this.nextSpawn);
        this.nextSpawn = null;
      }
    }

    spawnBehind(kind) {
      const cfg = this.cfg;
      const side = this.rand() < 0.5 ? -1 : 1;
      return this.spawn(kind,
        this.truck.x - this.range(cfg.spawnBehindMin, cfg.spawnBehindMax),
        side * this.range(0.5, cfg.roadHalfWidth));
    }

    spawn(kind, x, y) {
      const def = ENEMIES[kind];
      const side = y >= 0 ? 1 : -1;
      const e = {
        id: ++this.nextId, kind, def, x, y,
        hp: def.maxHp, stun: 0, flash: 0, removed: false,
        fireTimer: def.fireInterval || 0, timer: def.spawnInterval || 0, left: def.spawnCount || 0,
        post: null, slot: null, blocking: false, seed: this.rand() * Math.PI * 2,
      };
      if (kind === 'biker' || kind === 'boss') e.post = [this.range(-3, 3), side * def.sideDistance];
      if (kind === 'boarder') e.post = [this.range(-1.5, 1.5), side * def.sideDistance];
      if (kind === 'boss' && this.cfg.bossBlocksArrival) { this.blockers++; e.blocking = true; }
      this.enemies.push(e);
      this.emit('spawn', { e });
      return e;
    }

    clearEnemies() {
      for (const e of this.enemies) this.removeEnemy(e, false);
      this.enemies = [];
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
      if (e.stun > 0) e.stun -= dt;   // atordoado: parado no chão, o caminhão se afasta
      else this.tickEnemy(e, dt);
      if (!e.removed && e.x < this.truck.x - this.cfg.enemyDespawnBehind) this.removeEnemy(e, false);
    }

    tickEnemy(e, dt) {
      const t = this.truck, def = e.def;
      switch (e.kind) {
        case 'biker':
        case 'boss': {
          const remaining = this.moveTowards(e, t.x + e.post[0], t.y + e.post[1], dt);
          if (remaining <= def.attackDistance) {
            e.fireTimer -= dt;
            if (e.fireTimer <= 0) {
              e.fireTimer = def.fireInterval;
              this.emit('enemyShot', { e });
              this.damageTruck(def.damage);
            }
          }
          if (e.kind === 'boss' && this.running) {
            e.timer -= dt;
            if (e.timer <= 0) { e.timer = def.spawnInterval; this.spawnBehind(def.spawn); }
          }
          break;
        }
        case 'rammer': {
          const remaining = this.moveTowards(e, t.x, t.y, dt);
          if (remaining <= def.contactRadius) {
            this.emit('explode', { x: e.x, y: e.y });
            this.removeEnemy(e, false);
            this.damageTruck(def.damage);
          }
          break;
        }
        case 'boarder': {
          if (e.left <= 0) { e.x += this.truckSpeed * 0.5 * dt; break; } // vai embora
          if (this.moveTowards(e, t.x + e.post[0], t.y + e.post[1], dt) > 1) break;
          e.timer -= dt;
          if (e.timer > 0) break;
          e.timer = def.spawnInterval;
          e.left--;
          const slot = this.slots[Math.floor(this.rand() * this.slots.length)];
          const [gx, gy] = this.slotGround(slot);
          const raider = this.spawn(def.spawn, gx, gy);
          raider.slot = slot;
          slot.saboteurs++;
          this.emit('board', { e: raider, from: e });
          break;
        }
        case 'raider': {
          if (!e.slot) break;
          const [gx, gy] = this.slotGround(e.slot);
          e.x = gx; e.y = gy;
          this.damageTruck(def.damage * dt);
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
      if (e.slot) { e.slot.saboteurs = Math.max(0, e.slot.saboteurs - 1); e.slot = null; }
      if (e.blocking) { this.blockers = Math.max(0, this.blockers - 1); e.blocking = false; }
    }

    findNearest(slot, range, vehiclesOnly) {
      const [gx, gy] = this.slotGround(slot);
      let best = null, bestSqr = range * range;
      for (const e of this.enemies) {
        if (!this.isAlive(e) || (vehiclesOnly && !e.def.isVehicle)) continue;
        const sqr = (e.x - gx) ** 2 + (e.y - gy) ** 2;
        if (sqr > bestSqr || !this.canTarget(slot, e.x, e.y)) continue;
        best = e; bestSqr = sqr;
      }
      return best;
    }

    // ------------------------------------------------------------------ Defesas (Defense e filhas)

    updateDefense(slot, dt) {
      const d = slot.defense, def = d.def;
      d.firing = false;
      if (slot.saboteurs > 0) return;
      const dmg = def.damage * levelMult(d);
      const [gx, gy] = this.slotGround(slot);

      switch (def.kind) {
        case 'mg': {
          d.cooldown -= dt;
          if (d.cooldown > 0) break;
          const target = this.findNearest(slot, def.range, false);
          if (!target) break;
          d.cooldown = def.fireInterval;
          d.aim = normalize(target.x - gx, target.y - gy, d.aim);
          this.emit('shot', { slot, target, kind: 'mg' });
          this.damageEnemy(target, dmg);
          break;
        }
        case 'flame': {
          const target = this.findNearest(slot, def.range, false);
          if (!target) break;
          const aim = normalize(target.x - gx, target.y - gy, dirOf(slot.facing));
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
          const target = this.findNearest(slot, def.range, true);
          if (!target) break;
          d.cooldown = def.fireInterval;
          d.aim = normalize(target.x - gx, target.y - gy, d.aim);
          this.emit('shot', { slot, target, kind: 'harpoon' });
          this.damageEnemy(target, dmg);
          this.stun(target, def.stunSeconds * levelMult(d));
          break;
        }
        case 'armor': {
          const rangeSqr = def.range * def.range;
          for (const e of this.enemies) {
            if (!this.isAlive(e)) continue;
            if ((e.x - gx) ** 2 + (e.y - gy) ** 2 > rangeSqr) continue;
            this.damageEnemy(e, dmg * dt);
            d.firing = true;
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
      if (ab.kind === 'nitro') {
        this.truck.speedMult = ab.magnitude;
        this.nitroTimer = ab.duration;
      } else if (ab.kind === 'oil') {
        this.oils.push({ x: this.truck.x - ab.dropBehind, y: 0, life: ab.duration, maxLife: ab.duration,
          size: ab.size, stun: ab.magnitude, hit: new Set() });
      }
      this.cooldowns[i] = ab.cooldown;
      this.emit('ability', { ab });
      return true;
    }

    updateOils(dt) {
      const halfWidth = this.cfg.roadHalfWidth;
      for (const oil of this.oils) {
        oil.life -= dt;
        for (const e of this.enemies) {
          if (!this.isAlive(e) || !e.def.isVehicle || oil.hit.has(e.id)) continue;
          if (Math.abs(e.x - oil.x) > oil.size || Math.abs(e.y - oil.y) > halfWidth) continue;
          oil.hit.add(e.id);
          this.stun(e, oil.stun);
        }
      }
      this.oils = this.oils.filter((o) => o.life > 0);
    }

    // ------------------------------------------------------------------ Alocação (AllocationController)

    upgradeCost(d) { return d.def.upgradeCostPerLevel * d.level; }
    sellValue(d) { return Math.round(d.totalSpent * this.cfg.sellRefund); }

    // Devolve 'ok', 'occupied', 'locked' ou 'noScrap'.
    buy(slotIndex, defId) {
      const slot = this.slots[slotIndex], def = DEFENSES[defId];
      if (slot.defense) return 'occupied';
      if (!this.shop.includes(def)) return 'locked';
      if (this.scrap < def.cost) return 'noScrap';
      this.scrap -= def.cost;
      slot.defense = { def, level: 1, totalSpent: def.cost, cooldown: 0, aim: dirOf(slot.facing), firing: false };
      this.emit('build', { slot });
      return 'ok';
    }

    // Devolve 'ok', 'empty', 'max' ou 'noScrap'.
    upgrade(slotIndex) {
      const slot = this.slots[slotIndex], d = slot.defense;
      if (!d) return 'empty';
      if (d.level >= d.def.maxLevel) return 'max';
      const cost = this.upgradeCost(d);
      if (this.scrap < cost) return 'noScrap';
      this.scrap -= cost;
      d.totalSpent += cost;
      d.level++;
      this.emit('build', { slot });
      return 'ok';
    }

    sell(slotIndex) {
      const slot = this.slots[slotIndex], d = slot.defense;
      if (!d) return 0;
      const value = this.sellValue(d);
      this.scrap += value;
      slot.defense = null;
      this.emit('sell', { slot, value });
      return value;
    }
  }

  function levelMult(d) { return 1 + d.def.bonusPerLevel * (d.level - 1); }

  function normalize(x, y, fallback) {
    const len = Math.hypot(x, y);
    return len < 1e-4 ? fallback : [x / len, y / len];
  }

  // ------------------------------------------------------------------ Rota (RouteNode, RouteGenerator)

  function nodeName(node) {
    return node.isBoss ? 'B' : `${node.layer + 1}-${String.fromCharCode(65 + node.index)}`;
  }

  function nodeSettings(node, cfg) {
    return {
      label: node.isBoss ? 'Último trecho: chegada em B' : `Trecho ${node.name} (risco ${node.risk})`,
      difficulty: node.layer + 1 + node.risk,
      hasBoss: node.isBoss,
      scrapMultiplier: 1 + node.risk * cfg.scrapBonusPerRisk,
    };
  }

  function generateRoute(cfg, rand) {
    const nextInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
    const layerCount = Math.max(2, cfg.routeLayers);
    const layers = [];
    for (let l = 0; l < layerCount; l++) {
      const last = l === layerCount - 1;
      const count = last ? 1 : nextInt(cfg.minNodesPerLayer, cfg.maxNodesPerLayer);
      const layer = [];
      for (let i = 0; i < count; i++) {
        const node = { layer: l, index: i, isBoss: last, risk: last ? 0 : nextInt(0, cfg.maxRisk), next: [] };
        node.name = nodeName(node);
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

  // Joga sozinho: monta defesas num plano fixo, melhora a mais barata e usa as
  // habilidades. Serve para testar o balanceamento no Node e para o atalho #auto.
  const AUTO_PLAN = [
    ['teto', 'mg'], ['traseira', 'harpoon'], ['dirTras', 'flame'], ['esqTras', 'flame'],
    ['dirFrente', 'armor'], ['esqFrente', 'mg'],
  ];

  function autoPlay(sim) {
    if (sim.phase === 'route') {
      const options = sim.route.layers.flat().filter((n) => sim.canChoose(n));
      if (options.length) sim.chooseNode(options[Math.floor(sim.rand() * options.length)]);
      return;
    }
    if (sim.phase !== 'trip' || !sim.running) return;

    for (const [slotId, wanted] of AUTO_PLAN) {
      const slot = sim.slots.find((s) => s.id === slotId);
      if (slot.defense) continue;
      const def = sim.shop.includes(DEFENSES[wanted]) ? DEFENSES[wanted] : DEFENSES.mg;
      if (sim.scrap >= def.cost) sim.buy(slot.index, def.id);
      return; // espera juntar para este slot antes de pular para o próximo
    }
    let cheapest = null;
    for (const slot of sim.slots) {
      const d = slot.defense;
      if (!d || d.level >= d.def.maxLevel) continue;
      if (!cheapest || sim.upgradeCost(d) < sim.upgradeCost(cheapest.defense)) cheapest = slot;
    }
    if (cheapest && sim.scrap >= sim.upgradeCost(cheapest.defense)) sim.upgrade(cheapest.index);

    const t = sim.truck;
    const chasing = sim.enemies.some((e) => e.def.isVehicle && !e.removed && e.x < t.x - 2 && e.x > t.x - 14);
    if (chasing) sim.useAbility(1);
    const rammerNear = sim.enemies.some((e) => e.kind === 'rammer' && !e.removed && Math.hypot(e.x - t.x, e.y) < 8);
    if (rammerNear || t.hp < sim.cfg.truckMaxHp * 0.4) sim.useAbility(0);
  }

  const API = { Sim, generateRoute, seededRandom, autoPlay, levelMult };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.FH = API;
})(typeof window !== 'undefined' ? window : globalThis);
