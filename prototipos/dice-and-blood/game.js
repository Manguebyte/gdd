// DiceAndBlood — protótipo jogável em JavaScript puro.
// Segue a Parte 1 do DiceAndBlood.md com os placeholders de MVP do guia Unity: tabuleiro fixo 8×8 (§2.1),
// alcance de movimento por 1d6 (§2.2, Parte 5), ataque por roll-under em 1d20 contra Ataque − Defesa efetiva
// com dano fixo (§2.3, Parte 6), Parry como ação do turno (+3 de Defesa até o próximo turno, §2.4), ordem fixa
// herói → monstros (§3), IA que persegue o herói e ataca adjacente (Parte 7) e feedback visível de cada rolagem
// (§5). A run termina ao eliminar todos os monstros ou ao morrer. Arte: Sprites/DiceAndBlood/.
'use strict';

const ART = '../../Sprites/DiceAndBlood/';
const N = 8;                  // tabuleiro 8×8 (§2.1)
const CELL = 64;              // casa de 32 px desenhada em 2×
const REC_KEY = 'diceandblood-records-v1';
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));

// ============================================================ regras (placeholders de MVP, todos "Em aberto")

const RULES = { moveDie: 6, attackDie: 20, damage: 3, parryBonus: 3 };

// Atributos por tipo. O guia Unity deixa todos em Vida 10 / Ataque 12 / Defesa 2 e manda variar por monstro
// (Parte 7 §5.2); estes valores são do protótipo, para um herói sozinho conseguir vencer três monstros.
const KINDS = {
  heroi:     { name: 'Cavaleiro', img: 'chars/heroi_cavaleiro', vida: 18, atq: 14, def: 2, side: 'P' },
  esqueleto: { name: 'Esqueleto', img: 'monsters/esqueleto',    vida: 6,  atq: 11, def: 2, side: 'E' },
  goblin:    { name: 'Goblin',    img: 'monsters/goblin',       vida: 5,  atq: 12, def: 1, side: 'E' },
  morcego:   { name: 'Morcego',   img: 'monsters/morcego',      vida: 3,  atq: 10, def: 4, side: 'E' },
};

// Tabuleiro fixo (§8: 1 tabuleiro, sem geração procedural). '#' pedra que bloqueia, H herói, e/g/m monstros.
const BOARD = [
  '.e....g.',
  '........',
  '..#..m..',
  '.....#..',
  '.#......',
  '....#...',
  '........',
  '...H....',
];
const CODES = { H: 'heroi', e: 'esqueleto', g: 'goblin', m: 'morcego' };

// ============================================================ arte

const IMG = {};
function loadImages() {
  const names = ['tiles/chao_pedra', 'tiles/pedra_obstaculo', 'ui/dado_icone',
    ...[1, 2, 3, 4, 5, 6].map(n => 'ui/dado_' + n), ...Object.values(KINDS).map(k => k.img)];
  return Promise.all(names.map(n => new Promise(res => {
    const im = new Image();
    im.onload = res; im.onerror = res;
    im.src = ART + n + '.png';
    IMG[n] = im;
  })));
}

// ============================================================ estado

const $ = id => document.getElementById(id);
const cv = $('board'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

let units = [], rocks = new Set();
let hero = null;
let turn = 0;
let phase = 'title';          // title · busy · player · over
let range = 0;                // alcance rolado neste turno
let reach = new Map();        // casa alcançável → casa anterior no caminho
let mode = 'move';            // só muda o destaque; tocar numa casa válida age direto
let active = null;            // unidade da vez (marcador dourado)
let hover = null;
let floats = [];

const key = (x, y) => x + ',' + y;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const roll = sides => 1 + Math.floor(Math.random() * sides);
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const enemies = () => units.filter(u => u.side === 'E' && u.vida > 0);
const unitAt = (x, y) => units.find(u => u.vida > 0 && u.x === x && u.y === y);
const inBounds = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
const blocked = (x, y) => rocks.has(key(x, y)) || !!unitAt(x, y);

function newRun() {
  units = []; rocks = new Set(); floats = [];
  BOARD.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '#') rocks.add(key(x, y));
    if (CODES[c]) {
      const k = KINDS[CODES[c]];
      units.push({ kind: CODES[c], ...k, max: k.vida, x, y, parry: 0, ox: 0, oy: 0, flash: 0 });
    }
  }));
  hero = units.find(u => u.side === 'P');
  if (DEV.has('god')) hero.vida = hero.max = 99;
  if (DEV.has('weak')) enemies().forEach(u => { u.vida = u.max = 1; });
  turn = 0;
  $('log').innerHTML = '';
  log('A run começa. Elimine os 3 monstros do tabuleiro.');
}

