// Guerreiro da Masmorra — protótipo jogável em JavaScript puro, com a arte nova (flat vector, SpriteCook).
// Reescrita do núcleo do jogo publicado (abraaovilanova/guerreiro-da-masmorra) a partir da Parte 1 do
// GuerreiroDaMasmorra.md: fila de iniciativa, reações (parry/salto/lateral) com golpes nomeados, Fúria e os
// 4 especiais liberados pela Habilidade, exaustão (guarda), cansaço dos monstros, Fase 2 e escudo do chefe,
// 3 ondas por masmorra, acampamento com atributos, Tochas, Souls e Mapas. Só o elenco que já tem arte nova:
// Guerreiro, Servo, Arqueiro e o Cavaleiro-chefe em 4 cores. Arte: Sprites/GuerreiroDaMasmorra/.
'use strict';

const ART = '../../Sprites/GuerreiroDaMasmorra/';
const SAVE_KEY = 'guerreirodamasmorra-save-v1';
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ============================================================ dados (§3, §8, §9, §10)

const HERO = { hp: 60, atk: 10, def: 3, speed: 10 };
const ATTRS = [
  { id: 'hp',  name: 'Vida',       base: 50, desc: '+20 HP' },
  { id: 'atk', name: 'Ataque',     base: 60, desc: '+3 ATK' },
  { id: 'def', name: 'Defesa',     base: 60, desc: '+2 DEF' },
  { id: 'hab', name: 'Habilidade', base: 40, desc: 'especial a cada 5' },
];
const attrCost = (a, n) => Math.round(a.base * Math.pow(1.55, n));
const COLORS = [ // o Azul é o próprio herói; as 4 cores com sprite recolorido
  { id: 'red', name: 'Vermelha', knight: 'Cavaleiro Vermelho' }, { id: 'black', name: 'Negra', knight: 'Cavaleiro Negro' },
  { id: 'purple', name: 'Púrpura', knight: 'Cavaleiro Púrpura' }, { id: 'yellow', name: 'Dourada', knight: 'Cavaleiro Dourado' },
];
const BIOMES = ['Castelo', 'Floresta', 'Cemitério', 'Ruínas'];

// Golpes nomeados (§8.3): P = parry (toque), J = salto (↑), S = lateral (↔); número = m; a/d = curva.
const parseMove = s => s.split(' ').map(t => { const m = /^([PJS])(\d*\.?\d+)?([ad])?$/.exec(t); return { type: m[1], m: m[2] ? parseFloat(m[2]) : 1, curve: m[3] || '' }; });
const MONSTERS = {
  pawn:   { name: 'Servo',    hp: 30, atk: 9,  def: 2, speed: 12, ranged: false, sprite: 'monsters/pawn',   attack: 'anims/pawn_attack_sheet',
    moves: [['Facada do Servo', 'P', 1], ['Corte Apressado', 'P.75', 1], ['Dança das Facas', 'P1.2 P.7a', 3]] },
  archer: { name: 'Arqueiro', hp: 24, atk: 12, def: 1, speed: 9,  ranged: true,  sprite: 'monsters/archer', attack: 'anims/archer_attack_sheet',
    moves: [['Flecha Certeira', 'P', 1], ['Tiro Traiçoeiro', 'P1.35a', 1], ['Chuva de Flechas', 'P.8 P.8', 3]] },
  boss:   { name: 'Cavaleiro', hp: 160, atk: 20, def: 6, speed: 6, ranged: false, boss: true,
    moves: [['Julgamento do Cavaleiro', 'P J.9 P.7', 1], ['Lâmina Paciente', 'P1.5a P.65', 1], ['Tempestade de Aço', 'J.85 P.8 P1.2d', 1]] },
};

// ============================================================ save (§15)

const fresh = () => ({ gold: 120, souls: 0, torches: 5, torchTs: Date.now(), maps: 1, level: 1, color: 'red', ng: 0, buys: { hp: 0, atk: 0, def: 0, hab: 0 }, wins: 0 });
let S;
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.buys) return { ...fresh(), ...s }; } catch (e) {} return fresh(); }
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function tickTorches() {
  if (S.torches >= 5) { S.torchTs = Date.now(); return; }
  const n = Math.floor((Date.now() - S.torchTs) / 600000);
  if (n > 0) { S.torches = Math.min(5, S.torches + n); S.torchTs += n * 600000; persist(); }
}
const heroStats = () => ({ hp: HERO.hp + 20 * S.buys.hp, atk: HERO.atk + 3 * S.buys.atk, def: HERO.def + 2 * S.buys.def, hab: S.buys.hab });
const effLevel = () => S.level + 5 * S.ng;
const ngMult = () => Math.pow(1.25, S.ng);
const guardSegments = () => Math.min(20, 5 + Math.floor(S.buys.def / 5));

// ============================================================ arte

const IMG = {};
function loadImg(k) { return new Promise(r => { const im = new Image(); im.onload = () => { IMG[k] = im; r(); }; im.onerror = () => { console.warn('sem arte', k); r(); }; im.src = `${ART}${k}.png`; }); }

// ============================================================ utilidades

const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const now = () => performance.now();

// ============================================================ batalha: estado

let B = null;   // masmorra em andamento
const FX = { floats: [], shake: 0, flash: null };
function float(x, y, text, color = '#fff', size = 26) { FX.floats.push({ x, y, text, color, size, t: 0 }); }
function log(msg) { $('log').textContent = msg; }

function makeMonster(id, wave, opts = {}) {
  const d = MONSTERS[id], L = S.level, k = (1 + (L - 1) * 0.25) * ngMult() * (wave === 1 ? 1.3 : 1);
  const hpK = opts.escort ? 0.7 : 1, atkK = opts.escort ? 0.8 : 1;
  const m = {
    id, def: d, name: d.boss ? COLORS.find(c => c.id === S.color).knight : d.name,
    maxHP: Math.round(d.hp * k * hpK), atk: Math.round(d.atk * k * atkK), defn: Math.round(d.def * k),
    gold: Math.round((12 + 4 * L) * ngMult() * (wave === 1 ? 1.25 : 1) * (opts.escort ? 0.8 : 1)),
    tired: 0, exhausted: 0, shields: 0, phase2: false, canPhase2: d.boss && effLevel() >= 3 && Math.random() < 0.6,
    anim: null, x: 0, y: 0, homeX: 0,
  };
  m.hp = m.maxHP;
  return m;
}

