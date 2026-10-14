// Evil Enemy Defense — protótipo jogável em JavaScript puro, com a arte nova do PixelLab.
// Reescrita do protótipo original (abraaovilanova/evil-enemy-defense, TypeScript): a simulação de tick fixo
// (src/sim/battle.ts), as Moedas (src/domain/rewards.ts) e a meta-progressão (src/domain/progression.ts) são
// portadas linha a linha; os números são os da Parte 1 do EvilEnemyDefense.md (§4–§9). Telas no estilo FF NES.
'use strict';

const ART = '../../Sprites/EvilEnemyDefense/';
const SAVE_KEY = 'eed.save.v1';            // §13
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ============================================================ domínio (§4–§9)

const ENTRY_X = 175, TICK = 1 / 20, SPAWN_GAP = 5, MAX_TICKS = Math.round(600 / TICK);
const LEVEL_GAIN = 0.25, STARTING_CAPACITY = 6, MAX_LEVEL = 20, MAX_CAPACITY = 40;

const UNIT_TYPES = {
  warrior: { name: 'Guerreiro',   short: 'GUE', hp: 70, damage: 9,  armor: 3, attackInterval: 1.0,  range: 8,   speed: 22, unlockCost: 0 },
  archer:  { name: 'Arqueiro',    short: 'ARQ', hp: 25, damage: 6,  armor: 0, attackInterval: 0.8,  range: 60,  speed: 26, unlockCost: 120 },
  bomber:  { name: 'Bombardeiro', short: 'BOM', hp: 40, damage: 34, armor: 1, attackInterval: 3.5,  range: 110, speed: 14, unlockCost: 400 },
  pawn:    { name: 'Peão',        short: 'PEA', hp: 34, damage: 6,  armor: 0, attackInterval: 0.7,  range: 8,   speed: 34, unlockCost: 200,  unlockedByStage: 'lizard-nest' },
  lancer:  { name: 'Lanceiro',    short: 'LAN', hp: 60, damage: 16, armor: 2, attackInterval: 1.3,  range: 28,  speed: 24, unlockCost: 650,  unlockedByStage: 'bear-den' },
  thief:   { name: 'Ladino',      short: 'LAD', hp: 30, damage: 14, armor: 0, attackInterval: 0.45, range: 10,  speed: 42, unlockCost: 1200, unlockedByStage: 'wood-fort' },
};
const hpAtLevel = (t, l) => Math.round(t.hp * (1 + LEVEL_GAIN * (l - 1)));
const damageAtLevel = (t, l) => Math.round(t.damage * (1 + LEVEL_GAIN * (l - 1)));

const W = (damage, interval, range, targeting) => ({ damage, interval, range, targeting });
const near = { kind: 'foremost' }, low = { kind: 'lowestHp' }, area = radius => ({ kind: 'area', radius });
const FORMS = {
  goblin:         { name: 'Goblin',           hp: 800,  armor: 0,  speed: 18, weapons: [W(20, 1, 14, near)] },
  'great-orc':    { name: 'Orc Grande',       hp: 950,  armor: 2,  speed: 15, weapons: [W(30, 1, 20, near), W(14, 1.5, 85, low)] },
  lizard:         { name: 'Lagarto Cuspidor', hp: 820,  armor: 1,  speed: 20, weapons: [W(20, 1.4, 105, area(14))] },
  bear:           { name: 'Urso',             hp: 2400, armor: 5,  speed: 26, weapons: [W(52, 0.8, 22, near), W(38, 2.4, 26, area(20))] },
  minotaur:       { name: 'Minotauro',        hp: 2600, armor: 7,  speed: 19, weapons: [W(68, 1.3, 28, area(22)), W(30, 3, 70, low)] },
  troll:          { name: 'Troll',            hp: 2800, armor: 6,  speed: 12, weapons: [W(120, 2.2, 32, area(22))] },
  'wood-tower':   { name: 'Torre de Madeira', hp: 1900, armor: 6,  speed: 0,  weapons: [W(17, 0.7, 120, near), W(26, 2.6, 70, area(22))] },
  tower:          { name: 'Torre de Vigia',   hp: 2800, armor: 9,  speed: 0,  weapons: [W(16, 0.6, 150, near), W(40, 2, 170, area(30))] },
  'tower-blue':   { name: 'Torre Azul',       hp: 2500, armor: 11, speed: 0,  weapons: [W(15, 0.55, 160, low), W(45, 2.2, 180, area(26))] },
  'tower-purple': { name: 'Torre Sombria',    hp: 2700, armor: 13, speed: 0,  weapons: [W(15, 0.5, 170, near), W(48, 2, 190, area(28))] },
  castle:         { name: 'Castelo',          hp: 2600, armor: 14, speed: 0,  weapons: [W(13, 0.45, 190, near), W(42, 1.8, 210, low), W(42, 2.4, 200, area(30))] },
};
const isBuilding = id => FORMS[id].speed === 0;

