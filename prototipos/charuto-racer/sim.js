'use strict';
/* Charuto Racer — simulação (sem DOM). Porte direto do guia Unity do CharutoRacer.md:
   Track (Fase 2.2), PlayerCarController (3.3), CollisionSystem (4.1), AICarController (5.1),
   RaceDirector (5.3), PitStopController (6.1) e GameSession (8.2). Roda no navegador e no Node. */

// ------------------------------------------------------------------ utilidades
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clamp01 = v => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const moveTowards = (v, target, maxDelta) => Math.abs(target - v) <= maxDelta ? target : v + Math.sign(target - v) * maxDelta;
const easeIn = (a, b, t) => a + (b - a) * t * t;
const easeInOut = (a, b, t) => a + (b - a) * (-Math.cos(t * Math.PI) / 2 + 0.5);

// Aleatório com semente: a mesma pista sempre sai com as árvores no mesmo lugar.
function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ------------------------------------------------------------------ pista (Fase 2.2)
function buildTrack(def, index) {
  const segLen = CFG.segmentLength;
  const segments = [];
  const lastY = () => segments.length ? segments[segments.length - 1].y2 : 0;

  function addSegment(curve, y) {
    const n = segments.length;
    segments.push({
      index: n, z1: n * segLen, z2: (n + 1) * segLen, y1: lastY(), y2: y, curve,
      dark: Math.floor(n / CFG.rumbleLength) % 2 === 1, isPit: false,
      objects: [], cars: [], p1: null, p2: null, clipY: 0, fog: 0,
    });
  }
  function addRoad(enter, hold, leave, curve, hill) {
    const startY = lastY(), endY = startY + hill * segLen, total = Math.max(1, enter + hold + leave);
    for (let n = 0; n < enter; n++) addSegment(easeIn(0, curve, n / enter), easeInOut(startY, endY, n / total));
    for (let n = 0; n < hold; n++) addSegment(curve, easeInOut(startY, endY, (enter + n) / total));
    for (let n = 0; n < leave; n++) addSegment(easeInOut(curve, 0, n / leave), easeInOut(startY, endY, (enter + hold + n) / total));
  }

  for (const s of def.sections) addRoad(...s);
  const back = -lastY() / segLen;
  if (Math.abs(back) > 0.01) addRoad(25, 25, 25, 0, back);
  for (let i = PIT_START; i <= PIT_END && i < segments.length; i++) segments[i].isPit = true;

  const rand = seeded(1000 + index * 97);
  const place = p => {
    const count = p.count ?? 9999;
    for (let i = 0; i < count; i++) {
      const idx = p.first + i * p.every;
      if (idx >= segments.length - 2) break;
      const sides = p.mirror ? [1, -1] : [1];
      for (const side of sides) {
        let off = p.off * side;
        if (p.jit) off += Math.sign(off) * rand() * p.jit;
        const seg = segments[idx];
        // Nada que causa batida no lado direito do box (Fase 6.2, passo 2).
        if (p.hit && seg.isPit && off > 0) continue;
        seg.objects.push({ k: p.k, off, w: p.w, hit: !!p.hit });
      }
    }
  };
  def.roadside.forEach(place);
  START_DECOR.forEach(place);

  const length = segments.length * segLen;
  const wrap = z => { z %= length; return z < 0 ? z + length : z; };
  const findSegment = z => segments[Math.floor(wrap(z) / segLen) % segments.length];
  const percentIn = z => (wrap(z) % segLen) / segLen;
  const heightAt = z => { const s = findSegment(z); return lerp(s.y1, s.y2, percentIn(z)); };
  return { def, segments, length, wrap, findSegment, percentIn, heightAt };
}

// ------------------------------------------------------------------ carro (Fase 1.1 / 3.2)
function partById(id) { return PARTS.find(p => p.id === id) || null; }

function buildStats(parts) {
  const s = {
    maxSpeedKmh: CFG.baseMaxSpeedKmh, accelerationKmh: CFG.baseAccelerationKmh, grip: CFG.baseGrip,
    durability: 0, fuelConsumption: 1, tireWear: 1, gearCount: CFG.baseGearCount,
  };
  for (const p of parts) {
    if (!p) continue;
    s.maxSpeedKmh += p.speed || 0;
    s.accelerationKmh += p.accel || 0;
    s.grip += p.grip || 0;
    s.durability += p.durability || 0;
    s.fuelConsumption *= p.fuel || 1;
    s.tireWear *= p.wear || 1;
    if (p.gears) s.gearCount = p.gears;
  }
  s.grip = clamp01(s.grip);
  s.durability = clamp(s.durability, 0, 0.8);
  return s;
}