function buildWaves() {
  const pool = ['pawn', 'archer'];   // únicos comuns com arte nova (os demais do §8.1 ainda não têm sprite)
  const w = [0, 1].map(i => Array.from({ length: 3 }, () => makeMonster(pool[rnd(0, pool.length - 1)], i)));
  const boss = [makeMonster('boss', 2)];
  if (S.level % 5 === 0) boss.push(makeMonster(pool[0], 2, { escort: true }), makeMonster(pool[1], 2, { escort: true }));   // escolta (§9)
  w.push(boss);
  return w;
}

async function enterDungeon() {
  tickTorches();
  if (S.torches < 1) return;
  S.torches--; if (S.torches === 4) S.torchTs = Date.now(); persist();
  const st = heroStats();
  B = {
    waves: buildWaves(), wave: 0, monsters: [], hp: st.hp, maxHP: st.hp, atk: st.atk, def: st.def, hab: st.hab,
    fury: 0, guard: 0, guardBroken: false, noReact: false, skipNext: false, stones: 1,
    potHeal: 3, potFury: 3, gold: 0, tookDamage: false, biome: BIOMES[rnd(0, 3)], target: null, hero: { x: 90, y: 250, homeX: 90, anim: null },
  };
  if (DEV.has('boss')) B.wave = 2;   // atalho de teste: começa na onda do chefe
  $('camp').classList.add('hidden'); $('battle').classList.remove('hidden');
  await runWaves();
}

function layoutMonsters() {
  const alive = B.monsters.filter(m => m.hp > 0);
  const spots = alive.length === 1 ? [[270, 250]] : alive.length === 2 ? [[245, 230], [305, 270]] : [[230, 215], [305, 240], [250, 285]];
  alive.forEach((m, i) => { m.homeX = spots[i][0]; m.y = spots[i][1]; if (!m.moving) m.x = m.homeX; });
}
const alive = () => B.monsters.filter(m => m.hp > 0);

async function runWaves() {
  for (; B.wave < 3; B.wave++) {
    if (!B.monsters.length || !alive().length) B.monsters = B.waves[B.wave];
    layoutMonsters(); alive().forEach(m => { m.x = m.homeX + 200; });
    B.target = alive()[0];
    renderChip();
    log(B.wave === 2 ? `${B.monsters[0].name} aparece!` : `Onda ${B.wave + 1}: ${alive().map(m => m.name).join(', ')}`);
    await Promise.all(alive().map(m => tween(m, m.homeX, 600)));
    const r = await battleLoop();
    if (r === 'dead') return defeat();
    if (r === 'fled') return endDungeon('fled');
    if (B.wave < 2) { log('O herói marcha para a próxima sala…'); await wait(1200); }
  }
  endDungeon('won');
}

function tween(o, toX, ms) {
  const from = o.x, t0 = now(); o.moving = true;
  return new Promise(res => { const st = () => { const p = Math.min(1, (now() - t0) / ms); o.x = from + (toX - from) * (1 - Math.pow(1 - p, 2)); if (p < 1) requestAnimationFrame(st); else { o.moving = false; res(); } }; st(); });
}

// ------------------------------------------------------------ rodada: fila de iniciativa (§4)

async function battleLoop() {
  while (true) {
    const q = [{ who: 'hero', roll: HERO.speed + rnd(0, 5) }];
    for (const m of alive()) {
      const entries = m.phase2 ? rnd(2, 3) : 1;
      for (let i = 0; i < entries; i++) q.push({ who: m, roll: m.def.speed + rnd(0, 5) + (m.phase2 ? 3 : 0) });
    }
    q.sort((a, b) => b.roll - a.roll || (a.who === 'hero' ? -1 : b.who === 'hero' ? 1 : 0));
    B.queue = q; B.stones = 1;
    for (let i = 0; i < q.length; i++) {
      B.qi = i; renderQueue();
      const e = q[i];
      if (e.who === 'hero') {
        // Maldições e dinamites ficam de fora (só valem com Monge e goblins de fogo).
        if (B.skipNext) { B.skipNext = false; log('O herói está exausto e perde a rodada.'); await wait(900); continue; }
        if (B.guardBroken) { B.guardBroken = false; B.noReact = false; log('Guarda quebrada: o herói perde a ação.'); await wait(900); continue; }
        B.noReact = false;
        const r = await heroTurn();
        if (r === 'fled') return 'fled';
      } else {
        const m = e.who;
        if (m.hp <= 0) continue;   // quem morre antes da vez é pulado
        if (m.exhausted > 0) { m.exhausted--; float(m.x, m.y - 150, 'EXAUSTO', '#f6c453', 20); await wait(600); continue; }
        await monsterTurn(m);
        if (B.hp <= 0) return 'dead';
      }
      if (!alive().length) { await wait(400); return 'won'; }
    }
  }
}

// ------------------------------------------------------------ turno do herói (§6)

let turnResolve = null;
function heroTurn() {
  if (!B.target || B.target.hp <= 0) B.target = alive()[0];
  renderCmds('main');
  log(`Sua vez. Alvo: ${B.target.name}. Segure um comando para usar.`);
  return new Promise(r => { turnResolve = r; });
}
function endTurn(v) { const r = turnResolve; turnResolve = null; renderCmds(null); r && r(v); }

// Comandos de ação exigem segurar 0,9 s (§6). A pedrada e o Ataque Aéreo são toques simples.
function holdButton(btn, fn) {
  let t0 = 0, raf = 0; const fill = document.createElement('i'); fill.className = 'fill'; btn.appendChild(fill);
  const tick = () => { const p = Math.min(1, (now() - t0) / 900); fill.style.width = `${p * 100}%`; if (p >= 1) { t0 = 0; fill.style.width = '0'; fn(); return; } raf = requestAnimationFrame(tick); };
  btn.onpointerdown = e => { e.preventDefault(); if (btn.disabled) return; t0 = now(); tick(); };
  const stop = () => { cancelAnimationFrame(raf); t0 = 0; fill.style.width = '0'; };
  btn.onpointerup = stop; btn.onpointerleave = stop; btn.onpointercancel = stop;
}

const SPECIALS = [
  { id: 'fury',  name: '⚡ Fúria',              hab: 5,  minFury: 1 },
  { id: 'combo', name: '🗡 Combo',              hab: 10, minFury: 2 },
  { id: 'blade', name: '👻 Lâmina Invisível',   hab: 15, minFury: 1 },
  { id: 'death', name: '☠ Sequência Mortal',    hab: 20, minFury: 2 },
];

