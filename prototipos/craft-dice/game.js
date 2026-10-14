// Craft Dice — protótipo jogável em JavaScript puro.
// Segue a Parte 1 do CraftDice.md com os placeholders de MVP (§13): exploração topdown num mapa fixo feito à
// mão, monstros parados que abrem a batalha ao encostar, rodada de dados (intenção visível, 1 re-rolagem,
// feitiços, jogador age primeiro), bonfire (descansar, feitiços, forja de faces, mão de até 5 dados) e morte
// que apaga a run. Uma área com o chefe final, como o guia Unity (Fase 7.2). Arte: Sprites/CraftDice/.
'use strict';

const ART = '../../Sprites/CraftDice/';
const T = 32;                  // tile de 32 px (§10)
const VW = 480, VH = 270;      // resolução do mapa (desenhado em 2×)
const SAVE_KEY = 'craftdice-run-v1';
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ============================================================ dados de design (§3, §5, §13)

const FACES = {
  attack:  ['attack1', 'attack2', 'critical', 'miss'],
  defense: ['parry', 'dodge', 'miss'],
  spell:   ['spell0', 'spell1', 'spell2'],
};
const FACE_INFO = {
  attack1: { name: '1 Ataque', hits: 1, forge: 1 }, attack2: { name: '2 Ataques', hits: 2, forge: 2 }, critical: { name: 'Crítico', hits: 3, forge: 3 },
  miss: { name: 'Miss', forge: 0 }, parry: { name: 'Parry', forge: 2 }, dodge: { name: 'Esquiva', forge: 1 },
  spell0: { name: '0 Feitiço', sp: 0, forge: 0 }, spell1: { name: '1 Feitiço', sp: 1, forge: 1 }, spell2: { name: '2 Feitiços', sp: 2, forge: 2 },
};
const TYPE_NAME = { attack: 'Ataque', defense: 'Defesa', spell: 'Feitiço' };
const standardDie = type => ({ type, faces: [...FACES[type]] });
const forgePrice = faces => 5 + 3 * faces.reduce((s, f) => s + FACE_INFO[f].forge, 0);

const B = { maxHP: 10, playerDamage: 1, parryDamage: 1, rerollsPerRound: 1, handLimit: 5 };

const SPELLS = [
  { id: 'potion', name: 'Poção',       cost: 2, price: 15, desc: '+3 de HP' },
  { id: 'reroll', name: 'Re-rolar',    cost: 1, price: 10, desc: '+1 re-rolagem nesta rodada' },
  { id: 'weak',   name: 'Fraqueza',    cost: 2, price: 20, desc: 'monstro leva +1 por ataque até o fim' },
  { id: 'double', name: 'Golpe Duplo', cost: 3, price: 30, desc: '×2 ataques nesta rodada' },
];

const MONSTERS = {
  S: { id: 'skeleton', name: 'Esqueleto', hp: 4, dmg: 1, pattern: [1, 2], coins: 10, frame: 32, frames: 4 },
  H: { id: 'shadow-hound', name: 'Cão Sombrio', hp: 6, dmg: 2, pattern: [1, 1, 2], coins: 15, frame: 32, frames: 8 },
  K: { id: 'fallen-knight', name: 'Cavaleiro Caído', hp: 15, dmg: 2, pattern: [2, 3, 1, 3], coins: 50, frame: 48, frames: 4, boss: true },
};

// ============================================================ mapa fixo feito à mão (§8)
// '.' chão · ' ' vazio · P início · B bonfire · A bigorna · S/H/K monstros · G portão do chefe (decorativo)
// t árvore ciano · d árvore seca · o pedras · p pilar · q pilar quebrado · r pedra rúnica · m lápide
// x caveiras · y cristal · u toco · c baú

