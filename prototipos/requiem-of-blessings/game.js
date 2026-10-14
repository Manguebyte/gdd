// Requiem of Blessings — protótipo jogável em JavaScript puro.
// Segue o MVP sugerido do GDD (RequiemOfBlessings.md §10): batalha 1 herói × N inimigos com turno ativo
// (esquiva/parry com janela de tempo, Sequência de Desvio no Ataque Rápido), pedra + item antes do ataque,
// habilidades especiais com barra de precisão e Benção Divina, escudos, Quebra, Recuperação, Queima,
// boss com 2 fases, Acampamento com atributos, Tochas e Almas Perdidas. A arte vem de Sprites/RequiemOfBlessings/.
'use strict';

const ART = '../../Sprites/RequiemOfBlessings/';
const REF_W = 1152, REF_H = 648, PX = 3;   // fundo 384×216 desenhado em 3×
const SAVE_KEY = 'requiemofblessings-save-v1';
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ============================================================ números (GDD §2–§4; o que o GDD não fixa está marcado "protótipo")

const B = {
  heroHPBase: 100, heroAtkBase: 10, heroDefBase: 2,          // protótipo: o GDD não dá os valores-base
  atkPerStr: 2, defPerStr: 1, hpPerVit: 10, soulsPerKno: 0.05, // §4
  breakBase: 3, breakMax: 10, strPerBreak: 5,                 // §3.7 / §4
  blessingStart: 1, blessingMax: 5,                           // §3.2
  stoneFraction: 0.08,                                         // §3.1 (5–10% do ataque normal)
  elixirHP: 0.4, elixirStock: 3,                               // §3.1
  burnPerIcon: 0.03,                                           // §3.9
  maxShields: 10,                                              // §3.3
  vulnerableBonus: 0.5,                                        // §3.7
  quickMult: 1.5,                                              // §3.1 Ataque Rápido = "crítico" (protótipo: 1,5×)
  recoveryHits: 3, recoveryDamageFrac: 0.5,                   // §3.8 (protótipo: 3+ hits ou ≥50% do HP máx. do alvo)
  torchMax: 5, torchRechargeMs: 10 * 60 * 1000,               // §2.1
  // Janelas de reação (ms antes/depois do impacto). Esquiva é mais larga que o parry (§3.1).
  telegraphMs: 1150, dodgeBefore: 420, parryBefore: 170, after: 70,
  quickTapMs: 620, quickBefore: 300,
};
const costOf = n => Math.round(20 * Math.pow(1.12, n - 1));   // §4: Custo(N) = 20 × 1,12^(N−1)

// Inimigos (stats da masmorra 1; protótipo). anim: [idle, ataque] em ART/Enemies.
const ENEMIES = {
  ghoul:   { name: 'Carniçal',            hp: 55,  atk: 12, def: 1, souls: 12, melee: true,  combo: [1, 2],    shield: 0,    fire: 0, spr: 'SPR_Enemy_Ghoul', w: 174 },
  archer:  { name: 'Arqueiro Esqueleto',  hp: 42,  atk: 14, def: 0, souls: 14, melee: false, combo: [1],       shield: 0,    fire: 0, spr: 'SPR_Enemy_SkeletonArcher', w: 194 },
  mage:    { name: 'Mago Cultista',       hp: 48,  atk: 10, def: 0, souls: 16, melee: false, combo: [1],       shield: 0.3,  fire: 2, spr: 'SPR_Enemy_CultistMage', w: 192 },
  bishop:  { name: 'Bispo Caído',         hp: 300, atk: 15, def: 3, souls: 120, melee: true, combo: [1, 2],    shield: 0.25, fire: 1, spr: 'SPR_Boss_FallenBishop', w: 194, boss: true },
};

// Habilidades especiais (MVP: só dano). Loadout fixo de 3, uma por categoria de dano (§3.4); a árvore fica fora.
const SPECIALS = [
  { id: 'focus', name: 'Lâmina Votiva', cat: 'Dano Elevado', cost: 3, hits: 3, mult: 0.9, target: 'one' },
  { id: 'area',  name: 'Coro de Cinzas', cat: 'Área',        cost: 2, hits: 1, mult: 0.8, target: 'all' },
  { id: 'rand',  name: 'Chuva de Relíquias', cat: 'Aleatório', cost: 4, hits: 6, mult: 0.6, target: 'random' },
];

// Mundo 1 (7 masmorras, a 7ª é o boss). Composição fixa por masmorra, para o guardião de Almas ser reconhecível.
const WORLD = 'Catedral em Ruínas';
const DUNGEONS = [
  [['ghoul', 'archer'], ['ghoul', 'ghoul']],
  [['ghoul', 'archer'], ['mage', 'ghoul']],
  [['archer', 'mage'], ['ghoul', 'ghoul', 'archer']],
  [['ghoul', 'mage'], ['archer', 'ghoul', 'mage']],
  [['mage', 'archer'], ['ghoul', 'mage', 'ghoul']],
  [['ghoul', 'ghoul', 'archer'], ['mage', 'archer', 'mage']],
  [['ghoul', 'mage'], ['bishop']],
];
const scaleOf = d => 1 + 0.15 * (d - 1);
const quickChance = d => Math.min(0.45, 0.08 + 0.05 * (d - 1));       // §3.1: aparece mais em masmorras avançadas
const quickTaps = d => Math.min(4, 2 + Math.floor(d / 3));
const enemyBreakAt = d => Math.round(3 + (d - 1) * 7 / 41);           // §3.7

// ============================================================ save

function freshSave() {
  return { souls: 0, knowledge: 0, str: 0, vit: 0, kno: 0, torches: B.torchMax, torchTs: Date.now(), unlocked: 1, lost: null, bossKills: 0 };
}
let save;
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && typeof s.souls === 'number') return { ...freshSave(), ...s }; } catch (e) {}
  return freshSave();
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

// Tochas: recarga calculada pelo timestamp salvo (§2.1), então corre com o jogo fechado.
function tickTorches() {
  if (save.torches >= B.torchMax) { save.torchTs = Date.now(); return; }
  const gained = Math.floor((Date.now() - save.torchTs) / B.torchRechargeMs);
  if (gained > 0) { save.torches = Math.min(B.torchMax, save.torches + gained); save.torchTs += gained * B.torchRechargeMs; persist(); }
}