function renderCmds(mode) {
  const c = $('cmds');
  if (!mode) { c.innerHTML = ''; return; }
  if (mode === 'main') {
    const anySpecial = SPECIALS.some(s => B.hab >= s.hab);
    c.innerHTML = `<button class="btn" id="c-atk">⚔ Atacar<small>+1 Fúria</small></button>
      <button class="btn" id="c-sp" ${!anySpecial || B.fury < 1 ? 'disabled' : ''}>✨ Especial<small>${anySpecial ? `Fúria ${B.fury}/5` : 'Habilidade 5'}</small></button>
      <button class="btn" id="c-pot" ${!B.potHeal && !B.potFury ? 'disabled' : ''}>🧪 Poção<small>${B.potHeal} cura · ${B.potFury} adrenalina</small></button>
      <button class="btn" id="c-run" ${S.maps < 1 ? 'disabled' : ''}>🗺 Fugir<small>${S.maps} mapa(s)</small></button>
      <button class="btn wide" id="c-rock" ${B.stones < 1 ? 'disabled' : ''}>🪨 Pedrada (grátis, não gasta o turno) · toque</button>`;
    holdButton($('c-atk'), () => doAttack());
    holdButton($('c-sp'), () => renderCmds('special'));
    holdButton($('c-pot'), () => renderCmds('potion'));
    holdButton($('c-run'), () => { S.maps--; persist(); endTurn('fled'); });
    $('c-rock').onclick = doRock;
  } else if (mode === 'special') {
    c.innerHTML = SPECIALS.filter(s => B.hab >= s.hab).map(s => `<button class="btn" data-sp="${s.id}" ${B.fury < s.minFury ? 'disabled' : ''}>${s.name}<small>${specialCost(s.id)}</small></button>`).join('') + '<button class="btn" id="c-back">↩ Voltar</button>';
    c.querySelectorAll('[data-sp]').forEach(b => holdButton(b, () => doSpecial(b.dataset.sp)));
    $('c-back').onclick = () => renderCmds('main');
  } else if (mode === 'potion') {
    c.innerHTML = `<button class="btn" id="p-heal" ${!B.potHeal ? 'disabled' : ''}>❤ Cura<small>+40% HP (${B.potHeal})</small></button>
      <button class="btn" id="p-fury" ${!B.potFury ? 'disabled' : ''}>⚡ Adrenalina<small>Fúria 5/5 (${B.potFury})</small></button><button class="btn wide" id="c-back">↩ Voltar</button>`;
    holdButton($('p-heal'), () => { B.potHeal--; const h = Math.round(B.maxHP * 0.4); B.hp = Math.min(B.maxHP, B.hp + h); float(B.hero.x, B.hero.y - 140, `+${h}`, '#5bd17a'); endTurn(); });
    holdButton($('p-fury'), () => { B.potFury--; B.fury = 5; float(B.hero.x, B.hero.y - 140, 'FÚRIA 5', '#ff9d2e'); endTurn(); });
    $('c-back').onclick = () => renderCmds('main');
  }
}
function specialCost(id) {
  const f = B.fury;
  if (id === 'fury') return f >= 5 ? 'custa 5 · ×2 em todos' : f >= 3 ? 'custa 3 · ×1,5' : f === 2 ? 'custa 2 · ×1,2' : 'custa 1 · ×1,1';
  if (id === 'combo') return `custa ${f >= 4 ? 4 : f >= 3 ? 3 : 2} · ${f >= 4 ? 4 : f >= 3 ? 3 : 2} golpes`;
  if (id === 'blade') return `custa ${f} · ${f} golpes ×0,85`;
  return 'custa 2 · barra oscilante';
}
const gainFury = n => { B.fury = Math.min(5, B.fury + n); };

// Golpe do herói num monstro: escudo quebra em vez de tirar HP; cansaço e exaustão do monstro (§7.3).
function heroHit(m, mult, { crit = false, strong = false, spread = [-1, 3], shieldBreak = 1 } = {}) {
  if (!m || m.hp <= 0) return 0;
  if (m.shields > 0) { m.shields = Math.max(0, m.shields - shieldBreak * (crit ? 2 : 1)); float(m.x, m.y - 150, 'escudo!', '#5aa9f0', 20); return 0; }
  let dmg = Math.max(1, Math.round(B.atk * mult) - m.defn + rnd(spread[0], spread[1]));
  if (crit) dmg *= 2;
  m.hp = Math.max(0, m.hp - dmg);
  m.flash = 0.2; FX.shake = mult >= 1.5 || crit ? 0.25 : 0.1;
  float(m.x + rnd(-14, 14), m.y - 150, `${dmg}`, crit ? '#f6c453' : '#fff', crit ? 34 : 26);
  const cap = m.def.boss ? (effLevel() >= 20 ? 20 : 10) : (effLevel() >= 20 ? 10 : 5);
  if (m.tired >= cap && mult >= 1.5) { m.exhausted = 3; m.tired = 0; float(m.x, m.y - 180, 'EXAUSTO!', '#f6c453', 24); }
  else if (strong) m.tired = Math.min(cap, m.tired + 1);
  if (m.def.boss && m.canPhase2 && !m.phase2 && m.hp > 0 && m.hp <= m.maxHP / 2) {
    m.phase2 = true; m.atk = Math.round(m.atk * 1.4); float(m.x, m.y - 200, 'FASE 2!', '#ef5b5b', 30); FX.shake = 0.5;
  }
  if (m.hp <= 0) onKill(m);
  return dmg;
}
function onKill(m) { B.gold += m.gold; float(m.x, m.y - 190, `+${m.gold} ouro`, '#f6c453', 20); }

async function doAttack() {
  renderCmds(null);
  const t = B.target, crit = Math.random() < 0.15;
  await tween(B.hero, t.x - 70, 260);
  B.hero.anim = { sheet: 'anims/warrior_attack_sheet', t0: now(), ms: 700 };
  await wait(350);
  heroHit(t, 1, { crit, spread: [-2, 3] });
  gainFury(1);   // só o Guerreiro ganha Fúria com o ataque simples
  await wait(350);
  await tween(B.hero, B.hero.homeX, 260);
  retarget(); endTurn();
}

