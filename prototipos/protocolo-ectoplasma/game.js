// Protocolo Ectoplasma — protótipo jogável em JavaScript puro.
// Segue a Parte 1 do GDD_Protocolo_Ectoplasma.md: core loop da §5 (mapa → imóvel → sugar → upgrade), mapa da
// cidade como hub com nível de ameaça visível e sem bloqueio (§6.1), sucção segurando o botão com regeneração ao
// soltar e estabilidade de mira (§6.2), as duas armadilhas (§6.3), a árvore de upgrades (§6.4), os 4 tipos de
// fantasma da §7 e o MVP da §9 (1 bairro com 4 imóveis), com o gancho do Ato 1, uma pista do Ato 2 e o final do
// Ato 3 (§3.2). Arte: Sprites/ProtocoloEctoplasma/.
'use strict';

const ART = '../../Sprites/ProtocoloEctoplasma/';
const W = 480, H = 270;           // cena em pixels de arte, desenhada em 2×
const SAVE_KEY = 'ectoplasma-save-v1';
const DEV = new Set(location.hash.slice(1).split(',').filter(Boolean));
if (DEV.has('reset')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ============================================================ dados de design (números do protótipo)

// §6.4. Preço do nível seguinte; o decodificador é o "upgrade de história" (lê a memória antes de sugar).
const UPG = {
  suck:    { name: 'Velocidade de sucção', desc: '+30% de plasma sugado por segundo', max: 5 },
  tank:    { name: 'Tanque da mochila',    desc: '+30 de energia de sucção',          max: 5 },
  range:   { name: 'Alcance de mira',      desc: '+18 px de alcance do feixe',        max: 5 },
  resist:  { name: 'Resistência',          desc: '−12% de dano dos contra-ataques',    max: 4 },
  traps:   { name: 'Armadilhas',           desc: '+1 armadilha em campo, +30% de força', max: 3 },
  decoder: { name: 'Decodificador de memórias', desc: 'lê a memória de cada fantasma antes de sugar', max: 1 },
};
const PRICES = [40, 90, 160, 250, 360];
const upgPrice = (id, lvl) => id === 'decoder' ? 150 : PRICES[lvl];

const stat = {
  suck:    () => 20 * (1 + 0.3 * S.up.suck),     // plasma/s sugado com a mira parada
  tankMax: () => 100 + 30 * S.up.tank,
  range:   () => 90 + 18 * S.up.range,
  resist:  () => 1 - 0.12 * S.up.resist,
  slots:   () => 2 + S.up.traps,
  trapPow: () => 1 + 0.3 * S.up.traps,
};
const TANK_DRAIN = 22, TANK_REFILL = 18;         // energia/s gasta sugando e recuperada parado
const MOVING_PENALTY = 0.5;                       // §6.2: sugar andando rende metade
const REGEN_DELAY = 1.2;                          // s sem ser sugado antes de o plasma voltar

const TRAPS = {
  auto: { name: 'Armadilha autônoma', img: 'traps/armadilha_autonoma', price: 25, key: 'Q', radius: 55, desc: 'suga sozinha o fantasma mais perto, mais devagar que você' },
  sup:  { name: 'Armadilha de suporte', img: 'traps/armadilha_suporte', price: 20, key: 'E', radius: 60, desc: 'atrai fantasmas, desacelera e impede a regeneração' },
};

// §7. plasma = reserva do fantasma; regen = plasma/s de volta quando ninguém suga; reward = plasma que vira moeda.
const GHOSTS = {
  errante:     { name: 'Errante',     img: 'ghosts/errante',       size: 48, r: 12, plasma: 60,  regen: 6,  reward: 40,  speed: 12 },
  assombrado:  { name: 'Assombrado',  img: 'ghosts/assombrado',    size: 48, r: 13, plasma: 70,  regen: 8,  reward: 55,  speed: 20, flee: 62 },
  poltergeist: { name: 'Poltergeist', img: 'ghosts/poltergeist',   size: 48, r: 15, plasma: 90,  regen: 8,  reward: 70,  speed: 16, dmg: 6, throwEvery: 3 },
  residual:    { name: 'Residual',    img: 'ghosts/residual_boss', size: 96, r: 30, plasma: 360, regen: 12, reward: 250, speed: 9,  dmg: 8, boss: true },
};

// §6.1 / §9: um bairro com 4 imóveis. mx/my = posição do ícone de casa no mapa (em 960×540).
const HOUSES = [
  { id: 'acacia',  name: 'Casa da Rua das Acácias, 12', threat: 1, mx: 622, my: 91,  ghosts: ['errante', 'errante', 'errante'] },
  { id: 'largo',   name: 'Sobrado do Largo do Rio',     threat: 2, mx: 825, my: 221, ghosts: ['errante', 'assombrado', 'errante', 'assombrado'] },
  { id: 'vila',    name: 'Vila Operária, casa 4',       threat: 3, mx: 611, my: 455, ghosts: ['assombrado', 'poltergeist', 'errante', 'poltergeist'] },
  { id: 'casarao', name: 'Casarão da Ponte',            threat: 5, mx: 825, my: 480, ghosts: ['residual', 'poltergeist'] },
];
const threatMul = t => 1 + 0.3 * (t - 1);         // ameaça vira números (§6.1), não bloqueio: regeneração e plasma
const dmgMul = t => 1 + 0.15 * (t - 1);           // e, mais suave, o dano dos contra-ataques
const RECOMMENDED = [0, 0, 1, 3, 6, 9];           // níveis de upgrade somados sugeridos por ameaça
const RISK = ['adequado', 'arriscado', 'perigoso', 'suicida'];
const CONTRACT = 60;                              // bônus por imóvel limpo, × ameaça

// Memórias (§7: cada tipo tem uma memória associada; §3.2 Ato 2: pistas de que eram pessoas).
const MEMORIES = {
  errante:     ['"Já coloquei a mesa, Antônio. Vem jantar."', 'Uma cantiga de ninar, sempre pela metade.', '"Quem vai regar as samambaias agora?"', 'Cheiro de café passado às seis da manhã.'],
  assombrado:  ['Passos de criança subindo a escada, correndo.', '"Não me tira daqui. Essa casa é minha."', 'Um nome riscado no batente: LÚCIA, 1987.'],
  poltergeist: ['A poltrona favorita, onde ninguém mais podia sentar.', '"Vocês venderam o meu piano!"', 'O abajur que sempre acendia às seis da tarde.'],
  residual:    ['Dezenas de vozes da mesma rua, ao mesmo tempo: "a gente morava aqui".'],
};

// Tileset Wang rua/calçada: cantos NW NE SW SE (1 = calçada) → coluna/linha do tile (tirado do rua_calcada.json).
const WANG = { '0000': [2, 1], '0001': [3, 1], '0010': [2, 2], '0011': [1, 2], '0100': [2, 0], '0101': [3, 2], '0110': [0, 1], '0111': [3, 3],
  '1000': [1, 1], '1001': [2, 3], '1010': [1, 0], '1011': [0, 2], '1100': [3, 0], '1101': [0, 0], '1110': [1, 3], '1111': [0, 3] };

const DIRS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];