const heroMaxHP = () => B.heroHPBase + save.vit * B.hpPerVit;
const heroAtk = () => B.heroAtkBase + save.str * B.atkPerStr;
const heroDef = () => B.heroDefBase + save.str * B.defPerStr;
const heroBreakAt = () => Math.min(B.breakMax, B.breakBase + Math.floor(save.str / B.strPerBreak));
const soulMult = () => 1 + save.kno * B.soulsPerKno;

// ============================================================ arte

const IMG = {};
function loadImages(list) {
  return Promise.all(list.map(([k, src]) => new Promise(res => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = () => { console.warn('sem arte', src); res(); }; im.src = src; })));
}
const icon = n => `${ART}Icons/SPR_Icon_${n}.png`;

// ============================================================ atores e animação

const GROUND = 612;
class Actor {
  constructor(x, strips) { this.x = this.homeX = x; this.y = GROUND; this.strips = strips; this.anim = 'idle'; this.t = 0; this.once = null; this.flash = 0; this.shake = 0; }
  play(name, fps = 14) {
    if (!this.strips[name]) return Promise.resolve();
    if (this.once) { const r = this.once; this.once = null; r(); }   // animação interrompida também "termina"
    this.anim = name; this.t = 0; this.fps = fps;
    return new Promise(res => { this.once = res; });
  }
  update(dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt); this.shake = Math.max(0, this.shake - dt);
    const s = this.strips[this.anim];
    if (this.once && s && this.t * this.fps >= s.frames) { const r = this.once; this.once = null; this.anim = 'idle'; this.t = 0; r(); }
  }
  draw(g, opts = {}) {
    const s = this.strips[this.anim] || this.strips.idle; if (!s || !s.img) return;
    const fps = this.once ? this.fps : 8;
    const f = Math.floor(this.t * fps) % s.frames;
    const fw = s.img.width / s.frames, fh = s.img.height, k = 1.5;
    const dx = Math.round(this.x - fw * k / 2 + (this.shake > 0 ? Math.sin(this.shake * 90) * 4 : 0)), dy = Math.round(this.y - fh * k);
    g.save();
    if (opts.alpha != null) g.globalAlpha = opts.alpha;
    if (opts.glow) { g.shadowColor = opts.glow; g.shadowBlur = 18; }
    g.drawImage(s.img, f * fw, 0, fw, fh, dx, dy, fw * k, fh * k);
    if (this.flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = this.flash * 2; g.drawImage(s.img, f * fw, 0, fw, fh, dx, dy, fw * k, fh * k); }
    g.restore();
  }
}
const strip = (key, frames) => ({ img: IMG[key], frames });

// ============================================================ estado da batalha

let B$ = null;   // batalha em andamento
let screen = 'camp';
let selectedDungeon = 1;
const floaters = [];        // números de dano subindo
let telegraph = null;       // { kind: 'tele'|'quick', from, impactAt, ... } desenhado na cena
let projectile = null;

function makeEnemy(type, d, slot, waveIdx) {
  const e = ENEMIES[type], k = scaleOf(d);
  const guard = save.lost && save.lost.dungeon === d && save.lost.wave === waveIdx && save.lost.slot === slot;
  const strips = { idle: strip(type + (guard && type === 'ghoul' ? '_guard' : '') + '_idle', 8), attack: strip(type + '_attack', 8) };
  return {
    type, def: e, name: e.name, maxHP: Math.round(e.hp * k), hp: Math.round(e.hp * k), atk: Math.round(e.atk * k), defn: Math.round(e.def * k),
    souls: Math.round(e.souls * k), shields: 0, brk: 0, broken: false, vulnUntil: -1, recovering: false, burn: 0, phase: 1, invuln: false,
    guard, slot, actor: new Actor(0, strips),
  };
}

function layoutEnemies() {
  const list = B$.enemies.filter(e => e.hp > 0), n = list.length;
  const xs = n === 1 ? [820] : n === 2 ? [700, 940] : [610, 800, 990];
  list.forEach((e, i) => { e.actor.homeX = xs[i]; if (!e.moving) e.actor.x = xs[i]; });
}

// ============================================================ utilidades de fluxo

const wait = ms => new Promise(r => setTimeout(r, ms));
const now = () => performance.now();
const rand = () => Math.random();
const pick = a => a[Math.floor(rand() * a.length)];
function tween(actor, toX, ms) {
  const fromX = actor.x, t0 = now();
  return new Promise(res => {
    const step = () => { const p = Math.min(1, (now() - t0) / ms); actor.x = fromX + (toX - fromX) * (1 - Math.pow(1 - p, 2)); p < 1 ? requestAnimationFrame(step) : res(); };
    step();
  });
}
function floatText(x, y, text, color = '#fff', size = 26) { floaters.push({ x, y, text, color, size, t: 0 }); }
async function banner(text, sub = '', ms = 1100) {
  const b = $('banner'); b.innerHTML = `${text}${sub ? `<small>${sub}</small>` : ''}`; b.classList.remove('hidden');
  await wait(ms); b.classList.add('hidden');
}
const $ = id => document.getElementById(id);

// ============================================================ batalha: dano

// Aplica 1 hit num inimigo: escudo come o hit; senão dano (com +50% se vulnerável). Retorna o dano no HP.
function hitEnemy(e, raw, { breaks = false } = {}) {
  if (e.hp <= 0) return 0;
  if (e.invuln) { floatText(e.actor.x, GROUND - 260, 'INVULNERÁVEL', '#aaa', 18); return 0; }
  if (breaks) addEnemyBreak(e);
  if (e.shields > 0) { e.shields--; floatText(e.actor.x, GROUND - 250, 'escudo −1', '#9fd0ff', 20); e.actor.flash = 0.15; return 0; }
  let dmg = Math.max(1, Math.round(raw - e.defn));
  if (e.vulnUntil >= 0) dmg = Math.round(dmg * (1 + B.vulnerableBonus));
  e.hp = Math.max(0, e.hp - dmg);
  e.actor.flash = 0.2; e.actor.shake = 0.2;
  floatText(e.actor.x + (rand() * 30 - 15), GROUND - 240, `${dmg}`, e.vulnUntil >= 0 ? '#ffb347' : '#fff');
  checkBossPhase(e);
  if (e.hp <= 0) onEnemyKilled(e);
  return dmg;
}

