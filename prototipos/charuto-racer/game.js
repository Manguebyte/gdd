'use strict';
/* Charuto Racer — desenho (porte do RoadRenderer, RoadSpriteRenderer e ParallaxBackground do guia),
   entrada (teclado e controle), HUD, garagem, save e loop. As regras ficam em sim.js. */

const W = CFG.screenWidth, H = CFG.screenHeight, HALF_W = W / 2;
const $ = id => document.getElementById(id);
const canvas = $('view');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ------------------------------------------------------------------ atalhos de desenvolvimento (README)
const FLAGS = new Set(location.hash.slice(1).split(',').filter(Boolean).map(f => f.split('=')[0]));
const flagValue = name => { const f = location.hash.slice(1).split(',').find(x => x.startsWith(name + '=')); return f ? f.split('=')[1] : null; };

// ------------------------------------------------------------------ save (localStorage, só entre corridas)
const SAVE_KEY = 'charutoRacer.save.v1';
function loadSave() {
  if (FLAGS.has('reset')) localStorage.removeItem(SAVE_KEY);
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.version === 1) return s;
  } catch (e) { /* save inválido: começa do zero */ }
  return newSave();
}
function storeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* modo privado */ } }

let save = loadSave();
if (FLAGS.has('rich')) save.money += 50000;
if (flagValue('gp')) save.raceIndex = clamp(parseInt(flagValue('gp'), 10) - 1, 0, TRACKS.length - 1);

// ------------------------------------------------------------------ arte
const SPR = buildSprites();
const carCache = new Map();
function carSprites(look) {
  if (!carCache.has(look)) carCache.set(look, [drawCar(look, -1), drawCar(look, 0), drawCar(look, 1)]);
  return carCache.get(look);
}
const bgCache = new Map();
function backgrounds(index) {
  if (!bgCache.has(index)) {
    const th = TRACKS[index].theme;
    bgCache.set(index, {
      sky: makeCanvas(1, H / 2 + 30, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, th.skyTop); gr.addColorStop(1, th.skyBottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
      clouds: drawClouds(th.clouds, 50 + index),
      far: drawLayer(th.far, 70, 10 + index),
      near: drawLayer(th.near, 45, 20 + index),
    });
  }
  return bgCache.get(index);
}

// Cores com neblina: a mistura é arredondada em 16 níveis e guardada.
const colorCache = new Map();
function fogged(hex, fogHex, f) {
  const level = Math.round(f * 16), key = hex + fogHex + level;
  let c = colorCache.get(key);
  if (!c) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(fogHex.slice(1), 16), t = level / 16;
    const ch = s => Math.round(lerp((a >> s) & 255, (b >> s) & 255, t));
    c = `rgb(${ch(16)},${ch(8)},${ch(0)})`;
    colorCache.set(key, c);
  }
  return c;
}

// ------------------------------------------------------------------ entrada
const keys = new Set(), hits = new Set();
addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (!e.repeat) hits.add(e.code);
  keys.add(e.code);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
let padPrev = [];

function readInput() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()] : [];
  const pad = pads.find(p => p && p.connected);
  const b = i => !!(pad && pad.buttons[i] && (pad.buttons[i].pressed || pad.buttons[i].value > 0.3));
  const bHit = i => b(i) && !padPrev[i];
  const k = c => keys.has(c), kh = c => hits.has(c);
  let steer = (k('ArrowRight') || k('KeyD') ? 1 : 0) - (k('ArrowLeft') || k('KeyA') ? 1 : 0);
  if (pad) {
    const ax = pad.axes[0] || 0;
    if (Math.abs(ax) > 0.15) steer = ax;
    if (b(14)) steer = -1;
    if (b(15)) steer = 1;
  }
  const input = {
    accel: k('ArrowUp') || k('KeyW') || b(0) || b(7),
    brake: k('ArrowDown') || k('KeyS') || b(2) || b(6),
    steer,
    nitro: kh('Space') || bHit(3),
    up: kh('KeyE') || bHit(5),
    down: kh('KeyQ') || bHit(4),
    pause: kh('Escape') || kh('KeyP') || bHit(9),
    confirm: kh('Enter') || bHit(0),
  };
  padPrev = pad ? pad.buttons.map((_, i) => b(i)) : [];
  hits.clear();
  return input;
}