// ============================================================ save

const S = loadSave();
function loadSave() {
  const fresh = { plasma: 0, up: { suck: 0, tank: 0, range: 0, resist: 0, traps: 0, decoder: 0 }, traps: { auto: 1, sup: 0 }, clean: {}, mem: [], intro: false, note: false };
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return { ...fresh, ...s, up: { ...fresh.up, ...s.up }, traps: { ...fresh.traps, ...s.traps } }; } catch (e) {}
  return fresh;
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
if (DEV.has('rich')) S.plasma += 600;
const cleanCount = () => HOUSES.filter(h => S.clean[h.id]).length;
const power = () => S.up.suck + S.up.tank + S.up.range + S.up.resist + S.up.traps;
const riskOf = h => { const d = RECOMMENDED[h.threat] - power(); return d <= 0 ? 0 : d <= 2 ? 1 : d <= 4 ? 2 : 3; };

// ============================================================ arte

const IMG = {};
function loadImages() {
  const names = ['map/mapa_cidade', 'buildings/casa_contaminada', 'tiles/rua_calcada', ...DIRS.map(d => 'chars/operador/' + d),
    ...Object.values(GHOSTS).map(g => g.img), ...Object.values(TRAPS).map(t => t.img)];
  return Promise.all(names.map(n => new Promise(res => {
    const im = new Image(); im.onload = res; im.onerror = res; im.src = ART + n + '.png'; IMG[n] = im;
  })));
}

// Chão da cena: calçada em cima (frente da casa), meio-fio e asfalto embaixo, montado pelos cantos do Wang.
let ground = null;
function buildGround() {
  ground = document.createElement('canvas'); ground.width = W; ground.height = 288;
  const g = ground.getContext('2d');
  const side = (cx, cy) => cy <= 3 || (cx <= 2 && cy >= 8) || (cx >= 13 && cy >= 8) ? 1 : 0;
  for (let y = 0; y < 9; y++) for (let x = 0; x < 15; x++) {
    const [tx, ty] = WANG['' + side(x, y) + side(x + 1, y) + side(x, y + 1) + side(x + 1, y + 1)];
    g.drawImage(IMG['tiles/rua_calcada'], tx * 32, ty * 32, 32, 32, x * 32, y * 32, 32, 32);
  }
  // Calçada abandonada: escurece o bege claro do tileset para combinar com o bairro contaminado.
  g.fillStyle = 'rgba(40,36,60,.38)'; g.fillRect(0, 0, W, 288);
}

// ============================================================ estado e utilidades

const $ = id => document.getElementById(id);
const cv = $('view'), ctx = cv.getContext('2d');
let scene = 'map';               // map · mission · screen
let M = null;                    // missão em andamento
let hoverHouse = null, openHouse = null;
const keys = new Set();
const mouse = { x: 0, y: 0, down: false };
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hyp = (x, y) => Math.hypot(x, y);

function toast(html, ms = 3200) {
  const t = $('toast'); t.innerHTML = html; t.classList.remove('hidden');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), ms);
}
function showScreen(html) { const s = $('screen'); s.innerHTML = html; s.classList.remove('hidden'); scene = 'screen'; $('panel').classList.add('hidden'); }
function hideScreen() { $('screen').classList.add('hidden'); }

// ============================================================ mapa da cidade (§6.1, §8)