function addEnemyBreak(e) {
  if (e.broken) return;
  e.brk++;
  if (e.brk >= B$.enemyBreakAt) {
    e.brk = 0; e.broken = true; e.vulnUntil = B$.attackCount;   // vulnerável até o próximo ataque do jogador terminar
    floatText(e.actor.x, GROUND - 290, 'QUEBRA!', '#ffb347', 30);
  }
}

// Boss de 2 fases: aos 50% de HP troca de fase; durante a transição não toma dano (§3.6).
function checkBossPhase(e) {
  if (!e.def.boss || e.phase !== 1 || e.hp > e.maxHP / 2 || e.hp <= 0) return;
  e.phase = 2; e.invuln = true;
  B$.pendingPhase = e;
}

function onEnemyKilled(e) {
  const gained = Math.round(e.souls * soulMult());
  B$.souls += gained;
  floatText(e.actor.x, GROUND - 300, `+${gained} almas`, '#8fd6ff', 22);
  if (e.guard) {
    B$.recovered = save.lost.souls;
    floatText(e.actor.x, GROUND - 330, `Almas recuperadas: ${save.lost.souls}`, '#8fd6ff', 24);
    save.lost = null; persist();
  }
  if (e.def.boss) B$.bossKilled = true;
}

function heroTakeDamage(raw, { fire = 0 } = {}) {
  const dmg = Math.max(1, Math.round(raw - heroDef()));
  B$.hp = Math.max(0, B$.hp - dmg);
  B$.hero.flash = 0.2; B$.hero.shake = 0.25;
  B$.hero.play('hurt', 16);
  floatText(B$.hero.x, GROUND - 260, `−${dmg}`, '#ff6b5e', 30);
  if (fire) { B$.burn += fire; floatText(B$.hero.x + 40, GROUND - 230, `+${fire} queima`, '#ff9a3c', 18); }
  // Quebra do herói conta hits recebidos (§3.7).
  if (!B$.heroBroken) {
    B$.heroBrk++;
    if (B$.heroBrk >= heroBreakAt()) { B$.heroBrk = 0; B$.heroBroken = true; floatText(B$.hero.x, GROUND - 300, 'QUEBRADO!', '#ffb347', 30); }
  }
  return dmg;
}

// Queima: consumida inteira no início do turno de quem queima, 3% do HP máx. por ícone, ignora escudo (§3.9).
function burnTick(who) {
  if (who === 'hero') {
    if (!B$.burn) return;
    const dmg = Math.round(B$.burn * B.burnPerIcon * heroMaxHP());
    B$.hp = Math.max(0, B$.hp - dmg); B$.hero.flash = 0.2;
    floatText(B$.hero.x, GROUND - 270, `−${dmg} queima`, '#ff9a3c', 26); B$.burn = 0;
  } else {
    if (!who.burn || who.hp <= 0) return;
    const dmg = Math.round(who.burn * B.burnPerIcon * who.maxHP);
    who.hp = Math.max(0, who.hp - dmg); who.burn = 0;
    floatText(who.actor.x, GROUND - 260, `−${dmg} queima`, '#ff9a3c', 22);
    if (who.hp <= 0) onEnemyKilled(who);
  }
}

// ============================================================ batalha: fluxo

async function startExpedition(d) {
  tickTorches();
  if (save.torches < 1) return;
  save.torches--; if (save.torches === B.torchMax - 1) save.torchTs = Date.now(); persist();
  screen = 'battle'; $('camp').classList.add('hidden');
  const hero = new Actor(230, { idle: strip('hero_idle', 8), attack: strip('hero_attack', 8), dodge: strip('hero_dodge', 8), parry: strip('hero_parry', 8), hurt: strip('hero_hurt', 6) });
  B$ = {
    d, hero, hp: heroMaxHP(), burn: 0, heroBrk: 0, heroBroken: false, heroRecovering: false,
    elixirHP: B.elixirStock, elixirBless: B.elixirStock, souls: 0, recovered: 0, bossKilled: false,
    wave: 0, enemies: [], blessing: B.blessingStart, attackCount: 0, enemyBreakAt: enemyBreakAt(d), target: null,
  };
  for (let w = 0; w < DUNGEONS[d - 1].length; w++) {
    B$.wave = w;
    B$.enemies = DUNGEONS[d - 1][w].map((t, i) => makeEnemy(t, d, i, w));
    B$.blessing = B.blessingStart; B$.round = 0;
    layoutEnemies(); B$.enemies.forEach(e => { e.actor.x = e.actor.homeX + 400; });
    await Promise.all(B$.enemies.map(e => tween(e.actor, e.actor.homeX, 600)));
    await banner(`${WORLD} ${d}`, `Onda ${w + 1}/${DUNGEONS[d - 1].length}${B$.enemies.some(e => e.guard) ? ' · o guardião das suas Almas está aqui' : ''}`);
    const result = await battleLoop();
    if (result === 'dead') return endExpedition(false);
  }
  endExpedition(true);
}

const alive = () => B$.enemies.filter(e => e.hp > 0);

async function battleLoop() {
  while (true) {
    B$.round++;
    // ---- turno do herói
    if (B$.round > 1) B$.blessing = Math.min(B.blessingMax, B$.blessing + 1);   // +1 por turno (§3.2)
    burnTick('hero');
    if (B$.hp <= 0) return 'dead';
    if (B$.heroBroken) { await banner('Herói quebrado', 'perde a rodada inteira'); B$.heroBroken = false; B$.noReact = true; }
    else if (B$.heroRecovering) { await banner('Recuperando o fôlego', 'o herói perde este turno'); B$.heroRecovering = false; }
    else { await playerTurn(); }
    await resolvePhase();
    if (!alive().length) { await wait(500); return 'won'; }

    // ---- turno dos inimigos, um por vez (§3.1: telégrafos sequenciais)
    for (const e of alive()) {
      burnTick(e);
      if (e.hp <= 0) continue;
      if (e.broken) { floatText(e.actor.x, GROUND - 270, 'atordoado', '#ffb347', 20); e.broken = false; await wait(500); continue; }
      if (e.recovering) { floatText(e.actor.x, GROUND - 270, 'ofegante', '#aaa', 20); e.recovering = false; await wait(500); continue; }
      await enemyAction(e);
      if (B$.hp <= 0) { await wait(400); return 'dead'; }
    }
    B$.noReact = false;
    layoutEnemies();
    if (!alive().length) return 'won';
  }
}