const MAP = [
  '                                        ',
  '  ........                ..........    ',
  ' ...t..d...              ....d.....y.   ',
  ' ..........    ......    ...........    ',
  ' ....B.A...   ...m...H.  ......K.....   ',
  ' ...P......  ........... ...x.......r.  ',
  ' ..........  ...........  ..........    ',
  '  ...o.....  ..t.........   ...p.q..    ',
  '   ....................  .     ..G..    ',
  '    ..u.S.............         ...      ',
  '     ..........x......          ...     ',
  '       .....  ......            ...     ',
  '        ...    ....H..        .....     ',
  '        ...     .........    ......     ',
  '       .....      ....S...  .....t.     ',
  '      .r.....       ....... ...S...     ',
  '     .........       ......B.A.....     ',
  '     ...d.H....c       .........y.      ',
  '      .........          .......        ',
  '       ...S...             ...          ',
  '        .....                           ',
  '                                        ',
];
const MW = Math.max(...MAP.map(r => r.length)), MH = MAP.length;
const cellAt = (x, y) => (MAP[y] || '')[x] || ' ';
const isFloor = (x, y) => cellAt(x, y) !== ' ';
const PROPS = { t: 'cyan-tree', d: 'dead-tree', o: 'boulders', p: 'pillar', q: 'broken-pillar', r: 'rune-stone', m: 'tombstone', x: 'skull-pile', y: 'crystal', u: 'stump', c: 'chest', A: 'anvil', G: 'boss-gate', B: 'bonfire' };
const SOLID = new Set('tdopqrmyucAB');

// Autotile Wang de cantos (tiles/area1-void-ground.json): chave NW NE SW SE (1 = chão carmesim) → canto da sheet.
const WANG = { '0000': [64, 32], '0001': [96, 32], '0010': [64, 64], '0011': [32, 64], '0100': [64, 0], '0101': [96, 64], '0110': [0, 32], '0111': [96, 96], '1000': [32, 32], '1001': [64, 96], '1010': [32, 0], '1011': [0, 64], '1100': [96, 0], '1101': [0, 0], '1110': [32, 96], '1111': [0, 96] };

// ============================================================ run e save (§9, §12)

function newRun() {
  let px = 4, py = 5;
  MAP.forEach((r, y) => { const i = r.indexOf('P'); if (i >= 0) { px = i; py = y; } });
  return {
    x: px + 0.5, y: py + 0.7, dir: 0, hp: B.maxHP, coins: 0,
    bag: [standardDie('attack'), standardDie('attack'), standardDie('defense')], hand: [0, 1, 2],
    spells: [], dead: [], bossDead: false,
  };
}
let run = null;
function loadRun() { try { const r = JSON.parse(localStorage.getItem(SAVE_KEY)); if (r && r.bag) return r; } catch (e) {} return null; }
function persist() { try { if (run) localStorage.setItem(SAVE_KEY, JSON.stringify(run)); } catch (e) {} }
function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// Monstros do mapa (parados, §6). id = posição na grade, para lembrar quem já morreu.
function monstersOnMap() {
  const list = [];
  MAP.forEach((r, y) => [...r].forEach((ch, x) => { if (MONSTERS[ch]) list.push({ key: `${x},${y}`, def: MONSTERS[ch], x: x + 0.5, y: y + 0.7 }); }));
  return list;
}

// ============================================================ arte

const IMG = {};
function loadImages(keys) { return Promise.all(keys.map(k => new Promise(r => { const im = new Image(); im.onload = () => { IMG[k] = im; r(); }; im.onerror = () => { console.warn('sem arte', k); r(); }; im.src = `${ART}${k}.png`; }))); }
const faceSrc = (type, face) => `${ART}dice/faces/${type}_${face}.png`;

// ============================================================ exploração

const cv = document.getElementById('map'), g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
const $ = id => document.getElementById(id);
let mode = 'title';   // title | explore | battle | bonfire
const keys = new Set();
const stick = { on: false, id: -1, cx: 0, cy: 0, dx: 0, dy: 0 };
let nearBonfire = false, toastT = 0;

function toast(msg, s = 2) { const t = $('toast'); t.textContent = msg; t.classList.remove('hidden'); toastT = s; }