async function doRock() {
  if (B.stones < 1 || !turnResolve) return;
  B.stones--;
  const t = B.target;
  await projectile(B.hero.x + 30, B.hero.y - 80, t.x, t.y - 80, '#9a8f86');
  if (t.shields > 0) { t.shields--; float(t.x, t.y - 150, 'escudo -1', '#5aa9f0', 18); }
  else { const d = Math.max(1, Math.round(B.atk * 0.2)); t.hp = Math.max(0, t.hp - d); t.flash = 0.2; float(t.x, t.y - 150, `${d}`); if (t.hp <= 0) onKill(t); }
  retarget();
  if (!alive().length) return endTurn();
  renderCmds('main');
}

function retarget() { if (!B.target || B.target.hp <= 0) B.target = alive()[0] || null; layoutMonsters(); }

// ------------------------------------------------------------ especiais e minijogos (§7.1)

async function doSpecial(id) {
  renderCmds(null);
  const f = B.fury, t = B.target;
  if (id === 'fury') {
    if (f >= 5) {
      B.fury -= 5;
      const fill = await chargeBar();
      B.hero.anim = { sheet: 'anims/warrior_attack_sheet', t0: now(), ms: 700 }; await wait(300);
      for (const m of alive()) { const crit = Math.random() < fill; heroHit(m, crit ? 5 : 2, { crit: false, strong: true, shieldBreak: crit ? 4 : 2 }); }
    } else {
      const [cost, mult] = f >= 3 ? [3, 1.5] : f === 2 ? [2, 1.2] : [1, 1.1];
      B.fury -= cost;
      await tween(B.hero, t.x - 70, 240); B.hero.anim = { sheet: 'anims/warrior_attack_sheet', t0: now(), ms: 700 }; await wait(350);
      heroHit(t, mult, { strong: true, shieldBreak: 2 }); await wait(300); await tween(B.hero, B.hero.homeX, 240);
    }
  } else if (id === 'combo') {
    const n = f >= 4 ? 4 : f >= 3 ? 3 : 2; B.fury -= n;
    const mults = [1.2, 1.4, 1.8, 2];
    await tween(B.hero, t.x - 70, 240);
    for (let i = 0; i < n && t.hp > 0; i++) {
      const res = await qte({ type: 'P', ms: 900, curve: '', label: `Golpe ${i + 1}/${n}` });
      if (res === 'perfect') { B.hero.anim = { sheet: 'anims/warrior_attack_sheet', t0: now(), ms: 500 }; heroHit(t, mults[i], { strong: true }); }
      else float(t.x, t.y - 150, 'errou', '#a99cc4', 20);
    }
    await tween(B.hero, B.hero.homeX, 240);
  } else if (id === 'blade') {
    const n = f; B.fury = 0;
    for (let i = 0; i < n && alive().length; i++) {
      const m = alive()[rnd(0, alive().length - 1)];
      B.hero.x = m.x - 60; B.hero.anim = { sheet: 'anims/warrior_attack_sheet', t0: now(), ms: 400 };
      heroHit(m, 0.85, { strong: true, spread: [-1, 2] }); await wait(260);
    }
    B.hero.x = B.hero.homeX;
  } else if (id === 'death') {
    B.fury -= 2;
    const mult = await oscBar();
    if (mult) { await tween(B.hero, t.x - 70, 240); B.hero.anim = { sheet: 'anims/warrior_attack_sheet', t0: now(), ms: 700 }; await wait(350); heroHit(t, mult, { strong: true, shieldBreak: mult >= 2 ? 3 : mult >= 1.5 ? 2 : 1 }); await wait(300); await tween(B.hero, B.hero.homeX, 240); }
    else log('A Sequência Mortal falhou.');
  }
  B.skipNext = true;   // todo especial deixa o herói exausto: perde a rodada seguinte
  float(B.hero.x, B.hero.y - 170, 'exausto', '#a99cc4', 18);
  retarget(); await wait(300); endTurn();
}

// Barra de carga: martelar por 2,2 s; 14 toques enchem; vaza 22%/s. Retorna 0..1 (chance de crítico).
function chargeBar() {
  const box = $('mini'); box.classList.remove('hidden');
  box.innerHTML = '<div>MARTELE A TELA!</div><div class="bar"><i id="cb" style="left:0;background:#ff9d2e"></i></div><small id="cbt"></small>';
  let fill = 0; const t0 = now(); let last = t0;
  const tap = e => { if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return; fill = Math.min(1, fill + 1 / 14); };
  addEventListener('pointerdown', tap); addEventListener('keydown', tap);
  return new Promise(res => {
    const st = () => {
      const t = now(), dt = (t - last) / 1000; last = t; fill = Math.max(0, fill - 0.22 * dt);
      $('cb').style.width = `${fill * 100}%`; $('cbt').textContent = `${Math.max(0, 2.2 - (t - t0) / 1000).toFixed(1)}s · crítico ${Math.round(fill * 100)}%`;
      if (t - t0 >= 2200) { removeEventListener('pointerdown', tap); removeEventListener('keydown', tap); box.classList.add('hidden'); res(fill >= 0.999 ? 1 : fill); return; }
      requestAnimationFrame(st);
    };
    st();
  });
}

// Barra oscilante: fraca 60% (×1,1), forte 30% (×1,5), muito forte 10% (×2); acelera a cada zona; 3 idas e voltas.
function oscBar() {
  const box = $('mini'); box.classList.remove('hidden');
  box.innerHTML = `<div>TOQUE PARA TRAVAR</div><div class="bar"><i style="left:0;width:60%;background:#5a4a80"></i><i style="left:60%;width:30%;background:#c77d2e"></i><i style="left:90%;width:10%;background:#ef5b5b"></i><i id="ob" style="width:4px;background:#fff"></i></div>`;
  let x = 0, dir = 1, trips = 0, last = now(), done = false;
  return new Promise(res => {
    const finish = v => { if (done) return; done = true; removeEventListener('pointerdown', lock); removeEventListener('keydown', lock); box.classList.add('hidden'); res(v); };
    const lock = e => { if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return; finish(x >= 0.9 ? 2 : x >= 0.6 ? 1.5 : 1.1); };
    setTimeout(() => { addEventListener('pointerdown', lock); addEventListener('keydown', lock); }, 150);
    const st = () => {
      if (done) return;
      const t = now(), dt = (t - last) / 1000; last = t;
      const speed = x >= 0.9 ? 1.9 : x >= 0.6 ? 1.05 : 0.55;
      x += dir * speed * dt;
      if (x >= 1) { x = 1; dir = -1; } else if (x <= 0) { x = 0; dir = 1; trips++; }
      $('ob').style.left = `calc(${x * 100}% - 2px)`;
      if (trips >= 3) return finish(0);   // sem toque: falha
      requestAnimationFrame(st);
    };
    st();
  });
}