async function resolvePhase() {
  const e = B$.pendingPhase; if (!e) return;
  B$.pendingPhase = null;
  await banner('SEGUNDA FASE', `${e.name} se ergue em fúria`, 1400);
  e.invuln = false;
}

// ---- turno do jogador: pedra e item (opcionais, 1 de cada) e então um ataque, que encerra o turno (§3.1)
let turnResolve = null;
function playerTurn() {
  B$.usedStone = false; B$.usedItem = false;
  if (!B$.target || B$.target.hp <= 0) B$.target = alive()[0];
  showActions(true);
  return new Promise(res => { turnResolve = res; });
}

async function doStone() {
  if (B$.usedStone || busy) return;
  busy = true; B$.usedStone = true; renderActions();
  const t = B$.target;
  await throwProjectile(B$.hero.x + 40, t.actor.x, '#bbb', 4);
  hitEnemy(t, Math.max(1, Math.round(heroAtk() * B.stoneFraction)) + t.defn);   // a pedra ignora defesa: só tira escudo ou arranha
  busy = false; renderActions(); await afterEnemyDeaths();
}

async function doItem(kind) {
  if (B$.usedItem || busy) return;
  if (kind === 'hp' && (!B$.elixirHP || B$.hp >= heroMaxHP())) return;
  if (kind === 'bless' && (!B$.elixirBless || B$.blessing >= B.blessingMax)) return;
  B$.usedItem = true;
  if (kind === 'hp') { B$.elixirHP--; const h = Math.round(heroMaxHP() * B.elixirHP); B$.hp = Math.min(heroMaxHP(), B$.hp + h); floatText(B$.hero.x, GROUND - 260, `+${h}`, '#7dff8a'); }
  else { B$.elixirBless--; B$.blessing = B.blessingMax; floatText(B$.hero.x, GROUND - 260, 'Benção cheia', '#e7c46a', 22); }
  renderActions();
}

let busy = false;
async function doAttack(special) {
  if (busy) return;
  if (special && B$.blessing < special.cost) return;
  busy = true; showActions(false);
  const t = B$.target;
  B$.attackCount++;
  let mult = 1;
  if (special) { B$.blessing -= special.cost; mult = await precisionBar(); }
  const hero = B$.hero, startX = hero.x;
  const melee = !special || special.target === 'one';
  if (melee) await tween(hero, t.actor.x - 150, 260);
  const anim = hero.play('attack', 18);
  await wait(250);
  let totalDmg = 0, hits = 0, targets = new Set();
  const per = Math.round(heroAtk() * (special ? special.mult : 1) * mult);
  if (!special) { totalDmg += hitEnemy(t, per); hits = 1; targets.add(t); }
  else if (special.target === 'one') {
    for (let i = 0; i < special.hits; i++) { totalDmg += hitEnemy(t, per, { breaks: true }); hits++; targets.add(t); await wait(140); }
  } else if (special.target === 'all') {
    for (let i = 0; i < special.hits; i++) { for (const e of alive()) { totalDmg += hitEnemy(e, per); hits++; targets.add(e); } await wait(160); }
  } else {
    for (let i = 0; i < special.hits; i++) { const list = alive(); if (!list.length) break; const e = pick(list); totalDmg += hitEnemy(e, per); hits++; targets.add(e); await wait(110); }
  }
  if (special) floatText(hero.x, GROUND - 300, mult >= 1.45 ? 'PERFEITO!' : `${Math.round(mult * 100)}%`, '#e7c46a', 22);
  await anim;
  if (melee) await tween(hero, startX, 260);
  // Vulnerabilidade dura até o próximo ataque do jogador terminar (§3.7).
  for (const e of B$.enemies) if (e.vulnUntil >= 0 && e.vulnUntil < B$.attackCount) e.vulnUntil = -1;
  // Recuperação: muitos hits ou dano alto num golpe = herói perde o próximo turno (§3.8).
  const maxHP = Math.max(...[...targets].map(e => e.maxHP), 1);
  if (hits >= B.recoveryHits || totalDmg >= maxHP * B.recoveryDamageFrac) { B$.heroRecovering = true; floatText(hero.x, GROUND - 330, 'ofegante', '#aaa', 20); }
  await afterEnemyDeaths();
  busy = false;
  const r = turnResolve; turnResolve = null; r && r();
}

async function afterEnemyDeaths() {
  const dead = B$.enemies.filter(e => e.hp <= 0 && !e.gone);
  if (!dead.length) return;
  dead.forEach(e => e.gone = true);
  await wait(250);
  layoutEnemies();
  if (B$.target && B$.target.hp <= 0) B$.target = alive()[0] || null;
  if (screen === 'battle' && turnResolve) {
    if (!alive().length) { busy = false; const r = turnResolve; turnResolve = null; showActions(false); r(); }
    else renderActions();
  }
}

// Barra de precisão (§3.2/§10: a interação mais simples). 0,5× nas pontas, 1,5× no centro.
function precisionBar() {
  const box = $('precision'), cur = box.querySelector('.cur');
  box.classList.remove('hidden');
  const t0 = now();
  return new Promise(res => {
    let done = false;
    const pos = () => { const t = (now() - t0) / 1000 * 1.25; return Math.abs(((t % 2) + 2) % 2 - 1); };
    const step = () => { if (done) return; cur.style.left = `calc(${pos() * 100}% - 3px)`; if (now() - t0 > 3500) finish(); else requestAnimationFrame(step); };
    const finish = () => {
      if (done) return; done = true; removeEventListener('pointerdown', finish); removeEventListener('keydown', finish);
      const acc = 1 - Math.abs(pos() - 0.5) * 2;
      box.classList.add('hidden');
      res(acc > 0.88 ? 1.5 : 0.5 + acc);
    };
    setTimeout(() => { addEventListener('pointerdown', finish); addEventListener('keydown', finish); }, 120);
    step();
  });
}

