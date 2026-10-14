// DiceAndBlood — protótipo jogável em JavaScript puro.
// Segue a Parte 1 do DiceAndBlood.md com os placeholders de MVP do guia Unity: tabuleiro 8×8 (§2.1), alcance de
// movimento por dado (§2.2), ataque por roll-under em 1d20 contra Ataque − Defesa efetiva (§2.3) e Parry como
// ação que ocupa o turno (§2.4). Por cima disso o protótipo testa propostas que no GDD seguem "Em aberto":
// turno "mover e depois atacar", "Sangrar" (pagar vida para rolar um dado de novo), IA diferente por monstro,
// run de 7 salas com recompensa entre elas, crítico/falha no d20, chance de acerto visível, som e tremor.
// Arte: Sprites/DiceAndBlood/.
'use strict';

const ART = '../../Sprites/DiceAndBlood/';
const N = 8;                  // tabuleiro 8×8 (§2.1)
const CELL = 64;              // casa de 32 px desenhada em 2×
const REC_KEY = 'diceandblood-records-v2';
const SND_KEY = 'diceandblood-sound';
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));

// ============================================================ regras (placeholders do protótipo, todos "Em aberto")

// Sangrar: o herói paga vida para rolar de novo o dado de movimento (antes de andar) ou o d20 de um ataque errado.
// O custo começa em `bleedCost` e sobe 1 a cada uso no mesmo turno: na simulação, custo fixo 2 fazia sangrar
// nunca valer a pena e custo fixo 1 fazia sangrar sempre valer; crescente premia usar com critério.
// Nunca pode matar: só aparece se sobrar pelo menos 1 de vida.
const RULES = { attackDie: 20, parryBonus: 3, bleedCost: 1, critMult: 2, thirstHeal: 2, restHeal: 3 };

// Atributos e comportamento por tipo (Parte 7 §5.1 deixa a IA por tipo em aberto; aqui cada um tem a sua):
// muralha = persegue devagar (d4) e aguenta; covarde = foge com pouca vida; rasante = voa por cima de tudo,
// ataca e recua 2 casas no mesmo turno.
const KINDS = {
  heroi:     { name: 'Cavaleiro',     img: 'chars/heroi_cavaleiro', vida: 22, atq: 14, def: 2, dano: 4, mov: 6, side: 'P', sangue: '#8d1420' },
  esqueleto: { name: 'Esqueleto',     img: 'monsters/esqueleto',    vida: 7,  atq: 10, def: 3, dano: 2, mov: 4, side: 'E', ai: 'muralha', sangue: '#bfb6a2' },
  goblin:    { name: 'Goblin',        img: 'monsters/goblin',       vida: 5,  atq: 10, def: 1, dano: 2, mov: 6, side: 'E', ai: 'covarde', sangue: '#4f7a25' },
  morcego:   { name: 'Morcego',       img: 'monsters/morcego',      vida: 3,  atq: 9,  def: 4, dano: 2, mov: 6, side: 'E', ai: 'rasante', sangue: '#8d1420', voa: true },
  rei:       { name: 'Rei Esqueleto', img: 'monsters/esqueleto',    vida: 16, atq: 12, def: 3, dano: 3, mov: 4, side: 'E', ai: 'muralha', sangue: '#bfb6a2', chefe: true },
};

// 7 salas fixas (§8: sem geração procedural). '#' pedra, H herói, e/g/m monstros, R chefe.
const ROOMS = [
  { nome: 'Entrada da masmorra', mapa: [
    '..e.....',
    '........',
    '..#..#..',
    '........',
    '.#....g.',
    '....#...',
    '........',
    '...H....'] },
  { nome: 'Corredor das pedras', mapa: [
    '.e....g.',
    '........',
    '..#..m..',
    '.....#..',
    '.#......',
    '....#...',
    '........',
    '...H....'] },
  { nome: 'Toca dos goblins', mapa: [
    'g......g',
    '..#..#..',
    '........',
    '...m....',
    '.#....#.',
    '........',
    '..#..#..',
    '....H...'] },
  { nome: 'Ossuário', mapa: [
    '.e....e.',
    '...##...',
    '.m......',
    '......g.',
    '.#..#...',
    '........',
    '.....#..',
    '..H.....'] },
  { nome: 'Ninho de morcegos', mapa: [
    'm..##..m',
    '........',
    '.g....g.',
    '..#..#..',
    '........',
    '.#....#.',
    '........',
    '...H....'] },
  { nome: 'Salão da guarda', mapa: [
    'e.m..m.e',
    '...#....',
    '..#...#.',
    '....g...',
    '.#......',
    '.....#..',
    '..#.....',
    '....H...'] },
  { nome: 'Trono do Rei Esqueleto', mapa: [
    '#..R...#',
    '..e..e..',
    '.#....#.',
    '........',
    '...##...',
    '........',
    '.#....#.',
    '...H....'] },
];
const CODES = { e: 'esqueleto', g: 'goblin', m: 'morcego', R: 'rei' };