// ------------------------------------------------------------------ desenho da estrada (Fase 2.4)
function project(worldY, worldZ, cameraX, cameraY, cameraZ) {
  const camZ = worldZ - cameraZ, scale = CFG.cameraDepth / camZ;
  return {
    camZ, scale,
    x: Math.round(HALF_W + scale * -cameraX * HALF_W),
    y: Math.round(H / 2 - scale * (worldY - cameraY) * H / 2),
    w: Math.round(scale * CFG.roadWidth * HALF_W),
  };
}

function quad(x1, y1, x2, y2, x3, y3, x4, y4, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}

function drawSegment(s, th) {
  const p1 = s.p1, p2 = s.p2, f = s.fog, fog = th.fog, lanes = CFG.lanes;
  const r1 = p1.w / Math.max(6, 2 * lanes), r2 = p2.w / Math.max(6, 2 * lanes);
  // +1 na altura cobre a fresta de meio pixel entre um segmento e outro.
  quad(0, p1.y + 1, W, p1.y + 1, W, p2.y, 0, p2.y, fogged(th.grass[s.dark ? 1 : 0], fog, f));
  if (s.isPit) {
    const pw1 = p1.w * CFG.pitLaneWidth, pw2 = p2.w * CFG.pitLaneWidth;
    quad(p1.x + p1.w, p1.y + 1, p1.x + p1.w + r1 + pw1, p1.y + 1, p2.x + p2.w + r2 + pw2, p2.y, p2.x + p2.w, p2.y, fogged(th.road[1], fog, f));
  }
  const rumble = fogged(th.rumble[s.dark ? 1 : 0], fog, f);
  quad(p1.x - p1.w - r1, p1.y + 1, p1.x - p1.w, p1.y + 1, p2.x - p2.w, p2.y, p2.x - p2.w - r2, p2.y, rumble);
  quad(p1.x + p1.w, p1.y + 1, p1.x + p1.w + r1, p1.y + 1, p2.x + p2.w + r2, p2.y, p2.x + p2.w, p2.y, rumble);
  quad(p1.x - p1.w, p1.y + 1, p1.x + p1.w, p1.y + 1, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, fogged(th.road[s.dark ? 1 : 0], fog, f));

  if (s.index <= 1) { // linha de chegada quadriculada
    const cells = 10;
    for (let i = 0; i < cells; i++) {
      if ((i + s.index) % 2) continue;
      const a1 = p1.x - p1.w + (2 * p1.w * i) / cells, b1 = a1 + (2 * p1.w) / cells;
      const a2 = p2.x - p2.w + (2 * p2.w * i) / cells, b2 = a2 + (2 * p2.w) / cells;
      quad(a1, p1.y + 1, b1, p1.y + 1, b2, p2.y, a2, p2.y, '#f2f2f2');
    }
  } else if (!s.dark) {
    const l1 = p1.w / Math.max(32, 8 * lanes), l2 = p2.w / Math.max(32, 8 * lanes);
    const lw1 = (p1.w * 2) / lanes, lw2 = (p2.w * 2) / lanes;
    let lx1 = p1.x - p1.w + lw1, lx2 = p2.x - p2.w + lw2;
    const lane = fogged(th.lane, fog, f);
    for (let i = 1; i < lanes; i++, lx1 += lw1, lx2 += lw2)
      quad(lx1 - l1 / 2, p1.y + 1, lx1 + l1 / 2, p1.y + 1, lx2 + l2 / 2, p2.y, lx2 - l2 / 2, p2.y, lane);
  }
}