// ---- turno do inimigo: escudo (sem aviso) OU ataque, com 1+ golpes telegrafados (§3.1, §3.3)
async function enemyAction(e) {
  const d = B$.d, phase2 = e.phase === 2;
  const shieldChance = e.def.shield * (phase2 ? 1.6 : 1);
  if (shieldChance && e.shields < B.maxShields && rand() < shieldChance) {
    e.shields = Math.min(B.maxShields, e.shields + (e.def.boss ? 3 : 2));
    e.actor.play('attack', 14);
    floatText(e.actor.x, GROUND - 270, 'invocou escudo', '#9fd0ff', 20);
    await wait(700); return;
  }
  const comboLen = phase2 ? 3 : pick(e.def.combo);
  if (e.def.melee) await tween(e.actor, B$.hero.x + 210, 300);
  let hitsLanded = 0, dmgTotal = 0;
  for (let i = 0; i < comboLen && B$.hp > 0; i++) {
    const quick = rand() < quickChance(d) + (phase2 ? 0.15 : 0);
    const res = quick ? await quickAttack(e) : await telegraphedAttack(e);
    if (res.landed) { hitsLanded++; dmgTotal += res.dmg; }
    await wait(180);
  }
  if (e.def.melee) await tween(e.actor, e.actor.homeX, 300);
  if (comboLen >= B.recoveryHits) { e.recovering = true; floatText(e.actor.x, GROUND - 280, 'ofegante', '#aaa', 18); }
}

// Ataque Telegrafado: arco largo branco-amarelado; esquiva (janela larga) ou parry (janela curta, contra-ataca).
async function telegraphedAttack(e) {
  const impactAt = now() + B.telegraphMs;
  telegraph = { kind: 'tele', e, start: now(), impactAt };
  const anim = e.actor.play('attack', 8 / (B.telegraphMs / 1000) * 0.9);
  if (!e.def.melee) setTimeout(() => throwProjectile(e.actor.x - 40, B$.hero.x + 20, e.def.fire ? '#ff8a3c' : '#d8d0b0', 0, B.telegraphMs * 0.55), B.telegraphMs * 0.45);
  const press = await reactionWindow(impactAt, { parry: true });
  telegraph = null; await anim;
  if (press && press.kind === 'parry' && press.t >= impactAt - B.parryBefore && press.t <= impactAt + B.after) {
    B$.hero.play('parry', 18); floatText(B$.hero.x, GROUND - 280, 'PARRY!', '#e7c46a', 30);
    await wait(200);
    hitEnemy(e, heroAtk());   // contra-ataque com a mesma fórmula do ataque normal
    await afterEnemyDeaths();
    return { landed: false };
  }
  if (press && press.kind === 'dodge' && press.t >= impactAt - B.dodgeBefore && press.t <= impactAt + B.after) {
    B$.hero.play('dodge', 18); floatText(B$.hero.x, GROUND - 280, 'esquivou', '#8fd6ff', 24);
    return { landed: false };
  }
  B$.lastHitBy = e;
  return { landed: true, dmg: heroTakeDamage(e.atk, { fire: e.def.fire }) };
}

// Ataque Rápido: arco vermelho fino; só Sequência de Desvio. Dano proporcional aos toques errados (§3.1).
async function quickAttack(e) {
  const n = quickTaps(B$.d);
  let ok = 0;
  floatText(e.actor.x, GROUND - 280, 'ATAQUE RÁPIDO', '#ff5a4a', 22);
  e.actor.play('attack', 8 / (B.quickTapMs * n / 1000));
  for (let i = 0; i < n; i++) {
    const impactAt = now() + B.quickTapMs;
    telegraph = { kind: 'quick', e, start: now(), impactAt, i, n };
    const press = await reactionWindow(impactAt, { parry: false });
    if (press && press.kind === 'dodge' && press.t >= impactAt - B.quickBefore && press.t <= impactAt + B.after) { ok++; B$.hero.play('dodge', 22); }
  }
  telegraph = null;
  if (ok === n) { floatText(B$.hero.x, GROUND - 280, 'sequência perfeita', '#8fd6ff', 22); return { landed: false }; }
  const frac = (n - ok) / n;
  floatText(B$.hero.x, GROUND - 300, `${ok}/${n} desvios`, '#8fd6ff', 18);
  B$.lastHitBy = e;
  // (ataque × 1,5 − defesa) × fração de toques errados; o "+ defesa" compensa a subtração feita em heroTakeDamage.
  return { landed: true, dmg: heroTakeDamage((e.atk * B.quickMult - heroDef()) * frac + heroDef(), { fire: e.def.fire }) };
}

// Espera até o impacto (+ folga) e devolve o PRIMEIRO toque do jogador. Tocar antes da janela = errou (§3.1).
let pressHandler = null;
function reactionWindow(impactAt, { parry }) {
  const react = $('react');
  react.classList.remove('hidden');
  $('btn-parry').disabled = !parry || B$.noReact;
  $('btn-dodge').disabled = !!B$.noReact;
  return new Promise(res => {
    let first = null;
    pressHandler = kind => { if (first || B$.noReact) return; if (kind === 'parry' && !parry) return; first = { kind, t: now() }; $(`btn-${kind}`).classList.add('hit'); };
    const end = () => { pressHandler = null; $('btn-dodge').classList.remove('hit'); $('btn-parry').classList.remove('hit'); res(first); };
    setTimeout(end, Math.max(0, impactAt + B.after - now()));
  });
}
function hideReact() { $('react').classList.add('hidden'); }

function throwProjectile(fromX, toX, color, size = 0, ms = 260) {
  projectile = { fromX, toX, color, size, t0: now(), ms };
  return wait(ms).then(() => { projectile = null; });
}