function walkable(x, y) {
  const cx = Math.floor(x), cy = Math.floor(y);
  return isFloor(cx, cy) && !SOLID.has(cellAt(cx, cy));
}
function canStand(x, y) { return walkable(x - 0.28, y - 0.15) && walkable(x + 0.28, y - 0.15) && walkable(x - 0.28, y + 0.2) && walkable(x + 0.28, y + 0.2); }

function updateExplore(dt) {
  let dx = 0, dy = 0;
  if (keys.has('a') || keys.has('arrowleft')) dx--;
  if (keys.has('d') || keys.has('arrowright')) dx++;
  if (keys.has('w') || keys.has('arrowup')) dy--;
  if (keys.has('s') || keys.has('arrowdown')) dy++;
  if (stick.on) { dx = stick.dx; dy = stick.dy; }
  const l = Math.hypot(dx, dy);
  run.moving = l > 0.15;
  if (run.moving) {
    dx /= Math.max(1, l); dy /= Math.max(1, l);
    const sp = 4.2 * dt;
    if (canStand(run.x + dx * sp, run.y)) run.x += dx * sp;
    if (canStand(run.x, run.y + dy * sp)) run.y += dy * sp;
    run.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 0 : 2);   // linhas da sheet: S, E, N, W
  }
  // Encostar num monstro abre a batalha (§2).
  for (const m of monstersOnMap()) {
    if (run.dead.includes(m.key)) continue;
    if (Math.hypot(m.x - run.x, m.y - run.y) < 0.75) return startBattle(m);
  }
  // Encostar na bonfire abre o menu (placeholder de MVP, §11). Reabre só depois de se afastar.
  let touching = false;
  MAP.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === 'B' && Math.hypot(x + 0.5 - run.x, y + 0.6 - run.y) < 1.0) touching = true; }));
  if (touching && !nearBonfire) openBonfire();
  nearBonfire = touching;
}

let cam = { x: 0, y: 0 }, animT = 0;
function drawMap() {
  const tx = run.x * T - VW / 2, ty = run.y * T - VH / 2;
  cam.x += (tx - cam.x) * 0.2; cam.y += (ty - cam.y) * 0.2;
  const ox = Math.round(cam.x), oy = Math.round(cam.y);
  g.fillStyle = '#1a0d2e'; g.fillRect(0, 0, VW, VH);
  // Dual grid: cada tile desenhado fica entre 4 células do mapa (os 4 cantos).
  const tiles = IMG['tiles/area1-void-ground'];
  const x0 = Math.floor(ox / T), y0 = Math.floor(oy / T);
  for (let j = y0; j <= y0 + Math.ceil(VH / T) + 1; j++) for (let i = x0; i <= x0 + Math.ceil(VW / T) + 1; i++) {
    const k = `${+isFloor(i - 1, j - 1)}${+isFloor(i, j - 1)}${+isFloor(i - 1, j)}${+isFloor(i, j)}`;
    if (k === '0000' || !tiles) continue;
    const [sx, sy] = WANG[k];
    g.drawImage(tiles, sx, sy, T, T, Math.round(i * T - T / 2 - ox), Math.round(j * T - T / 2 - oy), T, T);
  }
  // Objetos ordenados por y (props, monstros, jogador).
  const objs = [];
  MAP.forEach((r, y) => [...r].forEach((ch, x) => { if (PROPS[ch]) objs.push({ y: y + 0.9, draw: () => drawProp(ch, x, y, ox, oy) }); }));
  for (const m of monstersOnMap()) if (!run.dead.includes(m.key)) objs.push({ y: m.y, draw: () => drawChar(m.def.id, m.def.frame, m.def.frames, 0, m.x, m.y, ox, oy, 'idle') });
  objs.push({ y: run.y, draw: () => drawChar('player', 32, run.moving ? 6 : 4, run.dir, run.x, run.y, ox, oy, run.moving ? 'walk' : 'idle') });
  objs.sort((a, b) => a.y - b.y).forEach(o => o.draw());
}