const G = (formId, x) => ({ formId, x });
const STAGES = [
  { id: 'goblin-camp',   name: 'Acampamento Goblin',     base: 40,   first: 60,   garrison: [G('goblin', 0)] },
  { id: 'orc-warcamp',   name: 'Forte dos Orcs',         base: 70,   first: 110,  garrison: [G('great-orc', 0), G('goblin', -55)] },
  { id: 'lizard-nest',   name: 'Ninho dos Lagartos',     base: 105,  first: 170,  garrison: [G('lizard', 0), G('goblin', 60), G('goblin', -60)] },
  { id: 'wood-outpost',  name: 'Posto de Madeira',       base: 150,  first: 240,  garrison: [G('wood-tower', 0), G('great-orc', -50), G('goblin', 55)] },
  { id: 'bear-den',      name: 'Toca do Urso',           base: 200,  first: 320,  garrison: [G('bear', 0), G('lizard', 65), G('goblin', -70)] },
  { id: 'minotaur-maze', name: 'Labirinto do Minotauro', base: 270,  first: 430,  garrison: [G('minotaur', 0), G('lizard', -60), G('great-orc', 65)] },
  { id: 'wood-fort',     name: 'Forte de Madeira',       base: 350,  first: 560,  garrison: [G('wood-tower', 0), G('wood-tower', -55), G('bear', 60), G('great-orc', -105)] },
  { id: 'troll-bridge',  name: 'Ponte do Troll',         base: 450,  first: 720,  garrison: [G('troll', 0), G('bear', -65), G('lizard', 70)] },
  { id: 'watchtower',    name: 'Torre de Vigia',         base: 580,  first: 930,  garrison: [G('tower', 0), G('minotaur', 60), G('wood-tower', -60), G('lizard', -110)] },
  { id: 'twin-towers',   name: 'Torres Gêmeas',          base: 740,  first: 1180, garrison: [G('tower-blue', 0), G('tower', -60), G('troll', 65), G('bear', -110)] },
  { id: 'dark-fortress', name: 'Fortaleza Sombria',      base: 950,  first: 1520, garrison: [G('tower-purple', 0), G('tower-blue', -60), G('minotaur', 60), G('troll', -115), G('lizard', 115)] },
  { id: 'castle',        name: 'O Castelo',              base: 1250, first: 2000, garrison: [G('castle', 0), G('tower-purple', -70), G('tower-blue', 70), G('troll', -120), G('minotaur', 120)] },
];

// ------------------------------------------------------------ simulação (src/sim/battle.ts)

function createBattle(stage, army) {
  const units = [], perSide = { '-1': 0, '1': 0 };
  let id = 0;
  for (const e of army) {
    const t = UNIT_TYPES[e.typeId];
    for (let n = 0; n < e.count; n++) {
      const rank = perSide[e.side]++;
      const maxHp = hpAtLevel(t, e.level);
      units.push({ id: id++, typeId: e.typeId, side: e.side, x: e.side * (ENTRY_X + rank * SPAWN_GAP), hp: maxHp, maxHp,
        damage: damageAtLevel(t, e.level), armor: t.armor, range: t.range, speed: t.speed, attackInterval: t.attackInterval, cooldown: 0, targetId: null });
    }
  }
  const defenders = stage.garrison.map((s, i) => {
    const f = FORMS[s.formId];
    return { id: i, formId: s.formId, x: s.x, hp: f.hp, maxHp: f.hp, armor: f.armor, speed: f.speed, weapons: f.weapons, cooldowns: f.weapons.map(() => 0), firing: false };
  });
  return { stage, units, defenders, garrisonMaxHp: defenders.reduce((t, d) => t + d.maxHp, 0), initialUnits: units.length, ticks: 0, outcome: 'running' };
}