function endExpedition(won) {
  hideReact(); showActions(false);
  const m = $('modal');
  if (won) {
    if (B$.d === save.unlocked && save.unlocked < DUNGEONS.length) save.unlocked++;
    if (B$.bossKilled) { save.knowledge++; save.bossKills++; }
    const base = B$.souls + B$.recovered;
    persist();
    m.innerHTML = `<div class="card"><h2>Vitória — ${WORLD} ${B$.d}</h2>
      <p class="big"><img src="${icon('Soul')}" width="34"> ${base}</p>
      <p>Almas colhidas${B$.recovered ? ` (inclui ${B$.recovered} recuperadas)` : ''} · Conhecimento ×${soulMult().toFixed(2).replace('.', ',')}</p>
      ${B$.bossKilled ? `<p style="color:var(--gold)">+1 Conhecimento das Almas (árvore fora do protótipo)</p>` : ''}
      <div class="row"><button class="btn gold" id="vision">Visão Divina ×3<br><small>anúncio simulado</small></button><button class="btn" id="take">Coletar</button></div></div>`;
    const finish = mult => { save.souls += base * mult; persist(); m.classList.add('hidden'); B$ = null; showCamp(); };
    $('vision').onclick = () => finish(3);
    $('take').onclick = () => finish(1);
  } else {
    // Almas Perdidas (§5.1): o monstro que matou o herói guarda as Almas desta expedição.
    // Morrer de novo antes de recuperar apaga as Almas presas da vez anterior.
    const killer = B$.lastHitBy;
    const prevLost = save.lost;
    const carried = B$.souls + B$.recovered;
    save.lost = killer && carried > 0 ? { dungeon: B$.d, wave: B$.wave, slot: killer.slot, souls: carried, name: killer.name } : null;
    persist();
    m.innerHTML = `<div class="card"><h2 style="color:var(--red)">Você caiu</h2>
      ${carried > 0 && killer ? `<p>${killer.name} guarda suas <b style="color:var(--soul)">${carried} Almas</b>.</p><p>Volte à ${WORLD} ${B$.d} e derrote-o (ele brilha) para recuperá-las. Se cair antes, elas somem.</p>` : '<p>Nenhuma Alma colhida nesta expedição.</p>'}
      ${prevLost ? `<p style="color:var(--red)">As ${prevLost.souls} Almas que ${prevLost.name} guardava na masmorra ${prevLost.dungeon} se perderam.</p>` : ''}
      <div class="row"><button class="btn" id="take">Voltar ao Acampamento</button></div></div>`;
    $('take').onclick = () => { m.classList.add('hidden'); B$ = null; showCamp(); };
  }
  m.classList.remove('hidden');
}

// ============================================================ UI de batalha

function showActions(on) {
  $('actions').classList.toggle('hidden', !on);
  if (on) { hideReact(); renderActions(); }
}
function renderActions() {
  if (!B$) return;
  const bl = B$.blessing;
  const sp = SPECIALS.map((s, i) => `<button class="btn act wide" data-sp="${i}" ${bl < s.cost || busy ? 'disabled' : ''}>${s.name}<small>${s.cat} · ${s.hits} hit${s.hits > 1 ? 's' : ''}</small>
      <span class="cost">${Array.from({ length: s.cost }, () => `<img src="${icon('DivineBlessing')}">`).join('')}</span><small>[${i + 1}]</small></button>`).join('');
  $('actions').innerHTML = `
    <div class="grp"><span class="lbl">ANTES</span>
      <button class="btn act" id="a-stone" ${B$.usedStone || busy ? 'disabled' : ''}><img src="${icon('Stone')}">Pedra<small>tira 1 escudo [Q]</small></button>
      <button class="btn act" id="a-hp" ${B$.usedItem || !B$.elixirHP || busy ? 'disabled' : ''}><img src="${icon('ElixirHP')}">Elixir HP<small>${B$.elixirHP}/3 · +40% [W]</small></button>
      <button class="btn act" id="a-bless" ${B$.usedItem || !B$.elixirBless || busy ? 'disabled' : ''}><img src="${icon('ElixirBlessing')}">Elixir Benção<small>${B$.elixirBless}/3 · enche [E]</small></button>
    </div>
    <div class="grp"><span class="lbl">ATAQUE</span>
      <button class="btn act" id="a-atk" ${busy ? 'disabled' : ''}>⚔<br>Atacar<small>1 hit [A]</small></button>${sp}
    </div>
    <div class="hint">Alvo: <b style="color:var(--gold)">${B$.target ? B$.target.name : '—'}</b><br>toque num inimigo para trocar</div>`;
  $('a-stone').onclick = doStone;
  $('a-hp').onclick = () => doItem('hp');
  $('a-bless').onclick = () => doItem('bless');
  $('a-atk').onclick = () => doAttack(null);
  document.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => doAttack(SPECIALS[+b.dataset.sp]));
}

function renderHUD() {
  const h = $('hud');
  if (!B$) { h.innerHTML = ''; return; }
  const max = heroMaxHP();
  const pips = Array.from({ length: B.blessingMax }, (_, i) => `<img src="${icon('DivineBlessing')}" class="${i < B$.blessing ? '' : 'off'}">`).join('');
  let html = `<div class="hero-hud"><div class="name"><span>Peregrino</span><span>${B$.hp}/${max}</span></div>
    <div class="bar"><i style="width:${B$.hp / max * 100}%"></i></div>
    <div class="bar brk" title="Quebra"><i style="width:${B$.heroBrk / heroBreakAt() * 100}%"></i></div>
    <div class="pips">Benção ${pips}</div>
    <div class="status">${B$.burn ? `<span><img src="${icon('Burn')}"> ${B$.burn}</span>` : ''}${B$.heroRecovering ? '<span class="tag">ofegante</span>' : ''}${B$.heroBroken || B$.noReact ? '<span class="tag red">quebrado</span>' : ''}</div></div>
    <div class="wave">${WORLD} <b>${B$.d}</b> · onda ${B$.wave + 1}/${DUNGEONS[B$.d - 1].length}<br><span class="souls"><img src="${icon('Soul')}"> ${B$.souls}</span></div>`;
  for (const e of alive()) {
    html += `<div class="enemy-hud${e === B$.target ? ' target' : ''}${e.guard ? ' guard' : ''}" style="left:${e.actor.homeX}px;top:${GROUND - (e.def.boss ? 410 : 372)}px">
      <div class="n"><span>${e.guard ? '✦ ' : ''}${e.name}${e.phase === 2 ? ' II' : ''}</span><span>${e.hp}</span></div>
      <div class="bar"><i style="width:${e.hp / e.maxHP * 100}%"></i></div>
      <div class="bar brk"><i style="width:${e.brk / B$.enemyBreakAt * 100}%"></i></div>
      <div class="status">${e.shields ? `<span><img src="${icon('EnemyShield')}"> ${e.shields}</span>` : ''}${e.burn ? `<span><img src="${icon('Burn')}"> ${e.burn}</span>` : ''}${e.vulnUntil >= 0 ? '<span class="tag">vulnerável</span>' : ''}${e.broken ? '<span class="tag">quebrado</span>' : ''}${e.recovering ? '<span class="tag">ofegante</span>' : ''}</div></div>`;
  }
  h.innerHTML = html;
}