// Recompensas entre salas: o herói escolhe 1 de 3. "Ataduras" sempre aparece; as outras duas são sorteadas.
const REWARDS = [
  { id: 'cura',   nome: 'Ataduras',         desc: 'Cura 8 de vida.',                          aplicar: h => { h.vida = Math.min(h.max, h.vida + 8); } },
  { id: 'vigor',  nome: 'Coração de ferro', desc: '+4 de vida máxima e cura 4.',              aplicar: h => { h.max += 4; h.vida += 4; } },
  { id: 'mira',   nome: 'Olho treinado',    desc: '+2 de Ataque (+10% de acerto).',           aplicar: h => { h.atq += 2; } },
  { id: 'lamina', nome: 'Lâmina afiada',    desc: '+1 de dano por golpe.',                    aplicar: h => { h.dano++; } },
  { id: 'escudo', nome: 'Escudo reforçado', desc: '+1 de Defesa.',                            aplicar: h => { h.def++; } },
  { id: 'postura', nome: 'Postura firme',   desc: 'O Parry dá +2 de Defesa a mais.',          aplicar: h => { h.parryBonus += 2; } },
  { id: 'pacto',  nome: 'Pacto de sangue',  desc: 'O custo do Sangrar não sobe no turno.',   ok: h => !h.pacto, aplicar: h => { h.pacto = true; } },
  { id: 'botas',  nome: 'Botas velozes',    desc: 'O movimento passa a ser d8.',              ok: h => h.mov < 8, aplicar: h => { h.mov = 8; } },
  { id: 'sede',   nome: 'Sede de sangue',   desc: `Cura ${RULES.thirstHeal} a cada monstro morto.`, ok: h => !h.sede, aplicar: h => { h.sede = true; } },
];

// ============================================================ arte

const IMG = {};
function loadImages() {
  const names = ['tiles/chao_pedra', 'tiles/pedra_obstaculo', 'ui/dado_icone',
    ...[1, 2, 3, 4, 5, 6].map(n => 'ui/dado_' + n), ...new Set(Object.values(KINDS).map(k => k.img))];
  return Promise.all(names.map(n => new Promise(res => {
    const im = new Image();
    im.onload = res; im.onerror = res;
    im.src = ART + n + '.png';
    IMG[n] = im;
  })));
}

// ============================================================ som (sintetizado, sem arquivos)

let AC = null;
let soundOn = (() => { try { return localStorage.getItem(SND_KEY) !== 'off'; } catch (e) { return true; } })();

function tone(freq, dur, type = 'square', vol = 0.12, slideTo = null, delay = 0) {
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur);
}
function noise(dur, vol = 0.1, cutoff = 2000) {
  const len = Math.floor(AC.sampleRate * dur), buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = buf; f.type = 'lowpass'; f.frequency.value = cutoff; g.gain.value = vol;
  s.connect(f).connect(g).connect(AC.destination); s.start();
}
function sfx(type) {
  if (!soundOn) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    if (type === 'tick') noise(0.03, 0.12, 3500);
    else if (type === 'step') noise(0.04, 0.05, 700);
    else if (type === 'hit') { tone(140, 0.18, 'square', 0.18, 50); noise(0.12, 0.15, 1200); }
    else if (type === 'crit') { tone(140, 0.2, 'square', 0.2, 45); noise(0.18, 0.2, 1800); tone(660, 0.12, 'square', 0.08, 990, 0.05); }
    else if (type === 'miss') tone(520, 0.15, 'sine', 0.08, 180);
    else if (type === 'die') { tone(220, 0.5, 'sawtooth', 0.12, 35); noise(0.3, 0.1, 500); }
    else if (type === 'bleed') { tone(95, 0.28, 'triangle', 0.25, 55); noise(0.2, 0.12, 400); }
    else if (type === 'parry') { tone(900, 0.08, 'triangle', 0.12); tone(1350, 0.12, 'triangle', 0.08, null, 0.05); }
    else if (type === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.07, null, i * 0.1));
    else if (type === 'lose') [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, null, i * 0.18));
  } catch (e) {}
}

// ============================================================ estado