// Sprite com o pé em (x, y) e largura destW, cortado abaixo de clipY (atrás de um morro).
function drawClipped(img, x, y, destW, clipY) {
  if (!img || destW < 1) return;
  const destH = destW * img.height / img.width;
  const top = y - destH;
  const hidden = clipY ? Math.max(0, y - clipY) : 0;
  if (hidden >= destH) return;
  const srcH = img.height * (1 - hidden / destH);
  ctx.drawImage(img, 0, 0, img.width, srcH, Math.round(x - destW / 2), Math.round(top), Math.round(destW), Math.round(destH - hidden));
}

function drawLayerTiled(img, offset, y) {
  const w = img.width;
  let x = -(((offset % w) + w) % w);
  for (; x < W; x += w) ctx.drawImage(img, Math.round(x), Math.round(y));
}

function renderRace(r, dt) {
  const t = r.track, th = r.def.theme, p = r.player, car = p.car;
  const camZ = t.wrap(car.z - CFG.playerZ);
  const playerY = t.heightAt(car.z);

  // Fundo (Fase 2.5)
  const bg = backgrounds(r.trackIndex);
  const speedPct = clamp01(car.speed / (CFG.baseMaxSpeedKmh * KMH));
  if (r.state !== 'paused') r.bgOffset = (r.bgOffset || 0) + (car.seg ? car.seg.curve : 0) * speedPct * dt;
  const lift = clamp(-playerY * 0.0015, -14, 14);
  ctx.drawImage(bg.sky, 0, 0, W, bg.sky.height);
  ctx.fillStyle = th.grass[1];
  ctx.fillRect(0, H / 2, W, H / 2);
  drawLayerTiled(bg.clouds, r.bgOffset * 6, 4 + lift * 0.3);
  drawLayerTiled(bg.far, r.bgOffset * 20, H / 2 - bg.far.height + 1 + lift * 0.6);
  drawLayerTiled(bg.near, r.bgOffset * 45, H / 2 - bg.near.height + 1 + lift);

  // Estrada (Fase 2.4)
  const base = t.findSegment(camZ), basePct = t.percentIn(camZ);
  const cameraY = t.heightAt(camZ + CFG.playerZ) + CFG.cameraHeight;
  const cameraX = car.x * CFG.roadWidth;
  let x = 0, dx = -base.curve * basePct, maxY = H;
  const count = Math.min(CFG.drawDistance, t.segments.length);
  for (let n = 0; n < count; n++) {
    const seg = t.segments[(base.index + n) % t.segments.length];
    const looped = seg.index < base.index;
    const cz = camZ - (looped ? t.length : 0);
    seg.clipY = maxY;
    seg.fog = 1 - Math.exp(-Math.pow(n / count, 2) * CFG.fogDensity);
    seg.p1 = project(seg.y1, seg.z1, cameraX - x, cameraY, cz);
    seg.p2 = project(seg.y2, seg.z2, cameraX - x - dx, cameraY, cz);
    x += dx;
    dx += seg.curve;
    if (seg.p1.camZ <= CFG.cameraDepth || seg.p2.y >= seg.p1.y || seg.p2.y >= maxY) continue;
    drawSegment(seg, th);
    maxY = seg.p2.y;
  }

  // Objetos e adversários, de trás para a frente (Fase 3.4)
  for (let n = count - 1; n > 0; n--) {
    const seg = t.segments[(base.index + n) % t.segments.length];
    if (seg.p1.camZ <= CFG.cameraDepth) continue;
    for (const o of seg.objects)
      drawClipped(SPR[o.k], seg.p1.x + seg.p1.w * o.off, seg.p1.y, o.w * seg.p1.scale * HALF_W, seg.clipY);
    for (const c of seg.cars) {
      const k = clamp01((c.z - seg.z1) / CFG.segmentLength);
      const scale = lerp(seg.p1.scale, seg.p2.scale, k);
      const cx = lerp(seg.p1.x, seg.p2.x, k) + scale * c.x * CFG.roadWidth * HALF_W;
      drawClipped(carSprites(c.look)[c.steer + 1], cx, lerp(seg.p1.y, seg.p2.y, k), CFG.carWorldWidth * scale * HALF_W, seg.clipY);
    }
  }

  // Carro do jogador, com trepidação na grama, chamas do nitro e poeira
  const bounce = p.offRoad && car.speed > 1 ? (Math.random() < 0.5 ? 1 : 0) : 0;
  const pw = CFG.carWorldWidth * (CFG.cameraDepth / CFG.playerZ) * HALF_W;
  const shake = r.shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
  const img = carSprites(PLAYER)[car.steer + 1];
  const ph = pw * img.height / img.width, k = pw / img.width;
  if (p.cond.nitroTime > 0 && r.state === 'racing') {
    const len = 4 + Math.random() * 5;
    for (const ex of [-9, 9]) {
      ctx.fillStyle = '#ffd24a'; ctx.fillRect(Math.round(HALF_W + (ex + car.steer * 2) * k - 2), Math.round(H - 6 * k - bounce), 4, Math.round(len));
      ctx.fillStyle = '#ff7a1a'; ctx.fillRect(Math.round(HALF_W + (ex + car.steer * 2) * k - 1), Math.round(H - 6 * k - bounce + len), 2, 3);
    }
  }
  drawClipped(img, HALF_W + shake, H - bounce, pw, 0);
  if (p.offRoad && car.speed > 5 * KMH) {
    ctx.fillStyle = th.grass[0];
    for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(HALF_W + (Math.random() - 0.5) * pw * 1.2), Math.round(H - Math.random() * ph * 0.5), 2, 2);
  }
  if (r.shake > 0) r.shake -= dt;
}