function goMap() {
  hideScreen(); M = null; scene = 'map'; openHouse = null; $('panel').classList.add('hidden');
  mapHud();
  // Ato 2 (§3.2): depois de duas casas limpas aparece a primeira pista de que os fantasmas eram gente.
  if (cleanCount() >= 2 && !S.note) {
    S.note = true; save();
    toast('Bilhete preso no portão do Largo: <i>"Minha mãe ainda está naquela casa. Por favor, não. — Iracema"</i>', 7000);
  }
}

function mapHud() {
  $('hud').innerHTML = `<div><div class="lbl">LimpaCorp Espectral · operador nº 0451</div><div class="plasma">◆ ${S.plasma} de plasma</div></div>
    <div><div class="lbl">Cidade limpa</div>${cleanCount()}/${HOUSES.length} imóveis</div>
    <div><div class="lbl">Memórias</div>${S.mem.length}</div><div class="grow"></div>
    <button class="btn neon" id="shopBtn">Loja da empresa [U]</button>
    <div class="hint">Clique num imóvel para ver a ameaça e entrar.</div>`;
  $('shopBtn').onclick = openShop;
}

function houseAt(x, y) { return HOUSES.find(h => hyp(h.mx - x, h.my - y) < 34); }

function openPanel(h) {
  openHouse = h;
  const p = $('panel');
  const mul = threatMul(h.threat), risk = riskOf(h);
  const est = Math.round(h.ghosts.reduce((s, g) => s + GHOSTS[g].reward, 0) * mul) + CONTRACT * h.threat;
  p.innerHTML = `<h2>${h.name}</h2>
    <div>Ameaça <span class="threat">${'☠'.repeat(h.threat)}${'·'.repeat(5 - h.threat)}</span></div>
    <div class="row cast">${h.ghosts.map(g => `<img src="${ART + GHOSTS[g].img}.png" title="${GHOSTS[g].name}" alt="">`).join('')}</div>
    ${S.clean[h.id] ? '<div class="risk-0">Limpo · imóvel valorizado</div>' :
      `<div>Seu equipamento: <span class="risk-${risk}">${RISK[risk]}</span></div><div>Contrato: até <b>◆ ${est}</b></div>
       <div class="row"><button class="btn go" id="enter">Entrar</button><button class="btn" id="close">Fechar</button></div>`}`;
  p.style.left = (h.mx > 480 ? h.mx - 380 : h.mx + 40) + 'px';
  p.style.top = clamp(h.my - 60, 60, 330) + 'px';
  p.style.width = '330px';
  p.classList.remove('hidden');
  if ($('enter')) $('enter').onclick = () => startMission(h);
  if ($('close')) $('close').onclick = () => { p.classList.add('hidden'); openHouse = null; };
}

function drawMap(now) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(IMG['map/mapa_cidade'], 0, 0, 960, 540);
  for (const h of HOUSES) {
    const clean = S.clean[h.id], hot = h === hoverHouse || h === openHouse;
    const pulse = (Math.sin(now / 300 + h.mx) + 1) / 2;
    ctx.save();
    if (clean) {
      // Bairro valorizado (§6.1): a névoa dá lugar ao neon.
      const g = ctx.createRadialGradient(h.mx, h.my, 4, h.mx, h.my, 90);
      g.addColorStop(0, 'rgba(54,214,255,.55)'); g.addColorStop(1, 'rgba(54,214,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.mx, h.my, 90, 0, 7); ctx.fill();
    }
    ctx.lineWidth = hot ? 4 : 3;
    ctx.strokeStyle = clean ? '#36d6ff' : `rgba(200,120,255,${0.5 + pulse * 0.5})`;
    ctx.beginPath(); ctx.arc(h.mx, h.my, 30 + (clean ? 0 : pulse * 4), 0, 7); ctx.stroke();
    // Etiqueta com o nível de ameaça (caveiras) ou o selo de limpo.
    const label = clean ? 'VALORIZADO' : '☠'.repeat(h.threat);
    ctx.font = '18px Silkscreen, monospace';
    const tw = ctx.measureText(label).width + 14, lx = clamp(h.mx - tw / 2, 4, 956 - tw), ly = h.my > 440 ? h.my - 62 : h.my + 36;
    ctx.fillStyle = 'rgba(8,7,12,.85)'; ctx.fillRect(lx, ly, tw, 24);
    ctx.fillStyle = clean ? '#36d6ff' : ['', '#8cff4a', '#ffd166', '#ff9a4a', '#ff5a5a', '#c77dff'][h.threat];
    ctx.textAlign = 'left'; ctx.fillText(label, lx + 7, ly + 18);
    ctx.restore();
  }
}

// ============================================================ loja (§6.4, §6.3, §8)