const $ = id => document.getElementById(id);
const cv = $('board'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

let units = [], rocks = new Set();
let hero = null;
let room = 0;                 // índice da sala atual (0–6)
let turn = 0;                 // turnos somados na run inteira
let phase = 'title';          // title · busy · player · choice · over
let range = 0;                // alcance rolado neste turno
let moved = false;            // o herói já andou neste turno (agora só pode atacar ou encerrar)
let reach = new Map();        // casa alcançável → casa anterior no caminho
let active = null;            // unidade da vez (marcador dourado)
let hover = null;
let floats = [], stains = [];
let shake = { t0: 0, amp: 0 };

const key = (x, y) => x + ',' + y;
const unkey = k => k.split(',').map(Number);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const roll = sides => 1 + Math.floor(Math.random() * sides);
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const enemies = () => units.filter(u => u.side === 'E' && u.vida > 0);
const unitAt = (x, y) => units.find(u => u.vida > 0 && u.x === x && u.y === y);
const inBounds = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
const blocked = (x, y) => rocks.has(key(x, y)) || !!unitAt(x, y);
const targets = () => enemies().filter(e => dist(e, hero) === 1);

function makeUnit(kind, x, y) {
  const k = KINDS[kind];
  return { kind, ...k, max: k.vida, x, y, parry: 0, ox: 0, oy: 0, flash: 0 };
}

function newRun() {
  hero = makeUnit('heroi', 0, 0);
  Object.assign(hero, { parryBonus: RULES.parryBonus, pacto: false, sede: false, bleeds: 0 });
  if (DEV.has('god')) hero.vida = hero.max = 99;
  turn = 0;
  const sala = [...DEV].find(d => /^sala\d$/.test(d));
  room = sala ? Math.min(ROOMS.length, +sala.slice(4)) - 1 : 0;
  $('log').innerHTML = '';
}

function loadRoom(i) {
  room = i;
  units = [hero]; rocks = new Set(); floats = []; stains = [];
  hero.parry = 0;
  ROOMS[i].mapa.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '#') rocks.add(key(x, y));
    if (c === 'H') { hero.x = x; hero.y = y; }
    if (CODES[c]) units.push(makeUnit(CODES[c], x, y));
  }));
  if (DEV.has('weak')) enemies().forEach(u => { u.vida = u.max = 1; });
  log(`Sala ${i + 1}/${ROOMS.length}: ${ROOMS[i].nome}. ${enemies().length} monstros.`);
  hud();
}

// ============================================================ movimento (Parte 5: flood fill ortogonal)

// Casas alcançáveis com até `steps` passos. Guarda de onde veio cada casa para a unidade andar casa a casa pelo
// caminho. Quem voa passa por cima de pedras e unidades, mas só pode parar numa casa livre (ver `free`).
function reachable(u, steps, fly = false) {
  const from = new Map([[key(u.x, u.y), null]]);
  const cost = new Map([[key(u.x, u.y), 0]]);
  const queue = [[u.x, u.y]];
  while (queue.length) {
    const [x, y] = queue.shift();
    const c = cost.get(key(x, y));
    if (c >= steps) continue;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (!inBounds(nx, ny) || cost.has(k) || (!fly && blocked(nx, ny))) continue;
      cost.set(k, c + 1); from.set(k, key(x, y)); queue.push([nx, ny]);
    }
  }
  from.delete(key(u.x, u.y));
  return from;
}
const free = k => !blocked(...unkey(k));

function pathTo(map, target) {
  const path = [];
  for (let k = target; k && map.has(k); k = map.get(k)) path.unshift(unkey(k));
  return path;
}

// Destino de um monstro: a casa livre mais perto do herói ('perto') ou mais longe ('longe'), sorteando entre
// empates para os monstros não andarem sempre em fila. Só vale se melhorar a distância atual.
function pickDest(from, how, u) {
  let best = [], bestD = dist(u, hero);
  for (const k of from.keys()) {
    if (!free(k)) continue;
    const [x, y] = unkey(k), d = dist({ x, y }, hero);
    if (how === 'perto' ? d < bestD : d > bestD) { bestD = d; best = [k]; }
    else if (d === bestD && best.length) best.push(k);
  }
  return best.length ? best[Math.floor(Math.random() * best.length)] : null;
}

async function walk(u, path) {
  for (const [x, y] of path) {
    const sx = (u.x - x) * CELL, sy = (u.y - y) * CELL;
    u.x = x; u.y = y;
    sfx('step');
    for (let t = 0; t <= 1; t += 0.2) { u.ox = sx * (1 - t); u.oy = sy * (1 - t) - Math.sin(t * Math.PI) * 6; await sleep(22); }
    u.ox = u.oy = 0;
  }
}

// ============================================================ rolagens com feedback visível (§5)