// ------------------------------------------------------------------ HUD (Fase 7.1)
const hud = {
  pos: $('h-pos'), posTotal: $('h-pos-total'), lap: $('h-lap'), time: $('h-time'), damage: $('h-damage'), nitro: $('h-nitro'),
  fuel: $('h-fuel'), tire: $('h-tire'), speed: $('h-speed'), gear: $('h-gear'), rpm: $('h-rpm'), center: $('h-center'),
};
const RPM_CELLS = 14;
hud.rpm.innerHTML = '<i></i>'.repeat(RPM_CELLS);
const rpmCells = [...hud.rpm.children];
const fmtTime = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const setText = (el, v) => { if (el.textContent !== v) el.textContent = v; };

function updateHud(r) {
  const p = r.player, c = p.cond;
  setText(hud.pos, 'P' + r.position);
  setText(hud.posTotal, '/' + r.cars.length);
  setText(hud.lap, `VOLTA ${clamp(p.car.laps + 1, 1, r.laps)}/${r.laps}`);
  setText(hud.time, fmtTime(r.time));
  setText(hud.damage, `DANO ${Math.floor(c.damage)}%`);
  setText(hud.nitro, c.nitroTime > 0 ? 'NITRO!' : 'NITRO ' + '●'.repeat(c.nitro) + '○'.repeat(CFG.nitroCharges - c.nitro));
  hud.damage.style.color = c.damage >= 60 ? '#ff6a5a' : '';
  hud.fuel.style.width = (c.fuel / CFG.fuelCapacity * 100) + '%';
  hud.fuel.style.background = c.fuel < 15 ? '#ff6a5a' : '';
  hud.tire.style.width = ((1 - c.tireWear) * 100) + '%';
  setText(hud.speed, String(Math.round(p.car.speed / KMH)));
  setText(hud.gear, `${p.gear}ª ${p.auto ? 'A' : 'M'}`);
  const lit = Math.round(p.rpm * RPM_CELLS);
  rpmCells.forEach((cell, i) => { cell.className = i < lit ? (i >= RPM_CELLS - 3 ? 'on hot' : 'on') : ''; });

  let msg = '', big = false;
  if (r.state === 'countdown') { msg = String(Math.ceil(r.countdown)); big = true; }
  else if (r.state === 'finished') msg = p.car.retired ? 'ABANDONO' : 'BANDEIRADA!';
  else if (r.time < 1) { msg = 'VAI!'; big = true; }
  else if (r.pit.active) msg = `BOX\nCOMB. ${Math.floor(c.fuel)}%  PNEUS ${Math.floor(clamp01(r.pit.timer / CFG.pitTireChangeSeconds) * 100)}%`;
  else if (c.fuel <= 0) msg = 'SEM COMBUSTÍVEL';
  else if (c.fuel < 15 && (r.time % 1) < 0.6) msg = 'COMBUSTÍVEL BAIXO';
  else if (p.car.laps === r.laps - 1 && r.lastLapMsg > 0) msg = 'ÚLTIMA VOLTA';
  setText(hud.center, msg);
  hud.center.classList.toggle('big', big);
}