const applyDamage = (target, amount) => { target.hp -= Math.max(1, amount - target.armor); };
function minBy(items, score) {
  let best = items[0];
  for (const it of items) { const d = score(it) - score(best); if (d < 0 || (d === 0 && it.id < best.id)) best = it; }
  return best;
}
function pickTargets(weapon, dx, units) {
  const inRange = units.filter(u => Math.abs(u.x - dx) <= weapon.range);
  if (!inRange.length) return [];
  if (weapon.targeting.kind === 'foremost') return [minBy(inRange, u => Math.abs(u.x - dx))];
  if (weapon.targeting.kind === 'lowestHp') return [minBy(inRange, u => u.hp)];
  const epi = minBy(inRange, u => Math.abs(u.x - dx));
  return inRange.filter(u => Math.abs(u.x - epi.x) <= weapon.targeting.radius);
}

function step(s) {
  if (s.outcome !== 'running') return;
  const dt = TICK;
  // 1. Defensores atiram, ou caminham se ninguém está no alcance.
  for (const d of s.defenders) {
    d.firing = false; let fired = false;
    d.weapons.forEach((w, i) => {
      d.cooldowns[i] -= dt;
      while (d.cooldowns[i] <= 0) {
        const targets = pickTargets(w, d.x, s.units);
        if (!targets.length) { d.cooldowns[i] = 0; break; }   // sem alvo: pronta, sem acumular
        for (const t of targets) applyDamage(t, w.damage);
        fired = true; d.cooldowns[i] += w.interval;
      }
    });
    d.firing = fired;
    const longest = Math.max(...d.weapons.map(w => w.range));
    const close = s.units.some(u => Math.abs(u.x - d.x) <= longest);
    d.moving = false;
    if (d.speed > 0 && !close && s.units.length) {
      const prey = minBy(s.units, u => Math.abs(u.x - d.x));
      d.x += Math.sign(prey.x - d.x) * d.speed * dt; d.moving = true;
    }
  }
  s.units = s.units.filter(u => u.hp > 0);
  // 2. Unidades atacam quem está no Alcance, ou avançam (nunca recuam).
  for (const u of s.units) {
    const reach = s.defenders.filter(d => Math.abs(d.x - u.x) <= u.range);
    if (reach.length) {
      const t = minBy(reach, d => Math.abs(d.x - u.x));
      u.targetId = t.id; u.cooldown -= dt;
      while (u.cooldown <= 0) { applyDamage(t, u.damage); u.cooldown += u.attackInterval; }
      continue;
    }
    u.targetId = null;
    if (!s.defenders.length) continue;
    const forward = -u.side;
    const ahead = s.defenders.filter(d => Math.sign(d.x - u.x) === forward || d.x === u.x);
    const goal = ahead.length ? minBy(ahead, d => Math.abs(d.x - u.x)) : minBy(s.defenders, d => Math.abs(d.x - u.x));
    const gap = Math.abs(goal.x - u.x) - u.range;
    u.x += Math.sign(goal.x - u.x) * Math.min(u.speed * dt, Math.max(0, gap));
  }
  s.defenders = s.defenders.filter(d => d.hp > 0);
  s.ticks++;
  // 3. Fim de Run.
  if (!s.defenders.length) s.outcome = 'victory';
  else if (!s.units.length || s.ticks >= MAX_TICKS) s.outcome = 'defeat';
}
const damageFraction = s => (s.garrisonMaxHp - s.defenders.reduce((t, d) => t + Math.max(0, d.hp), 0)) / s.garrisonMaxHp;

// ------------------------------------------------------------ Moedas (src/domain/rewards.ts, §8)

function coinBreakdown(stage, s, alreadyCleared, live = false) {
  const base = stage.base, seconds = s.ticks * TICK, won = s.outcome === 'victory' && !live;
  const damage = Math.round(base * 1 * damageFraction(s));
  const time = won ? Math.round(base * 0.5 * Math.max(0, 1 - seconds / 60)) : Math.round(base * Math.min(0.35, 0.006 * seconds));
  const survivors = Math.round(base * 0.3 * (s.initialUnits ? s.units.length / s.initialUnits : 0));
  const victory = won ? Math.round(base * 0.5) + (alreadyCleared ? 0 : stage.first) : 0;
  return { damage, time, survivors, victory, total: damage + time + survivors + victory };
}

// ------------------------------------------------------------ meta-progressão (src/domain/progression.ts, §9)