function drawProp(ch, x, y, ox, oy) {
  let im = IMG[`props/${PROPS[ch]}`];
  if (ch === 'B') {   // bonfire acesa animada
    const s = IMG['anims/bonfire_burn'];
    if (s) { const f = Math.floor(animT * 10) % 8; g.drawImage(s, f * 64, 0, 64, 64, Math.round(x * T + 16 - 32 - ox), Math.round(y * T + 30 - 64 - oy), 64, 64); return; }
  }
  if (!im) return;
  g.drawImage(im, Math.round(x * T + 16 - im.width / 2 - ox), Math.round(y * T + 30 - im.height - oy));
}

function drawChar(id, fs, frames, row, x, y, ox, oy, anim) {
  const s = IMG[`anims/${id}_${anim}`]; if (!s) return;
  const f = Math.floor(animT * (anim === 'walk' ? 10 : 5)) % frames;
  g.drawImage(s, f * fs, row * fs, fs, fs, Math.round(x * T - fs / 2 - ox), Math.round(y * T - fs + 4 - oy), fs, fs);
}

function renderHUD() {
  $('hud').innerHTML = mode === 'explore' ? `<span class="hp">♥ ${run.hp}/${B.maxHP}</span><span class="coin">◆ ${run.coins} Almas</span><span>🎲 ${run.hand.length}/${B.handLimit}</span>` : '';
}

// ============================================================ batalha (§4)

let BT = null;
function startBattle(m) {
  mode = 'battle'; persist();   // §12: salva ao entrar em batalha
  BT = { m, hp: m.def.hp, turn: 0, weak: false, dice: run.hand.map(i => ({ ...run.bag[i], face: null, sel: false, rolling: 0 })), log: `${m.def.name} bloqueia o caminho.` };
  $('battle').classList.remove('hidden');
  newRound();
}
const intention = () => BT.m.def.pattern[BT.turn % BT.m.def.pattern.length];

function newRound() {
  BT.rerolls = B.rerollsPerRound; BT.spent = 0; BT.double = false;
  BT.dice.forEach(d => { d.sel = false; });
  rollDice(BT.dice);
}
function rollDice(list) {
  BT.busy = true;
  for (const d of list) { d.face = d.faces[Math.floor(Math.random() * d.faces.length)]; d.rolling = 0.55 + Math.random() * 0.2; d.sel = false; }
  renderBattle();
  setTimeout(() => { BT.busy = false; renderBattle(); }, 800);
}
const spellPoints = () => BT.dice.reduce((s, d) => s + (FACE_INFO[d.face].sp || 0), 0) - BT.spent;

function castSpell(id) {
  const sp = SPELLS.find(s => s.id === id);
  if (BT.busy || spellPoints() < sp.cost) return;
  BT.spent += sp.cost;
  if (id === 'potion') { run.hp = Math.min(B.maxHP, run.hp + 3); BT.log = 'Poção: +3 de HP.'; }
  if (id === 'reroll') { BT.rerolls++; BT.log = 'Re-rolar: +1 re-rolagem nesta rodada.'; }
  if (id === 'weak') { BT.weak = true; BT.log = `Fraqueza: ${BT.m.def.name} leva +1 por ataque até o fim.`; }
  if (id === 'double') { BT.double = true; BT.log = 'Golpe Duplo: ×2 ataques nesta rodada.'; }
  renderBattle();
}

function reroll() {
  const sel = BT.dice.filter(d => d.sel);
  if (BT.busy || !sel.length || BT.rerolls <= 0) return;
  BT.rerolls--; rollDice(sel);
}