// ------------------------------------------------------------------ overlay
const overlay = $('overlay'), modal = $('modal');
function showModal(html, buttons) {
  modal.innerHTML = html + '<div class="buttons"></div>';
  const box = modal.querySelector('.buttons');
  for (const [label, cls, fn] of buttons) {
    const b = document.createElement('button');
    b.className = 'btn ' + cls; b.textContent = label; b.onclick = fn;
    box.appendChild(b);
  }
  overlay.classList.remove('hidden');
  modalButtons = buttons;
}
let modalButtons = null;
function hideModal() { overlay.classList.add('hidden'); modalButtons = null; }

// ------------------------------------------------------------------ fluxo de telas
let screen = 'garage', race = null;

function startRace() {
  const setup = raceSetupFrom(save);
  if (FLAGS.has('short')) setup.laps = 1;
  race = createRace(setup);
  race.trackIndex = setup.trackIndex;
  race.lastLapMsg = 0;
  screen = 'race';
  $('garage').classList.add('hidden');
  $('hud').classList.remove('hidden');
  hideModal();
  // #warp=N: adianta N segundos de corrida no piloto automático (testes e prints).
  const warp = parseFloat(flagValue('warp'));
  for (let t = 0; warp > 0 && t < warp && race.state !== 'finished'; t += STEP) raceStep(race, STEP, autopilot(race));
}

function showResults() {
  const r = race, me = r.results.find(x => x.isPlayer);
  const prize = me.retired ? 0 : (CFG.prizeByPosition[me.position - 1] || 0);
  const pts = me.retired ? 0 : (CFG.pointsByPosition[me.position - 1] || 0);
  const rows = r.results.map(x => {
    const time = x.retired ? 'abandonou' : x.finishTime < 0 ? 'faltava(m) ' + (r.laps - r.cars.find(c => c.name === x.driver).laps) + ' volta(s)' : fmtTime(x.finishTime);
    const p = x.retired ? '' : (CFG.pointsByPosition[x.position - 1] ? '+' + CFG.pointsByPosition[x.position - 1] : '');
    return `<tr class="${x.isPlayer ? 'me' : ''}"><td>${x.position}.</td><td>${x.driver}</td><td>${time}</td><td>${p}</td></tr>`;
  }).join('');
  const sum = me.retired ? 'Abandono: sem prêmio e sem pontos.' : `${me.position}º lugar · prêmio $ ${prize.toLocaleString('pt-BR')} · ${pts} ponto(s)`;
  showModal(`<h2>${r.def.gp.toUpperCase()} · RESULTADO</h2><table>${rows}</table><div class="sum">${sum}</div>`,
    [['Continuar', '', () => {
      applyRaceResult(save, r.results, r.player.cond.damage);
      storeSave();
      race = null;
      showGarage();
    }]]);
}

function pauseRace() {
  race.prevState = race.state;
  race.state = 'paused';
  showModal('<h2>PAUSA</h2>', [
    ['Continuar', '', resumeRace],
    ['Desistir da corrida', 'red', () => { race.state = race.prevState; retirePlayer(race); hideModal(); }],
  ]);
}
function resumeRace() { race.state = race.prevState; hideModal(); }

// ------------------------------------------------------------------ garagem (Fase 9.2)
let shopCategory = 0;
const iconCache = new Map();
function partIcon(p) {
  if (!iconCache.has(p.id)) iconCache.set(p.id, drawPartIcon(p.cat, p.tier));
  return iconCache.get(p.id);
}