const levelUpCost = l => Math.round(30 * Math.pow(1.48, l - 1));
const capacityCost = c => Math.round(50 * Math.pow(1.15, c - STARTING_CAPACITY));
const initialPlayer = () => ({ coins: 0, levels: { warrior: 1 }, capacity: STARTING_CAPACITY, cleared: [], lastArmy: null });
const isUnlocked = (p, t) => p.levels[t] !== undefined;
const hasCleared = (p, id) => p.cleared.includes(id);
const isTypeAvailable = (p, t) => !UNIT_TYPES[t].unlockedByStage || hasCleared(p, UNIT_TYPES[t].unlockedByStage);
const isStageUnlocked = (p, i) => i === 0 || hasCleared(p, STAGES[i - 1].id);

let player;
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && typeof s.coins === 'number' && s.levels) return { ...initialPlayer(), ...s }; } catch (e) {}
  return initialPlayer();   // save ilegível vira jogo novo, sem mensagem (§13)
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(player)); } catch (e) {} }

// ============================================================ arte

const IMG = {};
const SPR = {};   // [id][anim] = { img, frames, size }
function loadImg(key, src) { return new Promise(r => { const im = new Image(); im.onload = () => { IMG[key] = im; r(); }; im.onerror = () => { console.warn('sem arte', src); r(); }; im.src = src; }); }
const ANIMS = {
  warrior: ['walk', 'attack'], archer: ['walk', 'attack'], bomber: ['walk', 'attack'], pawn: ['walk', 'attack'], lancer: ['walk', 'attack'], thief: ['walk', 'attack'],
  goblin: ['idle', 'walk', 'attack'], 'great-orc': ['idle', 'walk', 'attack'], lizard: ['idle', 'attack'], bear: ['idle', 'attack'], minotaur: ['idle', 'walk', 'attack'], troll: ['idle', 'attack'],
};
const FRAMES = { walk: 8, attack: 9, idle: 4 };
// Altura na tela (px do campo 640×360) = 2× a tabela do battleView original.
const UNIT_HEIGHT = 52;
const FORM_HEIGHT = { goblin: 60, 'great-orc': 76, lizard: 68, bear: 84, minotaur: 100, troll: 120, 'wood-tower': 108, tower: 124, 'tower-blue': 132, 'tower-purple': 140, castle: 160 };

// ============================================================ campo

const cv = document.getElementById('field'), g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
const VW = 640, VH = 360, GROUND_Y = 296, VISIBLE_HALF = ENTRY_X + 30, SCALE = VW / (VISIBLE_HALF * 2);
const sx = x => Math.round(VW / 2 + x * SCALE);
const lane = id => (id % 5) * 4 - 8;   // 5 profundidades derivadas do id (§10)

const tmp = document.createElement('canvas'), tg = tmp.getContext('2d');
// Desenha um quadro com os pés no chão, espelhado se preciso, e piscando vermelho quando leva dano (§10).
function drawFrame(img, fx, fw, fh, cx, baseY, h, flip, flash, charFill = 0.72) {
  const k = h / (fh * charFill), w = Math.round(fw * k), hh = Math.round(fh * k);
  tmp.width = fw; tmp.height = fh; tg.imageSmoothingEnabled = false;
  tg.clearRect(0, 0, fw, fh); tg.drawImage(img, fx, 0, fw, fh, 0, 0, fw, fh);
  if (flash) { tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = 'rgba(255,40,40,.65)'; tg.fillRect(0, 0, fw, fh); tg.globalCompositeOperation = 'source-over'; }
  g.save(); g.translate(cx, baseY); if (flip) g.scale(-1, 1);
  g.drawImage(tmp, -w / 2, -hh + Math.round(hh * 0.03), w, hh); g.restore();
}