// ============================================================ acampamento

function showCamp() {
  screen = 'camp'; tickTorches();
  if (selectedDungeon > save.unlocked) selectedDungeon = save.unlocked;
  const c = $('camp');
  const attrs = [
    ['str', 'Força', `Ataque ${heroAtk()} · Defesa ${heroDef()} · Quebra em ${heroBreakAt()} hits`],
    ['vit', 'Vitalidade', `HP máximo ${heroMaxHP()}`],
    ['kno', 'Conhecimento', `Almas ×${soulMult().toFixed(2).replace('.', ',')}`],
  ];
  const nextTorch = save.torches < B.torchMax ? Math.max(0, B.torchRechargeMs - (Date.now() - save.torchTs)) : 0;
  const mmss = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
  const sel = selectedDungeon, comp = DUNGEONS[sel - 1];
  const lostHere = save.lost && save.lost.dungeon === sel;
  c.innerHTML = `
    <div class="card">
      <h2>Acampamento</h2>
      <div class="res"><span class="souls"><img src="${icon('Soul')}"> ${save.souls}</span><span style="color:var(--gold)"><img src="${icon('SoulKnowledge')}"> ${save.knowledge}</span></div>
      <div class="torches">${Array.from({ length: B.torchMax }, (_, i) => `<img src="${icon('Torch')}" class="${i < save.torches ? '' : 'off'}">`).join('')}
        <span>${save.torches < B.torchMax ? `+1 em ${mmss(nextTorch)}` : 'cheio'}</span></div>
      ${attrs.map(([k, n, eff]) => `<div class="attr"><b>${n} ${save[k]}</b><small>${eff}</small>
        <button class="btn" data-up="${k}" ${save.souls < costOf(save[k] + 1) ? 'disabled' : ''}><img src="${icon('Soul')}" width="16"> ${costOf(save[k] + 1)}</button></div>`).join('')}
      <p class="note">Custo(N) = 20 × 1,12^(N−1) (§4). Elixires: 3 de cada, repostos de graça a cada expedição neste protótipo.</p>
    </div>
    <div class="right-col">
      <div class="card"><h2>${WORLD}</h2>
        <div class="dungeons">${DUNGEONS.map((_, i) => {
          const n = i + 1, locked = n > save.unlocked;
          return `<button class="btn dg${n === sel ? ' sel' : ''}${save.lost && save.lost.dungeon === n ? ' lost' : ''}" data-dg="${n}" ${locked ? 'disabled' : ''}>${locked ? '🔒' : n}<small>${n === DUNGEONS.length ? 'BOSS' : `${DUNGEONS[i].length} ondas`}</small></button>`;
        }).join('')}</div>
        <div class="dg-info">
          ${comp.map((w, i) => `Onda ${i + 1}: ${w.map(t => ENEMIES[t].name).join(', ')}`).join('<br>')}<br>
          Ataque Rápido: ${Math.round(quickChance(sel) * 100)}% dos golpes · ${quickTaps(sel)} toques · quebra inimiga em ${enemyBreakAt(sel)} hits
          ${lostHere ? `<br><span class="lost">✦ ${save.lost.name} guarda ${save.lost.souls} Almas suas aqui (onda ${save.lost.wave + 1}).</span>` : ''}
        </div>
        <div class="go-row">
          <button class="btn gold" id="go" ${save.torches < 1 ? 'disabled' : ''}>Partir <img src="${icon('Torch')}" width="22"> −1</button>
          ${save.torches < 1 ? '<button class="btn" id="ad">Assistir vídeo (simulado) → +1 tocha</button>' : ''}
        </div>
      </div>
      <div class="card"><h2>Loadout de habilidades</h2>
        <div class="loadout">${SPECIALS.map(s => `<span>${s.name} · ${s.cat} · ${s.hits} hit(s) · ${s.cost} Benção</span>`).join('')}</div>
        <p class="note">Esquiva: Espaço/J (janela larga) · Parry: K (janela curta, contra-ataca; não vale no Ataque Rápido vermelho). Toque cedo demais = erro. Gemas, árvore e missões diárias ficam fora do protótipo.</p>
      </div>
    </div>`;
  c.querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
    const k = b.dataset.up, cost = costOf(save[k] + 1);
    if (save.souls < cost) return;
    save.souls -= cost; save[k]++; persist(); showCamp();
  });
  c.querySelectorAll('[data-dg]').forEach(b => b.onclick = () => { selectedDungeon = +b.dataset.dg; showCamp(); });
  $('go').onclick = () => startExpedition(selectedDungeon);
  if ($('ad')) $('ad').onclick = () => { save.torches++; persist(); showCamp(); };
  c.classList.remove('hidden');
}
setInterval(() => { if (screen === 'camp' && !$('camp').classList.contains('hidden')) { const before = save.torches; tickTorches(); if (before !== save.torches || save.torches < B.torchMax) showCamp(); } }, 1000);

// ============================================================ entrada

function press(kind) { if (pressHandler) pressHandler(kind); }
$('btn-dodge').onpointerdown = e => { e.preventDefault(); press('dodge'); };
$('btn-parry').onpointerdown = e => { e.preventDefault(); press('parry'); };
addEventListener('keydown', e => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'j') { e.preventDefault(); press('dodge'); }
  if (k === 'k' || k === 'shift') press('parry');
  if (!B$ || !turnResolve || busy) return;
  if (k === 'q') doStone();
  if (k === 'w') doItem('hp');
  if (k === 'e') doItem('bless');
  if (k === 'a') doAttack(null);
  if (['1', '2', '3'].includes(k)) doAttack(SPECIALS[+k - 1]);
});
// Escolher alvo tocando no inimigo.
$('app').addEventListener('pointerdown', ev => {
  if (!B$ || !turnResolve || busy) return;
  const r = $('app').getBoundingClientRect(), x = (ev.clientX - r.left) / scale, y = (ev.clientY - r.top) / scale;
  if (y > GROUND + 10 || y < GROUND - 330) return;
  let best = null, bd = 90;
  for (const e of alive()) { const d = Math.abs(e.actor.x - x); if (d < bd) { bd = d; best = e; } }
  if (best) { B$.target = best; renderActions(); }
});