function describePart(p) {
  const d = [];
  if (p.speed) d.push(`${p.speed > 0 ? '+' : ''}${p.speed} km/h`);
  if (p.accel) d.push(`+${p.accel} acel.`);
  if (p.grip) d.push(`+${Math.round(p.grip * 100)}% aderência`);
  if (p.durability) d.push(`${Math.round(p.durability * 100)}% menos dano`);
  if (p.gears && p.tier > 1) d.push(`${p.gears} marchas`);
  if (p.fuel && p.fuel !== 1) d.push(`consumo ×${p.fuel}`);
  if (p.wear && p.wear !== 1) d.push(`desgaste ×${p.wear}`);
  return d.length ? d.join(' · ') : 'peça de série';
}

function showGarage() {
  screen = 'garage';
  $('hud').classList.add('hidden');
  $('garage').classList.remove('hidden');
  hideModal();
  refreshGarage();
}

function refreshGarage() {
  const money = n => '$ ' + n.toLocaleString('pt-BR');
  $('g-money').textContent = money(save.money);
  const over = seasonOver(save);
  $('g-season').textContent = over ? `Temporada ${save.season} encerrada` : `Temporada ${save.season} · GP ${save.raceIndex + 1}/${TRACKS.length}`;

  const me = save.lastResults.find(r => r.isPlayer);
  const last = !me ? '' : me.retired ? 'Última corrida: abandono' : `Última: ${me.position}º · +${money(save.lastPrize)} · +${save.lastPoints} pts`;
  if (over) {
    $('g-next').innerHTML = `<div class="gp">FIM DE TEMPORADA</div><div class="name">Campeão: ${sortedStandings(save)[0].driver}</div><div class="last">${last}</div>`;
  } else {
    const t = TRACKS[save.raceIndex], len = buildTrack(t, save.raceIndex).length / 100000;
    $('g-next').innerHTML = `<div class="gp">${t.gp.toUpperCase()}</div><div class="name">${t.name}</div>` +
      `<div class="info">${t.laps} voltas · ${len.toFixed(2)} km por volta</div><div class="last">${last}</div>`;
  }

  $('g-standings').innerHTML = sortedStandings(save).map((s, i) =>
    `<tr class="${s.isPlayer ? 'me' : ''}"><td>${i + 1}. ${s.driver}</td><td>${s.points}</td></tr>`).join('');

  // Loja
  $('g-tabs').innerHTML = '';
  CATEGORIES.forEach((name, i) => {
    const b = document.createElement('button');
    b.textContent = name; b.className = i === shopCategory ? 'on' : '';
    b.onclick = () => { shopCategory = i; refreshGarage(); };
    $('g-tabs').appendChild(b);
  });
  const list = $('g-parts');
  list.innerHTML = '';
  for (const p of PARTS.filter(p => p.cat === shopCategory)) {
    const owned = save.owned.includes(p.id), equipped = save.equipped[p.cat] === p.id;
    const row = document.createElement('div');
    row.className = 'part';
    row.appendChild(cloneCanvas(partIcon(p)));
    const info = document.createElement('div');
    info.innerHTML = `<div class="n">${p.name}</div><div class="d">${describePart(p)}</div>`;
    row.appendChild(info);
    const cell = document.createElement('div');
    const b = document.createElement('button');
    b.textContent = equipped ? 'INSTALADA' : owned ? 'INSTALAR' : 'COMPRAR';
    b.className = equipped ? 'equipped' : owned ? 'owned' : '';
    b.disabled = !equipped && !owned && save.money < p.price;
    b.onclick = () => {
      if (equipped) return;
      if (owned) equipPart(save, p); else buyPart(save, p);
      storeSave(); refreshGarage();
    };
    cell.appendChild(b);
    if (!owned) cell.insertAdjacentHTML('beforeend', `<span class="price">${money(p.price)}</span>`);
    row.appendChild(cell);
    list.appendChild(row);
  }

  // Carro e números
  const gc = $('g-car').getContext('2d');
  gc.clearRect(0, 0, 64, 36);
  gc.drawImage(carSprites(PLAYER)[1], 0, 0);
  const s = currentStats(save);
  $('g-stats').innerHTML = [
    ['Vel. máxima', `${s.maxSpeedKmh} km/h`], ['Aceleração', s.accelerationKmh], ['Aderência', `${Math.round(s.grip * 100)}%`],
    ['Marchas', s.gearCount], ['Resistência', `${Math.round(s.durability * 100)}%`], ['Consumo', `×${s.fuelConsumption.toFixed(2)}`],
  ].map(([a, b]) => `<div><span>${a}</span><span>${b}</span></div>`).join('');

  const cost = repairCost(save);
  $('g-repair-text').textContent = save.damage > 0 ? `Dano ${Math.floor(save.damage)}% · conserto ${money(cost)}` : 'Carro sem dano';
  $('g-repair').disabled = !(save.damage > 0 && save.money >= cost);
  $('g-gearbox').textContent = 'Câmbio: ' + (save.automatic ? 'AUTOMÁTICO' : 'MANUAL');
  $('g-race').textContent = over ? 'NOVA TEMPORADA ▶' : 'CORRER ▶';
}