function openShop() {
  const ups = Object.entries(UPG).map(([id, u]) => {
    const lvl = S.up[id], maxed = lvl >= u.max, price = maxed ? 0 : upgPrice(id, lvl);
    return `<button data-up="${id}" ${maxed || S.plasma < price ? 'disabled' : ''}>${u.name} <em>${maxed ? 'máx.' : '◆ ' + price}</em>
      <span>${u.desc} · <i class="pips">${'■'.repeat(lvl)}${'□'.repeat(u.max - lvl)}</i></span></button>`;
  }).join('');
  const traps = Object.entries(TRAPS).map(([id, t]) =>
    `<button data-trap="${id}" ${S.plasma < t.price ? 'disabled' : ''}>${t.name} (tem ${S.traps[id]}) <em>◆ ${t.price}</em><span>[${t.key}] ${t.desc}</span></button>`).join('');
  showScreen(`<h1>Loja da empresa</h1><h2>◆ ${S.plasma} de plasma</h2>
    <div class="shop">${ups}${traps}</div>
    <small>Armadilhas são gastas ao serem colocadas. Em campo cabem ${stat.slots()} de uma vez.</small>
    <button class="btn go" id="back">Voltar ao mapa</button>`);
  document.querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
    const id = b.dataset.up; S.plasma -= upgPrice(id, S.up[id]); S.up[id]++; save(); openShop();
  });
  document.querySelectorAll('[data-trap]').forEach(b => b.onclick = () => {
    const id = b.dataset.trap; S.plasma -= TRAPS[id].price; S.traps[id]++; save(); openShop();
  });
  $('back').onclick = goMap;
}

// ============================================================ missão (§6.2, §6.3, §7)

function startMission(h) {
  hideScreen(); $('panel').classList.add('hidden');
  const mul = threatMul(h.threat);
  M = { house: h, mul, dmg: dmgMul(h.threat), t: 0, bag: 0, traps: [], shots: [], parts: [], ghosts: [], over: false,
    op: { x: 240, y: 240, hp: 100, dir: 6, hurt: -9, moving: false }, tank: stat.tankMax(), overheat: false, beam: null };
  h.ghosts.forEach((g, i) => spawnGhost(g, 70 + (i * 337) % 340, 120 + (i * 53) % 90));
  M.total = M.ghosts.reduce((s, g) => s + g.max, 0);
  scene = 'mission';
  buildMissionHud();
  toast(`<b>${h.name}</b> · segure o botão do mouse sobre um fantasma para sugar. Q/E: armadilhas.`, 4000);
}

function spawnGhost(kind, x, y) {
  const k = GHOSTS[kind];
  const g = { kind, ...k, x, y, tx: x, ty: y, max: k.plasma, p: k.plasma, lastHit: -9, aimed: -9, cd: rnd(1, 2.5), phase: 1, seed: Math.random() * 9 };
  g.memory = MEMORIES[kind][(S.mem.length + M.ghosts.length) % MEMORIES[kind].length];
  M.ghosts.push(g);
  return g;
}

// A arma sai da mão do operador: um pouco acima dos pés, para o lado da mira.
function nozzle() {
  const a = Math.atan2(mouse.y - (M.op.y - 18), mouse.x - M.op.x);
  return { x: M.op.x + Math.cos(a) * 14, y: M.op.y - 18 + Math.sin(a) * 8, a };
}

function hurt(dmg) {
  if (DEV.has('god')) return;
  M.op.hp -= dmg * M.dmg * stat.resist();
  M.op.hurt = M.t;
  if (M.op.hp <= 0) { M.op.hp = 0; endMission(false); }
}

function updateMission(dt) {
  const op = M.op;
  M.t += dt;
  // Movimento (WASD/setas), preso na cena e sem atravessar a casa.
  let vx = (keys.has('d') || keys.has('arrowright')) - (keys.has('a') || keys.has('arrowleft'));
  let vy = (keys.has('s') || keys.has('arrowdown')) - (keys.has('w') || keys.has('arrowup'));
  const len = hyp(vx, vy) || 1;
  op.moving = !!(vx || vy);
  const nx = clamp(op.x + vx / len * 72 * dt, 14, W - 14), ny = clamp(op.y + vy / len * 72 * dt, 64, H - 4);
  const inHouse = (x, y) => x > 190 && x < 292 && y > 30 && y < 100;
  if (!inHouse(nx, op.y)) op.x = nx;
  if (!inHouse(op.x, ny)) op.y = ny;
  const nz = nozzle();
  op.dir = ((Math.round(nz.a / (Math.PI / 4)) % 8) + 8) % 8;

  // Sucção (§6.2): segurar gasta o tanque; o feixe pega o fantasma sob a mira se estiver no alcance.
  M.beam = null;
  const sucking = mouse.down && !M.overheat && M.tank > 0;
  if (sucking) {
    M.tank = Math.max(0, M.tank - TANK_DRAIN * dt);
    if (M.tank === 0) { M.overheat = true; toast('Tanque vazio! Espere recarregar.', 1600); }
    const reach = stat.range();
    let target = null, best = 1e9;
    for (const g of M.ghosts) {
      const dm = hyp(g.x - mouse.x, g.y - g.size * 0.45 - mouse.y), dn = hyp(g.x - nz.x, g.y - g.size * 0.45 - nz.y);
      if (dm < g.r + 8 && dn <= reach + g.r && dm < best) { best = dm; target = g; }
    }
    if (target) {
      target.p -= stat.suck() * (op.moving ? MOVING_PENALTY : 1) * dt;
      target.lastHit = target.aimed = M.t;
      M.beam = { x: target.x, y: target.y - target.size * 0.45, hit: true };
      if (target.p <= 0) capture(target);
    } else {
      const d = Math.min(reach, hyp(mouse.x - nz.x, mouse.y - nz.y));
      M.beam = { x: nz.x + Math.cos(nz.a) * d, y: nz.y + Math.sin(nz.a) * d, hit: false };
    }
  } else {
    M.tank = Math.min(stat.tankMax(), M.tank + TANK_REFILL * dt);
    if (M.overheat && M.tank >= stat.tankMax() * 0.35) M.overheat = false;
  }

  // Armadilhas (§6.3).
  for (const tr of M.traps) {
    const R = TRAPS[tr.type].radius;
    if (tr.type === 'auto') {
      let g = null, best = R;
      for (const o of M.ghosts) { const d = hyp(o.x - tr.x, o.y - tr.y); if (d < best) { best = d; g = o; } }
      tr.link = g;
      if (g) { g.p -= 6 * stat.trapPow() * dt; g.lastHit = M.t; if (g.p <= 0) capture(g); }
    }
  }

  for (const g of [...M.ghosts]) updateGhost(g, dt);

  for (const s of M.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; s.rot += dt * 8;
    if (hyp(s.x - op.x, s.y - (op.y - 16)) < 13) { s.life = 0; hurt(s.dmg); burst(s.x, s.y, '#ff9a4a', 8); }
  }
  M.shots = M.shots.filter(s => s.life > 0 && s.x > -20 && s.x < W + 20 && s.y > -20 && s.y < H + 20);
  for (const p of M.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 10 * dt; p.life -= dt; }
  M.parts = M.parts.filter(p => p.life > 0);

  if (!M.ghosts.length && !M.over) { M.over = true; setTimeout(() => endMission(true), 1200); }
  missionHud();
}