// ------------------------------------------------------------ turno do monstro e reações (§5, §8)

async function monsterTurn(m) {
  const L = effLevel();
  // Escudo Arcano (§8.4): chefe a partir do nível 5, 45% de chance, teto 10.
  if (m.def.boss && L >= 5 && m.shields < 10 && Math.random() < 0.45) {
    m.shields = Math.min(10, m.shields + rnd(2, 3)); showMove(`${m.name} conjura Escudo Arcano`); log(`${m.name} conjura Escudo Arcano.`); float(m.x, m.y - 150, `escudo ${m.shields}`, '#5aa9f0', 20); await wait(900); hideMove(); return;
  }
  const options = m.def.moves.filter(mv => L >= mv[2]);
  const [name, code] = options[rnd(0, options.length - 1)];
  let hits = parseMove(code);
  if (m.phase2 && hits.length < 4) { const lastHit = hits[hits.length - 1]; hits = [...hits, { ...lastHit, m: lastHit.m * 0.85 }]; }
  showMove(name); log(`${m.name}: ${name}`);
  await wait(650);
  if (!m.def.ranged) await tween(m, B.hero.x + 80, 300);
  let defendedAll = true;
  for (let i = 0; i < hits.length && B.hp > 0; i++) {
    const h = hits[i];
    const base = hits.length > 1 ? Math.round(m.atk * 0.65) : m.atk;
    let ms = L >= 6 ? 900 * h.m : 900;
    if (m.phase2) ms *= 0.75;
    if (S.ng) ms *= Math.max(0.6, 1 - 0.06 * S.ng);
    m.anim = { sheet: m.def.boss ? `bosses/boss_knight_attack_sheet_${S.color}` : m.def.attack, t0: now(), ms: Math.max(500, ms) };
    if (m.def.ranged) setTimeout(() => projectile(m.x - 30, m.y - 80, B.hero.x + 20, B.hero.y - 80, '#e8d7a0'), ms * 0.4);
    const res = B.noReact ? 'fail' : await qte({ type: h.type, ms, curve: L >= 6 ? h.curve : '', label: hits.length > 1 ? `${i + 1}/${hits.length}` : '' });
    await resolveHit(m, res, base, hits.length > 1);
    if (!(res === 'perfect' || res === 'dodge' || res === 'jump')) defendedAll = false;
    if (m.hp <= 0) break;
    await wait(160);
  }
  hideMove();
  // Defender o combo inteiro rende um contra-ataque (§5).
  if (hits.length > 1 && defendedAll && m.hp > 0 && B.hp > 0) {
    const mult = 1.5 + Math.random() * 0.5;
    float(B.hero.x, B.hero.y - 170, 'CONTRA-ATAQUE!', '#f6c453', 22);
    B.hero.anim = { sheet: 'anims/warrior_attack_sheet', t0: now(), ms: 600 }; await wait(250);
    heroHit(m, mult, { spread: [0, 0] });
  }
  if (!m.def.ranged && m.hp > 0) await tween(m, m.homeX, 300);
  retarget();
}

async function resolveHit(m, res, base, multiHit) {
  const hero = B.hero;
  if (res === 'perfect') {
    gainFury(1); FX.flash = ['#5bd17a', 0.2];
    float(hero.x, hero.y - 150, 'PARRY PERFEITO!', '#5bd17a', 22);
    const d = Math.max(1, Math.round(B.atk * 0.5) - m.defn);
    if (m.shields > 0) m.shields--; else { m.hp = Math.max(0, m.hp - d); m.flash = 0.2; float(m.x, m.y - 150, `${d}`); if (m.hp <= 0) onKill(m); }
    m.tired = Math.min(m.def.boss ? 10 : 5, m.tired + 1);
    return;
  }
  if (res === 'jump') {
    gainFury(1); FX.flash = ['#5bd17a', 0.15]; float(hero.x, hero.y - 150, 'pulou!', '#5aa9f0', 22);
    await aerial(m); return;
  }
  if (res === 'dodge') { FX.flash = ['#5bd17a', 0.15]; float(hero.x, hero.y - 150, 'esquivou', '#5aa9f0', 22); return; }
  let dmg;
  if (res === 'block') { gainFury(1); dmg = Math.max(0, base - B.def); float(hero.x, hero.y - 150, 'bloqueio', '#a99cc4', 20); }
  else { dmg = base + rnd(0, 3); FX.flash = ['#ef5b5b', 0.2]; gainFury(1); }
  if (dmg > 0) {
    B.hp = Math.max(0, B.hp - dmg); B.tookDamage = true; hero.flash = 0.2; FX.shake = 0.2;
    float(hero.x, hero.y - 120, `-${dmg}`, '#ef5b5b', 28);
    // Exaustão do herói (§7.2): barra cheia + dano durante combo de vários hits = guarda quebrada.
    const segs = guardSegments();
    if (B.guard >= segs && multiHit && !B.guardBroken) { B.guard = 0; B.guardBroken = true; B.noReact = true; float(hero.x, hero.y - 180, 'GUARDA QUEBRADA', '#ef5b5b', 22); }
    else B.guard = Math.min(segs, B.guard + Math.max(0.3, dmg * 7 / B.maxHP));
  }
}

// Ataque Aéreo: botão disponível por 1,1 s depois de um salto bem-sucedido.
function aerial(m) {
  const c = $('cmds'); c.innerHTML = '<button class="btn wide gold" id="air" style="min-height:70px;font-size:22px">🦅 ATAQUE AÉREO!</button>';
  return new Promise(res => {
    let done = false;
    const go = () => { if (done) return; done = true; removeEventListener('keydown', key); B.hero.anim = { sheet: 'anims/warrior_attack_sheet', t0: now(), ms: 500 }; heroHit(m, 0.9, { spread: [0, 0] }); c.innerHTML = ''; res(); };
    const key = e => { if (e.key === ' ' || e.key === 'Enter') go(); };
    $('air').onpointerdown = go; addEventListener('keydown', key);
    setTimeout(() => { if (!done) { done = true; removeEventListener('keydown', key); c.innerHTML = ''; res(); } }, 1100);
  });
}