function cloneCanvas(src) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}

$('g-repair').onclick = () => { repairCar(save); storeSave(); refreshGarage(); };
$('g-gearbox').onclick = () => { save.automatic = !save.automatic; storeSave(); refreshGarage(); };
$('g-race').onclick = () => {
  if (seasonOver(save)) { startNextSeason(save); storeSave(); refreshGarage(); return; }
  startRace();
};

// ------------------------------------------------------------------ loop
const STEP = 1 / 60;
let acc = 0, last = performance.now();

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const input = readInput();

  if (screen === 'garage') {
    if (input.confirm && overlay.classList.contains('hidden')) $('g-race').click();
    drawGarageBackdrop();
  } else if (race) {
    if (modalButtons && input.confirm) modalButtons[0][2]();
    else if (input.pause && race.state !== 'finished') { if (race.state === 'paused') resumeRace(); else pauseRace(); }

    if (race.state !== 'paused') {
      acc += dt;
      let first = true;
      const prevLaps = race.player.car.laps, prevDamage = race.player.cond.damage;
      while (acc >= STEP) {
        const inp = FLAGS.has('auto') ? autopilot(race) : input;
        raceStep(race, STEP, first ? inp : Object.assign({}, inp, { nitro: false, up: false, down: false }));
        first = false;
        acc -= STEP;
      }
      if (race.player.cond.damage > prevDamage + 0.5) race.shake = 0.25;
      if (race.player.car.laps !== prevLaps && race.player.car.laps === race.laps - 1) race.lastLapMsg = 2.5;
      if (race.lastLapMsg > 0) race.lastLapMsg -= dt;
      if (race.state === 'finished' && !race.resultsShown) {
        race.resultsShown = true;
        setTimeout(() => { if (race) showResults(); }, 1500);
      }
    } else acc = 0;
    if (race) { renderRace(race, dt); updateHud(race); }
  }
  requestAnimationFrame(frame);
}

// Fundo do canvas enquanto a garagem (HTML) está por cima.
function drawGarageBackdrop() {
  ctx.fillStyle = '#16211a';
  ctx.fillRect(0, 0, W, H);
}

// ------------------------------------------------------------------ escala da tela
function fit() {
  const scale = Math.min(innerWidth / 640, innerHeight / 360);
  const app = $('app');
  app.style.transform = `scale(${scale})`;
  app.style.left = Math.round((innerWidth - 640 * scale) / 2) + 'px';
  app.style.top = Math.round((innerHeight - 360 * scale) / 2) + 'px';
}
addEventListener('resize', fit);
fit();

if (FLAGS.has('go') && !seasonOver(save)) startRace(); else showGarage();
requestAnimationFrame(frame);