const flashUntil = new Map(), lastHp = new Map(), attackUntil = new Map();
let clock = 0;
function drawField(s) {
  // Céu liso, chão verde com linha escura no horizonte (§10).
  g.fillStyle = '#6ec6f0'; g.fillRect(0, 0, VW, GROUND_Y);
  g.fillStyle = '#5aa846'; g.fillRect(0, GROUND_Y, VW, VH - GROUND_Y);
  g.fillStyle = '#2f6a2a'; g.fillRect(0, GROUND_Y, VW, 3);
  g.fillStyle = 'rgba(255,255,255,.55)';
  for (const [x, y, w] of [[60, 50, 70], [250, 34, 90], [470, 60, 80]]) { g.fillRect(x, y, w, 12); g.fillRect(x + 12, y - 8, w - 30, 10); }
  // Entradas.
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(sx(-ENTRY_X) - 1, GROUND_Y - 40, 2, 40); g.fillRect(sx(ENTRY_X) - 1, GROUND_Y - 40, 2, 40);
  const now = performance.now();
  // Defensores: maiores primeiro (o castelo não cobre as criaturas à frente).
  const ds = [...s.defenders].sort((a, b) => FORM_HEIGHT[b.formId] - FORM_HEIGHT[a.formId]);
  for (const d of ds) {
    const key = 'd' + d.id;
    if (lastHp.has(key) && d.hp < lastHp.get(key)) flashUntil.set(key, now + 140);
    lastHp.set(key, d.hp);
    if (d.firing) attackUntil.set(key, now + 9 / 12 * 1000);   // segura a animação de ataque inteira
    const h = FORM_HEIGHT[d.formId], cx = sx(d.x), hit = now < (flashUntil.get(key) || 0);
    if (isBuilding(d.formId)) {
      const im = IMG['g/' + d.formId];
      if (im) drawFrame(im, 0, im.width, im.height, cx, GROUND_Y + 4, h, false, hit, 0.85);
    } else {
      let nearest = null; for (const u of s.units) if (!nearest || Math.abs(u.x - d.x) < Math.abs(nearest.x - d.x)) nearest = u;
      const flip = nearest && nearest.x < d.x;
      const attacking = now < (attackUntil.get(key) || 0);
      const anim = attacking ? 'attack' : d.moving && SPR[d.formId].walk ? 'walk' : 'idle';
      const a = SPR[d.formId][anim];
      const f = attacking ? Math.min(8, Math.floor((1 - (attackUntil.get(key) - now) / 750) * 9)) : Math.floor(clock * (anim === 'walk' ? 10 : 5)) % a.frames;
      if (a.img) drawFrame(a.img, f * a.size, a.size, a.size, cx, GROUND_Y + 2, h, flip, hit);
    }
    const bw = Math.max(24, Math.round(h * 0.5)), fill = Math.round(bw * Math.max(0, d.hp / d.maxHp)), by = GROUND_Y - h - 10;
    g.fillStyle = '#400'; g.fillRect(cx - bw / 2, by, bw, 4); g.fillStyle = '#e83030'; g.fillRect(cx - bw / 2, by, fill, 4);
  }
  // Unidades.
  const us = [...s.units].sort((a, b) => lane(a.id) - lane(b.id));
  for (const u of us) {
    const key = 'u' + u.id;
    if (lastHp.has(key) && u.hp < lastHp.get(key)) flashUntil.set(key, now + 140);
    lastHp.set(key, u.hp);
    const anim = u.targetId === null ? 'walk' : 'attack', a = SPR[u.typeId][anim];
    const f = Math.floor(clock * (anim === 'walk' ? 10 : 9 / UNIT_TYPES[u.typeId].attackInterval) + u.id * 0.37) % a.frames;   // desencontra as animações
    const cx = sx(u.x), by = GROUND_Y + lane(u.id) / 2 + 6;
    if (a.img) drawFrame(a.img, f * a.size, a.size, a.size, cx, by, UNIT_HEIGHT, u.side === 1, now < (flashUntil.get(key) || 0));
    if (u.hp < u.maxHp) { const bw = 16; g.fillStyle = '#400'; g.fillRect(cx - 8, by - UNIT_HEIGHT - 6, bw, 3); g.fillStyle = '#5ce65c'; g.fillRect(cx - 8, by - UNIT_HEIGHT - 6, Math.round(bw * u.hp / u.maxHp), 3); }
  }
}

// ============================================================ telas (FF NES, teclado primário + mouse)

const ui = document.getElementById('ui');
let screen = 'stages', cursor = 0, menuRows = [], state = null, speed = 1, curStage = 0, army = [], summary = null;

function setScreen(name, cur = 0) { screen = name; cursor = cur; render(); }

function rowsHTML(rows) {
  menuRows = rows;
  if (cursor >= rows.length) cursor = rows.length - 1;
  return rows.map((r, i) => `<div class="row${i === cursor ? ' cur' : ''}${r.off ? ' off' : ''}" data-i="${i}">${r.html}</div>`).join('');
}