// Resolução (§4.2): o jogador age primeiro; Parry antes da Esquiva; contra-ataque pode matar no meio.
function confirmRound() {
  if (BT.busy) return;
  const per = B.playerDamage + (BT.weak ? 1 : 0);
  let hits = BT.dice.reduce((s, d) => s + (FACE_INFO[d.face].hits || 0), 0);
  if (BT.double) hits *= 2;
  const lines = [];
  BT.hp = Math.max(0, BT.hp - hits * per);
  lines.push(`Você acerta ${hits}× (${hits * per} de dano).`);
  shake('foe');
  if (BT.hp <= 0) return endBattle(true, lines);
  const atks = intention();
  let parries = BT.dice.filter(d => d.face === 'parry').length, dodges = BT.dice.filter(d => d.face === 'dodge').length;
  let taken = 0, left = atks;
  while (left > 0 && parries > 0) { left--; parries--; BT.hp = Math.max(0, BT.hp - (B.parryDamage + (BT.weak ? 1 : 0))); lines.push('Parry! Contra-ataque.'); if (BT.hp <= 0) return endBattle(true, lines); }
  while (left > 0 && dodges > 0) { left--; dodges--; lines.push('Esquiva.'); }
  taken = left * BT.m.def.dmg;
  run.hp = Math.max(0, run.hp - taken);
  lines.push(left ? `${BT.m.def.name} acerta ${left}× (${taken} de dano).` : `${BT.m.def.name} não acerta nada.`);
  if (taken) shake('me');
  BT.log = lines.join(' ');
  if (run.hp <= 0) return endBattle(false, lines);
  BT.turn++;
  newRound();
}

function endBattle(won, lines) {
  BT.busy = true;
  BT.log = lines.join(' ');
  renderBattle();
  setTimeout(() => {
    $('battle').classList.add('hidden');
    if (!won) { wipe(); return showScreen('death'); }
    run.coins += BT.m.def.coins;
    run.dead.push(BT.m.key);
    if (BT.m.def.boss) { run.bossDead = true; wipe(); return showScreen('win'); }
    persist();   // §12: salva ao vencer
    mode = 'explore';
    toast(`${BT.m.def.name} derrotado: +${BT.m.def.coins} Almas`);
  }, 1100);
}

function shake(who) { const el = document.querySelector(`#battle .${who}`); if (el) { el.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 220 }); } }

function renderBattle() {
  const m = BT.m.def, it = intention();
  const sp = spellPoints();
  $('battle').innerHTML = `
    <div class="foe">
      <canvas id="foe-cv" width="${m.frame}" height="${m.frame}"></canvas>
      <div><h2>${m.name}</h2><div class="bar"><i style="width:${BT.hp / m.hp * 100}%"></i><span>${BT.hp}/${m.hp}</span></div>
        <div class="tags">${BT.weak ? 'Fraco (+1 por ataque)' : ''}</div><div class="log">${BT.log}</div></div>
      <div class="intent">Intenção<b>⚔ ×${it}</b>${m.dmg} de dano cada</div>
    </div>
    <div class="dice">${BT.dice.map((d, i) => `<button class="die${d.sel ? ' sel' : ''}" data-i="${i}" ${BT.busy ? 'disabled' : ''}><canvas width="48" height="48" data-die="${i}"></canvas><span>${d.rolling > 0 ? '...' : FACE_INFO[d.face].name}${d.sel ? ' ↻' : ''}</span></button>`).join('')}</div>
    <div class="me">
      <div><div class="stats"><span>♥ <b>${run.hp}/${B.maxHP}</b></span><span class="sp">✦ ${sp} pontos</span><span>↻ ${BT.rerolls}</span></div>
        <div class="spells">${run.spells.length ? run.spells.map(id => { const s = SPELLS.find(x => x.id === id); return `<button class="btn" data-sp="${id}" ${BT.busy || sp < s.cost ? 'disabled' : ''}>${s.name} ✦${s.cost}</button>`; }).join('') : '<span class="note">Sem feitiços (aprenda na bonfire)</span>'}</div></div>
      <div class="actions"><button class="btn" id="b-reroll" ${BT.busy || BT.rerolls <= 0 || !BT.dice.some(d => d.sel) ? 'disabled' : ''}>Re-rolar marcados</button><button class="btn gold" id="b-ok" ${BT.busy ? 'disabled' : ''}>Confirmar</button></div>
    </div>`;
  $('battle').querySelectorAll('.die').forEach(b => b.onclick = () => { if (BT.busy) return; const d = BT.dice[+b.dataset.i]; d.sel = !d.sel; renderBattle(); });
  $('battle').querySelectorAll('[data-sp]').forEach(b => b.onclick = () => castSpell(b.dataset.sp));
  $('b-reroll').onclick = reroll; $('b-ok').onclick = confirmRound;
}