// ============================================================ movimento (Parte 5: flood fill ortogonal)

// Casas alcançáveis com até `steps` passos, sem atravessar pedras nem unidades. Guarda de onde veio cada casa
// para a unidade andar casa a casa pelo caminho, e não em linha reta por cima das pedras.
function reachable(u, steps) {
  const from = new Map([[key(u.x, u.y), null]]);
  const cost = new Map([[key(u.x, u.y), 0]]);
  const queue = [[u.x, u.y]];
  while (queue.length) {
    const [x, y] = queue.shift();
    const c = cost.get(key(x, y));
    if (c >= steps) continue;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (!inBounds(nx, ny) || blocked(nx, ny) || cost.has(k)) continue;
      cost.set(k, c + 1); from.set(k, key(x, y)); queue.push([nx, ny]);
    }
  }
  from.delete(key(u.x, u.y));
  return from;
}

function pathTo(map, target) {
  const path = [];
  for (let k = target; k && map.has(k); k = map.get(k)) path.unshift(k.split(',').map(Number));
  return path;
}

async function walk(u, path) {
  for (const [x, y] of path) {
    const sx = (u.x - x) * CELL, sy = (u.y - y) * CELL;
    u.x = x; u.y = y;
    for (let t = 0; t <= 1; t += 0.2) { u.ox = sx * (1 - t); u.oy = sy * (1 - t) - Math.sin(t * Math.PI) * 6; await sleep(22); }
    u.ox = u.oy = 0;
  }
}

// ============================================================ rolagens com feedback visível (§5)

async function rollD6(who) {
  const d6 = $('d6');
  d6.classList.add('spin');
  setRollText(`${who} rola o dado de movimento…`);
  for (let i = 0; i < 9; i++) { d6.src = ART + 'ui/dado_' + roll(6) + '.png'; await sleep(55 + i * 8); }
  const r = roll(RULES.moveDie);
  d6.src = ART + 'ui/dado_' + r + '.png';
  d6.classList.remove('spin');
  return r;
}