// O d6 usa as faces desenhadas (ui/dado_N.png); d4 e d8 não têm arte e aparecem como dado de texto.
async function rollMove(u) {
  const sides = u.mov, img = $('d6'), txt = $('dn'), useImg = sides === 6;
  img.classList.toggle('hidden', !useImg); txt.classList.toggle('hidden', useImg);
  txt.dataset.sides = sides;
  $('movlabel').textContent = `Movimento (d${sides})`;
  const show = n => { if (useImg) img.src = ART + 'ui/dado_' + n + '.png'; else txt.textContent = n; };
  const el = useImg ? img : txt;
  el.classList.add('spin');
  setRollText(`${u.name} rola o d${sides} de movimento…`);
  const spins = u === hero ? 9 : 6;
  for (let i = 0; i < spins; i++) { show(roll(sides)); sfx('tick'); await sleep(55 + i * 8); }
  const r = roll(sides);
  show(r);
  el.classList.remove('spin');
  return r;
}

// Roll-under (§2.3): acerta se o d20 sair igual ou menor que Ataque − Defesa efetiva do alvo (mínimo 1).
// Proposta do protótipo para o crítico/falha (§3, em aberto): 1 natural sempre acerta com dano dobrado,
// 20 natural sempre erra.
const attackTarget = (a, d) => Math.max(1, a.atq - (d.def + d.parry));
const hitChance = (a, d) => 5 * (1 + Math.max(0, Math.min(attackTarget(a, d), 19) - 1));

async function attack(a, d) {
  const d20 = $('d20');
  for (;;) {
    const target = attackTarget(a, d);
    d20.className = 'spin';
    setRollText(`${a.name} ataca ${d.name}: precisa de <b>≤ ${target}</b> no d20 (${hitChance(a, d)}%)…`);
    for (let i = 0; i < 10; i++) { d20.textContent = roll(RULES.attackDie); sfx('tick'); await sleep(45 + i * 7); }
    const r = roll(RULES.attackDie), crit = r === 1, fumble = r === RULES.attackDie;
    const hit = crit || (!fumble && r <= target);
    d20.textContent = r;
    d20.className = crit ? 'crit' : hit ? 'hit' : 'miss';
    // Investida: a unidade avança meio passo na direção do alvo e volta.
    const dx = Math.sign(d.x - a.x), dy = Math.sign(d.y - a.y);
    for (let t = 0; t <= 1; t += 0.25) { a.ox = dx * 18 * Math.sin(t * Math.PI); a.oy = dy * 18 * Math.sin(t * Math.PI); await sleep(20); }
    a.ox = a.oy = 0;

    if (!hit) {
      const why = fumble ? 'FALHA (20 natural)' : 'Errou';
      const txt = `${a.name} rolou ${r} (alvo ≤ ${target}) — ${why}`;
      log(txt + (d.parry ? ' (Parry)' : ''));
      float(d, fumble ? 'falha!' : 'errou', '#9198ab');
      sfx('miss');
      // Sangrar: o herói pode pagar vida para rolar o mesmo ataque de novo.
      if (a === hero && hero.vida > bleedCost()) {
        const c = await choose(`${txt}. <b>Sangrar ${bleedCost()}</b> de vida para rolar o d20 de novo?`, [
          { id: 'sangrar', label: `Sangrar −${bleedCost()}`, cls: 'red' },
          { id: 'aceitar', label: 'Aceitar' },
        ]);
        if (c === 'sangrar') { pay(hero, 'para rolar o ataque de novo'); await sleep(250); continue; }
      } else setRollText(txt);
      await sleep(350);
      return;
    }

    const dmg = a.dano * (crit ? RULES.critMult : 1);
    const txt = `${a.name} rolou ${r} (alvo ≤ ${target}) — ${crit ? 'CRÍTICO!' : 'Acertou!'} −${dmg}`;
    setRollText(`<b>${txt}</b>`);
    log(txt);
    d.vida = Math.max(0, d.vida - dmg);
    d.flash = performance.now();
    float(d, (crit ? 'CRÍTICO −' : '-') + dmg, crit ? '#f2c94c' : '#ff6b6b');
    splat(d, crit ? 1.4 : 0.8);
    shake = { t0: performance.now(), amp: d === hero ? 9 : crit ? 7 : 4 };
    sfx(crit ? 'crit' : 'hit');
    if (d.vida === 0) {
      log(`${d.name} caiu.`);
      float(d, d.side === 'P' ? 'MORTO' : 'X', '#f2c94c');
      splat(d, 2);
      sfx('die');
      if (a === hero && hero.sede) {
        const cura = Math.min(RULES.thirstHeal, hero.max - hero.vida);
        if (cura) { hero.vida += cura; float(hero, '+' + cura, '#4cc36a'); log(`Sede de sangue: +${cura} de vida.`); }
      }
    }
    hud();
    await sleep(450);
    return;
  }
}