function updateGhost(g, dt) {
  const op = M.op;
  // Suporte: dentro do raio o fantasma fica lento, é puxado para a armadilha e não regenera.
  let slow = 1, sup = null;
  for (const tr of M.traps) if (tr.type === 'sup' && hyp(g.x - tr.x, g.y - tr.y) < TRAPS.sup.radius * (g.boss ? 0.8 : 1)) { slow = 0.4; sup = tr; }
  if (!sup && M.t - g.lastHit > REGEN_DELAY) g.p = Math.min(g.max, g.p + g.regen * M.mul * dt);

  const dOp = hyp(g.x - op.x, g.y - op.y);
  let vx = 0, vy = 0;
  if (g.kind === 'assombrado' && M.t - g.aimed < 0.25) {
    // Foge quando mirado (§7): obriga a reposicionar.
    vx = (g.x - op.x) / dOp * g.flee; vy = (g.y - op.y) / dOp * g.flee;
  } else if (g.kind === 'poltergeist') {
    // Mantém distância e arremessa objetos da casa contra o operador (§7).
    if (dOp < 95) { vx = (g.x - op.x) / dOp * g.speed * 2; vy = (g.y - op.y) / dOp * g.speed * 2; }
    else wander(g);
    g.cd -= dt;
    if (g.cd <= 0) { g.cd = g.throwEvery * rnd(0.8, 1.2); throwAt(g, Math.random() < 0.5 ? 'chair' : 'lamp', 105); }
  } else if (g.boss) {
    // Residual (§7): avança devagar, machuca de perto, divide-se em fases e cospe ectoplasma a partir da 2ª.
    if (dOp > 20) { vx = (op.x - g.x) / dOp * g.speed; vy = (op.y - g.y) / dOp * g.speed; }
    if (dOp < 36) hurt(g.dmg * dt);
    const phase = g.p > g.max * 2 / 3 ? 1 : g.p > g.max / 3 ? 2 : 3;
    if (phase > g.phase) {
      g.phase = phase;
      toast(`O Residual se parte! Fase ${phase}.`, 1800);
      for (let i = 0; i < 2; i++) spawnGhost('errante', clamp(g.x + rnd(-70, 70), 40, 440), clamp(g.y + rnd(-40, 40), 90, 240));
      burst(g.x, g.y - 40, '#8cff4a', 30);
      if (dOp < 80) hurt(10);
    }
    if (g.phase >= 2) { g.cd -= dt; if (g.cd <= 0) { g.cd = g.phase === 2 ? 3.2 : 2.4; throwAt(g, 'blob', 95); } }
  } else wander(g);

  if (sup && !g.boss) { vx += (sup.x - g.x) * 0.6; vy += (sup.y - g.y) * 0.6; }
  g.x = clamp(g.x + vx * slow * dt, 24, W - 24);
  g.y = clamp(g.y + vy * slow * dt, 70 + (g.boss ? 30 : 0), H - 8);

  function wander(o) {
    if (hyp(o.tx - o.x, o.ty - o.y) < 4) { o.tx = rnd(40, W - 40); o.ty = rnd(110, H - 20); }
    const d = hyp(o.tx - o.x, o.ty - o.y);
    vx = (o.tx - o.x) / d * o.speed; vy = (o.ty - o.y) / d * o.speed;
  }
}

function throwAt(g, kind, speed) {
  const sx = g.x, sy = g.y - g.size * 0.4, d = hyp(M.op.x - sx, M.op.y - 16 - sy) || 1;
  M.shots.push({ kind, x: sx, y: sy, vx: (M.op.x - sx) / d * speed, vy: (M.op.y - 16 - sy) / d * speed, life: 4, rot: 0, dmg: g.dmg });
}