// Roll-under (§2.3): acerta se o d20 sair igual ou menor que Ataque do atacante − Defesa efetiva do alvo
// (mínimo 1). O Parry soma à Defesa efetiva até o próximo turno de quem o usou (§2.4).
async function attack(a, d) {
  const target = Math.max(1, a.atq - (d.def + d.parry));
  const d20 = $('d20');
  d20.className = 'spin';
  setRollText(`${a.name} ataca ${d.name}: precisa de <b>≤ ${target}</b> no d20…`);
  for (let i = 0; i < 10; i++) { d20.textContent = roll(RULES.attackDie); await sleep(50 + i * 7); }
  const r = roll(RULES.attackDie), hit = r <= target;
  d20.textContent = r;
  d20.className = hit ? 'hit' : 'miss';
  // Investida: a unidade avança meio passo na direção do alvo e volta.
  const dx = Math.sign(d.x - a.x), dy = Math.sign(d.y - a.y);
  for (let t = 0; t <= 1; t += 0.25) { a.ox = dx * 18 * Math.sin(t * Math.PI); a.oy = dy * 18 * Math.sin(t * Math.PI); await sleep(20); }
  a.ox = a.oy = 0;
  const txt = `${a.name} rolou ${r} (alvo ≤ ${target}) — ${hit ? 'Acertou! −' + RULES.damage : 'Errou'}`;
  setRollText(hit ? `<b>${txt}</b>` : txt);
  log(txt + (d.parry && !hit ? ' (Parry)' : ''));
  if (hit) {
    d.vida = Math.max(0, d.vida - RULES.damage);
    d.flash = performance.now();
    float(d, '-' + RULES.damage, '#ff6b6b');
    if (d.vida === 0) { log(`${d.name} caiu.`); float(d, d.side === 'P' ? 'MORTO' : 'X', '#f2c94c'); }
  } else float(d, 'errou', '#9198ab');
  hud();
  await sleep(450);
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

// ============================================================ turnos (§3: herói age, depois todos os monstros)

async function heroTurn() {
  if (phase === 'over') return;
  turn++;
  hero.parry = 0;                 // o bônus de Parry acaba quando a vez de quem o usou volta (Parte 6 §4.2)
  active = hero; phase = 'busy'; buttons();
  hud();
  range = await rollD6('O Cavaleiro');
  reach = reachable(hero, range);
  setRollText(`Alcance: <em>${range} ${range === 1 ? 'casa' : 'casas'}</em>. Escolha <em>Mover</em>, <b>Atacar</b> um vizinho ou <em>Parry</em>.`);
  mode = targets().length ? 'attack' : 'move';
  phase = 'player'; buttons();
}

const targets = () => enemies().filter(e => dist(e, hero) === 1);

async function heroAct(act, cell) {
  phase = 'busy'; buttons();
  if (act === 'move') {
    const path = pathTo(reach, key(cell.x, cell.y));
    await walk(hero, path);
    log(`Cavaleiro andou ${path.length} de ${range} ${range === 1 ? 'casa' : 'casas'}.`);
  } else if (act === 'attack') {
    await attack(hero, cell);
  } else if (act === 'parry') {
    hero.parry = RULES.parryBonus;
    float(hero, '+' + RULES.parryBonus + ' DEF', '#9cc0ff');
    log(`Cavaleiro ergue o escudo: Defesa ${hero.def} → ${hero.def + hero.parry} até o próximo turno.`);
    setRollText(`<em>Parry:</em> Defesa ${hero.def + hero.parry} até o seu próximo turno.`);
    hud();
    await sleep(500);
  }
  reach = new Map();
  if (!enemies().length) return endRun(true);
  await enemyPhase();
}

// IA da Parte 7: ataca se estiver ao lado do herói; senão rola o d6 e vai para a casa alcançável mais perto dele.
async function enemyPhase() {
  for (const e of enemies()) {
    if (hero.vida <= 0) break;
    active = e;
    await sleep(250);
    if (dist(e, hero) === 1) { await attack(e, hero); continue; }
    const r = await rollD6(e.name);
    const opts = reachable(e, r);
    let best = null, bestD = dist(e, hero);
    for (const k of opts.keys()) {
      const [x, y] = k.split(',').map(Number), d = dist({ x, y }, hero);
      if (d < bestD) { bestD = d; best = k; }
    }
    setRollText(`${e.name} tirou ${r} e ${best ? 'avança' : 'não acha caminho'}.`);
    if (best) await walk(e, pathTo(opts, best));
    await sleep(150);
  }
  active = null;
  if (hero.vida <= 0) return endRun(false);
  heroTurn();
}

// ============================================================ fim de run e ranking

function records() { try { return JSON.parse(localStorage.getItem(REC_KEY)) || []; } catch (e) { return []; } }

function endRun(won) {
  phase = 'over'; active = null; buttons();
  let rows = records();
  let mine = null;
  if (won) {
    mine = { turnos: turn, vida: hero.vida, data: new Date().toLocaleDateString('pt-BR') };
    rows.push(mine);
    rows.sort((a, b) => a.turnos - b.turnos || b.vida - a.vida);
    rows = rows.slice(0, 5);
    try { localStorage.setItem(REC_KEY, JSON.stringify(rows)); } catch (e) {}
  }
  const table = rows.length ? `<h2>Ranking local</h2><table>${rows.map((r, i) =>
    `<tr style="${r === mine ? 'color:var(--gold)' : ''}"><td>${i + 1}º</td><td>${r.turnos} turnos</td><td>${r.vida} de vida</td><td>${r.data}</td></tr>`).join('')}</table>` : '';
  screen(`<h1>${won ? 'Vitória' : 'Morte'}</h1>
    <p>${won ? `O tabuleiro está limpo em ${turn} turnos, com ${hero.vida} de vida.` : `O Cavaleiro caiu no turno ${turn}. Permadeath: a run acabou.`}</p>
    ${table}<small>No jogo, o ranking vai para o Firebase (§7); a métrica de score ainda está em aberto.</small>
    <button class="btn big" id="again">Nova run</button>`);
  $('again').onclick = start;
}

function screen(html) { const s = $('screen'); s.innerHTML = html; s.classList.remove('hidden'); }

function title() {
  screen(`<h1>Dice<br>And Blood</h1>
    <div class="cast">${['heroi', 'esqueleto', 'goblin', 'morcego'].map(k => `<img src="${ART + KINDS[k].img}.png" alt="">`).join('')}</div>
    <p>Um herói, três monstros, um tabuleiro 8×8. No seu turno o <b style="color:var(--gold)">d6</b> diz até onde você anda; depois escolha uma ação: <em style="color:#9cc0ff;font-style:normal">Mover</em>, <b style="color:var(--blood2);font-weight:400">Atacar</b> um vizinho ou <em style="color:#9cc0ff;font-style:normal">Parry</em>.</p>
    <small>Ataque por roll-under: o d20 precisa sair igual ou menor que Ataque − Defesa do alvo. Parry dá +3 de Defesa até o seu próximo turno.</small>
    <button class="btn big" id="go">Começar</button>`);
  $('go').onclick = start;
}

function start() {
  $('screen').classList.add('hidden');
  newRun(); hud(); heroTurn();
}

// ============================================================ interface

function hud() {
  if (!hero) return;
  $('hud').innerHTML = `<div class="who"><img src="${ART + KINDS.heroi.img}.png" alt="">
      <div><div>Cavaleiro</div><div class="bar"><i style="width:${100 * hero.vida / hero.max}%"></i><span>${hero.vida}/${hero.max}</span></div></div></div>
    <div class="tags">Turno ${turn}<br>ATQ ${hero.atq} · DEF ${hero.def}${hero.parry ? ` <b>+${hero.parry}</b>` : ''}<br>Monstros: ${enemies().length}</div>`;
}

function buttons() {
  const on = phase === 'player';
  document.querySelectorAll('#actions button').forEach(b => {
    const a = b.dataset.act;
    b.disabled = !on || (a === 'move' && !reach.size) || (a === 'attack' && !targets().length);
    b.classList.toggle('on', on && a === mode);
  });
}

document.querySelectorAll('#actions button').forEach(b => b.onclick = () => {
  if (phase !== 'player') return;
  const a = b.dataset.act;
  if (a === 'parry') return heroAct('parry');
  mode = a; buttons();
  setRollText(a === 'move' ? `Toque numa casa <em>azul</em> (até ${range}).` : 'Toque num monstro <b>vermelho</b> ao seu lado.');
});

function cellFromEvent(ev) {
  const r = cv.getBoundingClientRect();
  return { x: Math.floor((ev.clientX - r.left) / r.width * N), y: Math.floor((ev.clientY - r.top) / r.height * N) };
}

// Toque direto (§5: tudo por toque): casa azul = mover, monstro vizinho = atacar, qualquer que seja o botão aceso.
cv.addEventListener('pointerdown', ev => {
  if (phase !== 'player') return;
  const c = cellFromEvent(ev);
  const foe = targets().find(e => e.x === c.x && e.y === c.y);
  if (foe) return heroAct('attack', foe);
  if (reach.has(key(c.x, c.y))) return heroAct('move', c);
});
cv.addEventListener('pointermove', ev => { hover = cellFromEvent(ev); });
cv.addEventListener('pointerleave', () => { hover = null; });

// ============================================================ desenho

function draw(now) {
  ctx.clearRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    ctx.drawImage(IMG['tiles/chao_pedra'], x * CELL, y * CELL, CELL, CELL);
    if ((x + y) % 2) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x * CELL, y * CELL, CELL, CELL); }
  }

  if (phase === 'player') {
    const tgt = targets();
    if (mode === 'move' || !tgt.length) for (const k of reach.keys()) {
      const [x, y] = k.split(',').map(Number);
      cellMark(x, y, 'rgba(93,143,224,.32)', 'rgba(156,192,255,.8)');
    }
    for (const e of tgt) cellMark(e.x, e.y, 'rgba(179,32,44,.38)', 'rgba(255,107,107,.95)');
    if (hover && inBounds(hover.x, hover.y)) { ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.strokeRect(hover.x * CELL + 2, hover.y * CELL + 2, CELL - 4, CELL - 4); }
  }

  // Pedras e unidades na ordem de altura, para quem está mais abaixo ficar na frente.
  const things = [...[...rocks].map(k => { const [x, y] = k.split(',').map(Number); return { rock: true, x, y }; }),
    ...units.filter(u => u.vida > 0)].sort((a, b) => a.y - b.y);
  for (const t of things) {
    if (t.rock) { ctx.drawImage(IMG['tiles/pedra_obstaculo'], t.x * CELL, t.y * CELL - 6, CELL, CELL); continue; }
    drawUnit(t, now);
  }

  floats = floats.filter(f => now - f.t0 < 900);
  ctx.font = '20px Silkscreen, monospace'; ctx.textAlign = 'center';
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
  const bob = u.kind === 'morcego' ? Math.sin(now / 180 + u.x) * 4 - 6 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(px + CELL / 2, py + CELL - 8, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
  const hurt = now - u.flash < 250;
  if (hurt) ctx.filter = 'brightness(2.2) saturate(0)';
  ctx.drawImage(IMG[u.img], px, py - 8 + bob, CELL, CELL);
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
    const ay = py - 16 + Math.sin(now / 150) * 3;
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
  newRun(); hud(); buttons();
  requestAnimationFrame(draw);
  if (DEV.has('go')) start(); else title();
});