function render() {
  if (screen === 'stages') renderStages();
  else if (screen === 'shop') renderShop();
  else if (screen === 'army') renderArmy();
  else if (screen === 'battle') renderBattleHud();
  else if (screen === 'summary') renderSummary();
  ui.querySelectorAll('.row').forEach(el => {
    el.onmouseenter = () => { const i = +el.dataset.i; if (cursor !== i) { cursor = i; ui.querySelectorAll('.row').forEach((x, j) => x.classList.toggle('cur', j === i)); } };
    el.onclick = e => { cursor = +el.dataset.i; const adj = e.target.closest('[data-adj]'); activate(adj ? +adj.dataset.adj : 0); };
  });
  const sp = ui.querySelector('.speed'); if (sp) sp.onclick = toggleSpeed;
}

function renderStages() {
  const rows = STAGES.map((st, i) => {
    const open = isStageUnlocked(player, i);
    return { html: `<span>${String(i + 1).padStart(2, ' ')} ${open ? st.name : '? ? ?'}</span><span class="${hasCleared(player, st.id) ? 'dim' : 'gold'}">${!open ? 'TRANCADO' : hasCleared(player, st.id) ? 'LIMPO' : 'NOVO'}</span>`, off: !open, act: () => open && openArmy(i) };
  });
  rows.push({ html: `<span>LOJA</span><span class="gold">${player.coins} M</span>`, act: () => setScreen('shop') });
  ui.innerHTML = `<div class="win" style="left:150px;top:24px;width:340px"><div class="title">ESTÁGIOS</div>${rowsHTML(rows)}</div>
    <div class="hint">↑↓ ESCOLHE · ENTER CONFIRMA · CLIQUE TAMBÉM VALE</div>`;
}

function renderShop() {
  const rows = [];
  for (const [id, t] of Object.entries(UNIT_TYPES)) {
    if (!isTypeAvailable(player, id)) continue;   // tipo trancado por Estágio nem aparece (§9)
    if (!isUnlocked(player, id)) rows.push({ html: `<span>${t.name}</span><span>DESBLOQ. ${t.unlockCost} M</span>`, off: player.coins < t.unlockCost, act: () => buy(() => { if (player.coins < t.unlockCost) return false; player.coins -= t.unlockCost; player.levels[id] = 1; return true; }) });
    else {
      const l = player.levels[id], c = levelUpCost(l);
      rows.push({ html: `<span>${t.name}</span><span>${l >= MAX_LEVEL ? 'MAX' : `N${l}→N${l + 1} ${c} M`}</span>`, off: l >= MAX_LEVEL || player.coins < c, act: () => buy(() => { if (l >= MAX_LEVEL || player.coins < c) return false; player.coins -= c; player.levels[id] = l + 1; return true; }) });
    }
  }
  const cc = capacityCost(player.capacity);
  rows.push({ html: `<span>Capacidade ${player.capacity}</span><span>${player.capacity >= MAX_CAPACITY ? 'MAX' : `+1 ${cc} M`}</span>`, off: player.capacity >= MAX_CAPACITY || player.coins < cc, act: () => buy(() => { if (player.capacity >= MAX_CAPACITY || player.coins < cc) return false; player.coins -= cc; player.capacity++; return true; }) });
  rows.push({ html: '<span>VOLTAR</span>', act: () => setScreen('stages', STAGES.length) });
  ui.innerHTML = `<div class="win" style="left:130px;top:30px;width:380px"><div class="title">LOJA <span class="gold" style="float:right">${player.coins} M</span></div>${rowsHTML(rows)}</div>
    <div class="hint">ENTER COMPRA · ESC VOLTA</div>`;
}
function buy(fn) { if (fn()) { persist(); render(); } }

// ------------------------------------------------------------ montagem do Exército (§11)

function openArmy(i) {
  curStage = i;
  const types = Object.keys(UNIT_TYPES).filter(t => isUnlocked(player, t));
  const prev = player.lastArmy || [{ typeId: 'warrior', side: -1, count: player.capacity }];   // a última composição fica lembrada (§3)
  army = [];
  for (const side of [-1, 1]) for (const t of types) army.push({ typeId: t, side, count: (prev.find(p => p.typeId === t && p.side === side) || {}).count || 0 });
  clampArmy();
  setScreen('army');
}
const used = () => army.reduce((s, e) => s + e.count, 0);
function clampArmy() { let over = used() - player.capacity; for (let i = army.length - 1; i >= 0 && over > 0; i--) { const k = Math.min(army[i].count, over); army[i].count -= k; over -= k; } }