function capture(g) {
  M.ghosts = M.ghosts.filter(o => o !== g);
  const gain = Math.round(g.reward * M.mul);
  M.bag += gain;
  burst(g.x, g.y - g.size * 0.45, '#8cff4a', g.boss ? 60 : 22);
  if (!S.mem.includes(g.memory)) { S.mem.push(g.memory); save(); }
  toast(`${g.name} sugado · <b>+◆ ${gain}</b><br><i>${g.memory}</i>`, 3600);
}

function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) M.parts.push({ x, y, vx: rnd(-50, 50), vy: rnd(-60, 20), life: rnd(0.4, 1), color });
}

function placeTrap(type) {
  if (!M || M.over) return;
  if (S.traps[type] <= 0) return toast(`Sem ${TRAPS[type].name.toLowerCase()}. Compre na loja.`, 1600);
  if (M.traps.length >= stat.slots()) return toast(`Só cabem ${stat.slots()} armadilhas em campo (upgrade Armadilhas).`, 1600);
  const d = hyp(mouse.x - M.op.x, mouse.y - M.op.y), k = Math.min(1, 70 / (d || 1));
  M.traps.push({ type, x: clamp(M.op.x + (mouse.x - M.op.x) * k, 20, W - 20), y: clamp(M.op.y + (mouse.y - M.op.y) * k, 110, H - 6) });
  S.traps[type]--; save();
}

function endMission(won) {
  if (scene !== 'mission') return;
  const h = M.house;
  if (won) {
    const bonus = CONTRACT * h.threat;
    S.plasma += M.bag + bonus; S.clean[h.id] = true; save();
    if (cleanCount() === HOUSES.length) return ending();
    showScreen(`<h1>Imóvel 100% limpo</h1><h2>${h.name}</h2>
      <p>Plasma extraído: <b>◆ ${M.bag}</b> · bônus do contrato: <b>◆ ${bonus}</b></p>
      <p>A cidade agradece. O metro quadrado da rua subiu ${8 * h.threat}%.</p>
      <div class="row"><button class="btn neon" id="shop">Loja</button> <button class="btn go" id="map">Mapa</button></div>`);
  } else {
    const kept = Math.floor(M.bag / 2);
    S.plasma += kept; save();
    showScreen(`<h1 style="color:var(--hp)">Evacuado</h1><h2>${h.name}</h2>
      <p>${M.op.hp <= 0 ? 'O operador foi retirado pela equipe de resgate.' : 'Você abandonou o imóvel.'} Metade do plasma da mochila se perdeu: ficou <b>◆ ${kept}</b>.</p>
      <p>Os fantasmas regeneram. O imóvel continua contaminado.</p>
      <div class="row"><button class="btn neon" id="shop">Loja</button> <button class="btn go" id="map">Mapa</button></div>`);
  }
  $('shop').onclick = openShop; $('map').onclick = goMap;
}

// Ato 3 (§3.2) e vitória vazia: a cidade limpa, sem ninguém.
function ending() {
  showScreen(`<h1>Cidade 100% limpa</h1>
    <div class="memo">ARQUIVO INTERNO — LimpaCorp Espectral<br><br>
    Projeto PONTE (protótipo de <b>comunicação</b> espectral): os testes confirmaram contato estável com residentes falecidos.
    Os familiares reconheceram as vozes.<br><br>Status: <b>arquivado</b>. Motivo: retorno financeiro inferior à extração de plasma.</div>
    <p>Você guardou ${S.mem.length} memórias de pessoas que alguém amou.</p>
    <button class="btn" id="next">Continuar</button>`);
  $('next').onclick = () => {
    showScreen(`<h2>Fim</h2><p>Os imóveis foram valorizados. As ruas estão vazias.<br>Ninguém mais chama ninguém para jantar.</p>
      <small>Protótipo do MVP (§9): o final alternativo da §3.2 ainda está em aberto.</small>
      <div class="row"><button class="btn go" id="map">Ver a cidade</button> <button class="btn" id="again">Recomeçar do zero</button></div>`);
    $('map').onclick = goMap;
    $('again').onclick = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.hash = ''; location.reload(); };
  };
}

// ============================================================ HUD da missão (§8)

// Montado uma vez por missão; a cada quadro só os números e as barras mudam (o botão Sair não é recriado).
function buildMissionHud() {
  $('hud').innerHTML = `<div><div class="lbl">Operador</div><div class="bar"><i id="hpBar" style="background:var(--hp)"></i><span id="hpTxt"></span></div></div>
    <div><div class="lbl">Tanque<span id="heat" style="color:var(--hp)"></span></div><div class="bar"><i id="tkBar"></i><span id="tkTxt"></span></div></div>
    <div><div class="lbl">Mochila</div><span class="plasma" id="bag"></span></div>
    <div><div class="lbl">Fantasmas</div><span id="left"></span></div>
    <div class="traps">${Object.entries(TRAPS).map(([id, t]) => `<div title="${t.name}: ${t.desc}"><img src="${ART + t.img}.png" alt=""><kbd>${t.key}</kbd>×<span id="tr-${id}"></span></div>`).join('')}</div>
    <div class="grow"></div><button class="btn" id="quit">Sair [Esc]</button>`;
  $('quit').onclick = () => endMission(false);
}