// Paga o custo de Sangrar: tira vida do herói e deixa a mancha no chão. O próximo Sangrar do turno custa 1 a mais.
const bleedCost = () => RULES.bleedCost + (hero.pacto ? 0 : hero.bleeds);
function pay(u, why) {
  const n = bleedCost();
  hero.bleeds++;
  u.vida -= n;
  float(u, '−' + n, '#ff6b6b');
  splat(u, 0.6);
  sfx('bleed');
  log(`${u.name} sangra ${n} ${why}.`);
  hud();
}

function setRollText(html) { $('rolltext').innerHTML = html; }
function float(u, text, color) { floats.push({ x: u.x, y: u.y, text, color, t0: performance.now() }); }
function log(text) {
  const li = document.createElement('li');
  li.textContent = text;
  const ol = $('log');
  ol.prepend(li);
  while (ol.children.length > 40) ol.lastChild.remove();
}

// Mancha de sangue no chão (some ao trocar de sala). Esqueletos soltam pó de osso, goblins sangue verde.
function splat(u, size) {
  const drops = [];
  const n = 3 + Math.round(size * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 18 * size;
    drops.push({ dx: Math.cos(a) * r, dy: Math.sin(a) * r * 0.6, r: 2 + Math.random() * 5 * size });
  }
  stains.push({ x: u.x, y: u.y, color: u.sangue, drops });
  if (stains.length > 60) stains.shift();
}

// ============================================================ botões de ação

// Os botões mudam conforme o momento do turno; `choose` mostra uma pergunta e espera o toque.
function setActions(list) {
  const nav = $('actions');
  nav.innerHTML = '';
  for (const a of list) {
    const b = document.createElement('button');
    b.className = 'btn ' + (a.cls || '');
    b.innerHTML = a.label;
    b.disabled = !!a.disabled;
    b.onclick = () => { if (phase === 'player' || phase === 'choice') a.run(); };
    nav.appendChild(b);
  }
}

function choose(html, opts) {
  return new Promise(res => {
    setRollText(html);
    phase = 'choice';
    setActions(opts.map(o => ({ ...o, run: () => { phase = 'busy'; setActions([]); res(o.id); } })));
  });
}

function busy() { phase = 'busy'; setActions([]); }

// ============================================================ turno do herói
// Proposta "mover e depois agir": rola o dado de movimento, anda (se quiser) e então ataca um vizinho.
// O Parry continua ocupando o turno inteiro, como manda a §2.4 (no lugar de mover ou atacar).

async function heroTurn() {
  if (phase === 'over') return;
  turn++;
  hero.parry = 0;                 // o bônus de Parry acaba quando a vez de quem o usou volta (Parte 6 §4.2)
  moved = false;
  hero.bleeds = 0;
  active = hero; busy();
  hud();
  range = await rollMove(hero);
  offerTurn();
}

function offerTurn() {
  reach = moved ? new Map() : reachable(hero, range);
  const tgt = targets();
  if (moved && !tgt.length) return endHeroTurn();
  phase = 'player';
  if (!moved) {
    setRollText(`Alcance: <em>${range} ${range === 1 ? 'casa' : 'casas'}</em>. Toque numa casa <em>azul</em> para andar`
      + (tgt.length ? ' ou num monstro <b>vermelho</b> para atacar' : ' e depois ataque um vizinho') + '.');
    setActions([
      { label: 'Parry', cls: 'blue', run: heroParry },
      { label: `Sangrar −${bleedCost()}`, cls: 'red', disabled: hero.vida <= bleedCost(), run: bleedMove },
      { label: 'Esperar', run: endHeroTurn },
    ]);
  } else {
    setRollText('Toque num monstro <b>vermelho</b> para atacar, ou encerre o turno.');
    setActions([{ label: 'Encerrar turno', run: endHeroTurn }]);
  }
}

async function bleedMove() {
  busy();
  pay(hero, 'para rolar o movimento de novo');
  range = await rollMove(hero);
  offerTurn();
}

async function heroMove(cell) {
  busy();
  const path = pathTo(reach, key(cell.x, cell.y));
  reach = new Map();
  await walk(hero, path);
  log(`Cavaleiro andou ${path.length} de ${range} ${range === 1 ? 'casa' : 'casas'}.`);
  moved = true;
  offerTurn();
}

async function heroAttack(foe) {
  busy();
  reach = new Map();
  await attack(hero, foe);
  endHeroTurn();
}

async function heroParry() {
  busy();
  hero.parry = hero.parryBonus;
  float(hero, '+' + hero.parry + ' DEF', '#9cc0ff');
  sfx('parry');
  log(`Cavaleiro ergue o escudo: Defesa ${hero.def} → ${hero.def + hero.parry} até o próximo turno.`);
  setRollText(`<em>Parry:</em> Defesa ${hero.def + hero.parry} até o seu próximo turno.`);
  hud();
  await sleep(500);
  endHeroTurn();
}