// Círculo de reação: fecha em ms. Parry: toque (últimos 32% = perfeito, antes = bloqueio). Salto: ↑. Lateral: ← →.
let qteInput = null;
function qte({ type, ms, curve, label }) {
  const box = $('qte'), ring = box.querySelector('.ring');
  const icon = { P: '🛡️', J: '⬆️', S: '↔️' }[type], hint = { P: 'TOQUE', J: 'ARRASTE ↑', S: 'DESLIZE ↔' }[type];
  box.querySelector('b').textContent = icon; box.querySelector('small').textContent = `${hint} ${label || ''}`;
  box.classList.remove('hidden');
  const t0 = now();
  return new Promise(res => {
    let done = false;
    const finish = r => { if (done) return; done = true; qteInput = null; box.classList.add('hidden'); res(r); };
    qteInput = g => {
      const p = (now() - t0) / ms;
      if (type === 'P') finish(g === 'tap' ? (p >= 0.68 ? 'perfect' : 'block') : 'fail');
      else if (type === 'J') finish(g === 'up' ? 'jump' : 'fail');
      else finish(g === 'side' ? 'dodge' : 'fail');
    };
    const st = () => {
      if (done) return;
      let p = Math.min(1, (now() - t0) / ms);
      const v = curve === 'a' ? p * p : curve === 'd' ? 1 - (1 - p) * (1 - p) : p;
      ring.setAttribute('r', String(90 - 44 * v));
      ring.style.stroke = p >= 0.68 ? '#f6c453' : type === 'P' ? '#ffffff' : '#5aa9f0';
      if (p >= 1) return finish('fail');
      requestAnimationFrame(st);
    };
    st();
  });
}
function showMove(t) { const m = $('move'); m.textContent = t; m.classList.remove('hidden'); }
function hideMove() { $('move').classList.add('hidden'); }

let projectiles = [];
function projectile(x0, y0, x1, y1, color) { const p = { x0, y0, x1, y1, color, t0: now(), ms: 280 }; projectiles.push(p); return wait(280).then(() => { projectiles = projectiles.filter(q => q !== p); }); }

// ------------------------------------------------------------ fim de masmorra (§9)

function defeat() {
  const lost = Math.floor(B.gold / 2);
  modal(`<h2 style="color:#ef5b5b">Você caiu</h2><p>Ouro desta masmorra: ${B.gold} (perde ${lost}).</p>
    ${S.souls > 0 ? '<p>Gastar 1 Soul para reviver com a vida cheia nesta onda?</p>' : ''}
    <div class="row2">${S.souls > 0 ? '<button class="btn gold" id="m-rev">Reviver (1 Soul)</button>' : ''}<button class="btn" id="m-ok">Voltar ao acampamento</button></div>`);
  if ($('m-rev')) $('m-rev').onclick = async () => { S.souls--; persist(); closeModal(); B.hp = B.maxHP; B.guard = 0; B.noReact = false; B.guardBroken = false; const r = await battleLoop(); if (r === 'dead') return defeat(); if (r === 'fled') return endDungeon('fled'); B.wave++; await runWaves(); };
  $('m-ok').onclick = () => { S.gold += B.gold - lost; persist(); closeModal(); toCamp(); };
}

function endDungeon(kind) {
  if (kind === 'fled') { S.gold += B.gold; persist(); modal(`<h2>Fugiu</h2><p>Você mantém ${B.gold} de ouro.</p><div class="row2"><button class="btn" id="m-ok">Acampamento</button></div>`); $('m-ok').onclick = () => { closeModal(); toCamp(); }; return; }
  const L = S.level, perfect = !B.tookDamage;
  let bonus = Math.round((150 + 60 * (L - 1)) * ngMult()), souls = 1;
  if (perfect) { bonus *= 2; souls *= 2; }
  const total = B.gold + bonus;
  modal(`<h2 style="color:#f6c453">Masmorra ${L} vencida!</h2><p>Ouro dos monstros: ${B.gold}</p><p>Bônus de vitória: ${bonus}${perfect ? ' (run perfeita ×2)' : ''}</p><p>+${souls} Soul</p>
    <div class="row2"><button class="btn gold" id="m-x2">Vídeo premiado: bônus ×2 (simulado)</button><button class="btn" id="m-ok">Coletar</button></div>`);
  const take = extra => {
    S.gold += total + extra; S.souls += souls; S.wins++;
    if (S.level >= 33) { S.ng++; S.level = 1; } else S.level++;
    S.color = COLORS[rnd(0, COLORS.length - 1)].id;
    persist(); closeModal(); toCamp();
  };
  $('m-x2').onclick = () => take(bonus); $('m-ok').onclick = () => take(0);
}

function modal(html) { $('modal').innerHTML = `<div class="box">${html}</div>`; $('modal').classList.remove('hidden'); }
function closeModal() { $('modal').classList.add('hidden'); }

// ============================================================ HUD da batalha

function renderChip() { $('chip').textContent = `MASMORRA NV. ${S.level}${S.ng ? ` · NG+${S.ng}` : ''} · ${B.biome} · ONDA ${B.wave + 1}/3 · 🪙 ${B.gold}`; }
function renderQueue() {
  $('queue').innerHTML = (B.queue || []).map((e, i) => `<i class="${e.who === 'hero' ? 'hero' : ''}${i === B.qi ? ' now' : ''}">${e.who === 'hero' ? 'Herói' : e.who.name.split(' ')[0]}</i>`).join('');
}
let barsKey = '';
function renderBars() {
  const segs = guardSegments(), key = `${B.fury}|${Math.floor(B.guard)}|${segs}`;
  if (key === barsKey) return; barsKey = key;
  $('bars').innerHTML = `<span>⚡</span><div class="seg f">${Array.from({ length: 5 }, (_, i) => `<i class="${i < B.fury ? 'on' : ''}"></i>`).join('')}</div>
    <span>🛡</span><div class="seg g">${Array.from({ length: segs }, (_, i) => `<i class="${i < Math.floor(B.guard) ? 'on' : ''}"></i>`).join('')}</div>`;
}

// ============================================================ acampamento (§10, §14)