function missionHud() {
  const hp = Math.max(0, M.op.hp);
  $('hpBar').style.width = hp + '%'; $('hpTxt').textContent = Math.ceil(hp);
  $('tkBar').style.width = M.tank / stat.tankMax() * 100 + '%';
  $('tkBar').style.background = M.overheat ? '#7a5050' : 'var(--ecto2)';
  $('tkTxt').textContent = Math.round(M.tank);
  $('heat').textContent = M.overheat ? ' · recarregando' : '';
  $('bag').textContent = '◆ ' + M.bag;
  $('left').textContent = M.ghosts.length;
  for (const id in TRAPS) $('tr-' + id).textContent = S.traps[id];
}

// ============================================================ desenho da missão

function drawMission(now) {
  const op = M.op;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ground, 0, 0);
  ctx.drawImage(IMG['buildings/casa_contaminada'], 176, -26);

  // Contaminação: névoa verde/roxa que some conforme o plasma da casa é sugado.
  const left = M.ghosts.reduce((s, g) => s + g.p, 0) / M.total;
  ctx.fillStyle = `rgba(60,25,90,${0.12 + 0.28 * left})`; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) {
    const fx = (i * 113 + now / 60 * (i % 2 ? 1 : -1)) % (W + 160) - 80, fy = 70 + i * 40;
    const g = ctx.createRadialGradient(fx, fy, 4, fx, fy, 90);
    g.addColorStop(0, `rgba(120,255,80,${0.10 * left})`); g.addColorStop(1, 'rgba(120,255,80,0)');
    ctx.fillStyle = g; ctx.fillRect(fx - 90, fy - 90, 180, 180);
  }

  for (const tr of M.traps) {
    const R = TRAPS[tr.type].radius;
    ctx.strokeStyle = tr.type === 'auto' ? 'rgba(140,255,74,.25)' : 'rgba(199,125,255,.3)';
    ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.ellipse(tr.x, tr.y, R, R * 0.6, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.drawImage(IMG[TRAPS[tr.type].img], tr.x - 16, tr.y - 28);
    if (tr.link) beam(tr.x, tr.y - 22, tr.link.x, tr.link.y - tr.link.size * 0.45, now, 0.5);
  }

  // Operador e fantasmas por altura (pés); fantasmas semitransparentes (§4) e flutuando.
  const list = [{ op: true, y: op.y }, ...M.ghosts].sort((a, b) => a.y - b.y);
  for (const e of list) {
    if (e.op) {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(op.x, op.y - 2, 11, 4, 0, 0, 7); ctx.fill();
      const bob = op.moving ? Math.abs(Math.sin(now / 90)) * 2 : 0;
      if (M.t - op.hurt < 0.2) ctx.filter = 'brightness(2) saturate(0)';
      ctx.drawImage(IMG['chars/operador/' + DIRS[op.dir]], Math.round(op.x - 24), Math.round(op.y - 46 - bob));
      ctx.filter = 'none';
      continue;
    }
    const g = e, s = g.size, bob = Math.sin(now / 400 + g.seed) * 3;
    ctx.fillStyle = 'rgba(80,255,120,.18)'; ctx.beginPath(); ctx.ellipse(g.x, g.y - 2, s * 0.25, s * 0.08, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.82 + 0.1 * Math.sin(now / 200 + g.seed);
    if (M.t - g.aimed < 0.1) ctx.filter = 'brightness(1.4)';
    ctx.drawImage(IMG[g.img], Math.round(g.x - s / 2), Math.round(g.y - s - 6 + bob));
    ctx.filter = 'none'; ctx.globalAlpha = 1;
    if (g.p < g.max || M.t - g.aimed < 1) {
      const w = g.boss ? 60 : 30, bx = g.x - w / 2, by = g.y - s - 12 + bob;
      ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, w + 2, 5);
      ctx.fillStyle = '#8cff4a'; ctx.fillRect(bx, by, w * Math.max(0, g.p) / g.max, 3);
    }
  }

  for (const s of M.shots) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
    if (s.kind === 'chair') { ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-5, -5, 10, 3); ctx.fillRect(-5, -5, 3, 11); ctx.fillRect(2, -2, 3, 8); }
    else if (s.kind === 'lamp') { ctx.fillStyle = '#f2c46b'; ctx.fillRect(-5, -6, 10, 5); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-1, -1, 2, 8); }
    else { ctx.fillStyle = '#8cff4a'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#c77dff'; ctx.fillRect(-1, -1, 3, 3); }
    ctx.restore();
  }

  if (M.beam) { const nz = nozzle(); beam(nz.x, nz.y, M.beam.x, M.beam.y, now, M.beam.hit ? 1 : 0.45); }
  if (mouse.down && !M.overheat) {
    ctx.strokeStyle = 'rgba(140,255,74,.18)'; ctx.beginPath(); ctx.arc(op.x, op.y - 18, stat.range(), 0, 7); ctx.stroke();
  }

  for (const p of M.parts) { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 2, 2); }
  ctx.globalAlpha = 1;

  // Decodificador (upgrade de história, §6.4): a memória aparece ao passar a mira sobre o fantasma.
  if (S.up.decoder) {
    const g = M.ghosts.find(o => hyp(o.x - mouse.x, o.y - o.size * 0.45 - mouse.y) < o.r + 8);
    if (g) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = '20px VT323, monospace'; ctx.textAlign = 'center';
      const w = ctx.measureText(g.memory).width + 16;
      const tx = clamp(g.x * 2, w / 2 + 4, 956 - w / 2), ty = Math.max(90, (g.y - g.size - 18) * 2);
      ctx.fillStyle = 'rgba(13,11,20,.85)'; ctx.fillRect(tx - w / 2, ty - 18, w, 24);
      ctx.fillStyle = '#d9c6ff'; ctx.fillText(g.memory, tx, ty);
    }
  }
}