// Desenho por quadro dos dados (animação de girar, §10) e do monstro na cena de batalha.
function drawBattle(dt) {
  if (!BT) return;
  for (const c of document.querySelectorAll('#battle [data-die]')) {
    const d = BT.dice[+c.dataset.die], cg = c.getContext('2d'); cg.imageSmoothingEnabled = false; cg.clearRect(0, 0, 48, 48);
    if (d.rolling > 0) {
      d.rolling -= dt;
      const s = IMG[`anims/die-${d.type}_roll`], f = Math.floor(animT * 16) % 8;
      if (s) cg.drawImage(s, f * 48, 0, 48, 48, 0, 0, 48, 48);
      if (d.rolling <= 0) { const sp = c.nextElementSibling; if (sp) sp.textContent = FACE_INFO[d.face].name + (d.sel ? ' ↻' : ''); }
    } else {
      const im = faceImg(d.type, d.face); if (im.complete) cg.drawImage(im, 0, 0);
    }
  }
  const fc = document.getElementById('foe-cv');
  if (fc) {
    const m = BT.m.def, s = IMG[`anims/${m.id}_idle`], fg = fc.getContext('2d'); fg.imageSmoothingEnabled = false;
    fg.clearRect(0, 0, m.frame, m.frame);
    if (s) fg.drawImage(s, (Math.floor(animT * 6) % m.frames) * m.frame, 0, m.frame, m.frame, 0, 0, m.frame, m.frame);
  }
}
const faceCache = {};
function faceImg(type, face) { const k = type + face; if (!faceCache[k]) { const im = new Image(); im.src = faceSrc(type, face); faceCache[k] = im; } return faceCache[k]; }

// ============================================================ bonfire (§7)

let bfTab = 'rest', forge = { type: 'attack', faces: [...FACES.attack] };
function openBonfire() { mode = 'bonfire'; bfTab = 'rest'; renderBonfire(); $('bonfire').classList.remove('hidden'); }
function closeBonfire() { $('bonfire').classList.add('hidden'); mode = 'explore'; persist(); }