// ============================================================ desenho

let scale = 1;
function fit() {
  scale = Math.min(innerWidth / REF_W, innerHeight / REF_H);
  const a = $('app'); a.style.transform = `scale(${scale})`;
  a.style.left = `${(innerWidth - REF_W * scale) / 2}px`; a.style.top = `${(innerHeight - REF_H * scale) / 2}px`;
}

const g = $('scene').getContext('2d');
g.imageSmoothingEnabled = false;
let last = 0, hudT = 0;
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
  g.imageSmoothingEnabled = false;
  const bg = screen === 'camp' ? IMG.bgCamp : IMG.bgBattle;
  if (bg) g.drawImage(bg, 0, 0, REF_W, REF_H); else { g.fillStyle = '#111'; g.fillRect(0, 0, REF_W, REF_H); }
  if (screen === 'camp') {
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, REF_W, REF_H);
  }
  if (B$) {
    for (const e of B$.enemies) {
      e.actor.update(dt);
      if (e.hp <= 0) { e.fade = (e.fade || 1) - dt * 1.5; if (e.fade > 0) e.actor.draw(g, { alpha: e.fade }); continue; }
      e.actor.draw(g, { glow: e.guard ? '#8fd6ff' : e.phase === 2 ? '#b04cff' : null });
    }
    B$.hero.update(dt); B$.hero.draw(g);
    if (B$.target && B$.target.hp > 0 && turnResolve) {
      g.fillStyle = '#e7c46a'; const x = B$.target.actor.x;
      g.beginPath(); g.moveTo(x - 10, GROUND + 6); g.lineTo(x + 10, GROUND + 6); g.lineTo(x, GROUND - 6); g.fill();
    }
    drawTelegraph();
    if (projectile) {
      const p = Math.min(1, (now() - projectile.t0) / projectile.ms), x = projectile.fromX + (projectile.toX - projectile.fromX) * p;
      const y = GROUND - 150 - Math.sin(p * Math.PI) * 40;
      g.fillStyle = projectile.color; g.beginPath(); g.arc(x, y, projectile.size || 7, 0, Math.PI * 2); g.fill();
      if (!projectile.size) { g.strokeStyle = projectile.color; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 26, y - 4); g.stroke(); }
    }
  }
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]; f.t += dt;
    if (f.t > 1.2) { floaters.splice(i, 1); continue; }
    g.globalAlpha = Math.min(1, 2.4 - f.t * 2);
    g.font = `700 ${f.size}px 'Pixelify Sans', monospace`; g.textAlign = 'center';
    g.fillStyle = '#000'; g.fillText(f.text, f.x + 2, f.y - f.t * 50 + 2);
    g.fillStyle = f.color; g.fillText(f.text, f.x, f.y - f.t * 50);
    g.globalAlpha = 1;
  }
  hudT -= dt; if (hudT <= 0) { hudT = 0.08; renderHUD(); }
  requestAnimationFrame(frame);
}

// Slash FX: arco largo branco-amarelado (telegrafado) ou fino vermelho (rápido), com um anel que fecha no impacto.
function drawTelegraph() {
  if (!telegraph) return;
  const tg = telegraph, total = tg.impactAt - tg.start, p = Math.min(1.2, (now() - tg.start) / total);
  const cx = B$.hero.x, cy = GROUND - 150;
  const quick = tg.kind === 'quick';
  g.save();
  g.lineCap = 'round';
  g.strokeStyle = quick ? 'rgba(255,60,50,.95)' : 'rgba(255,240,190,.9)';
  g.lineWidth = quick ? 5 : 16;
  g.shadowColor = quick ? '#ff2a1a' : '#ffe9a0'; g.shadowBlur = 16;
  const a0 = -2.4, a1 = a0 + Math.min(1, p) * 2.2;
  g.beginPath(); g.arc(cx + 30, cy, 110, a0, a1); g.stroke();
  // anel de timing: fecha até o círculo-alvo no momento do impacto
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3;
  g.beginPath(); g.arc(cx, cy, 46, 0, Math.PI * 2); g.stroke();
  const r = 46 + Math.max(0, 1 - p) * 150;
  g.strokeStyle = quick ? '#ff5a4a' : '#ffe9a0'; g.lineWidth = 4;
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  if (quick) { g.fillStyle = '#ff5a4a'; g.font = "700 22px 'Pixelify Sans'"; g.textAlign = 'center'; g.fillText(`${tg.i + 1}/${tg.n}`, cx, cy + 8); }
  g.restore();
}

// ============================================================ boot

async function boot() {
  const E = ART + 'Enemies/';
  await loadImages([
    ['bgBattle', ART + 'Backgrounds/SPR_Background_Battle_Cathedral.png'], ['bgCamp', ART + 'Backgrounds/SPR_Background_Camp.png'],
    ['hero_idle', ART + 'Hero/SPR_Hero_Anim_Idle.png'], ['hero_attack', ART + 'Hero/SPR_Hero_Anim_Attack.png'],
    ['hero_dodge', ART + 'Hero/SPR_Hero_Anim_Dodge.png'], ['hero_parry', ART + 'Hero/SPR_Hero_Anim_Parry.png'], ['hero_hurt', ART + 'Hero/SPR_Hero_Anim_Hurt.png'],
    ...Object.entries(ENEMIES).flatMap(([k, e]) => [[k + '_idle', `${E}${e.spr}_Anim_Idle.png`], [k + '_attack', `${E}${e.spr}_Anim_Attack.png`]]),
    ['ghoul_guard_idle', E + 'SPR_Enemy_Ghoul_SoulGuardian_Anim_Idle.png'],
  ]);
  save = load();
  if (DEV.has('rich')) { save.souls += 2000; persist(); }
  if (DEV.has('unlock')) { save.unlocked = DUNGEONS.length; persist(); }
  addEventListener('resize', fit); fit();
  requestAnimationFrame(frame);
  const dg = [...DEV].find(k => /^d\d$/.test(k));
  if (dg) { save.unlocked = Math.max(save.unlocked, +dg[1]); startExpedition(+dg[1]); }
  else showCamp();
}
boot();