function renderArmy() {
  const st = STAGES[curStage];
  const rows = army.map((e, i) => ({
    html: `<span>${e.side < 0 ? 'ESQ' : 'DIR'} ${UNIT_TYPES[e.typeId].short} N${player.levels[e.typeId]}</span><span class="adj"><i data-adj="-1">◀</i><b>${e.count}</b><i data-adj="1">▶</i></span>`,
    adj: d => { if (d > 0 && used() >= player.capacity) return; e.count = Math.max(0, e.count + d); render(); },
    act: () => {}, type: e.typeId,
  }));
  rows.push({ html: '<span>INICIAR RUN</span>', off: used() === 0, act: () => used() > 0 && startRun() });
  rows.push({ html: '<span>VOLTAR</span>', act: () => setScreen('stages', curStage) });
  const cur = (rows[Math.min(cursor, rows.length - 1)] || {}).type || army[0].typeId;
  const t = UNIT_TYPES[cur], lv = player.levels[cur];
  const left = st.garrison.filter(s => s.x < 0).length, right = st.garrison.filter(s => s.x > 0).length;
  const centre = st.garrison.find(s => s.x === 0);
  ui.innerHTML = `<div class="win" style="left:12px;top:12px;width:300px;max-height:330px;overflow:hidden"><div class="title">EXÉRCITO <span style="float:right" class="${used() > player.capacity ? 'red' : 'gold'}">${used()}/${player.capacity}</span></div>${rowsHTML(rows)}</div>
    <div class="win" style="left:330px;top:12px;width:298px">
      <div class="title">${t.name.toUpperCase()} N${lv}</div>
      <div>HP ${hpAtLevel(t, lv)}  DANO ${damageAtLevel(t, lv)}</div><div>ARM ${t.armor}  ALC ${t.range}</div><div>VEL ${t.speed}  ATQ ${t.attackInterval}s</div>
      <div class="title" style="margin-top:10px">${st.name.toUpperCase()}</div>
      <div>ESQ ${left} · DIR ${right} · TOTAL ${st.garrison.length}</div>
      <div class="dim">CENTRO: ${FORMS[centre.formId].name}</div>
      ${st.garrison.filter(s => s.x !== 0).map(s => `<div class="dim">${s.x < 0 ? 'ESQ' : 'DIR'} ${FORMS[s.formId].name}</div>`).join('')}
    </div>
    <div class="hint">◀ ▶ AJUSTA · ENTER INICIA · ESC VOLTA</div>`;
}

// ------------------------------------------------------------ Run e resumo

function startRun() {
  const st = STAGES[curStage];
  player.lastArmy = army.filter(e => e.count > 0).map(e => ({ typeId: e.typeId, side: e.side, count: e.count }));
  persist();
  state = createBattle(st, army.filter(e => e.count > 0).map(e => ({ ...e, level: player.levels[e.typeId] })));
  flashUntil.clear(); lastHp.clear(); attackUntil.clear();
  setScreen('battle');
}
function toggleSpeed() { speed = speed === 1 ? 3 : 1; }

function renderBattleHud() {
  const st = STAGES[curStage], live = coinBreakdown(st, state, hasCleared(player, st.id), true);
  const counts = {};
  for (const u of state.units) counts[u.typeId] = (counts[u.typeId] || 0) + 1;
  ui.innerHTML = `<div class="hud"><div>${st.name.toUpperCase()}<br>INIMIGOS ${state.defenders.length}<br>${Object.entries(counts).map(([k, n]) => `${UNIT_TYPES[k].short} ${n}`).join('  ')}</div>
    <div class="r">${(state.ticks * TICK).toFixed(1)}s<br><span class="gold">${live.total} M</span></div></div>
    <div class="win speed">x${speed} (ESPAÇO)</div>`;
  const sp = ui.querySelector('.speed'); if (sp) sp.onclick = toggleSpeed;
}

function finishRun() {
  const st = STAGES[curStage], cleared = hasCleared(player, st.id);
  const b = coinBreakdown(st, state, cleared);
  player.coins += b.total;
  if (state.outcome === 'victory' && !cleared) player.cleared.push(st.id);
  persist();
  summary = { won: state.outcome === 'victory', b };
  setScreen('summary');
}