function newCar(props) {
  return Object.assign({ z: 0, x: 0, speed: 0, steer: 0, laps: -1, finished: false, retired: false, finishTime: 0, seg: null }, props);
}

function updateSegment(car, track) {
  const current = track.findSegment(car.z);
  if (current === car.seg) return;
  if (!car.isPlayer) {
    if (car.seg) car.seg.cars.splice(car.seg.cars.indexOf(car), 1);
    current.cars.push(car);
  }
  car.seg = current;
}

function advance(car, distance, track) {
  car.z += distance;
  if (car.z >= track.length) { car.z -= track.length; car.laps++; }
  updateSegment(car, track);
}

// ------------------------------------------------------------------ corrida (Fase 5.3)
// setup: { trackIndex, stats, damage, automatic, rivals }
function createRace(setup) {
  const def = TRACKS[setup.trackIndex];
  const track = buildTrack(def, setup.trackIndex);
  const race = {
    def, track, laps: setup.laps || def.laps, state: 'countdown', countdown: CFG.countdown, time: 0,
    cars: [], rivals: [], ai: [], standings: [], position: 0, results: null,
    pit: { active: false, timer: 0, leaving: false },
    player: null,
  };

  const total = setup.rivals.length + 1;
  let rivalIndex = 0;
  for (let slot = 0; slot < total; slot++) {
    const row = Math.floor(slot / 2), x = slot % 2 === 0 ? -0.4 : 0.4;
    let car;
    if (slot === total - 1) { // jogador larga em último (Parte 1 §4.1, placeholder)
      car = newCar({ name: PLAYER.driver, isPlayer: true, look: PLAYER });
      race.player = {
        car, stats: setup.stats, auto: setup.automatic, gear: 1, rpm: 0, offRoad: false, controls: false, crashCd: 0,
        cond: { fuel: CFG.fuelCapacity, damage: clamp(setup.damage || 0, 0, 99), tireWear: 0, nitro: CFG.nitroCharges, nitroTime: 0 },
      };
    } else {
      const team = setup.rivals[rivalIndex++];
      car = newCar({ name: team.driver, look: team });
      race.ai.push({ car, team, prefX: x });
      race.rivals.push(car);
    }
    car.x = x;
    car.z = track.wrap(-CFG.carLength * 1.5 * (row + 1));
    updateSegment(car, track);
    race.cars.push(car);
  }
  updateStandings(race);
  return race;
}

// Um passo da corrida. input: { accel, brake, steer, nitro, up, down } (nitro/up/down = apertou neste passo).
function raceStep(race, dt, input) {
  if (race.state === 'countdown') {
    race.countdown -= dt;
    if (race.countdown <= 0) { race.state = 'racing'; race.player.controls = true; }
    return;
  }
  if (race.state === 'racing') {
    race.time += dt;
    pitTick(race, dt);
  }
  playerTick(race, dt, input);
  for (const a of race.ai) aiTick(race, a, dt);
  checkRoadside(race);
  checkCars(race);
  checkFinishes(race);
  updateStandings(race);
}

function checkFinishes(race) {
  for (const car of race.cars)
    if (!car.finished && !car.retired && car.laps >= race.laps) { car.finished = true; car.finishTime = race.time; }

  const p = race.player, me = p.car;
  if (!me.finished && !me.retired &&
      (p.cond.damage >= 100 || (p.cond.fuel <= 0 && me.speed < 1 && !race.pit.active)))
    me.retired = true;
  if (race.state === 'racing' && (me.finished || me.retired)) finishRace(race);
}

// Abandono voluntário (pausa → Desistir).
function retirePlayer(race) {
  if (race.state === 'finished') return;
  race.player.car.retired = true;
  if (race.state === 'countdown') race.state = 'racing';
  finishRace(race);
}

function finishRace(race) {
  race.state = 'finished';
  race.player.controls = false;
  updateStandings(race);
  race.results = race.standings.map((c, i) => ({
    driver: c.name, isPlayer: !!c.isPlayer, position: i + 1, retired: c.retired,
    finishTime: c.finished ? c.finishTime : -1,
  }));
}

function compareCars(race, a, b) {
  if (a.retired !== b.retired) return a.retired ? 1 : -1;
  if (a.finished && b.finished) return a.finishTime - b.finishTime;
  if (a.finished !== b.finished) return a.finished ? -1 : 1;
  return (b.laps * race.track.length + b.z) - (a.laps * race.track.length + a.z);
}