function endHeroTurn() {
  busy();
  reach = new Map();
  if (!enemies().length) return roomCleared();
  enemyPhase();
}

// ============================================================ turno dos monstros (IA por tipo)

async function enemyPhase() {
  for (const e of enemies()) {
    if (hero.vida <= 0) break;
    active = e;
    await sleep(200);
    await monsterTurn(e);
  }
  active = null;
  if (hero.vida <= 0) return endRun(false);
  heroTurn();
}

// Todos andam e depois atacam se ficarem ao lado do herói (a mesma regra de "mover e agir" do herói).
async function monsterTurn(e) {
  const fleeing = e.ai === 'covarde' && e.vida <= 2;
  if (!fleeing && !e.voa && dist(e, hero) === 1) return attack(e, hero);
  const r = await rollMove(e);
  const from = reachable(e, r, e.voa);
  const dest = pickDest(from, fleeing ? 'longe' : 'perto', e);
  setRollText(`${e.name} tirou ${r} e ${dest ? (fleeing ? 'foge!' : e.voa ? 'voa até você.' : 'avança.') : 'fica parado.'}`);
  if (fleeing && dest) log(`${e.name} está ferido e foge.`);
  if (dest) await walk(e, pathTo(from, dest));
  await sleep(120);
  if (dist(e, hero) !== 1) return;
  await attack(e, hero);
  // Rasante: depois de atacar, o morcego recua 2 casas voando.
  if (e.ai === 'rasante' && e.vida > 0 && hero.vida > 0) {
    const back = reachable(e, 2, true), k = pickDest(back, 'longe', e);
    if (k) { log(`${e.name} recua no escuro.`); await walk(e, pathTo(back, k)); }
  }
}

// ============================================================ fim de sala, recompensas e fim de run

async function roomCleared() {
  busy(); active = null;
  sfx('win');
  log(`Sala ${room + 1} limpa!`);
  setRollText(`<em>Sala ${room + 1} limpa!</em>`);
  await sleep(700);
  if (room === ROOMS.length - 1) return endRun(true);
  offerRewards();
}

// Ao descer para a próxima sala o herói recupera um pouco de vida, e então escolhe 1 de 3 recompensas.
function offerRewards() {
  hero.vida = Math.min(hero.max, hero.vida + RULES.restHeal);
  hud();
  const pool = REWARDS.filter(r => r.id !== 'cura' && (!r.ok || r.ok(hero)));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const opts = [REWARDS[0], ...pool.slice(0, 2)];
  screen(`<h2>Sala ${room + 1}/${ROOMS.length} limpa</h2>
    <p>Você recupera ${RULES.restHeal} de vida (${hero.vida}/${hero.max}). Escolha uma recompensa antes de descer:</p>
    <div class="rewards">${opts.map((r, i) => `<button class="reward" data-i="${i}"><b>${r.nome}</b><span>${r.desc}</span></button>`).join('')}</div>
    <small>Próxima: ${ROOMS[room + 1].nome}</small>`);
  document.querySelectorAll('#screen .reward').forEach(b => b.onclick = () => {
    const r = opts[+b.dataset.i];
    r.aplicar(hero);
    $('screen').classList.add('hidden');
    loadRoom(room + 1);
    log(`Recompensa: ${r.nome}.`);
    heroTurn();
  });
}

function records() { try { return JSON.parse(localStorage.getItem(REC_KEY)) || []; } catch (e) { return []; } }

// Score proposto (§7, em aberto): salas limpas primeiro, depois menos turnos.
function endRun(won) {
  phase = 'over'; active = null; setActions([]);
  sfx(won ? 'win' : 'lose');
  const salas = won ? ROOMS.length : room;
  const mine = { salas, turnos: turn, vida: Math.max(0, hero.vida), data: new Date().toLocaleDateString('pt-BR') };
  let rows = records();
  rows.push(mine);
  rows.sort((a, b) => b.salas - a.salas || a.turnos - b.turnos || b.vida - a.vida);
  rows = rows.slice(0, 5);
  try { localStorage.setItem(REC_KEY, JSON.stringify(rows)); } catch (e) {}
  const table = `<h2>Ranking local</h2><table>${rows.map((r, i) =>
    `<tr style="${r === mine ? 'color:var(--gold)' : ''}"><td>${i + 1}º</td><td>${r.salas}/${ROOMS.length} salas</td><td>${r.turnos} turnos</td><td>${r.data}</td></tr>`).join('')}</table>`;
  screen(`<h1>${won ? 'Vitória' : 'Morte'}</h1>
    <p>${won ? `O Rei Esqueleto caiu. As 7 salas foram limpas em ${turn} turnos, com ${hero.vida} de vida.`
      : `O Cavaleiro caiu na sala ${room + 1} (${ROOMS[room].nome}), no turno ${turn}. Permadeath: a run acabou.`}</p>
    ${table}<small>No jogo, o ranking vai para o Firebase (§7); a métrica de score ainda está em aberto.</small>
    <button class="btn big" id="again">Nova run</button>`);
  $('again').onclick = start;
}