function toCamp() {
  B = null; $('battle').classList.add('hidden'); renderCamp(); $('camp').classList.remove('hidden');
}
function renderCamp() {
  tickTorches();
  const st = heroStats(), next = S.torches < 5 ? Math.max(0, 600000 - (Date.now() - S.torchTs)) : 0;
  const unlocked = SPECIALS.filter(s => st.hab >= s.hab).map(s => s.name).join(' · ') || 'nenhum (Habilidade 5)';
  $('camp').innerHTML = `
    <div class="res"><span>🪙 ${S.gold}</span><span>💠 ${S.souls}</span><span>🔥 ${S.torches}/5</span><span>🗺 ${S.maps}</span></div>
    <div class="hero-card"><canvas id="hero-cv" width="240" height="240"></canvas><div class="st"><h2>Guerreiro</h2>HP ${st.hp} · ATK ${st.atk} · DEF ${st.def}<br>Habilidade ${st.hab}<br><small style="color:var(--dim)">${unlocked}</small></div></div>
    <div class="attrs">${ATTRS.map(a => { const c = attrCost(a, S.buys[a.id]); return `<button class="btn attr" data-a="${a.id}" ${S.gold < c ? 'disabled' : ''}>${a.name} <small>${a.desc}</small><b>🪙 ${c}</b></button>`; }).join('')}</div>
    <button class="btn gold enter" id="enter" ${S.torches < 1 ? 'disabled' : ''}>Entrar na Masmorra Nv. ${S.level}<br><small style="font-size:12px">🔥 −1 · ${S.torches < 5 ? `+1 tocha em ${Math.floor(next / 60000)}:${String(Math.floor(next / 1000) % 60).padStart(2, '0')}` : 'tochas cheias'} · cor ${COLORS.find(c => c.id === S.color).name}</small></button>
    <div class="row2"><button class="btn" id="b-torch" ${S.souls < 1 || S.torches >= 5 ? 'disabled' : ''}>+1 Tocha (1 💠)</button><button class="btn" id="b-map" ${S.souls < 1 ? 'disabled' : ''}>+1 Mapa (1 💠)</button></div>
    <p class="note">Reação: toque = parry (no fim do círculo = perfeito) · arraste ↑ = salto · deslize ↔ = lateral.<br>Teclado: Espaço, ↑, ← →. Comandos: segure 0,9 s.</p>`;
  $('camp').querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const a = ATTRS.find(x => x.id === b.dataset.a), c = attrCost(a, S.buys[a.id]); if (S.gold < c) return; S.gold -= c; S.buys[a.id]++; persist(); renderCamp(); });
  $('enter').onclick = enterDungeon;
  $('b-torch').onclick = () => { S.souls--; S.torches++; persist(); renderCamp(); };
  $('b-map').onclick = () => { S.souls--; S.maps++; persist(); renderCamp(); };
}
setInterval(() => { if (!B && !$('camp').classList.contains('hidden') && S.torches < 5) renderCamp(); }, 1000);

// ============================================================ entrada (gestos de reação e alvo)

let gest = null;
$('app').addEventListener('pointerdown', e => {
  if (qteInput) { gest = { x: e.clientX, y: e.clientY, fired: false }; return; }
  // Tocar num monstro escolhe o alvo (no turno do herói).
  if (B && turnResolve && e.target.id === 'field') {
    const r = $('field').getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 360, y = (e.clientY - r.top) / r.height * 320;
    let best = null, bd = 60; for (const m of alive()) { const d = Math.hypot(m.x - x, m.y - 60 - y); if (d < bd) { bd = d; best = m; } }
    if (best) { B.target = best; log(`Alvo: ${best.name}`); }
  }
});
addEventListener('pointermove', e => {
  if (!gest || gest.fired || !qteInput) return;
  const dx = (e.clientX - gest.x) / scale, dy = (e.clientY - gest.y) / scale;
  if (dy < -30 && Math.abs(dy) > Math.abs(dx)) { gest.fired = true; qteInput('up'); }
  else if (Math.abs(dx) > 30) { gest.fired = true; qteInput('side'); }
});
addEventListener('pointerup', () => { if (gest && !gest.fired && qteInput) qteInput('tap'); gest = null; });
addEventListener('keydown', e => {
  if (qteInput) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); qteInput('tap'); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); qteInput('up'); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); qteInput('side'); }
    return;
  }
  if (B && turnResolve && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    const a = alive(), i = a.indexOf(B.target); B.target = a[(i + (e.key === 'ArrowRight' ? 1 : -1) + a.length) % a.length]; log(`Alvo: ${B.target.name}`);
  }
});

// ============================================================ desenho

const cv = $('field'), g = cv.getContext('2d');
function drawSheet(key, frame, x, y, h, flip, alpha = 1, flash = 0) {
  const im = IMG[key]; if (!im) return;
  const fw = im.height, k = h / fw * 1.25;
  g.save(); g.globalAlpha = alpha; g.translate(x * 2, y * 2); if (flip) g.scale(-1, 1);
  g.drawImage(im, frame * fw, 0, fw, fw, -fw * k, -fw * k * 2 + 10, fw * k * 2, fw * k * 2);
  if (flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = flash * 3; g.drawImage(im, frame * fw, 0, fw, fw, -fw * k, -fw * k * 2 + 10, fw * k * 2, fw * k * 2); }
  g.restore();
}
function drawPose(key, x, y, h, flip, bob, flash) {
  const im = IMG[key]; if (!im) return;
  const k = h / im.height * 1.1;
  g.save(); g.translate(x * 2, y * 2 + Math.sin(bob) * 3); if (flip) g.scale(-1, 1);
  g.drawImage(im, -im.width * k, -im.height * k * 2, im.width * k * 2, im.height * k * 2);
  if (flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = flash * 3; g.drawImage(im, -im.width * k, -im.height * k * 2, im.width * k * 2, im.height * k * 2); }
  g.restore();
}