function renderBonfire() {
  const tabs = [['rest', 'Descansar'], ['spells', 'Feitiços'], ['forge', 'Forja'], ['hand', `Dados (${run.hand.length}/${B.handLimit})`]];
  let body = '';
  if (bfTab === 'rest') body = `<p style="font-size:22px">Descansar recupera todo o HP (${run.hp}/${B.maxHP}) e faz os monstros comuns renascerem. O chefe não volta.</p>
      <button class="btn gold" id="rest">Descansar</button>`;
  if (bfTab === 'spells') body = `<div class="list">${SPELLS.map(s => {
      const known = run.spells.includes(s.id);
      return `<div class="item"><span class="grow">${s.name} <small>✦${s.cost} · ${s.desc}</small></span>${known ? '<small>aprendido</small>' : `<button class="btn" data-learn="${s.id}" ${run.coins < s.price ? 'disabled' : ''}>◆ ${s.price}</button>`}</div>`;
    }).join('')}</div>`;
  if (bfTab === 'forge') {
    const price = forgePrice(forge.faces);
    body = `<div class="tabs">${Object.keys(FACES).map(t => `<button class="btn ${forge.type === t ? 'on' : ''}" data-ftype="${t}">${TYPE_NAME[t]}</button>`).join('')}</div>
      <div>${forge.faces.map((f, i) => `<span class="slot"><img src="${faceSrc(forge.type, f)}"><select data-slot="${i}">${FACES[forge.type].map(o => `<option value="${o}" ${o === f ? 'selected' : ''}>${FACE_INFO[o].name}</option>`).join('')}</select></span>`).join('')}</div>
      <p class="note">Mesmo número de faces do dado padrão, só faces do próprio tipo. Preço = 5 + 3 × soma do valor de forja (Miss 0, Esquiva 1, Parry 2, demais pelo número, Crítico 3).</p>
      <button class="btn gold" id="do-forge" ${run.coins < price ? 'disabled' : ''}>Forjar por ◆ ${price}</button>`;
  }
  if (bfTab === 'hand') body = `<p class="note">Escolha até ${B.handLimit} dados para levar às batalhas (pelo menos 1).</p><div class="list">${run.bag.map((d, i) => {
      const inHand = run.hand.includes(i);
      return `<div class="item"><span>${TYPE_NAME[d.type]}</span><span class="faces grow">${d.faces.map(f => `<img src="${faceSrc(d.type, f)}" title="${FACE_INFO[f].name}">`).join('')}</span>
        <button class="btn ${inHand ? 'gold' : ''}" data-hand="${i}" ${(!inHand && run.hand.length >= B.handLimit) || (inHand && run.hand.length <= 1) ? 'disabled' : ''}>${inHand ? 'Na mão' : 'Levar'}</button></div>`;
    }).join('')}</div>`;
  $('bonfire').innerHTML = `<div class="card"><h2>Bonfire</h2><div class="note">◆ ${run.coins} Almas · ♥ ${run.hp}/${B.maxHP}</div>
    <div class="tabs">${tabs.map(([k, n]) => `<button class="btn ${bfTab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}<button class="btn red" id="leave" style="margin-left:auto">Sair</button></div>${body}</div>`;
  const q = s => $('bonfire').querySelectorAll(s);
  q('[data-tab]').forEach(b => b.onclick = () => { bfTab = b.dataset.tab; renderBonfire(); });
  $('leave').onclick = closeBonfire;
  if ($('rest')) $('rest').onclick = () => { run.hp = B.maxHP; run.dead = run.dead.filter(k => { const [x, y] = k.split(',').map(Number); return MONSTERS[cellAt(x, y)].boss; }); persist(); toast('Você descansa. Os monstros voltam.'); renderBonfire(); };
  q('[data-learn]').forEach(b => b.onclick = () => { const s = SPELLS.find(x => x.id === b.dataset.learn); if (run.coins < s.price) return; run.coins -= s.price; run.spells.push(s.id); persist(); renderBonfire(); });
  q('[data-ftype]').forEach(b => b.onclick = () => { forge = { type: b.dataset.ftype, faces: [...FACES[b.dataset.ftype]] }; renderBonfire(); });
  q('[data-slot]').forEach(s => s.onchange = () => { forge.faces[+s.dataset.slot] = s.value; renderBonfire(); });
  if ($('do-forge')) $('do-forge').onclick = () => {
    const price = forgePrice(forge.faces); if (run.coins < price) return;
    run.coins -= price; run.bag.push({ type: forge.type, faces: [...forge.faces] });
    if (run.hand.length < B.handLimit) run.hand.push(run.bag.length - 1);
    persist(); toast(`Dado de ${TYPE_NAME[forge.type]} forjado`); bfTab = 'hand'; renderBonfire();
  };
  q('[data-hand]').forEach(b => b.onclick = () => {
    const i = +b.dataset.hand, k = run.hand.indexOf(i);
    if (k >= 0) { if (run.hand.length > 1) run.hand.splice(k, 1); } else if (run.hand.length < B.handLimit) run.hand.push(i);
    persist(); renderBonfire();
  });
}

// ============================================================ telas de título / morte / vitória