function renderSummary() {
  const { won, b } = summary;
  ui.innerHTML = `<div class="win" style="left:170px;top:70px;width:300px">
    <div class="title ${won ? 'green' : 'red'}" style="text-align:center;font-size:14px">${won ? 'VITÓRIA' : 'DERROTA'}</div>
    <div class="row" style="padding-left:0"><span>DANO</span><span>${b.damage}</span></div>
    <div class="row" style="padding-left:0"><span>${won ? 'RAPIDEZ' : 'RESISTÊNCIA'}</span><span>${b.time}</span></div>
    <div class="row" style="padding-left:0"><span>SOBREVIV.</span><span>${b.survivors}</span></div>
    <div class="row" style="padding-left:0"><span>VITÓRIA</span><span>${b.victory}</span></div>
    <div class="row gold" style="padding-left:0;border-top:2px solid #fff;margin-top:4px"><span>TOTAL</span><span>${b.total} M</span></div>
    <div style="text-align:center;margin-top:8px">ENTER CONTINUA</div></div>`;
  ui.firstElementChild.onclick = () => { state = null; setScreen('stages', curStage); };
}

function activate(dir) {
  const r = menuRows[cursor]; if (!r) return;
  if (dir && r.adj) return r.adj(dir);
  if (!r.off || r.adj) r.act();
}

addEventListener('keydown', e => {
  const k = e.key;
  if (screen === 'battle') { if (k === ' ') { e.preventDefault(); toggleSpeed(); } return; }
  if (screen === 'summary') { if (k === 'Enter' || k === ' ') { state = null; setScreen('stages', curStage); } return; }
  if (k === 'ArrowDown') { cursor = (cursor + 1) % menuRows.length; render(); }
  else if (k === 'ArrowUp') { cursor = (cursor - 1 + menuRows.length) % menuRows.length; render(); }
  else if (k === 'ArrowLeft') activate(-1);
  else if (k === 'ArrowRight') activate(1);
  else if (k === 'Enter') activate(0);
  else if (k === 'Escape') { if (screen === 'shop') setScreen('stages', STAGES.length); else if (screen === 'army') setScreen('stages', curStage); }
  else return;
  e.preventDefault();
});

// ============================================================ laço (tick fixo de 20/s, render só lê o estado)

let scaleV = 1;
function fit() {
  // Escala inteira quando cabe (pixel art sem borrão), senão a maior possível.
  const s = Math.min(innerWidth / 640, innerHeight / 360);
  scaleV = s >= 1 ? Math.floor(s) : s;
  const a = document.getElementById('app'); a.style.transform = `scale(${scaleV})`;
  a.style.left = `${(innerWidth - 640 * scaleV) / 2}px`; a.style.top = `${(innerHeight - 360 * scaleV) / 2}px`;
}

let last = 0, acc = 0, hudT = 0;
const idleState = { units: [], defenders: STAGES[0].garrison.map((s, i) => ({ id: i, formId: s.formId, x: s.x, hp: 1, maxHp: 1, moving: false })) };
function frame(t) {
  const dt = Math.min(0.1, (t - last) / 1000 || 0); last = t; clock += dt;
  if (screen === 'battle' && state) {
    acc += dt * speed;
    while (acc >= TICK && state.outcome === 'running') { step(state); acc -= TICK; }
    hudT -= dt; if (hudT <= 0) { hudT = 0.1; renderBattleHud(); }
    if (state.outcome !== 'running' && !state.endAt) state.endAt = t + 900;
    if (state.endAt && t >= state.endAt) finishRun();
  }
  const view = state || (screen === 'army' ? { units: [], defenders: STAGES[curStage].garrison.map((s, i) => ({ id: i, formId: s.formId, x: s.x, hp: 1, maxHp: 1 })) } : idleState);
  drawField(view);
  if (screen !== 'battle') { g.fillStyle = 'rgba(0,0,40,.35)'; g.fillRect(0, 0, VW, VH); }
  requestAnimationFrame(frame);
}

async function boot() {
  const jobs = [];
  for (const [id, anims] of Object.entries(ANIMS)) { SPR[id] = {}; for (const a of anims) jobs.push(loadImg(`${id}/${a}`, `${ART}anims/${id}_${a}.png`).then(() => { const im = IMG[`${id}/${a}`]; SPR[id][a] = { img: im, frames: FRAMES[a], size: im ? im.height : 84 }; })); }
  for (const id of ['wood-tower', 'tower', 'tower-blue', 'tower-purple', 'castle']) jobs.push(loadImg('g/' + id, `${ART}garrison/${id}.png`));
  await Promise.all(jobs);
  player = load();
  if (DEV.has('rich')) { player.coins += 20000; persist(); }
  if (DEV.has('unlock')) { player.cleared = STAGES.map(s => s.id); persist(); }
  addEventListener('resize', fit); fit();
  render();
  requestAnimationFrame(frame);
}
boot();