let last = 0, clock = 0;
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t; clock += dt;
  if (B) {
    // Corredor de masmorra (o bioma é só decorativo).
    const grd = g.createLinearGradient(0, 0, 0, 640); grd.addColorStop(0, '#241a3a'); grd.addColorStop(0.55, '#3a2b55'); grd.addColorStop(1, '#17112a');
    g.fillStyle = grd; g.fillRect(0, 0, 720, 640);
    g.fillStyle = '#2a2040'; g.beginPath(); g.moveTo(0, 640); g.lineTo(220, 330); g.lineTo(500, 330); g.lineTo(720, 640); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { const y = 340 + i * i * 9; g.beginPath(); g.moveTo(0, y); g.lineTo(720, y); g.stroke(); }
    if (FX.flash) { g.fillStyle = FX.flash[0]; g.globalAlpha = FX.flash[1]; g.fillRect(0, 0, 720, 640); g.globalAlpha = 1; FX.flash[1] -= dt; if (FX.flash[1] <= 0) FX.flash = null; }
    const sh = FX.shake > 0 ? Math.sin(clock * 90) * 6 : 0; FX.shake = Math.max(0, FX.shake - dt);
    g.save(); g.translate(sh, 0);
    // Monstros (de trás para frente).
    for (const m of [...B.monsters].sort((a, b) => a.y - b.y)) {
      if (m.hp <= 0) { m.fade = (m.fade == null ? 1 : m.fade) - dt * 2; if (m.fade <= 0) continue; }
      m.flash = Math.max(0, (m.flash || 0) - dt);
      const h = m.def.boss ? 120 : 92, alpha = m.hp <= 0 ? m.fade : 1;
      const anim = m.anim && now() - m.anim.t0 < m.anim.ms ? m.anim : null;
      if (anim) drawSheet(anim.sheet, Math.min(7, Math.floor((now() - anim.t0) / anim.ms * 8)), m.x, m.y, h, m.def.boss, alpha, m.flash);
      else if (m.def.boss) drawSheet(`bosses/boss_knight_idle_sheet_${S.color}`, Math.floor(clock * 8) % 8, m.x, m.y, h, true, alpha, m.flash);
      else { g.globalAlpha = alpha; drawPose(m.def.sprite, m.x, m.y, h, false, clock * 3 + m.homeX, m.flash); g.globalAlpha = 1; }
      if (m.hp > 0) {
        const bw = 60, bx = m.x * 2 - bw, by = (m.y - h - 16) * 2;
        g.fillStyle = '#000a'; g.fillRect(bx, by, bw * 2, 12); g.fillStyle = m.phase2 ? '#ff6b3d' : '#ef5b5b'; g.fillRect(bx, by, bw * 2 * m.hp / m.maxHP, 12);
        g.font = '700 20px "Baloo 2"'; g.fillStyle = '#fff'; g.textAlign = 'center';
        g.fillText(`${m.name}${m.shields ? ` 🛡${m.shields}` : ''}${m.exhausted ? ' 💫' : ''}`, m.x * 2, by - 6);
        if (m === B.target) { g.fillStyle = '#f6c453'; g.beginPath(); g.moveTo(m.x * 2 - 12, m.y * 2 + 18); g.lineTo(m.x * 2 + 12, m.y * 2 + 18); g.lineTo(m.x * 2, m.y * 2 + 4); g.fill(); }
        const cap = m.def.boss ? 10 : 5; g.fillStyle = '#f6c45399'; g.fillRect(bx, by + 14, bw * 2 * m.tired / cap, 5);
      }
    }
    // Herói.
    const H = B.hero; H.flash = Math.max(0, (H.flash || 0) - dt);
    const ha = H.anim && now() - H.anim.t0 < H.anim.ms ? H.anim : null;
    drawSheet(ha ? ha.sheet : 'anims/warrior_idle_sheet', ha ? Math.min(7, Math.floor((now() - ha.t0) / ha.ms * 8)) : Math.floor(clock * 8) % 8, H.x, H.y, 104, false, 1, H.flash);
    const bw = 60; g.fillStyle = '#000a'; g.fillRect(H.x * 2 - bw, (H.y - 130) * 2, bw * 2, 12); g.fillStyle = '#5bd17a'; g.fillRect(H.x * 2 - bw, (H.y - 130) * 2, bw * 2 * B.hp / B.maxHP, 12);
    g.font = '700 20px "Baloo 2"'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(`${B.hp}/${B.maxHP}`, H.x * 2, (H.y - 133) * 2);
    for (const p of projectiles) { const k = Math.min(1, (now() - p.t0) / p.ms); g.fillStyle = p.color; g.beginPath(); g.arc((p.x0 + (p.x1 - p.x0) * k) * 2, (p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * 20) * 2, 7, 0, Math.PI * 2); g.fill(); }
    for (let i = FX.floats.length - 1; i >= 0; i--) {
      const f = FX.floats[i]; f.t += dt; if (f.t > 1.1) { FX.floats.splice(i, 1); continue; }
      g.globalAlpha = Math.min(1, 2.2 - f.t * 2); g.font = `800 ${f.size}px "Baloo 2"`; g.textAlign = 'center';
      g.fillStyle = '#000'; g.fillText(f.text, f.x * 2 + 2, (f.y - f.t * 30) * 2 + 2); g.fillStyle = f.color; g.fillText(f.text, f.x * 2, (f.y - f.t * 30) * 2);
      g.globalAlpha = 1;
    }
    g.restore();
    renderChip(); renderBars();
  } else {
    const hc = document.getElementById('hero-cv');
    if (hc && IMG['anims/warrior_idle_sheet']) { const hg = hc.getContext('2d'), im = IMG['anims/warrior_idle_sheet'], fw = im.height; hg.clearRect(0, 0, 240, 240); hg.drawImage(im, (Math.floor(clock * 8) % 8) * fw, 0, fw, fw, 0, 0, 240, 240); }
  }
  requestAnimationFrame(frame);
}

let scale = 1;
function fit() {
  scale = Math.min(innerWidth / 360, innerHeight / 640);
  const a = $('app'); a.style.transform = `scale(${scale})`;
  a.style.left = `${(innerWidth - 360 * scale) / 2}px`; a.style.top = `${(innerHeight - 640 * scale) / 2}px`;
}

async function boot() {
  const ks = ['heroes/warrior', 'monsters/pawn', 'monsters/archer', 'anims/warrior_idle_sheet', 'anims/warrior_attack_sheet', 'anims/pawn_attack_sheet', 'anims/archer_attack_sheet'];
  for (const c of COLORS) ks.push(`bosses/boss_knight_idle_sheet_${c.id}`, `bosses/boss_knight_attack_sheet_${c.id}`);
  await Promise.all(ks.map(loadImg));
  S = load();
  if (DEV.has('rich')) { S.gold += 5000; S.souls += 5; persist(); }
  const lv = [...DEV].find(k => /^nv\d+$/.test(k)); if (lv) { S.level = +lv.slice(2); persist(); }
  addEventListener('resize', fit); fit();
  toCamp();
  if (DEV.has('go')) enterDungeon();
  requestAnimationFrame(frame);
}
boot();