function showScreen(kind) {
  mode = 'title';
  const s = $('screen'), saved = loadRun();
  if (kind === 'title') s.innerHTML = `<div class="card"><h2>CRAFT DICE</h2><p>Ande com WASD/setas (ou arraste no celular). Encoste num monstro para lutar e numa bonfire para descansar, aprender feitiços e forjar dados.</p><p class="note">Morrer apaga a run inteira.</p>
    <div class="row">${saved ? '<button class="btn gold" id="cont">Continuar run</button>' : ''}<button class="btn" id="new">Nova run</button></div></div>`;
  if (kind === 'death') s.innerHTML = `<div class="card"><h2 style="color:#ff7070">VOCÊ MORREU</h2><p>Dados, feitiços e Almas se foram. A run recomeça do zero.</p><div class="row"><button class="btn gold" id="new">Nova run</button></div></div>`;
  if (kind === 'win') s.innerHTML = `<div class="card"><h2>VITÓRIA</h2><p>O Cavaleiro Caído tombou. A run termina com ${run.coins} Almas.</p><div class="row"><button class="btn gold" id="new">Nova run</button></div></div>`;
  s.classList.remove('hidden');
  const start = r => { run = r; persist(); s.classList.add('hidden'); mode = 'explore'; nearBonfire = true; cam = { x: run.x * T - VW / 2, y: run.y * T - VH / 2 }; };
  if ($('cont')) $('cont').onclick = () => { start(saved); const m = monstersOnMap().find(m => !run.dead.includes(m.key) && Math.hypot(m.x - run.x, m.y - run.y) < 0.75); if (m) startBattle(m); };
  $('new').onclick = () => start(newRun());
}

// ============================================================ entrada

addEventListener('keydown', e => { keys.add(e.key.toLowerCase()); if (e.key === 'Escape' && mode === 'bonfire') closeBonfire(); });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
const toApp = e => { const r = $('app').getBoundingClientRect(); return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }; };
$('map').addEventListener('pointerdown', e => {   // joystick virtual: aparece onde o dedo encosta
  if (mode !== 'explore') return;
  const p = toApp(e); Object.assign(stick, { on: true, id: e.pointerId, cx: p.x, cy: p.y, dx: 0, dy: 0 });
  const el = $('stick'); el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; el.classList.remove('hidden'); el.firstElementChild.style.transform = '';
});
addEventListener('pointermove', e => {
  if (!stick.on || e.pointerId !== stick.id) return;
  const p = toApp(e), dx = p.x - stick.cx, dy = p.y - stick.cy, l = Math.hypot(dx, dy), k = Math.min(1, l / 50);
  stick.dx = l ? dx / l * k : 0; stick.dy = l ? dy / l * k : 0;
  $('stick').firstElementChild.style.transform = `translate(${stick.dx * 36}px, ${stick.dy * 36}px)`;
});
addEventListener('pointerup', e => { if (e.pointerId === stick.id) { stick.on = false; stick.dx = stick.dy = 0; $('stick').classList.add('hidden'); } });

// ============================================================ laço

let scale = 1;
function fit() {
  scale = Math.min(innerWidth / 960, innerHeight / 540);
  const a = $('app'); a.style.transform = `scale(${scale})`;
  a.style.left = `${(innerWidth - 960 * scale) / 2}px`; a.style.top = `${(innerHeight - 540 * scale) / 2}px`;
}
let last = 0;
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t; animT += dt;
  if (mode === 'explore') updateExplore(dt);
  if (run) drawMap(); else { g.fillStyle = '#1a0d2e'; g.fillRect(0, 0, VW, VH); }
  if (mode === 'battle') drawBattle(dt);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.add('hidden'); }
  renderHUD();
  requestAnimationFrame(frame);
}

async function boot() {
  const ks = ['tiles/area1-void-ground', 'anims/bonfire_burn', 'anims/player_idle', 'anims/player_walk', 'anims/die-attack_roll', 'anims/die-defense_roll', 'anims/die-spell_roll'];
  Object.values(PROPS).forEach(p => ks.push(`props/${p}`));
  Object.values(MONSTERS).forEach(m => ks.push(`anims/${m.id}_idle`));
  await loadImages(ks);
  Object.entries(FACES).forEach(([t, fs]) => fs.forEach(f => faceImg(t, f)));
  addEventListener('resize', fit); fit();
  if (DEV.has('rich')) { const r = loadRun() || newRun(); r.coins += 300; run = r; persist(); }
  if (DEV.has('go')) { run = loadRun() || newRun(); persist(); mode = 'explore'; nearBonfire = true; cam = { x: run.x * T - VW / 2, y: run.y * T - VH / 2 }; }
  else showScreen('title');
  requestAnimationFrame(frame);
}
boot();