function screen(html) { const s = $('screen'); s.innerHTML = html; s.classList.remove('hidden'); }

function title() {
  screen(`<h1>Dice<br>And Blood</h1>
    <div class="cast">${['heroi', 'esqueleto', 'goblin', 'morcego'].map(k => `<img src="${ART + KINDS[k].img}.png" alt="">`).join('')}</div>
    <p>Desça as 7 salas da masmorra. No seu turno o <b style="color:var(--gold)">dado</b> diz até onde você anda; depois ataque um monstro ao lado, ou use o turno todo em <em style="color:#9cc0ff;font-style:normal">Parry</em>.</p>
    <p>A sorte não é justa, mas se compra com <b style="color:var(--blood2);font-weight:400">sangue</b>: pague vida para rolar qualquer dado seu de novo.</p>
    <small>Ataque por roll-under: o d20 precisa sair igual ou menor que Ataque − Defesa do alvo. 1 natural é crítico, 20 natural é falha.</small>
    <button class="btn big" id="go">Começar</button>`);
  $('go').onclick = start;
}

function start() {
  $('screen').classList.add('hidden');
  sfx('tick');                    // cria o áudio no toque do jogador (o navegador exige)
  newRun(); loadRoom(room); heroTurn();
}

// ============================================================ interface

function hud() {
  if (!hero) return;
  $('hud').innerHTML = `<div class="who"><img src="${ART + KINDS.heroi.img}.png" alt="">
      <div><div>Cavaleiro <button id="mute" title="Som">${soundOn ? '♪' : '×'}</button></div><div class="bar"><i style="width:${100 * hero.vida / hero.max}%"></i><span>${hero.vida}/${hero.max}</span></div></div></div>
    <div class="tags">Sala ${room + 1}/${ROOMS.length} · Turno ${turn}<br>ATQ ${hero.atq} · DEF ${hero.def}${hero.parry ? ` <b>+${hero.parry}</b>` : ''} · Dano ${hero.dano}<br>Monstros: ${enemies().length}</div>`;
  $('mute').onclick = () => {
    soundOn = !soundOn;
    try { localStorage.setItem(SND_KEY, soundOn ? 'on' : 'off'); } catch (e) {}
    hud();
  };
}

function cellFromEvent(ev) {
  const r = cv.getBoundingClientRect();
  return { x: Math.floor((ev.clientX - r.left) / r.width * N), y: Math.floor((ev.clientY - r.top) / r.height * N) };
}

// Toque direto (§5: tudo por toque): casa azul = mover, monstro vermelho ao lado = atacar.
cv.addEventListener('pointerdown', ev => {
  if (phase !== 'player') return;
  const c = cellFromEvent(ev);
  const foe = targets().find(e => e.x === c.x && e.y === c.y);
  if (foe) return heroAttack(foe);
  if (reach.has(key(c.x, c.y))) return heroMove(c);
});
cv.addEventListener('pointermove', ev => { hover = cellFromEvent(ev); });
cv.addEventListener('pointerleave', () => { hover = null; });

// ============================================================ desenho