function updateStandings(race) {
  race.standings = race.cars.slice().sort((a, b) => compareCars(race, a, b));
  race.position = race.standings.indexOf(race.player.car) + 1;
}

// ------------------------------------------------------------------ jogador (Fase 3.3)
function maxSpeed(p) {
  let kmh = p.stats.maxSpeedKmh * (1 - CFG.damageSpeedPenalty * p.cond.damage / 100);
  if (p.cond.nitroTime > 0) kmh *= CFG.nitroSpeedBoost;
  return kmh * KMH;
}
const gearTop = (p, gear) => maxSpeed(p) * gear / p.stats.gearCount;

function playerTick(race, dt, input) {
  const p = race.player, car = p.car, c = p.cond, track = race.track;
  const ctl = p.controls;
  const accelerate = ctl && input.accel && c.fuel > 0 && c.damage < 100;
  const brake = ctl && input.brake;
  const steer = ctl ? clamp(input.steer, -1, 1) : 0;

  // Nitro
  if (c.nitroTime > 0) c.nitroTime -= dt;
  else if (ctl && input.nitro && c.nitro > 0) { c.nitro--; c.nitroTime = CFG.nitroDuration; }

  // Câmbio
  if (p.auto) {
    if (p.gear < p.stats.gearCount && p.rpm >= 0.92) p.gear++;
    else if (p.gear > 1 && car.speed < gearTop(p, p.gear - 1) * 0.6) p.gear--;
  } else if (ctl) {
    if (input.up && p.gear < p.stats.gearCount) p.gear++;
    if (input.down && p.gear > 1) p.gear--;
  }

  const seg = track.findSegment(car.z);
  const speedPercent = car.speed / (CFG.referenceSpeedKmh * KMH);

  // Direção e força centrífuga
  const dx = dt * CFG.steerSpeed * speedPercent;
  car.x += steer * dx;
  car.steer = steer < -0.2 ? -1 : steer > 0.2 ? 1 : 0;
  const grip = p.stats.grip * (1 - c.tireWear * 0.5);
  car.x -= dx * speedPercent * seg.curve * CFG.centrifugal * lerp(1.4, 0.6, grip);

  // Velocidade
  if (accelerate) car.speed += acceleration(p) * dt;
  else if (brake) car.speed -= CFG.brakingKmh * KMH * dt;
  else car.speed -= CFG.coastDecelKmh * KMH * dt;

  const onPitLane = seg.isPit && car.x > 0 && car.x < 1 + CFG.pitLaneWidth;
  p.offRoad = Math.abs(car.x) > 1 && !onPitLane;
  if (p.offRoad && car.speed > CFG.offRoadMaxSpeedKmh * KMH) car.speed -= CFG.offRoadDecelKmh * KMH * dt;

  const top = gearTop(p, p.gear);
  if (car.speed > top) car.speed = moveTowards(car.speed, top, CFG.coastDecelKmh * 2 * KMH * dt);
  car.speed = Math.max(0, car.speed);
  car.x = clamp(car.x, -CFG.maxOffsetX, CFG.maxOffsetX);
  p.rpm = clamp01(car.speed / top);

  // Consumo e desgaste
  const km = car.speed * dt / 100000;
  c.fuel = Math.max(0, c.fuel - km * CFG.fuelPerKm * p.stats.fuelConsumption * (c.nitroTime > 0 ? 2 : 1));
  c.tireWear = Math.min(1, c.tireWear + km * CFG.tireWearPerKm * p.stats.tireWear * (p.offRoad ? 3 : 1));

  advance(car, car.speed * dt, track);
  p.crashCd -= dt;
}

function acceleration(p) {
  const n = p.stats.gearCount;
  const gearFactor = n <= 1 ? 1 : lerp(1.4, 0.7, (p.gear - 1) / (n - 1));
  const torque = lerp(0.6, 1, Math.sin(p.rpm * Math.PI * 0.9));
  let a = p.stats.accelerationKmh * gearFactor * torque;
  if (p.auto) a *= CFG.automaticAccelFactor;
  if (p.cond.nitroTime > 0) a *= CFG.nitroAccelBoost;
  return a * KMH;
}

// Batida: velocidade cai para newSpeed; dano proporcional ao impacto, no máximo a cada 0,5 s.
function applyCrash(p, damageAtFullSpeed, newSpeed) {
  const impact = clamp01(p.car.speed / (p.stats.maxSpeedKmh * KMH));
  p.car.speed = Math.min(p.car.speed, newSpeed);
  if (p.crashCd > 0) return false;
  p.crashCd = 0.5;
  p.cond.damage = Math.min(100, p.cond.damage + damageAtFullSpeed * impact * (1 - p.stats.durability));
  p.lastCrash = true;
  return true;
}