// Feixe de sucção: duas linhas onduladas verdes do bico até o alvo.
function beam(x1, y1, x2, y2, now, power) {
  const d = hyp(x2 - x1, y2 - y1), n = Math.max(4, Math.floor(d / 6)), nx = -(y2 - y1) / (d || 1), ny = (x2 - x1) / (d || 1);
  for (const [w, color] of [[4, `rgba(140,255,74,${0.25 * power})`], [1.5, `rgba(220,255,200,${0.9 * power})`]]) {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const t = i / n, wob = Math.sin(t * 12 - now / 40) * 2.5 * Math.sin(t * Math.PI);
      ctx[i ? 'lineTo' : 'moveTo'](x1 + (x2 - x1) * t + nx * wob, y1 + (y2 - y1) * t + ny * wob);
    }
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

// ============================================================ entrada

function viewPos(ev) {
  const r = cv.getBoundingClientRect();
  return { x: (ev.clientX - r.left) / r.width * 960, y: (ev.clientY - r.top) / r.height * 540 };
}
cv.addEventListener('contextmenu', ev => ev.preventDefault());
cv.addEventListener('pointermove', ev => {
  const p = viewPos(ev);
  mouse.x = p.x / 2; mouse.y = p.y / 2;
  if (scene === 'map') { hoverHouse = houseAt(p.x, p.y); cv.style.cursor = hoverHouse ? 'pointer' : 'default'; }
  else cv.style.cursor = 'crosshair';
});
cv.addEventListener('pointerdown', ev => {
  const p = viewPos(ev);
  mouse.x = p.x / 2; mouse.y = p.y / 2;
  if (scene === 'map') { const h = houseAt(p.x, p.y); if (h) openPanel(h); else { $('panel').classList.add('hidden'); openHouse = null; } return; }
  if (scene === 'mission') mouse.down = true;   // §6.2 usa o botão direito; o esquerdo também suga (touchpad)
});
addEventListener('pointerup', () => { mouse.down = false; });
addEventListener('blur', () => { mouse.down = false; keys.clear(); });
addEventListener('keydown', ev => {
  const k = ev.key.toLowerCase();
  keys.add(k);
  if (scene === 'mission') {
    if (k === 'q') placeTrap('auto');
    if (k === 'e') placeTrap('sup');
    if (k === 'escape') endMission(false);
  } else if (scene === 'map' && k === 'u') openShop();
});
addEventListener('keyup', ev => keys.delete(ev.key.toLowerCase()));

// ============================================================ laço, escala e início

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (scene === 'mission' && M) { updateMission(dt); drawMission(now); }
  else if (M && scene === 'screen') drawMission(now);
  else drawMap(now);
  requestAnimationFrame(frame);
}

function fit() {
  const s = Math.min(innerWidth / 960, innerHeight / 540), app = $('app');
  app.style.transform = `scale(${s})`;
  app.style.left = (innerWidth - 960 * s) / 2 + 'px';
  app.style.top = (innerHeight - 540 * s) / 2 + 'px';
}
addEventListener('resize', fit);
fit();

// Gancho do Ato 1 (§3.2): tom corporativo e leve.
function intro() {
  showScreen(`<h1>Protocolo Ectoplasma</h1>
    <div class="cast"><img src="${ART}chars/operador/south.png" width="96" alt=""><img src="${ART}ghosts/errante.png" width="96" alt=""><img src="${ART}ghosts/poltergeist.png" width="96" alt=""></div>
    <div class="memo">MEMORANDO — LimpaCorp Espectral<br><br>Bem-vindo(a), operador(a) nº 0451! Nosso bairro piloto tem <b>4 imóveis contaminados</b>.
    Escolha um no mapa, entre e <b>sugue o plasma</b> de cada presença. Cada casa limpa valoriza a rua e enche o seu bônus. Lembre-se: fantasma não é gente. É estoque.</div>
    <small>WASD move · segure o botão do mouse sobre o fantasma para sugar (parado rende o dobro) · Q/E armadilhas · Esc sai</small>
    <button class="btn go" id="start">Bater o ponto</button>`);
  $('start').onclick = () => { S.intro = true; save(); goMap(); };
}

loadImages().then(() => {
  buildGround();
  requestAnimationFrame(frame);
  const h = [...DEV].map(d => /^h(\d)$/.exec(d)).find(Boolean);
  if (h) startMission(HOUSES[+h[1] - 1]);
  else if (DEV.has('go') || S.intro) goMap();
  else intro();
});