function draw(now) {
  // Tremor de tela ao acertar (mais forte quando é o herói que apanha).
  const k = now - shake.t0;
  cv.style.transform = k < 260 ? `translate(${(Math.random() * 2 - 1) * shake.amp * (1 - k / 260)}px, ${(Math.random() * 2 - 1) * shake.amp * (1 - k / 260)}px)` : '';

  ctx.clearRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    ctx.drawImage(IMG['tiles/chao_pedra'], x * CELL, y * CELL, CELL, CELL);
    if ((x + y) % 2) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x * CELL, y * CELL, CELL, CELL); }
  }
  ctx.globalAlpha = 0.6;
  for (const s of stains) {
    ctx.fillStyle = s.color;
    for (const d of s.drops) { ctx.beginPath(); ctx.arc(s.x * CELL + CELL / 2 + d.dx, s.y * CELL + CELL * 0.7 + d.dy, d.r, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;

  const tgt = phase === 'player' ? targets() : [];
  if (phase === 'player') {
    for (const k of reach.keys()) { const [x, y] = unkey(k); cellMark(x, y, 'rgba(93,143,224,.32)', 'rgba(156,192,255,.8)'); }
    for (const e of tgt) cellMark(e.x, e.y, 'rgba(179,32,44,.38)', 'rgba(255,107,107,.95)');
    if (hover && inBounds(hover.x, hover.y)) { ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.strokeRect(hover.x * CELL + 2, hover.y * CELL + 2, CELL - 4, CELL - 4); }
  }

  // Pedras e unidades na ordem de altura, para quem está mais abaixo ficar na frente.
  const things = [...[...rocks].map(k => { const [x, y] = unkey(k); return { rock: true, x, y }; }),
    ...units.filter(u => u.vida > 0)].sort((a, b) => a.y - b.y);
  for (const t of things) {
    if (t.rock) { ctx.drawImage(IMG['tiles/pedra_obstaculo'], t.x * CELL, t.y * CELL - 6, CELL, CELL); continue; }
    drawUnit(t, now);
  }

  // Chance de acerto em cima de cada alvo atacável.
  ctx.font = '16px Silkscreen, monospace'; ctx.textAlign = 'center';
  for (const e of tgt) {
    const t = hitChance(hero, e) + '%', px = e.x * CELL + CELL / 2, py = e.y * CELL + 12;
    ctx.fillStyle = '#000'; ctx.fillText(t, px + 1, py + 1);
    ctx.fillStyle = '#f2c94c'; ctx.fillText(t, px, py);
  }

  floats = floats.filter(f => now - f.t0 < 900);
  ctx.font = '20px Silkscreen, monospace';
  for (const f of floats) {
    const k = (now - f.t0) / 900, px = f.x * CELL + CELL / 2, py = f.y * CELL + 10 - k * 30;
    ctx.globalAlpha = 1 - k * k;
    ctx.fillStyle = '#000'; ctx.fillText(f.text, px + 2, py + 2);
    ctx.fillStyle = f.color; ctx.fillText(f.text, px, py);
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(draw);
}

function cellMark(x, y, fill, line) {
  ctx.fillStyle = fill; ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
  ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.strokeRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6);
}

function drawUnit(u, now) {
  const px = u.x * CELL + u.ox, py = u.y * CELL + u.oy;
  const bob = u.voa ? Math.sin(now / 180 + u.x) * 4 - 6 : 0;
  const size = u.chefe ? CELL * 1.3 : CELL, off = (size - CELL) / 2;
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(px + CELL / 2, py + CELL - 8, u.chefe ? 26 : 20, 6, 0, 0, Math.PI * 2); ctx.fill();
  // O chefe reaproveita o sprite do esqueleto, maior e tingido de vermelho (não tem arte própria ainda).
  const filters = [];
  if (u.chefe) filters.push('sepia(1) saturate(5) hue-rotate(-35deg) brightness(.85)');
  if (now - u.flash < 250) filters.push('brightness(2.2) saturate(0)');
  ctx.filter = filters.join(' ') || 'none';
  ctx.drawImage(IMG[u.img], px - off, py - 8 + bob - off * 1.6, size, size);
  ctx.filter = 'none';
  // Vida
  const w = 44, fx = px + (CELL - w) / 2, fy = py + CELL - 6;
  ctx.fillStyle = '#000'; ctx.fillRect(fx - 1, fy - 1, w + 2, 6);
  ctx.fillStyle = u.side === 'P' ? '#4cc36a' : '#d8333f'; ctx.fillRect(fx, fy, w * u.vida / u.max, 4);
  if (u.parry) {                  // escudo do Parry
    ctx.fillStyle = '#5d8fe0'; ctx.strokeStyle = '#0c0e14'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px + 50, py + 2); ctx.lineTo(px + 62, py + 6); ctx.lineTo(px + 60, py + 16); ctx.lineTo(px + 56, py + 21); ctx.lineTo(px + 52, py + 16); ctx.lineTo(px + 50, py + 6); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  if (u === active) {             // marcador de quem está agindo
    const ay = py - 16 - off * 1.6 + Math.sin(now / 150) * 3;
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath(); ctx.moveTo(px + 26, ay); ctx.lineTo(px + 38, ay); ctx.lineTo(px + 32, ay + 8); ctx.fill();
  }
}

// ============================================================ escala e início

function fit() {
  const s = Math.min(innerWidth / 480, innerHeight / 860);
  const app = $('app');
  app.style.transform = `scale(${s})`;
  app.style.left = (innerWidth - 480 * s) / 2 + 'px';
  app.style.top = (innerHeight - 860 * s) / 2 + 'px';
}
addEventListener('resize', fit);
fit();

loadImages().then(() => {
  newRun(); loadRoom(room); setActions([]);
  requestAnimationFrame(draw);
  if (DEV.has('go')) start(); else title();
});