// ------------------------------------------------------------------ colisões (Fase 4.1)
function checkRoadside(race) {
  const p = race.player, car = p.car;
  if (!car.seg || Math.abs(car.x) <= 1) return;
  const carW = CFG.carWorldWidth / CFG.roadWidth;
  for (const obj of car.seg.objects) {
    if (!obj.hit) continue;
    const minDistance = (carW + obj.w / CFG.roadWidth) / 2;
    if (Math.abs(car.x - obj.off) >= minDistance) continue;
    applyCrash(p, CFG.crashDamage, car.speed * CFG.crashSpeedFactor);
    car.x = obj.off - Math.sign(obj.off) * minDistance * 1.01;
    break;
  }
}

function checkCars(race) {
  const p = race.player, me = p.car, track = race.track;
  const carW = CFG.carWorldWidth / CFG.roadWidth;
  for (const other of race.rivals) {
    if (other.retired) continue;
    const ahead = track.wrap(other.z - me.z);
    if (ahead > CFG.carLength || me.speed <= other.speed || Math.abs(me.x - other.x) >= carW) continue;
    applyCrash(p, CFG.carBumpDamage, other.speed * 0.9);
  }
}

// ------------------------------------------------------------------ IA (Fase 5.1)
function aiTick(race, a, dt) {
  const car = a.car, track = race.track;
  if (car.retired) return;
  const seg = track.findSegment(car.z);
  const curveFactor = 1 - clamp01(Math.abs(seg.curve) / 6) * CFG.aiCurveSlowdown;
  const target = a.team.speed * KMH * curveFactor;
  const rate = a.team.accel * KMH * (car.speed > target ? 2 : 1);
  car.speed = moveTowards(car.speed, target, rate * dt);

  const desiredX = aiDesiredX(race, a);
  const newX = moveTowards(car.x, desiredX, dt * 0.8);
  car.steer = newX < car.x - 0.001 ? -1 : newX > car.x + 0.001 ? 1 : 0;
  car.x = newX;
  advance(car, car.speed * dt, track);
}

function aiDesiredX(race, a) {
  const car = a.car, carW = CFG.carWorldWidth / CFG.roadWidth, lookAhead = CFG.segmentLength * 20;
  for (const other of race.cars) {
    if (other === car || other.retired) continue;
    const ahead = race.track.wrap(other.z - car.z);
    if (ahead <= 0 || ahead > lookAhead || other.speed >= car.speed || Math.abs(other.x - car.x) > carW * 1.2) continue;
    const side = other.x > 0 ? -1 : 1;
    return clamp(other.x + side * carW * 1.5, -0.8, 0.8);
  }
  return a.prefX;
}

// ------------------------------------------------------------------ box (Fase 6.1)
function pitTick(race, dt) {
  const p = race.player, car = p.car, seg = car.seg, pit = race.pit;
  if (!seg) return;
  if (!pit.active) {
    if (pit.leaving) { if (!seg.isPit) pit.leaving = false; return; }
    if (seg.isPit && car.x > CFG.pitEntryX && car.speed / KMH <= CFG.pitMaxEntryKmh) {
      pit.active = true; pit.timer = 0; car.speed = 0; p.controls = false; pit.stops = (pit.stops || 0) + 1;
    }
    return;
  }
  car.speed = 0;
  const c = p.cond;
  c.fuel = Math.min(CFG.fuelCapacity, c.fuel + CFG.pitRefuelPerSecond * dt);
  pit.timer += dt;
  if (pit.timer >= CFG.pitTireChangeSeconds) c.tireWear = 0;
  if (c.fuel >= CFG.fuelCapacity && pit.timer >= CFG.pitTireChangeSeconds) {
    pit.active = false; pit.leaving = true; p.controls = true;
  }
}

// ------------------------------------------------------------------ piloto automático (atalho #auto e testes)
// Segura a curva até onde dá; se nem virando tudo o carro aguenta, tira o pé. Usa o box quando o
// combustível não chega ao fim. Não é a IA dos adversários: dirige o carro do jogador com as mesmas regras dele.
function autopilot(race) {
  const p = race.player, car = p.car, track = race.track;
  const sp = car.speed / (CFG.referenceSpeedKmh * KMH);
  const grip = p.stats.grip * (1 - p.cond.tireWear * 0.5);
  const f = CFG.centrifugal * lerp(1.4, 0.6, grip);
  // Olha a curva um pouco à frente para frear antes.
  let curve = 0;
  for (let i = 0; i < 12; i++) {
    const c = track.findSegment(car.z + i * CFG.segmentLength * 2).curve;
    if (Math.abs(c) > Math.abs(curve)) curve = c;
  }
  const here = track.findSegment(car.z).curve;
  const remainingKm = ((race.laps - car.laps - 1) * track.length + (track.length - car.z)) / 100000;
  const needPit = p.cond.fuel < remainingKm * CFG.fuelPerKm * p.stats.fuelConsumption + 3 && car.laps < race.laps - 1;
  const nearPit = car.seg && car.z > track.length - 30 * CFG.segmentLength;
  const inPit = car.seg && car.seg.isPit;
  let targetX = car.seg && (nearPit || inPit) && needPit ? 1.3 : 0;
  // Desvia de quem está logo à frente.
  for (const o of race.rivals) {
    const ahead = track.wrap(o.z - car.z);
    if (ahead > 0 && ahead < 2500 && Math.abs(o.x - targetX) < 0.35 && o.speed < car.speed) targetX = o.x > 0 ? o.x - 0.5 : o.x + 0.5;
  }
  const need = sp * here * f;
  const steer = clamp(need + (targetX - car.x) * 2.5, -1, 1);
  const needAhead = sp * curve * f;
  const wantPit = needPit && (nearPit || inPit) && car.speed / KMH > CFG.pitMaxEntryKmh - 15;
  return {
    accel: Math.abs(needAhead) < 0.95 && !wantPit,
    brake: Math.abs(needAhead) > 1.15 || wantPit,
    steer,
    nitro: !needPit && Math.abs(curve) < 1 && p.cond.fuel > 40,
    up: false, down: false,
  };
}

// ------------------------------------------------------------------ campeonato e economia (Fase 8.2)
function newSave() {
  const save = {
    version: 1, money: CFG.startingMoney, owned: [], equipped: [null, null, null, null], damage: 0, automatic: true,
    season: 1, raceIndex: 0, standings: [], lastResults: [], lastPrize: 0, lastPoints: 0,
  };
  for (const p of PARTS.filter(p => p.tier === 1)) { save.owned.push(p.id); save.equipped[p.cat] = p.id; }
  save.standings = newStandings();
  return save;
}

function newStandings() {
  return TEAMS.map(t => ({ driver: t.driver, isPlayer: false, points: 0, wins: 0, seconds: 0 }))
    .concat([{ driver: PLAYER.driver, isPlayer: true, points: 0, wins: 0, seconds: 0 }]);
}

const seasonOver = save => save.raceIndex >= TRACKS.length;
const currentStats = save => buildStats(save.equipped.map(partById));
const repairCost = save => Math.ceil(save.damage * CFG.repairCostPerPercent);
const sortedStandings = save => save.standings.slice().sort((a, b) => b.points - a.points || b.wins - a.wins || b.seconds - a.seconds);

function raceSetupFrom(save) {
  return { trackIndex: save.raceIndex, stats: currentStats(save), damage: save.damage, automatic: save.automatic, rivals: TEAMS };
}

function applyRaceResult(save, results, finalDamage) {
  save.lastPrize = 0; save.lastPoints = 0;
  for (const r of results) {
    const entry = save.standings.find(s => s.driver === r.driver);
    if (!entry || r.retired) continue;
    const points = CFG.pointsByPosition[r.position - 1] || 0;
    entry.points += points;
    if (r.position === 1) entry.wins++;
    if (r.position === 2) entry.seconds++;
    if (r.isPlayer) {
      save.lastPrize = CFG.prizeByPosition[r.position - 1] || 0;
      save.lastPoints = points;
      save.money += save.lastPrize;
    }
  }
  save.damage = clamp(finalDamage, 0, 100);
  save.lastResults = results;
  save.raceIndex++;
}

function startNextSeason(save) {
  save.season++; save.raceIndex = 0; save.standings = newStandings(); save.lastResults = [];
}

function buyPart(save, part) {
  if (save.owned.includes(part.id) || save.money < part.price) return false;
  save.money -= part.price;
  save.owned.push(part.id);
  save.equipped[part.cat] = part.id;
  return true;
}

function equipPart(save, part) { if (save.owned.includes(part.id)) save.equipped[part.cat] = part.id; }

function repairCar(save) {
  const cost = repairCost(save);
  if (save.damage <= 0 || save.money < cost) return false;
  save.money -= cost; save.damage = 0;
  return true;
}

