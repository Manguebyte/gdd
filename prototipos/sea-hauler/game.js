// Sea Hauler — tela, entrada e HUD do protótipo.
// POR QUE: sim.js tem as regras; aqui fica só o que o jogador vê e faz.
// ESTRATÉGIA: o mundo é desenhado num canvas com a mesma projeção isométrica
// do guia Unity (IsoProjection, Fase 1): 1 metro do plano = losango de 32×16 px.
// O plano agora é o mar: as ondas ficam presas a ele, então correm para trás
// quando o navio anda. Cada objeto tem um desenho vetorial; quando existir
// sprite PixelLab em Sprites/SeaHauler/, ele é usado no lugar. HUD e telas são
// HTML por cima do canvas.
(() => {
  'use strict';
  const { SAILS, COPPER, RIGGING, CREW, PORT, LEG_TYPES, WEAPONS, WEAPON_ORDER, ABILITIES } = window.SEA_DATA;
  const { Sim, autoPlay, levelMult } = window.SEA;

  // A altura lógica é fixa (720). A largura acompanha a tela entre 16:9 e
  // ~21:9, para celulares largos não ficarem com faixas pretas dos lados.
  let W = 1280;
  const H = 720;
  // Toque (celular/tablet): áreas de toque maiores, sem hover e textos de toque.
  const TOUCH = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const HW = 16, HH = 8;          // meia largura / meia altura de 1 metro do plano, em px
  const CAM_Y = H * (TOUCH ? 0.5 : 0.58); // no toque a barra de baixo é maior: o navio sobe um pouco
  const DECK_H = 10;              // altura do convés (onde ficam as portinholas), em px
  const ZOOM = 1.25;              // aproximação da câmera (tudo é desenhado em escala 1 e ampliado)
  const FULL = SAILS.length - 1;

  // Atalhos de desenvolvimento: index.html#short,rich,unlock,boss,auto,port
  const flags = new Set(location.hash.replace('#', '').toLowerCase().split(/[,&+]/).filter(Boolean));
  // #warp30: quando o primeiro trecho começa, simula 30 s de uma vez (com o piloto automático).
  const warpFlag = [...flags].find((f) => /^warp\d+$/.test(f));
  let warpSeconds = warpFlag ? +warpFlag.slice(4) : 0;
  // #type=reefs: o primeiro trecho da run é desse tipo (para testar cada padrão).
  const typeFlag = [...flags].find((f) => f.startsWith('type='));

  // ------------------------------------------------------------------ Save (MetaProgress)
  const SAVE_KEY = 'seahauler.meta';
  function loadMeta() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || undefined; } catch (e) { return undefined; }
  }
  function saveMeta(meta) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(meta)); } catch (e) { /* sem save neste navegador */ }
  }

  const sim = new Sim({
    meta: loadMeta(),
    saveMeta,
    unlockAll: flags.has('unlock'),
    config: flags.has('short') ? { legLength: 150 } : {},
  });
  const cfg = sim.cfg;

  // ------------------------------------------------------------------ DOM
  const $ = (id) => document.getElementById(id);
  const app = $('app'), canvas = $('view');
  let ctx = canvas.getContext('2d');
  const hud = $('hud'), overlay = $('overlay'), modal = $('modal');
  const shopEl = $('shop'), abilitiesEl = $('abilities'), panel = $('panel');
  const sailsEl = $('sails'), upgradesEl = $('upgrades');

  let scale = 1, k = 1;
  function fit() {
    W = Math.round(Math.min(1700, Math.max(1280, H * innerWidth / innerHeight)));
    app.style.width = `${W}px`;
    canvas.style.width = `${W}px`;
    scale = Math.min(innerWidth / W, innerHeight / H);
    const ox = (innerWidth - W * scale) / 2, oy = (innerHeight - H * scale) / 2;
    app.style.transform = `translate(${ox}px, ${oy}px) scale(${scale})`;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * scale * dpr);
    canvas.height = Math.round(H * scale * dpr);
    k = canvas.width / W;
  }
  addEventListener('resize', fit);
  addEventListener('orientationchange', () => setTimeout(fit, 200));
  document.body.classList.toggle('touch', TOUCH);
  fit();

  // ------------------------------------------------------------------ Estado da tela
  const ui = { pending: null, selected: null, hover: null };
  let paused = false;
  let time = 0;
  let overlayHold = 0;      // segundos até mostrar a tela por cima (depois do fim do trecho)
  let shownScreen = undefined;
  let runStartShop = [];    // armas liberadas no começo da run (para avisar desbloqueios)
  let autoTimer = 0;
  let refMode = false;      // exportando referências para o PixelLab (#refs): sem efeitos
  let lightning = 0;        // clarão da rajada

  const cam = { gx: 0 };
  let camWX = 0, camWY = 0, shake = 0, shakeX = 0, shakeY = 0;
  const portScreen = [];
  const muzzle = sim.gunports.map(() => 0);
  let particles = [], shots = [], floaters = [];

  // ------------------------------------------------------------------ Projeção
  // Plano (metros, altura em px) → tela. Mesma conta do IsoProjection.ToScreen.
  function P(gx, gy, h = 0) {
    return [(gx - gy) * HW - camWX + W / 2 + shakeX, -(gx + gy) * HH - h - camWY + CAM_Y + shakeY];
  }
  // Tela (já com zoom) → coordenadas sem zoom, que são as de P().
  function unzoom(sx, sy) {
    return [W / 2 + (sx - W / 2) / ZOOM, CAM_Y + (sy - CAM_Y) / ZOOM];
  }
  function toGround(sx, sy) {
    [sx, sy] = unzoom(sx, sy);
    const a = (sx - W / 2 + camWX) / HW, b = -(sy - CAM_Y + camWY) / HH;
    return [(a + b) / 2, (b - a) / 2];
  }

  // ------------------------------------------------------------------ Desenho básico
  function poly(points, fill, stroke = 'rgba(16,10,6,.6)') {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function line(a, b, color, width = 1) {
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function ellipse(p, rx, ry, fill, stroke) {
    ctx.beginPath(); ctx.ellipse(p[0], p[1], rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function glow(p, r, color, alpha = 0.6) {
    const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
  }
  // Três tons de uma cor: topo claro, lateral direita média, traseira escura.
  function tones(hex, flash) {
    if (flash) return { top: '#ffffff', right: '#f6efe0', rear: '#e0d6c0' };
    return { top: shade(hex, 1.18), right: shade(hex, 0.86), rear: shade(hex, 0.6) };
  }
  // Caixa isométrica: L no eixo da rota, Wd para o lado, altura em px.
  // Só aparecem a traseira (-x), a lateral direita (-y) e o topo.
  function box(gx, gy, L, Wd, hgt, base, c) {
    const x0 = gx - L / 2, x1 = gx + L / 2, y0 = gy - Wd / 2, y1 = gy + Wd / 2;
    const A = P(x0, y0, base), B = P(x1, y0, base), D = P(x0, y1, base);
    const At = P(x0, y0, base + hgt), Bt = P(x1, y0, base + hgt), Ct = P(x1, y1, base + hgt), Dt = P(x0, y1, base + hgt);
    poly([D, A, At, Dt], c.rear);
    poly([A, B, Bt, At], c.right);
    poly([At, Bt, Ct, Dt], c.top);
    return { x0, x1, y0, y1, top: base + hgt };
  }
  // Casco de navio: uma caixa com a proa em ponta (a ponta fica em +x).
  function hull(gx, gy, L, Wd, hgt, base, c, bow = 0.25) {
    const x0 = gx - L / 2, x1 = gx + L / 2 - L * bow, y0 = gy - Wd / 2, y1 = gy + Wd / 2, tip = gx + L / 2;
    const A = P(x0, y0, base), B = P(x1, y0, base), T = P(tip, gy, base + 2), D = P(x0, y1, base);
    const At = P(x0, y0, base + hgt), Bt = P(x1, y0, base + hgt), Tt = P(tip + 0.2, gy, base + hgt + 2);
    const Ct = P(x1, y1, base + hgt), Dt = P(x0, y1, base + hgt);
    poly([D, A, At, Dt], c.rear);
    poly([A, B, Bt, At], c.right);
    poly([B, T, Tt, Bt], c.right);
    poly([At, Bt, Tt, Ct, Dt], c.top);
    return { x0, x1: tip, y0, y1, top: base + hgt };
  }
  // Vela redonda (de pano quadrado), em pé, atravessando o navio na posição x.
  // bulge: quanto o vento empurra o meio dela para frente.
  function squareSail(x, gy, halfY, hb, ht, bulge, color, flash) {
    const pts = [P(x, gy - halfY, hb), P(x + bulge, gy, hb + 1), P(x, gy + halfY, hb), P(x, gy + halfY * 0.9, ht), P(x + bulge * 0.5, gy, ht), P(x, gy - halfY * 0.9, ht)];
    poly(pts, flash ? '#ffffff' : color, 'rgba(60,44,30,.7)');
  }
  // Vela latina (de proa a popa), em pé, ao longo do navio.
  function foreAftSail(x0, x1, y, hb, ht, color, flash) {
    poly([P(x0, y, hb), P(x1, y, hb), P(x1 - (x1 - x0) * 0.15, y, ht * 0.8 + hb * 0.2), P(x0, y, ht)], flash ? '#ffffff' : color, 'rgba(20,14,10,.7)');
  }

  // ------------------------------------------------------------------ Sprites PixelLab
  // POR QUE: a arte final é pixel art do PixelLab (Sprites/SeaHauler/). Cada
  // sprite é um redesenho da forma vetorial, no mesmo ângulo e tamanho, então
  // basta colar o ponto de apoio (âncora, em px do PNG) no plano.
  // ESTRATÉGIA: 1 px de arte = 1 px da tela lógica, ampliada sem suavização.
  // Sprite que não carregou (ou #vector na URL) cai de volta no desenho vetorial.
  const SPRITE_BASE = '../../Sprites/SeaHauler/';
  // Nome → { path, ax, ay }. Gerado por Sprites/SeaHauler/_tools/baixar.py.
  const SPRITES = {};
  for (const [name, sp] of Object.entries(window.SEA_SPRITES || {})) SPRITES[name] = Object.assign({}, sp);
  const TURRET_DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
  const SPRITE_PARTS = { galleon: ['galleon-bow', 'galleon-hull'] }; // desenhadas nessa ordem
  const hasSprite = (name) => (SPRITE_PARTS[name] || [name]).every((n) => SPRITES[n] && SPRITES[n].img);
  if (!flags.has('vector')) {
    for (const sp of Object.values(SPRITES)) {
      const img = new Image();
      img.onload = () => {
        // Versão branca do sprite, para a piscada de dano.
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        g.globalCompositeOperation = 'source-in';
        g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        sp.white = c;
        sp.img = img;
      };
      img.src = `${SPRITE_BASE}${sp.path}.png`;
    }
  }
  const ART = 1;            // px de arte por px da tela lógica
  const LOW = ZOOM * ART;   // px de arte por px sem zoom
  // Desenha um sprite com a âncora no ponto do plano. Devolve false se não houver sprite.
  function drawSprite(name, gx, gy, h = 0, flash = false) {
    if (refMode) return false;
    const sp = SPRITES[name];
    if (!sp || !sp.img) return false;
    const p = P(gx, gy, h);
    const lx = Math.round(p[0] * LOW + (W / 2) * (1 - ZOOM) * ART);
    const ly = Math.round(p[1] * LOW + CAM_Y * (1 - ZOOM) * ART);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(flash ? sp.white : sp.img, lx - sp.ax, ly - sp.ay);
    ctx.restore();
    return true;
  }
  // Direção da arma: a mais perto, entre as 8 da tela, da direção da mira no plano.
  function turretSprite(id, aim) {
    const sx = (aim[0] - aim[1]) * HW, sy = -(aim[0] + aim[1]) * HH; // vetor da mira na tela
    const ang = Math.atan2(sx, sy); // 0 = para baixo (south), cresce para a direita (east)
    const i = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
    return `turret-${id}-${TURRET_DIRS[i]}`;
  }

  function hash(ix, iy, salt = 0) {
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(salt, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  // ------------------------------------------------------------------ Mar, ilhas, boias, faróis
  const stormy = () => sim.settings && sim.settings.squalls && sim.phase === 'leg';

  // O mar é o plano: as ondas ficam presas a ele (a cada 2 m, uma crista que
  // brilha e some), então correm para trás quando o navio anda.
  function drawSea(b) {
    const storm = stormy();
    const g = ctx.createLinearGradient(0, 0, W * 0.25, H);
    if (storm) { g.addColorStop(0, '#0e2430'); g.addColorStop(1, '#16343e'); }
    else { g.addColorStop(0, '#0f4a6a'); g.addColorStop(0.6, '#155a7a'); g.addColorStop(1, '#1a6a84'); }
    ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);

    const CELL = 2;
    const x0 = Math.floor(b.x0 / CELL) - 1, x1 = Math.ceil(b.x1 / CELL) + 1;
    const y0 = Math.floor(b.y0 / CELL) - 1, y1 = Math.ceil(b.y1 / CELL) + 1;
    for (let ix = x0; ix <= x1; ix++) {
      for (let iy = y0; iy <= y1; iy++) {
        const r = hash(ix, iy, 7);
        if (r > (storm ? 0.75 : 0.55)) continue;
        const gx = ix * CELL + hash(ix, iy, 8) * CELL, gy = iy * CELL + hash(ix, iy, 9) * CELL;
        const phase = Math.sin(time * (1.2 + r * 1.5) + ix * 0.7 + iy * 1.3);
        if (phase < 0.1) continue;
        const p = P(gx, gy, 0);
        ctx.globalAlpha = phase * (storm ? 0.5 : 0.35);
        ctx.fillStyle = r < 0.12 ? '#e8f8ff' : r < 0.3 ? '#7ac8e0' : '#3a8aa8';
        const w = 4 + Math.round(r * 8);
        ctx.fillRect(Math.round(p[0] - w / 2), Math.round(p[1]), w, 1);
        if (r < 0.2) ctx.fillRect(Math.round(p[0] - w / 2 + 2), Math.round(p[1] - 1), w - 4, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Ilhas ao longe, fora da rota (|y| > 24), presas ao mar: dão profundidade.
  function pushIslands(items, b) {
    const STEP = 70;
    for (let i = Math.floor(b.x0 / STEP) - 1; i <= Math.ceil(b.x1 / STEP) + 1; i++) {
      for (const side of [1, -1]) {
        if (hash(i, side, 11) > 0.6) continue;
        const gx = i * STEP + hash(i, side, 12) * STEP;
        const gy = side * (26 + hash(i, side, 13) * 14);
        const r = 3 + hash(i, side, 14) * 5;
        items.push({ key: gx + gy, draw: () => drawIsland(gx, gy, r, hash(i, side, 15)) });
      }
    }
  }
  function drawIsland(gx, gy, r, seed) {
    const n = 10, sand = [], grass = [], foam = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, rr = r * (0.8 + 0.3 * hash(i, Math.floor(seed * 999), 3));
      foam.push(P(gx + Math.cos(a) * rr * 1.15, gy + Math.sin(a) * rr * 1.15, 0));
      sand.push(P(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr, 2));
      grass.push(P(gx + Math.cos(a) * rr * 0.75, gy + Math.sin(a) * rr * 0.75, 6));
    }
    poly(foam, 'rgba(220,245,255,.35)', null);
    poly(sand, '#d8c48a');
    poly(grass, '#4a7a3a');
    // Coqueiros.
    for (let i = 0; i < 3; i++) {
      const px = gx + (hash(i, Math.floor(seed * 99), 5) - 0.5) * r, py = gy + (hash(i, Math.floor(seed * 99), 6) - 0.5) * r;
      const base = P(px, py, 6), top = P(px, py, 30);
      line(base, [top[0] + 3, top[1]], '#6a4a2a', 3);
      for (let j = 0; j < 5; j++) { const a = j / 5 * Math.PI * 2; line([top[0] + 3, top[1]], [top[0] + 3 + Math.cos(a) * 12, top[1] + Math.sin(a) * 6 + 3], '#3a7a2a', 3); }
    }
  }

  // Boias a cada 100 m nos dois lados da rota (vermelhas a bombordo, verdes a estibordo).
  function pushStaticItems(items, b) {
    const len = cfg.legLength;
    for (let m = 100; m < len; m += 100) {
      if (m < b.x0 - 10 || m > b.x1 + 10) continue;
      items.push({ key: m + 8, draw: () => drawBuoy(m, 8, '#c83a2a', null) });
      items.push({ key: m - 8, draw: () => drawBuoy(m, -8, '#2a9a4a', `${len - m} m`) });
    }
    const boss = sim.settings && sim.settings.hasBoss;
    if (len > b.x0 - 20 && len < b.x1 + 20) {
      if (boss) items.push({ key: len + 14, draw: () => drawHarbor(len + 6, 14) });
      else items.push({ key: len + 12, draw: () => drawLighthouse(len, 12, 'FIM DO TRECHO') });
    }
    if (b.x0 < 0 && b.x1 > -20) items.push({ key: -6 + 12, draw: () => drawLighthouse(-6, 12, 'A') });
    pushIslands(items, b);
  }
  function drawBuoy(gx, gy, color, label) {
    const bob = Math.sin(time * 2 + gx) * 1.5;
    ellipse(P(gx, gy, 0), 7, 3.5, 'rgba(230,248,255,.35)');
    box(gx, gy, 0.5, 0.5, 12, bob, tones(color));
    const on = Math.sin(time * 4 + gx) > 0;
    ellipse(P(gx, gy, 16 + bob), 2.5, 2.5, on ? '#fff2b0' : '#6a5a2a');
    if (on) glow(P(gx, gy, 16 + bob), 12, '#ffe8a0', 0.5);
    if (label) {
      const p = P(gx, gy, 0);
      ctx.fillStyle = '#e8f6ff'; ctx.font = '700 12px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(label, p[0], p[1] + 14);
    }
  }
  // Farol numa pedra ao lado da rota, no começo (A) e no fim de cada trecho.
  function drawLighthouse(gx, gy, text) {
    const rock = [];
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; rock.push(P(gx + Math.cos(a) * 2.6, gy + Math.sin(a) * 2.6, 4)); }
    poly(rock.map((p) => [p[0], p[1] + 4]), 'rgba(220,245,255,.35)', null);
    poly(rock, '#5a5450');
    box(gx, gy, 1.4, 1.4, 50, 4, tones('#e8e0d0'));
    for (const h of [18, 36]) { const a = P(gx - 0.7, gy - 0.7, h), c = P(gx + 0.7, gy - 0.7, h), d = P(gx - 0.7, gy + 0.7, h); line(d, a, '#b83a2a', 5); line(a, c, '#b83a2a', 5); }
    box(gx, gy, 1.0, 1.0, 10, 54, tones('#3a3430'));
    const lamp = P(gx, gy, 60);
    glow(lamp, 30, '#ffe8a0', 0.55 + 0.25 * Math.sin(time * 3));
    ellipse(lamp, 4, 4, '#fff6c8');
    const p = P(gx, gy, 0);
    ctx.fillStyle = '#fff2c8'; ctx.font = '22px "IM Fell English SC", serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#0a1a24'; ctx.strokeText(text, p[0], p[1] + 30); ctx.fillText(text, p[0], p[1] + 30);
  }
  // O porto de destino: cais, armazéns e um forte com a bandeira.
  function drawHarbor(gx, gy) {
    const land = [P(gx - 6, gy - 3, 3), P(gx + 30, gy - 3, 3), P(gx + 30, gy + 30, 3), P(gx - 6, gy + 30, 3)];
    poly(land.map((p) => [p[0], p[1] + 4]), 'rgba(220,245,255,.35)', null);
    poly(land, '#c8b07a');
    box(gx + 2, gy - 2, 10, 2, 4, 0, tones('#7a5a3a'));            // cais
    box(gx + 4, gy + 4, 4, 3, 22, 3, tones('#b8a088'));              // armazém
    box(gx - 2, gy + 6, 3, 4, 18, 3, tones('#a87a5a'));
    const fort = box(gx + 10, gy + 10, 6, 6, 30, 3, tones('#8a8278')); // forte
    for (let i = 0; i < 4; i++) box(fort.x0 + 0.6 + i * 1.6, fort.y0 + 0.4, 0.7, 0.7, 6, fort.top, tones('#8a8278'));
    const pole = P(gx + 10, gy + 10, fort.top);
    line(pole, [pole[0], pole[1] - 40], '#3a2a1a', 2);
    drawFlag([pole[0], pole[1] - 40], 20, 12);
    const p = P(gx, gy, 0);
    ctx.fillStyle = '#ffe2a0'; ctx.font = '26px "IM Fell English SC", serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#0a1a24'; ctx.strokeText('PORTO DE DESTINO', p[0], p[1] + 40); ctx.fillText('PORTO DE DESTINO', p[0], p[1] + 40);
  }
  // Bandeira da Marinha (um pavilhão azul com a cruz vermelha), em px de tela.
  function drawFlag(p, w, h) {
    const wave = Math.sin(time * 6) * 1.5;
    ctx.fillStyle = '#1a2a6a'; ctx.fillRect(p[0], p[1] + wave * 0.3, w, h);
    ctx.fillStyle = '#f2ece0'; ctx.fillRect(p[0] + w * 0.4, p[1], w * 0.2, h); ctx.fillRect(p[0], p[1] + h * 0.38, w, h * 0.24);
    ctx.fillStyle = '#c8202a'; ctx.fillRect(p[0] + w * 0.45, p[1], w * 0.1, h); ctx.fillRect(p[0], p[1] + h * 0.44, w, h * 0.12);
  }

  function visibleBounds() {
    const corners = [toGround(0, 0), toGround(W, 0), toGround(0, H), toGround(W, H)];
    const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }

  // Barris de pólvora boiando atrás do navio.
  function drawBarrels() {
    for (const b of sim.barrels) {
      const a = Math.min(1, b.life / 0.6);
      ctx.globalAlpha = a;
      for (let i = 0; i < 7; i++) {
        const gx = b.x + (hash(i, b.x | 0, 3) - 0.5) * b.size * 2;
        const gy = b.y + (hash(i, b.x | 0, 4) - 0.5) * cfg.laneHalfWidth * 1.6;
        const bob = Math.sin(time * 3 + i) * 1.5;
        ellipse(P(gx, gy, 0), 6, 3, 'rgba(230,248,255,.4)');
        box(gx, gy, 0.5, 0.5, 7, bob, tones('#8a5a2a'));
        line(P(gx - 0.25, gy - 0.25, bob + 3.5), P(gx + 0.25, gy - 0.25, bob + 3.5), '#3a2a1a', 1.5);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Arco de alcance da portinhola (prévia de compra ou arma selecionada).
  function drawRangePreview() {
    let g = null, def = null;
    if (ui.pending && ui.hover !== null && sim.gunports[ui.hover].isOpen && !sim.gunports[ui.hover].weapon) { g = sim.gunports[ui.hover]; def = WEAPONS[ui.pending]; }
    else if (ui.selected !== null && sim.gunports[ui.selected].weapon) { g = sim.gunports[ui.selected]; def = sim.gunports[ui.selected].weapon.def; }
    if (!g) return;
    const [gx, gy] = sim.gunportGround(g);
    const pts = [];
    const full = g.arc >= 360;
    const from = full ? 0 : g.facing - g.arc / 2, to = full ? 360 : g.facing + g.arc / 2;
    if (!full) pts.push(P(gx, gy, 0));
    for (let a = from; a <= to + 0.01; a += 6) {
      const r = a * Math.PI / 180;
      pts.push(P(gx + Math.cos(r) * def.range, gy + Math.sin(r) * def.range, 0));
    }
    ctx.setLineDash([6, 5]);
    poly(pts, 'rgba(255,230,150,.12)', 'rgba(255,236,170,.85)');
    ctx.setLineDash([]);
  }

  // ------------------------------------------------------------------ Rochedos
  function drawRock(r) {
    ellipse(P(r.x, r.y, 0), r.r * 22, r.r * 11, `rgba(230,248,255,${0.3 + 0.15 * Math.sin(time * 3 + r.seed * 9)})`);
    if (drawSprite(`rock-${1 + Math.floor(r.seed * 3)}`, r.x, r.y, 0, false)) return;
    drawRockVector(r);
  }
  function drawRockVector(r) {
    const n = 9, pts = [], top = [];
    for (let i = 0; i < n; i++) {
      const ang = i / n * Math.PI * 2;
      const rr = r.r * (0.75 + 0.35 * hash(i, Math.floor(r.seed * 1000), 9));
      pts.push(P(r.x + Math.cos(ang) * rr, r.y + Math.sin(ang) * rr, 0));
      top.push(P(r.x + Math.cos(ang) * rr * 0.6, r.y + Math.sin(ang) * rr * 0.6, r.r * 12));
    }
    poly(pts, '#3a3632');
    poly(top, '#6a645a');
    ellipse(P(r.x - r.r * 0.2, r.y + r.r * 0.15, r.r * 12), r.r * 4, r.r * 2, '#4a443e');
    ellipse(P(r.x + r.r * 0.25, r.y - r.r * 0.2, r.r * 12), r.r * 2.5, r.r * 1.2, '#8a8478');
    ellipse(P(r.x + r.r * 0.1, r.y, r.r * 12 + 1), r.r * 1.5, r.r * 0.8, '#e8e4d8'); // guano das gaivotas
  }

  // ------------------------------------------------------------------ O navio
  const SAIL_SPRITE = ['rig-reefed', 'rig-half', 'rig-full'];
  // As portinholas de bombordo (+y) e a proa ficam "atrás" do mastreame na tela.
  const isFarPort = (g) => g.offset[1] > 0 || g.offset[0] > 2.5;

  function drawShip() {
    const s = sim.ship;
    const gx = s.x, gy = 0;
    const bob = sim.running ? Math.sin(time * 2.2) * 1.2 : 0;
    const flash = s.flash > 0;
    if (!drawSprite('ship', gx, gy, bob, flash)) drawShipVector(gx, gy, bob, flash);
    drawPorts(true, bob);
    // O mastreame fica meio transparente enquanto o jogador mexe nas portinholas.
    const busy = ui.pending || ui.selected !== null || ui.hover !== null;
    ctx.globalAlpha = busy ? 0.4 : 1;
    const sail = sim.effectiveSail;
    if (!drawSprite(SAIL_SPRITE[sail], gx, gy, bob, flash)) drawRigVector(gx, gy, bob, sail, flash, s.torn > 0);
    if (s.torn > 0 && !refMode) drawRags(gx, gy, bob);
    ctx.globalAlpha = 1;
    drawPorts(false, bob);
    for (const e of sim.enemies) if (e.kind === 'boarder' && !e.removed) drawBoarder(e, DECK_H + bob);
  }

  function drawShipVector(gx, gy, base, flash) {
    const b = base - 4; // linha d'água: o casco afunda um pouco no mar
    const c = hull(gx, gy, 6.8, 1.9, 14, b, tones('#2a221c', flash), 0.18);
    if (!flash) {
      // Faixa ocre das portinholas (o "xadrez de Nelson") e as tampas pretas.
      line(P(c.x0, c.y0, b + 8), P(gx + 2.4, c.y0, b + 8), '#d8a838', 4);
      for (let i = 0; i < 8; i++) { const p = P(c.x0 + 0.5 + i * 0.7, c.y0, b + 8); ctx.fillStyle = '#1a1410'; ctx.fillRect(p[0] - 2, p[1] - 2, 4, 4); }
      line(P(c.x0, c.y0, b + 2), P(gx + 2.6, c.y0, b + 2), '#b87a3a', 1.5); // cobre na linha d'água
    }
    // Janelas da câmara do capitão, na popa.
    if (!flash) for (let i = 0; i < 4; i++) { const p = P(c.x0, c.y0 + 0.3 + i * 0.43, b + 9); ctx.fillStyle = '#ffd88a'; ctx.fillRect(p[0] - 1, p[1] - 2, 3, 3); }
    // Convés de madeira.
    plateDeck(gx, gy, c.top, flash);
    // Gurupés na proa.
    line(P(gx + 3.4, gy, c.top + 2), P(gx + 5.0, gy, c.top + 12), flash ? '#fff' : '#4a3424', 3);
    // Mastro da bandeira na popa.
    const pole = P(gx - 3.35, gy - 0.6, c.top);
    line(pole, [pole[0], pole[1] - 22], '#3a2a1a', 2);
    if (!flash) drawFlag([pole[0] - 1, pole[1] - 22], 14, 9);
  }
  function plateDeck(gx, gy, h, flash) {
    if (flash) return;
    for (let i = 0; i < 5; i++) line(P(gx - 1.8 + i * 1.0, gy - 0.9, h), P(gx - 1.8 + i * 1.0, gy + 0.9, h), 'rgba(40,24,12,.35)', 1);
  }

  // Mastros e velas. sail: 0 Rizadas (velas enroladas nas vergas), 1 Meio pano
  // (só as de cima), 2 Pano cheio (todas). Cada mastro é uma linha em pé.
  const MASTS = [{ x: 2.3, h: 74 }, { x: 0.8, h: 84 }, { x: -0.8, h: 64 }];
  function drawRigVector(gx, gy, base, sail, flash, torn) {
    const deck = base + 10;
    const cream = '#efe6d0';
    for (const m of MASTS) {
      const mx = gx + m.x;
      line(P(mx, gy, deck), P(mx, gy, deck + m.h), flash ? '#fff' : '#3a2a1a', 3);
      // Vergas (as traves das velas) em três alturas.
      const yards = [0.35, 0.62, 0.86].map((f) => deck + m.h * f);
      for (const y of yards) line(P(mx, gy - 1.3, y), P(mx, gy + 1.3, y), flash ? '#fff' : '#3a2a1a', 2);
      if (sail === 0 || torn) {
        // Velas enroladas: um rolo creme em cima de cada verga.
        for (const y of yards) line(P(mx, gy - 1.2, y + 2), P(mx, gy + 1.2, y + 2), flash ? '#fff' : '#d8ccb0', 4);
        continue;
      }
      const bulge = 0.35;
      squareSail(mx, gy, 1.25, yards[1] + 1, yards[2] - 1, bulge * 0.7, cream, flash);           // gávea
      squareSail(mx, gy, 1.0, yards[2] + 1, deck + m.h - 2, bulge * 0.5, cream, flash);           // joanete
      if (sail === FULL) squareSail(mx, gy, 1.4, deck + 12, yards[0] + 1, bulge, cream, flash);    // vela grande
      else line(P(mx, gy - 1.2, yards[0] + 2), P(mx, gy + 1.2, yards[0] + 2), flash ? '#fff' : '#d8ccb0', 4);
    }
    // Bujarrona: o triângulo entre o gurupé e o mastro de proa.
    if (sail > 0 && !torn) poly([P(gx + 4.8, gy, deck + 10), P(gx + 3.3, gy, deck + 6), P(gx + 2.5, gy, deck + 46)], flash ? '#ffffff' : cream, 'rgba(60,44,30,.7)');
  }
  // Velas rasgadas: trapos batendo nas vergas.
  function drawRags(gx, gy, base) {
    for (const m of MASTS) {
      for (let i = 0; i < 3; i++) {
        const p = P(gx + m.x, gy + (i - 1) * 0.8, base + 10 + m.h * 0.6);
        const sway = Math.sin(time * 12 + i + m.x) * 4;
        line(p, [p[0] + 6 + sway, p[1] + 10], '#e8dcc0', 2);
      }
    }
  }

  // Portinholas, armas e piratas a bordo, de trás para frente.
  function drawPorts(far, bob) {
    const order = sim.gunports.filter((g) => isFarPort(g) === far)
      .sort((a, b) => (b.offset[0] + b.offset[1]) - (a.offset[0] + a.offset[1]));
    for (const g of order) {
      const [sx, sy] = sim.gunportGround(g);
      portScreen[g.index] = P(sx, sy, DECK_H + bob);
      drawGunport(g, sx, sy, DECK_H + bob);
    }
  }

  function drawGunport(g, gx, gy, h) {
    const w = g.weapon;
    const p = P(gx, gy, h);
    const isHover = ui.hover === g.index, isSel = ui.selected === g.index;
    const sabotaged = g.saboteurs > 0;
    if (!g.isOpen) {
      // Fechada: tampa vermelha pregada.
      ellipse(p, 7, 3.5, isSel ? '#ffd84a' : isHover ? '#ffffff' : 'rgba(120,30,20,.85)', 'rgba(0,0,0,.6)');
      line([p[0] - 4, p[1]], [p[0] + 4, p[1]], '#2a1008', 1.5);
      if (isSel || isHover) { ctx.lineWidth = 2; ellipse(p, 11, 5.5, null, isSel ? '#ffd84a' : '#ffffff'); }
      return;
    }
    let ring = null;
    if (sabotaged) ring = Math.sin(time * 14) > 0 ? '#ff3b54' : '#7a1a2c';
    else if (isSel) ring = '#ffd84a';
    else if (ui.pending && !w) ring = `rgba(150,255,190,${0.6 + Math.sin(time * 8) * 0.35})`;
    else if (isHover) ring = '#ffffff';
    else if (!w) ring = 'rgba(255,240,200,.45)';
    if (!w) ellipse(p, 8, 4, 'rgba(20,12,6,.6)');
    if (ring) {
      ctx.lineWidth = isSel || sabotaged ? 2.5 : 2;
      ellipse(p, 11, 5.5, null, ring);
    }
    if (!w) {
      if (ui.pending && isHover) drawTurret(WEAPONS[ui.pending], { level: 1, aim: [Math.cos(g.facing * Math.PI / 180), Math.sin(g.facing * Math.PI / 180)], cooldown: 0 }, g, gx, gy, h, 0.5);
      return;
    }
    drawTurret(w.def, w, g, gx, gy, h, 1);
  }

  function drawTurret(def, w, g, gx, gy, h, alpha) {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * alpha;
    const aim = w.aim || [1, 0];
    const tip = (len, hh) => P(gx + aim[0] * len, gy + aim[1] * len, h + hh);
    if (!drawSprite(turretSprite(def.id, aim), gx, gy, h)) switch (def.kind) {
      case 'longgun': case 'chainshot': {
        box(gx, gy, 0.7, 0.6, 4, h, tones('#6a4a2a'));            // reparo (a carreta de madeira)
        line(P(gx - aim[0] * 0.3, gy - aim[1] * 0.3, h + 5), tip(1.4, 5), '#1a1a1e', 4);
        ellipse(tip(1.4, 5), 2, 2, '#0a0a0e');
        if (def.kind === 'chainshot') {
          for (const s of [-0.35, 0.35]) ellipse(P(gx - aim[1] * s, gy + aim[0] * s, h + 2), 2.5, 2.5, '#2a2a30', 'rgba(0,0,0,.5)');
          line(P(gx + aim[1] * 0.35, gy - aim[0] * 0.35, h + 2), P(gx - aim[1] * 0.35, gy + aim[0] * 0.35, h + 2), '#8a8a90', 1);
        }
        break;
      }
      case 'carronade': {
        box(gx, gy, 0.8, 0.7, 3, h, tones('#5a3a20'));
        line(P(gx - aim[0] * 0.2, gy - aim[1] * 0.2, h + 5), tip(0.8, 5), '#1a1a1e', 7);
        ellipse(tip(0.85, 5), 3.5, 3, '#0a0a0e');
        break;
      }
      case 'marines': {
        // Dois fuzileiros de casaca vermelha, com os mosquetes apontados.
        for (const s of [-0.25, 0.25]) {
          const bx = gx - aim[1] * s, by = gy + aim[0] * s;
          const feet = P(bx, by, h);
          ctx.fillStyle = '#e8e4dc'; ctx.fillRect(feet[0] - 2, feet[1] - 6, 4, 6);     // calças brancas
          ctx.fillStyle = '#b8202a'; ctx.fillRect(feet[0] - 3, feet[1] - 13, 6, 7);    // casaca
          ellipse([feet[0], feet[1] - 16], 2.5, 2.5, '#e8c8a0');
          ctx.fillStyle = '#1a1a1e'; ctx.fillRect(feet[0] - 4, feet[1] - 20, 8, 2);    // chapéu
          line([feet[0], feet[1] - 11], P(bx + aim[0] * 0.9, by + aim[1] * 0.9, h + 11), '#4a3424', 2);
        }
        break;
      }
    }
    if (muzzle[g.index] > 0 && def.kind !== 'marines') ellipse(tip(def.kind === 'carronade' ? 1.0 : 1.6, 5), 5, 4, '#ffe58a');
    if (w.firing && def.kind === 'marines' && Math.random() < 0.3) ellipse(tip(1.0, 11), 3, 2, '#fff2a0');
    // Nível: pontinhos dourados.
    for (let i = 1; i < (w.level || 1); i++) {
      const p = P(gx, gy, h + 22 + i * 5);
      poly([[p[0], p[1] - 3], [p[0] + 4, p[1]], [p[0], p[1] + 3], [p[0] - 4, p[1]]], '#f2b632', 'rgba(0,0,0,.6)');
    }
    ctx.globalAlpha = prev;
  }

  // Pirata a bordo: lenço vermelho, camisa listrada, um sabre.
  function drawBoarder(e, h) {
    const p = P(e.x, e.y, h);
    if (drawSprite('boarder', e.x, e.y, h, e.flash > 0)) { drawHpBar(p[0], p[1] - 32, e); return; }
    drawBoarderVector(p, e);
    drawHpBar(p[0], p[1] - 32, e);
  }
  function drawBoarderVector(p, e) {
    const sway = Math.sin(time * 10 + e.seed) * 2;
    const white = e.flash > 0;
    line([p[0] - 3, p[1]], [p[0] - 2, p[1] - 8], '#2a2018', 2.5);
    line([p[0] + 3, p[1]], [p[0] + 2, p[1] - 8], '#2a2018', 2.5);
    ctx.fillStyle = white ? '#fff' : '#e8e0d0'; ctx.fillRect(p[0] - 4, p[1] - 17, 8, 10);
    if (!white) { ctx.fillStyle = '#2a3a6a'; for (let i = 0; i < 3; i++) ctx.fillRect(p[0] - 4, p[1] - 16 + i * 3, 8, 1); }
    ellipse([p[0], p[1] - 21], 4.5, 4.5, white ? '#fff' : '#d8a878', 'rgba(0,0,0,.5)');
    ctx.fillStyle = white ? '#fff' : '#c8202a'; ctx.fillRect(p[0] - 5, p[1] - 26, 10, 3);  // lenço
    line([p[0] + 4, p[1] - 15], [p[0] + 11 + sway, p[1] - 25], '#c8ccd8', 2);              // sabre
  }

  // ------------------------------------------------------------------ Inimigos
  function enemyTop(e) {
    return { schooner: 64, fireship: 40, sloop: 60, boarder: DECK_H + 26, galleon: 92 }[e.kind];
  }

  function drawEnemy(e) {
    const flash = e.flash > 0, torn = e.torn > 0;
    const b = Math.sin(time * 2 + e.seed) * 1.2;
    const { x, y } = e;
    ellipse(P(x, y, 0), e.kind === 'galleon' ? 70 : 34, e.kind === 'galleon' ? 26 : 12, 'rgba(230,248,255,.18)');
    if (hasSprite(e.kind) && !refMode) {
      for (const part of SPRITE_PARTS[e.kind] || [e.kind]) drawSprite(part, x, y, b, flash);
      if (torn) drawRagsAt(x, y, b + 40);
    } else switch (e.kind) {
      case 'schooner': drawSchooner(x, y, b, flash, torn); break;
      case 'fireship': drawFireship(x, y, b, flash, torn); break;
      case 'sloop': drawSloop(x, y, b, flash, torn, refMode ? 2 : e.left); break;
      case 'galleon': drawGalleonBow(x, y, b, flash); drawGalleonHull(x, y, b, flash); break;
    }
    if (torn) {
      const p = P(x, y, enemyTop(e) + 6);
      for (let i = 0; i < 3; i++) {
        const a = time * 6 + i * 2.1;
        ellipse([p[0] + Math.cos(a) * 10, p[1] + Math.sin(a) * 4], 2.5, 2.5, '#f2e8c8', 'rgba(0,0,0,.4)');
      }
    }
    if (e.kind !== 'galleon') {
      const p = P(x, y, enemyTop(e) + 4);
      drawHpBar(p[0], p[1], e);
    }
  }
  function drawRagsAt(x, y, h) {
    for (let i = 0; i < 4; i++) {
      const p = P(x + (i - 1.5) * 0.5, y, h);
      line(p, [p[0] + 5 + Math.sin(time * 12 + i) * 3, p[1] + 9], '#2a2420', 2);
    }
  }

  // Escuna pirata: casco escuro e estreito, dois mastros com velas latinas pretas.
  function drawSchooner(x, y, base, flash, torn) {
    const c = hull(x, y, 3.2, 1.0, 9, base - 3, tones('#4a2e1e', flash), 0.25);
    if (!flash) line(P(c.x0, c.y0, base + 2), P(x + 1.0, c.y0, base + 2), '#8a1a1a', 2);
    for (const mx of [0.6, -0.6]) {
      line(P(x + mx, y, c.top), P(x + mx, y, c.top + 50), flash ? '#fff' : '#2a1a10', 2);
      if (!torn) foreAftSail(x + mx - 1.3, x + mx - 0.05, y, c.top + 6, c.top + 48, '#1e1a1a', flash);
    }
    if (!torn) foreAftSail(x + 0.7, x + 2.3, y, c.top + 3, c.top + 36, '#2a2424', flash);
    const top = P(x + 0.6, y, c.top + 52);
    if (!flash) { ctx.fillStyle = '#0a0a0a'; ctx.fillRect(top[0], top[1], 10, 6); ellipse([top[0] + 5, top[1] + 3], 1.5, 1.5, '#f2ece0'); }
  }
  // Brulote: um bote velho carregado de pólvora e piche, pegando fogo.
  function drawFireship(x, y, base, flash, torn) {
    const c = hull(x, y, 2.6, 1.1, 8, base - 3, tones('#3a2a1e', flash), 0.25);
    for (let i = 0; i < 3; i++) box(x - 0.7 + i * 0.6, y, 0.45, 0.45, 6, c.top, tones('#6a4a2a', flash));
    line(P(x + 0.2, y, c.top), P(x + 0.2, y, c.top + 30), flash ? '#fff' : '#2a1a10', 2);
    if (!torn) squareSail(x + 0.2, y, 0.7, c.top + 8, c.top + 28, 0.15, '#4a3a2a', flash);
    if (!refMode) {
      const fp = P(x, y, c.top + 8);
      glow(fp, 26, '#ff8a2a', 0.6 + 0.2 * Math.sin(time * 14));
    }
  }
  // Chalupa de abordagem: um mastro, vela latina grande, piratas prontos para pular.
  function drawSloop(x, y, base, flash, torn, crew) {
    const c = hull(x, y, 3.6, 1.4, 10, base - 3, tones('#5a3a24', flash), 0.22);
    line(P(x + 0.3, y, c.top), P(x + 0.3, y, c.top + 46), flash ? '#fff' : '#2a1a10', 2.5);
    if (!torn) foreAftSail(x - 1.6, x + 0.25, y, c.top + 6, c.top + 44, '#2a2020', flash);
    for (let i = 0; i < crew; i++) {
      const p = P(x - 0.6 + i * 0.6, y - 0.3, c.top);
      ctx.fillStyle = flash ? '#fff' : '#e8e0d0'; ctx.fillRect(p[0] - 2, p[1] - 9, 5, 6);
      ellipse([p[0], p[1] - 12], 2.5, 2.5, flash ? '#fff' : '#d8a878');
      ctx.fillStyle = '#c8202a'; ctx.fillRect(p[0] - 3, p[1] - 15, 6, 2);
    }
    // Ganchos de abordagem.
    for (const s of [-0.6, 0.6]) line(P(x + 0.8, y + s * 0.6, c.top + 4), P(x + 1.4, y + s, c.top + 14), '#8a8a90', 1.5);
  }
  // O galeão é desenhado em duas peças (proa e casco), porque inteiro ele
  // passa do tamanho máximo de um sprite do PixelLab (256 px).
  function drawGalleonBow(x, y, base, flash) {
    const c = hull(x + 3.4, y, 2.6, 2.6, 18, base - 4, tones('#3a1e1a', flash), 0.55);
    box(x + 3.0, y, 1.2, 2.4, 8, c.top, tones('#4a2620', flash)); // castelo de proa
    line(P(x + 4.6, y, c.top + 2), P(x + 6.4, y, c.top + 14), flash ? '#fff' : '#2a1a10', 3);
    const mx = x + 3.2;
    line(P(mx, y, c.top), P(mx, y, c.top + 66), flash ? '#fff' : '#1a100a', 3);
    squareSail(mx, y, 1.7, c.top + 14, c.top + 38, 0.3, '#1a1616', flash);
    squareSail(mx, y, 1.3, c.top + 40, c.top + 62, 0.2, '#1a1616', flash);
  }
  function drawGalleonHull(x, y, base, flash) {
    const c = box(x - 0.8, y, 6.4, 3.0, 20, base - 4, tones('#3a1e1a', flash));
    if (!flash) {
      line(P(c.x0, c.y0, base + 6), P(c.x1, c.y0, base + 6), '#8a6a2a', 3);
      for (let i = 0; i < 6; i++) { const p = P(c.x0 + 0.6 + i * 1.0, c.y0, base + 6); ctx.fillStyle = '#0a0606'; ctx.fillRect(p[0] - 2, p[1] - 2, 4, 4); }
      for (let i = 0; i < 3; i++) ellipse(P(c.x0, c.y0 + 0.6 + i * 0.9, base + 12), 2, 2, Math.sin(time * 5 + i) > 0 ? '#ffb43a' : '#6a3a1a');
    }
    const poop = box(x - 3.2, y, 1.8, 3.0, 12, c.top, tones('#4a2620', flash)); // tombadilho alto
    for (const mx of [x + 0.6, x - 1.8]) {
      const h = mx > x ? 80 : 60;
      line(P(mx, y, c.top), P(mx, y, c.top + h), flash ? '#fff' : '#1a100a', 3.5);
      squareSail(mx, y, 2.0, c.top + 14, c.top + h * 0.52, 0.35, '#1a1616', flash);
      squareSail(mx, y, 1.5, c.top + h * 0.55, c.top + h - 4, 0.25, '#1a1616', flash);
      if (!flash && mx > x) { // a caveira na vela grande
        const sk = P(mx + 0.3, y, c.top + h * 0.33);
        ellipse(sk, 6, 6, '#e8dcc4'); ellipse([sk[0] - 2, sk[1] - 1], 1.6, 1.6, '#1a0e08'); ellipse([sk[0] + 2, sk[1] - 1], 1.6, 1.6, '#1a0e08');
      }
    }
    const pole = P(x - 3.9, y, poop.top);
    line(pole, [pole[0], pole[1] - 26], '#1a100a', 2);
    if (!flash) { ctx.fillStyle = '#0a0a0a'; ctx.fillRect(pole[0], pole[1] - 26, 16, 10); ellipse([pole[0] + 8, pole[1] - 21], 2.5, 2.5, '#f2ece0'); }
    for (const yy of [1.4, -1.4]) glow(P(c.x0 - 0.2, y + yy, c.top + 12), 14, '#ffb43a', 0.6);
  }

  function drawHpBar(cx, cy, e) {
    if (e.hp >= e.def.maxHp) return;
    const w = 26, f = Math.max(0, e.hp / e.def.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(cx - w / 2 - 1, cy - 1, w + 2, 5);
    ctx.fillStyle = f > 0.5 ? '#8ef08a' : f > 0.25 ? '#f2b632' : '#e0442e';
    ctx.fillRect(cx - w / 2, cy, w * f, 3);
  }

  // ------------------------------------------------------------------ Partículas e efeitos
  function emit(o) {
    if (particles.length > 1600) return;
    particles.push(Object.assign({ vx: 0, vy: 0, vh: 0, grow: 1, drag: 0, layer: 'high', alpha: 1 }, o, { max: o.life }));
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // Navio explodindo: fogo, fumaça escura, lascas de madeira e um anel de espuma no mar.
  function explosion(gx, gy, h, size) {
    for (let i = 0; i < 16 * size; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(1, 4) * size;
      emit({ gx, gy, h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vh: rnd(0, 50) * size, life: rnd(0.3, 0.6), size: rnd(3, 6) * size, grow: 1.5, kind: 'fire', drag: 2 });
    }
    for (let i = 0; i < 10 * size; i++) {
      emit({ gx: gx + rnd(-1, 1), gy: gy + rnd(-1, 1), h: h + rnd(0, 10), vx: rnd(-1, 1), vy: rnd(-1, 1), vh: rnd(10, 30), life: rnd(0.9, 1.6), size: rnd(4, 7) * size, grow: 2, color: '#2a2420', alpha: 0.55, kind: 'smoke' });
    }
    for (let i = 0; i < 12 * size; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(3, 8);
      emit({ gx, gy, h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vh: rnd(20, 80), life: rnd(0.6, 1.1), size: rnd(1.5, 3), grow: 0, color: '#6a4a2a', kind: 'debris', gravity: true });
    }
    splash(gx, gy, size * 1.4);
  }
  function splash(gx, gy, size) {
    emit({ gx, gy, h: 0, life: 0.6, size: 6 * size, grow: 3, color: '#e8f8ff', alpha: 0.7, kind: 'ring', layer: 'low' });
    for (let i = 0; i < 6 * size; i++) emit({ gx: gx + rnd(-0.5, 0.5), gy: gy + rnd(-0.5, 0.5), h: 0, vx: rnd(-1, 1), vy: rnd(-1, 1), vh: rnd(30, 60), life: rnd(0.4, 0.7), size: rnd(1.5, 2.5), grow: 0, color: '#e8f8ff', kind: 'spark', gravity: true });
  }
  function sparks(gx, gy, h, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(2, 6);
      emit({ gx, gy, h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vh: rnd(-20, 40), life: rnd(0.15, 0.35), size: 1.5, grow: 0, color, kind: 'spark' });
    }
  }
  function puff(gx, gy, h, n, color = '#e8e4dc', size = 4) {
    for (let i = 0; i < n; i++) {
      emit({ gx: gx + rnd(-0.4, 0.4), gy: gy + rnd(-0.4, 0.4), h, vx: rnd(-1.2, 1.2) - 2, vy: rnd(-1.2, 1.2), vh: rnd(0, 18), life: rnd(0.5, 0.9), size: rnd(size * 0.7, size * 1.2), grow: 1.8, color, alpha: 0.7, kind: 'smoke' });
    }
  }
  function floater(gx, gy, h, text, color = '#ffd84a') {
    floaters.push({ gx, gy, h, text, color, life: 1.1, max: 1.1 });
  }

  function hitHeight(e) {
    return { schooner: 14, fireship: 12, sloop: 14, boarder: DECK_H + 12, galleon: 26 }[e.kind];
  }

  sim.on((type, d) => {
    const s = sim.ship;
    switch (type) {
      case 'shot': {
        const [gx, gy] = sim.gunportGround(d.gunport);
        const to = [d.target.x, d.target.y, hitHeight(d.target)];
        const aim = d.gunport.weapon ? d.gunport.weapon.aim : [1, 0];
        shots.push({ from: [gx + aim[0] * 1.4, gy + aim[1] * 1.4, DECK_H + 5], to, life: 0.18, max: 0.18, chain: d.kind === 'chainshot' });
        muzzle[d.gunport.index] = 0.07;
        puff(gx + aim[0] * 1.6, gy + aim[1] * 1.6, DECK_H + 6, 3);
        break;
      }
      case 'volley': {
        const [gx, gy] = sim.gunportGround(d.gunport);
        muzzle[d.gunport.index] = 0.08;
        puff(gx + d.aim[0] * 1.0, gy + d.aim[1] * 1.0, DECK_H + 6, 5, '#e8e4dc', 5);
        // A metralha se espalha num cone.
        for (let i = 0; i < 18; i++) {
          const spread = rnd(-1, 1) * Math.tan(d.cone / 2 * Math.PI / 180), sp = d.range / rnd(0.18, 0.28);
          const ax = d.aim[0] - d.aim[1] * spread, ay = d.aim[1] + d.aim[0] * spread, len = Math.hypot(ax, ay);
          emit({ gx: gx + d.aim[0] * 0.9, gy: gy + d.aim[1] * 0.9, h: DECK_H + 5, vx: ax / len * sp, vy: ay / len * sp, vh: rnd(-10, 10), life: 0.22, size: 1.5, grow: 0, color: '#2a2a2a', kind: 'spark' });
        }
        break;
      }
      case 'enemyShot': {
        const to = [s.x + rnd(-2.5, 2.5), rnd(-0.8, 0.8), rnd(8, 20)];
        shots.push({ from: [d.e.x, d.e.y, d.e.kind === 'galleon' ? 14 : 8], to, life: 0.2, max: 0.2, enemy: true });
        puff(d.e.x, d.e.y, d.e.kind === 'galleon' ? 14 : 8, 3);
        break;
      }
      case 'kill': {
        const e = d.e;
        const size = e.kind === 'galleon' ? 3 : e.kind === 'boarder' ? 0.4 : e.kind === 'schooner' ? 0.9 : 1.2;
        if (e.kind === 'boarder') { puff(e.x, e.y, DECK_H + 6, 4, '#c8b8a0'); splash(e.x, e.y + 1.4, 0.6); }
        else explosion(e.x, e.y, hitHeight(e), size);
        floater(e.x, e.y, hitHeight(e) + 22, `+${d.gain}`);
        if (e.kind === 'galleon') { shake = 16; banner('GALEÃO AFUNDADO', 'A entrada do porto está livre'); }
        else if (e.kind !== 'boarder') shake = Math.max(shake, 2);
        break;
      }
      case 'explode':
        explosion(d.x, d.y, 12, 2);
        shake = Math.max(shake, 11);
        toast(s.copper ? `Brulote! (Forro de cobre −${Math.round(sim.collisionReduction * 100)}%)` : 'Brulote! O Forro de cobre reduz esse dano');
        break;
      case 'barrelBlast':
        explosion(d.x, d.y, 8, 1.1);
        shake = Math.max(shake, 4);
        break;
      case 'rockHit':
        splash(d.r.x, d.r.y, 1.6);
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * Math.PI * 2, sp = rnd(2, 6);
          emit({ gx: s.x + 2, gy: rnd(-1, 1), h: 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vh: rnd(20, 60), life: rnd(0.6, 1.1), size: rnd(1.5, 3), grow: 0, color: '#6a4a2a', kind: 'debris', gravity: true });
        }
        shake = Math.max(shake, 9);
        toast(s.copper ? `Rochedo! (Forro de cobre −${Math.round(sim.collisionReduction * 100)}%)` : 'Rochedo! Mais devagar, ele dói menos');
        break;
      case 'shipHit':
        shake = Math.max(shake, Math.min(7, d.amount / 6));
        break;
      case 'board':
        puff(d.e.x, d.e.y, DECK_H, 6, '#c8b8a0');
        toast('Pirata a bordo! A arma da portinhola parou');
        break;
      case 'boss':
        banner('GALEÃO PIRATA!', 'Afunde o galeão para entrar no porto');
        break;
      case 'escaped':
        floater(d.e.x, d.e.y, 30, 'ficou para trás', '#bfe8ff');
        break;
      case 'tear':
        for (let i = 0; i < 8; i++) emit({ gx: d.e.x + rnd(-0.6, 0.6), gy: d.e.y + rnd(-0.6, 0.6), h: 40, vx: rnd(-3, -1), vy: rnd(-1, 1), vh: rnd(-10, 10), life: rnd(0.6, 1), size: 2, grow: 0, color: '#2a2420', kind: 'debris', gravity: true });
        break;
      case 'squallWarning':
        banner('RAJADA À VISTA!', s.sail === FULL ? 'Recolha o Pano cheio ou as velas rasgam' : 'As velas estão seguras');
        break;
      case 'squall':
        lightning = 0.35; shake = Math.max(shake, 6);
        if (d.caught) banner('VELAS RASGADAS!', 'O navio fica em Rizadas até o conserto');
        break;
      case 'sailsMended':
        toast('Velas consertadas');
        break;
      case 'legStarted':
        cam.gx = s.x + 3;
        particles = []; shots = []; floaters = [];
        banner(d.settings.hasBoss ? 'RUMO AO PORTO' : LEG_TYPES[d.settings.type].name.toUpperCase(),
          d.settings.hasBoss ? 'O último trecho. Algo grande vem aí.' : LEG_TYPES[d.settings.type].short);
        break;
      case 'legEnded':
        overlayHold = 1.8;
        ui.pending = null; ui.selected = null;
        if (d.success) banner('TRECHO CONCLUÍDO', sim.phase === 'result' ? 'Você chegou ao porto!' : 'Escolha o próximo caminho');
        else { banner('NAVIO AFUNDADO', ''); explosion(s.x, 0, 16, 3.5); explosion(s.x - 2, 0, 12, 2); shake = 20; }
        break;
      case 'ability':
        if (d.ab.kind === 'broadside') toast('BORDADA! Recarga em dobro');
        else { const b = sim.barrels[sim.barrels.length - 1]; splash(b.x, 0, 1); }
        break;
      case 'shipUpgrade': {
        const names = { copper: `Forro de cobre ${s.copper}`, rigging: `Velame ${s.rigging}`, crew: `Tripulação ${s.crew}` };
        sparks(s.x, 0, 20, 16, '#ffe2a0');
        floater(s.x, 0, 60, names[d.kind], '#ffe2a0');
        break;
      }
      case 'gunportOpened': {
        const [gx, gy] = sim.gunportGround(d.gunport);
        puff(gx, gy, DECK_H, 4, '#c8b8a0');
        floater(gx, gy, DECK_H + 20, 'Portinhola aberta', '#ffe2a0');
        break;
      }
      case 'build': {
        const [gx, gy] = sim.gunportGround(d.gunport);
        puff(gx, gy, DECK_H, 3, '#c8b8a0');
        sparks(gx, gy, DECK_H + 6, 6, '#ffe2a0');
        break;
      }
      case 'sell': {
        const [gx, gy] = sim.gunportGround(d.gunport);
        puff(gx, gy, DECK_H, 5, '#c8b8a0');
        floater(gx, gy, DECK_H + 16, `+${d.value}`);
        break;
      }
      case 'phase':
        shownScreen = undefined;
        break;
    }
  });

  // Esteira, espuma da proa, fogo dos brulotes e dano que dependem do estado (todo frame).
  function emitContinuous(dt) {
    if (!sim.running) return;
    const s = sim.ship;
    const chance = (rate) => Math.random() < rate * dt;
    const fast = s.speed / cfg.seaSpeed;
    // Esteira: espuma que fica no mar (não anda com o navio) atrás da popa.
    if (chance(30 * fast)) emit({ gx: s.x - 3.4, gy: rnd(-0.6, 0.6), h: 0, life: rnd(1.2, 2), size: rnd(2, 4), grow: 1.5, color: '#e8f8ff', alpha: 0.6, kind: 'foam', layer: 'low' });
    for (const side of [1, -1]) if (chance(14 * fast)) emit({ gx: s.x + 2.8, gy: side * 0.9, h: 0, vy: side * rnd(1, 2.5), life: rnd(0.8, 1.4), size: rnd(1.5, 3), grow: 1.2, color: '#e8f8ff', alpha: 0.7, kind: 'foam', layer: 'low' });
    if (fast > 1.1 && chance(20)) emit({ gx: s.x + 3.4, gy: rnd(-0.5, 0.5), h: 4, vx: rnd(0, 2), vy: rnd(-2, 2), vh: rnd(20, 40), life: 0.4, size: 1.5, grow: 0, color: '#e8f8ff', kind: 'spark', gravity: true });
    if (s.hull < sim.maxHull * 0.35) {
      if (chance(12)) emit({ gx: s.x - 1 + rnd(-2, 2), gy: rnd(-0.8, 0.8), h: 14, vh: rnd(10, 25), vx: -2, life: rnd(0.5, 0.8), size: 3, grow: 1.5, kind: 'fire' });
      if (chance(10)) emit({ gx: s.x - 1 + rnd(-2, 2), gy: rnd(-0.8, 0.8), h: 16, vh: rnd(10, 25), vx: -3, life: rnd(1, 1.6), size: 4, grow: 3, color: '#2a2420', alpha: 0.55, kind: 'smoke' });
    }
    for (const g of sim.gunports) {
      const w = g.weapon;
      if (!w || !w.firing || w.def.kind !== 'marines') continue;
      if (chance(6)) { const [gx, gy] = sim.gunportGround(g); puff(gx + w.aim[0] * 0.8, gy + w.aim[1] * 0.8, DECK_H + 11, 1, '#f2eee6', 2.5); }
    }
    for (const e of sim.enemies) {
      if (e.removed || !e.def.isShip) continue;
      if (chance(e.kind === 'galleon' ? 30 : 10)) emit({ gx: e.x - 1.5, gy: e.y + rnd(-0.4, 0.4), h: 0, life: rnd(0.8, 1.3), size: 2.5, grow: 1.2, color: '#e8f8ff', alpha: 0.5, kind: 'foam', layer: 'low' });
      if (e.kind === 'fireship' && chance(40)) emit({ gx: e.x + rnd(-0.6, 0.6), gy: e.y + rnd(-0.4, 0.4), h: rnd(10, 22), vh: rnd(20, 40), vx: -1, life: rnd(0.3, 0.6), size: rnd(2, 4), grow: 1.2, kind: 'fire' });
      if (e.kind === 'fireship' && chance(14)) emit({ gx: e.x, gy: e.y, h: 26, vh: rnd(20, 30), vx: -2, life: rnd(1, 1.6), size: 4, grow: 2.5, color: '#1a1614', alpha: 0.5, kind: 'smoke' });
    }
  }

  function updateFx(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.gx += p.vx * dt; p.gy += p.vy * dt; p.h += p.vh * dt;
      if (p.gravity) { p.vh -= 160 * dt; if (p.h < 0) { p.h = 0; p.life = Math.min(p.life, 0.05); } }
      if (p.drag) { const f = Math.max(0, 1 - p.drag * dt); p.vx *= f; p.vy *= f; }
    }
    particles = particles.filter((p) => p.life > 0);
    for (const sh of shots) {
      sh.life -= dt;
      if (sh.life <= 0 && !sh.done) {
        sh.done = true;
        const [x, y, h] = sh.to;
        if (sh.enemy) sparks(x, y, h, 6, '#c89a5a');
        else { sparks(x, y, h, 5, '#c89a5a'); for (let i = 0; i < 3; i++) emit({ gx: x, gy: y, h, vx: rnd(-3, 3), vy: rnd(-3, 3), vh: rnd(20, 50), life: 0.6, size: 2, grow: 0, color: '#6a4a2a', kind: 'debris', gravity: true }); }
      }
    }
    shots = shots.filter((sh) => sh.life > 0);
    for (const f of floaters) f.life -= dt;
    floaters = floaters.filter((f) => f.life > 0);
    for (let i = 0; i < muzzle.length; i++) muzzle[i] = Math.max(0, muzzle[i] - dt);
    lightning = Math.max(0, lightning - dt);
  }

  function drawParticles(layer) {
    for (const p of particles) {
      if (p.layer !== layer) continue;
      const f = p.life / p.max;
      const pos = P(p.gx, p.gy, p.h);
      const r = p.size * (1 + p.grow * (1 - f));
      let color = p.color, alpha = p.alpha * f;
      if (p.kind === 'fire') {
        color = f > 0.66 ? '#fff0a0' : f > 0.33 ? '#ff8a3a' : '#5a2a1a';
        alpha = Math.min(1, f * 1.6);
      }
      ctx.globalAlpha = Math.max(0, alpha);
      if (p.kind === 'ring') {
        ctx.lineWidth = 2; ellipse(pos, r * 1.6, r * 0.8, null, color);
      } else if (p.kind === 'foam') {
        ellipse(pos, r * 1.4, r * 0.7, color);
      } else if (p.kind === 'debris' || p.kind === 'spark') {
        ctx.fillStyle = color; ctx.fillRect(pos[0] - r, pos[1] - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(pos[0], pos[1], r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // Balas de canhão: uma bolinha preta que voa num arco curto até o alvo.
  function drawShots() {
    for (const sh of shots) {
      const t = 1 - sh.life / sh.max;
      const x = sh.from[0] + (sh.to[0] - sh.from[0]) * t, y = sh.from[1] + (sh.to[1] - sh.from[1]) * t;
      const h = sh.from[2] + (sh.to[2] - sh.from[2]) * t + Math.sin(t * Math.PI) * 10;
      const p = P(x, y, h);
      if (sh.chain) {
        const a = time * 30, q = [p[0] + Math.cos(a) * 5, p[1] + Math.sin(a) * 3], q2 = [p[0] - Math.cos(a) * 5, p[1] - Math.sin(a) * 3];
        line(q, q2, '#8a8a90', 1);
        ellipse(q, 2, 2, '#101014'); ellipse(q2, 2, 2, '#101014');
      } else ellipse(p, sh.enemy ? 2.5 : 2, sh.enemy ? 2.5 : 2, '#101014');
    }
  }

  function drawFloaters() {
    ctx.font = '700 22px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    for (const f of floaters) {
      const p = P(f.gx, f.gy, f.h + (1 - f.life / f.max) * 34);
      ctx.globalAlpha = Math.min(1, f.life / f.max * 2);
      ctx.lineWidth = 4; ctx.strokeStyle = '#08141c'; ctx.strokeText(f.text, p[0], p[1]);
      ctx.fillStyle = f.color; ctx.fillText(f.text, p[0], p[1]);
    }
    ctx.globalAlpha = 1;
  }

  // Chuva da tempestade: riscos inclinados na tela, mais o escuro e o clarão.
  function drawWeather() {
    if (!stormy()) return;
    ctx.fillStyle = 'rgba(8,16,24,.28)'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(200,220,235,.35)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 140; i++) {
      const x = (hash(i, 1, 21) * W * 1.3 + time * 500) % (W * 1.3) - W * 0.15;
      const y = (hash(i, 2, 22) * H + time * 900 * (0.8 + hash(i, 3, 23) * 0.4)) % H;
      ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 18);
    }
    ctx.stroke();
    if (lightning > 0) { ctx.fillStyle = `rgba(230,240,255,${lightning * 1.6})`; ctx.fillRect(0, 0, W, H); }
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,10,20,.5)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (sim.ship.flash > 0 && sim.running) {
      ctx.fillStyle = `rgba(200,40,30,${sim.ship.flash * 0.9})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ------------------------------------------------------------------ Quadro
  // O mundo é desenhado numa tela de baixa resolução (1 px = 1 px de arte dos
  // sprites) e ampliado sem suavização: mar, efeitos e sprites ficam na mesma
  // grade de pixels.
  const low = document.createElement('canvas');
  const lowCtx = low.getContext('2d');
  const mainCtx = ctx;

  function render() {
    const lw = Math.ceil(W * ART), lh = H * ART;
    if (low.width !== lw || low.height !== lh) { low.width = lw; low.height = lh; }
    ctx = lowCtx;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, lw, lh);
    ctx.setTransform(LOW, 0, 0, LOW, (W / 2) * (1 - ZOOM) * ART, CAM_Y * (1 - ZOOM) * ART);
    camWX = cam.gx * HW; camWY = -cam.gx * HH;
    shakeX = (Math.random() - 0.5) * shake; shakeY = (Math.random() - 0.5) * shake;

    const b = visibleBounds();
    drawSea(b);
    drawParticles('low');
    drawRangePreview();

    const items = [{ key: sim.ship.x, draw: drawShip }];
    for (const e of sim.enemies) if (!e.removed && e.kind !== 'boarder') items.push({ key: e.x + e.y, draw: () => drawEnemy(e) });
    for (const r of sim.rocks) items.push({ key: r.x + r.y, draw: () => drawRock(r) });
    if (sim.barrels.length) items.push({ key: sim.ship.x + 1e3, draw: drawBarrels });
    pushStaticItems(items, b);
    items.sort((a, c) => c.key - a.key);
    for (const it of items) it.draw();

    drawParticles('high');
    drawShots();

    ctx = mainCtx;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(low, 0, 0, lw / ART, H);
    ctx.setTransform(k * ZOOM, 0, 0, k * ZOOM, k * (W / 2) * (1 - ZOOM), k * CAM_Y * (1 - ZOOM));
    drawFloaters();
    ctx.setTransform(k, 0, 0, k, 0, 0);
    drawWeather();
    drawVignette();
  }

  // ------------------------------------------------------------------ Entrada
  function toLogical(ev) {
    const r = canvas.getBoundingClientRect();
    return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H];
  }
  function pickGunport(lx, ly) {
    [lx, ly] = unzoom(lx, ly);
    const radius = TOUCH ? 26 : 16; // dedo é menos preciso que o mouse
    let best = null, bestSqr = radius * radius;
    for (const g of sim.gunports) {
      const p = portScreen[g.index];
      if (!p) continue;
      const sqr = (p[0] - lx) ** 2 + (p[1] - ly) ** 2;
      if (sqr < bestSqr) { best = g.index; bestSqr = sqr; }
    }
    return best;
  }

  canvas.addEventListener('pointermove', (ev) => {
    if (ev.pointerType === 'touch') return; // no toque não existe "passar por cima"
    if (sim.phase !== 'leg') { ui.hover = null; return; }
    const [lx, ly] = toLogical(ev);
    ui.hover = pickGunport(lx, ly);
    canvas.style.cursor = ui.hover !== null ? 'pointer' : 'default';
  });
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
  canvas.addEventListener('pointerdown', (ev) => {
    if (sim.phase !== 'leg' || paused) return;
    if (ev.button === 2) { cancelAll(); return; }
    if (ev.button !== 0) return;
    const [lx, ly] = toLogical(ev);
    const index = pickGunport(lx, ly);
    ui.hover = ev.pointerType === 'touch' ? null : index;
    if (index === null) { cancelAll(); return; }
    const g = sim.gunports[index];
    if (!g.isOpen) {
      // Portinhola fechada: o painel oferece abrir.
      ui.pending = null;
      ui.selected = ui.selected === index ? null : index;
    } else if (ui.pending && !g.weapon) {
      const res = sim.buy(index, ui.pending);
      if (res === 'noGold') toast('Ouro insuficiente');
      if (res === 'ok' && !ev.shiftKey) ui.pending = null;
    } else if (g.weapon) {
      ui.pending = null;
      ui.selected = ui.selected === index ? null : index;
    } else {
      toast('Escolha uma arma na barra de baixo');
    }
  });

  function cancelAll() { ui.pending = null; ui.selected = null; }

  const BUY_KEYS = ['KeyQ', 'KeyW', 'KeyE', 'KeyR'];
  const SAIL_KEYS = ['KeyZ', 'KeyX', 'KeyC'];
  const UPGRADE_KEYS = { KeyF: 'copper', KeyG: 'rigging', KeyT: 'crew' };
  addEventListener('keydown', (ev) => {
    if (ev.code === 'KeyP' || (ev.code === 'Escape' && paused)) { togglePause(); return; }
    if (sim.phase !== 'leg' || paused) return;
    if (ev.code === 'Escape') cancelAll();
    const ai = ['Digit1', 'Digit2', 'Numpad1', 'Numpad2'].indexOf(ev.code);
    if (ai >= 0) useAbility(ai % 2);
    const bi = BUY_KEYS.indexOf(ev.code);
    if (bi >= 0) selectBuy(WEAPON_ORDER[bi]);
    const si = SAIL_KEYS.indexOf(ev.code);
    if (si >= 0) sim.setSail(si);
    if (ev.code === 'ArrowUp') sim.setSail(sim.ship.sail + 1);
    if (ev.code === 'ArrowDown') sim.setSail(sim.ship.sail - 1);
    if (UPGRADE_KEYS[ev.code]) doShipUpgrade(UPGRADE_KEYS[ev.code]);
    if (ev.code === 'KeyU' && ui.selected !== null) doUpgrade();
    if (ev.code === 'KeyV' && ui.selected !== null) doSell();
  });
  addEventListener('blur', () => { if (sim.phase === 'leg' && sim.running && !paused) togglePause(); });
  // No celular, trocar de app ou bloquear a tela também pausa.
  document.addEventListener('visibilitychange', () => { if (document.hidden && sim.phase === 'leg' && sim.running && !paused) togglePause(); });

  // Tela cheia e paisagem no celular (o navegador só deixa pedir depois de um toque).
  function goFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req || document.fullscreenElement || document.webkitFullscreenElement) return;
    Promise.resolve(req.call(el)).then(() => {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    }).catch(() => {});
  }

  function togglePause() {
    if (sim.phase !== 'leg' || !sim.running) return;
    paused = !paused;
    shownScreen = undefined;
  }
  $('pause-btn').addEventListener('click', togglePause);

  // ------------------------------------------------------------------ HUD
  let toastTimer = 0, bannerTimer = 0;
  function toast(text) { $('toast').textContent = text; $('toast').classList.add('show'); toastTimer = 1.6; }
  function banner(text, sub) {
    $('banner').innerHTML = `${text}${sub ? `<small>${sub}</small>` : ''}`;
    $('banner').classList.add('show');
    bannerTimer = 2;
  }

  function selectBuy(id) {
    const def = WEAPONS[id];
    if (!sim.shop.includes(def)) {
      toast(`Libera ao concluir ${def.unlockAtBestLegs} ${def.unlockAtBestLegs === 1 ? 'trecho' : 'trechos'} numa run`);
      return;
    }
    ui.pending = ui.pending === id ? null : id;
    ui.selected = null;
  }

  function iconCanvas(w, h, draw) {
    const c = document.createElement('canvas');
    const dpr = 2;
    c.width = w * dpr; c.height = h * dpr; c.style.width = `${w}px`; c.style.height = `${h}px`;
    const g = c.getContext('2d'); g.scale(dpr, dpr); draw(g);
    return c;
  }
  function drawWeaponIcon(g, kind) {
    g.lineCap = 'round';
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(28, 38, 18, 4, 0, 0, Math.PI * 2); g.fill();
    if (kind === 'marines') {
      for (const x of [20, 34]) {
        g.fillStyle = '#e8e4dc'; g.fillRect(x - 3, 28, 6, 9);
        g.fillStyle = '#b8202a'; g.fillRect(x - 4, 17, 8, 11);
        g.fillStyle = '#e8c8a0'; g.beginPath(); g.arc(x, 13, 3.5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1a1a1e'; g.fillRect(x - 5, 8, 10, 3);
        g.strokeStyle = '#4a3424'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 22); g.lineTo(x + 14, 12); g.stroke();
      }
      return;
    }
    g.fillStyle = '#6a4a2a'; g.fillRect(12, 26, 20, 9);
    g.fillStyle = '#2a1a10'; for (const x of [16, 28]) { g.beginPath(); g.arc(x, 35, 3.5, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = '#1a1a1e';
    if (kind === 'carronade') { g.lineWidth = 11; g.beginPath(); g.moveTo(18, 25); g.lineTo(36, 19); g.stroke(); }
    else { g.lineWidth = 6; g.beginPath(); g.moveTo(14, 26); g.lineTo(48, 15); g.stroke(); }
    if (kind === 'chainshot') {
      g.strokeStyle = '#8a8a90'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(40, 30); g.lineTo(52, 30); g.stroke();
      g.fillStyle = '#101014'; for (const x of [40, 52]) { g.beginPath(); g.arc(x, 30, 4, 0, Math.PI * 2); g.fill(); }
    }
  }
  function drawUpgradeIcon(g, kind) {
    if (kind === 'copper') {
      g.fillStyle = '#c87a3a'; g.beginPath(); g.moveTo(6, 10); g.lineTo(42, 10); g.lineTo(36, 30); g.lineTo(12, 30); g.closePath(); g.fill();
      g.strokeStyle = '#6a3a1a'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#ffd0a0'; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(12 + i * 8 + j * 2, 16 + j * 8, 1.4, 0, Math.PI * 2); g.fill(); }
    } else if (kind === 'rigging') {
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(24, 4); g.lineTo(24, 36); g.stroke();
      g.fillStyle = '#efe6d0';
      g.beginPath(); g.moveTo(10, 8); g.quadraticCurveTo(24, 14, 38, 8); g.lineTo(38, 20); g.quadraticCurveTo(24, 26, 10, 20); g.fill();
      g.beginPath(); g.moveTo(8, 22); g.quadraticCurveTo(24, 28, 40, 22); g.lineTo(40, 34); g.quadraticCurveTo(24, 40, 8, 34); g.fill();
    } else {
      g.fillStyle = '#6a4a2a'; g.fillRect(6, 26, 36, 6);
      g.strokeStyle = '#8a8a90'; g.lineWidth = 4; g.beginPath(); g.moveTo(14, 22); g.lineTo(30, 8); g.stroke();
      g.fillStyle = '#4a4a50'; g.fillRect(26, 4, 12, 8);
      g.fillStyle = '#e8c8a0'; g.beginPath(); g.arc(14, 20, 3, 0, Math.PI * 2); g.fill();
    }
  }
  function drawAbilityIcon(g, kind) {
    if (kind === 'barrels') {
      for (const [x, y] of [[14, 22], [30, 22], [22, 10]]) {
        g.fillStyle = '#8a5a2a'; g.fillRect(x - 6, y - 7, 12, 14);
        g.fillStyle = '#3a2a1a'; g.fillRect(x - 6, y - 3, 12, 2); g.fillRect(x - 6, y + 3, 12, 2);
      }
      g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(28, 6, 3, 0, Math.PI * 2); g.fill();
    } else {
      g.strokeStyle = '#1a1a1e'; g.lineWidth = 5;
      for (const y of [10, 20, 30]) { g.beginPath(); g.moveTo(8, y + 4); g.lineTo(28, y); g.stroke(); }
      g.fillStyle = '#ffe58a'; for (const y of [10, 20, 30]) { g.beginPath(); g.arc(33, y, 4, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(240,236,228,.8)'; for (const y of [10, 20, 30]) { g.beginPath(); g.arc(40, y - 2, 5, 0, Math.PI * 2); g.fill(); }
    }
  }

  const shopButtons = WEAPON_ORDER.map((id, i) => {
    const def = WEAPONS[id];
    const btn = document.createElement('button');
    btn.className = 'buy plate';
    btn.innerHTML = `<span class="key">${BUY_KEYS[i].slice(3)}</span><span class="name">${def.name}</span><span class="cost"></span>`;
    // Ícone: o sprite PixelLab da arma (virada para a câmera); se não houver, o desenho vetorial.
    const sp = SPRITES[`turret-${id}-south`];
    if (sp && !flags.has('vector')) {
      const img = document.createElement('img');
      img.className = 'icon';
      img.src = `${SPRITE_BASE}${sp.path}.png`;
      img.onerror = () => img.replaceWith(iconCanvas(56, 44, (g) => drawWeaponIcon(g, id)));
      btn.prepend(img);
    } else btn.prepend(iconCanvas(56, 44, (g) => drawWeaponIcon(g, id)));
    btn.addEventListener('click', () => selectBuy(id));
    shopEl.appendChild(btn);
    return { id, def, btn, cost: btn.querySelector('.cost') };
  });

  // Melhorias do navio: coluna à direita (são do navio, não de uma portinhola).
  const UPGRADES = [
    { kind: 'copper', key: 'F', name: 'Forro de cobre', short: '+casco, −colisão' },
    { kind: 'rigging', key: 'G', name: 'Velame', short: '+Pano cheio' },
    { kind: 'crew', key: 'T', name: 'Tripulação', short: 'conserta o casco' },
  ];
  const upgradeButtons = UPGRADES.map((u) => {
    const btn = document.createElement('button');
    btn.className = 'upg plate';
    btn.innerHTML = `<span class="key">${u.key}</span><span class="name">${u.name}</span><span class="cost"></span>`;
    btn.prepend(iconCanvas(48, 40, (g) => drawUpgradeIcon(g, u.kind)));
    btn.title = u.short;
    btn.addEventListener('click', () => doShipUpgrade(u.kind));
    upgradesEl.appendChild(btn);
    return { u, btn, cost: btn.querySelector('.cost') };
  });
  function doShipUpgrade(kind) {
    const res = sim.buyUpgrade(kind);
    if (res === 'noGold') toast('Ouro insuficiente');
    else if (res === 'max') toast('Nível máximo');
  }

  // Velas: três botões em pé, Pano cheio em cima (como um telégrafo de máquinas).
  sailsEl.className = 'plate';
  sailsEl.innerHTML = `<div class="sails-head">VELAS</div>${SAILS.map((sl, i) => `<button class="sail" data-i="${i}"><span class="key">${SAIL_KEYS[i].slice(3)}</span>${sl.name}</button>`).reverse().join('')}<div class="sails-speed"></div><div class="sails-escaped"></div>`;
  const sailButtons = [...sailsEl.querySelectorAll('.sail')];
  for (const b of sailButtons) b.addEventListener('click', () => sim.setSail(+b.dataset.i));

  const abilityButtons = ABILITIES.map((ab, i) => {
    const btn = document.createElement('button');
    btn.className = 'ability plate';
    btn.innerHTML = `<span class="key">${i + 1}</span><span class="name">${ab.name}</span><span class="secs"></span><span class="cd"></span>`;
    btn.prepend(iconCanvas(48, 40, (g) => drawAbilityIcon(g, ab.kind)));
    btn.addEventListener('click', () => useAbility(i));
    abilitiesEl.appendChild(btn);
    return { btn, secs: btn.querySelector('.secs') };
  });
  function useAbility(i) {
    if (!sim.useAbility(i) && sim.running) toast(`${ABILITIES[i].name} recarregando`);
  }

  function doUpgrade() {
    const g = sim.gunports[ui.selected];
    if (!g.isOpen) { const res = sim.openGunport(ui.selected); if (res === 'noGold') toast('Ouro insuficiente'); return; }
    const res = sim.upgrade(ui.selected);
    if (res === 'noGold') toast('Ouro insuficiente');
  }
  function doSell() {
    if (!sim.gunports[ui.selected].weapon) return;
    sim.sell(ui.selected);
    ui.selected = null;
  }
  $('upgrade-btn').addEventListener('click', doUpgrade);
  $('sell-btn').addEventListener('click', doSell);

  const fmt = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
  function statsLine(w) {
    const def = w.def, m = levelMult(w);
    switch (def.kind) {
      case 'longgun': return `${fmt(def.damage * m)} de dano a cada ${fmt(def.fireInterval)} s · alcance ${fmt(def.range)} m`;
      case 'carronade': return `metralha de ${fmt(def.damage * m)} em cone a cada ${fmt(def.fireInterval)} s · alcance ${fmt(def.range)} m`;
      case 'chainshot': return `${fmt(def.damage * m)} de dano a cada ${fmt(def.fireInterval)} s · rasga as velas por ${fmt(def.tearSeconds * m)} s · só navios`;
      case 'marines': return `fogo de ${fmt(def.damage * m)}/s em quem chega a ${fmt(def.range)} m (inclusive piratas a bordo)`;
    }
    return '';
  }

  let panelSig = '';
  function updateHud() {
    const inLeg = sim.phase === 'leg' || overlayHold > 0;
    hud.classList.toggle('hidden', !inLeg);
    if (!inLeg) return;
    const s = sim.ship;
    $('gold').textContent = sim.gold;
    const hpf = s.hull / sim.maxHull;
    $('hp-fill').style.width = `${hpf * 100}%`;
    $('hp-fill').classList.toggle('low', hpf < 0.3);
    $('hp-text').textContent = `CASCO ${Math.ceil(s.hull)} / ${sim.maxHull}`;
    $('leg-label').textContent = sim.settings ? sim.settings.label : '';
    const prog = sim.progress;
    $('progress-fill').style.width = `${prog * 100}%`;
    $('progress-ship').style.left = `${prog * 100}%`;
    $('progress-end').textContent = sim.settings && sim.settings.hasBoss ? 'B' : 'FIM';
    const boss = sim.enemies.find((e) => e.kind === 'galleon' && !e.removed);
    $('boss-bar').classList.toggle('hidden', !boss);
    if (boss) $('boss-fill').style.width = `${boss.hp / boss.def.maxHp * 100}%`;
    if (sim.running && s.x >= cfg.legLength && sim.blockers > 0 && bannerTimer <= 0) banner('AFUNDE O GALEÃO', 'Ele bloqueia a entrada do porto');
    const sq = sim.squall;
    $('squall-bar').classList.toggle('hidden', !sq || !sq.warned);
    if (sq && sq.warned) $('squall-bar').textContent = `RAJADA EM ${Math.max(0, sq.timer).toFixed(1).replace('.', ',')} s`;

    for (const sb of shopButtons) {
      const locked = !sim.shop.includes(sb.def);
      sb.btn.classList.toggle('locked', locked);
      sb.btn.classList.toggle('selected', ui.pending === sb.id);
      sb.btn.classList.toggle('poor', !locked && sim.gold < sb.def.cost);
      const text = locked ? `Concluir ${sb.def.unlockAtBestLegs} ${sb.def.unlockAtBestLegs === 1 ? 'trecho' : 'trechos'}` : `${sb.def.cost} ouro`;
      if (sb.cost.textContent !== text) sb.cost.textContent = text;
    }
    for (const ub of upgradeButtons) {
      const kind = ub.u.kind, lvl = s[kind], maxed = lvl >= sim.upgradeMax(kind), cost = sim.upgradeCostOf(kind);
      const text = maxed ? `Nv ${lvl} · máx.` : `Nv ${lvl + 1} · ${cost}`;
      if (ub.cost.textContent !== text) ub.cost.textContent = text;
      ub.btn.classList.toggle('poor', !maxed && sim.gold < cost);
      ub.btn.classList.toggle('locked', maxed);
    }
    sailButtons.forEach((b) => {
      const i = +b.dataset.i;
      b.classList.toggle('on', s.sail === i);
      b.classList.toggle('torn', s.torn > 0 && i === FULL);
    });
    sailsEl.querySelector('.sails-speed').textContent = s.torn > 0 ? `RASGADAS ${Math.ceil(s.torn)} s` : `${fmt(s.speed)} m/s · piratas ${cfg.seaSpeed}`;
    sailsEl.querySelector('.sails-escaped').textContent = sim.escaped ? `Deixados para trás: ${sim.escaped}` : '';
    abilityButtons.forEach((ab, i) => {
      const f = sim.cooldown01(i);
      ab.btn.style.setProperty('--cd', f.toFixed(3));
      ab.secs.textContent = f > 0 ? Math.ceil(sim.cooldowns[i]) : '';
      ab.btn.classList.toggle('ready', f <= 0 && sim.running);
    });

    const g = ui.selected !== null ? sim.gunports[ui.selected] : null;
    const w = g && g.weapon;
    if (g && g.isOpen && !w) ui.selected = null;
    const show = g && (w || !g.isOpen);
    panel.classList.toggle('hidden', !show);
    if (!show) { panelSig = ''; return; }
    if (!g.isOpen) {
      const cost = sim.openCost();
      const sig = ['closed', g.index, cost, sim.gold >= cost].join('|');
      if (sig !== panelSig) {
        panelSig = sig;
        $('panel-title').textContent = 'Portinhola fechada';
        $('panel-info').innerHTML = `${g.label}<br>Abra para montar uma arma deste lado.`;
        $('upgrade-btn').textContent = `Abrir (${cost})`;
        $('upgrade-btn').disabled = sim.gold < cost;
        $('sell-btn').classList.add('hidden');
      }
      return;
    }
    $('sell-btn').classList.remove('hidden');
    const canUp = w.level < w.def.maxLevel, cost = canUp ? sim.upgradeCost(w) : 0;
    const sig = [g.index, w.def.id, w.level, sim.gold >= cost, g.saboteurs > 0, sim.sellValue(w)].join('|');
    if (sig !== panelSig) {
      panelSig = sig;
      $('panel-title').textContent = `${w.def.name} — nível ${w.level}/${w.def.maxLevel}`;
      $('panel-info').innerHTML = `${g.label}${g.saboteurs > 0 ? ' · <b style="color:#ff6a6a">SABOTADA</b>' : ''}<br>${statsLine(w)}`;
      $('upgrade-btn').textContent = canUp ? `Melhorar (${cost})` : 'Nível máximo';
      $('upgrade-btn').disabled = !canUp || sim.gold < cost;
      $('sell-btn').textContent = `Vender (+${sim.sellValue(w)})`;
    }
  }

  // ------------------------------------------------------------------ Telas (menu, rota, porto, resultado, pausa)
  function startRun() {
    sim.newRun();
    runStartShop = sim.shop.slice();
    if (flags.has('rich')) sim.gold = 9999;
    if (typeFlag) {
      const t = typeFlag.slice(5);
      for (const n of sim.route.layers[0]) { n.type = t; n.risk = LEG_TYPES[t] ? LEG_TYPES[t].risk : 0; n.label = LEG_TYPES[t] ? LEG_TYPES[t].name : n.label; }
    }
    if (flags.has('boss')) {
      const layers = sim.route.layers;
      sim.current = layers[layers.length - 2][0];
      sim.current.next = [0];
      sim.legsDone = layers.length - 1;
      sim.gold = Math.max(sim.gold, 700);
    }
    if (flags.has('port')) { sim.ship.hull = 220; sim.phase = 'port'; sim.current = sim.route.layers[0][0]; }
    ui.pending = null; ui.selected = null; paused = false;
    shownScreen = undefined;
  }

  function screenWanted() {
    if (overlayHold > 0) return null;
    if (paused) return 'pause';
    if (sim.phase === 'leg') return null;
    return sim.phase;
  }

  function syncOverlay() {
    const want = screenWanted();
    if (want === shownScreen) return;
    shownScreen = want;
    overlay.classList.toggle('hidden', !want);
    if (!want) return;
    if (want === 'menu') modal.innerHTML = menuHtml();
    else if (want === 'route') { modal.innerHTML = routeHtml(); bindRoute(); }
    else if (want === 'port') modal.innerHTML = portHtml();
    else if (want === 'result') modal.innerHTML = resultHtml();
    else if (want === 'pause') modal.innerHTML = pauseHtml();
    modal.querySelectorAll('[data-act]').forEach((el) => el.addEventListener('click', () => act(el.dataset.act)));
  }

  function act(name) {
    if (name === 'start') { if (TOUCH) goFullscreen(); startRun(); }
    else if (name === 'menu') { sim.phase = 'menu'; shownScreen = undefined; }
    else if (name === 'resume') { paused = false; shownScreen = undefined; }
    else if (name === 'abandon') { paused = false; sim.abandon(); }
    else if (name.startsWith('repair')) { sim.repair(name === 'repairAll' ? Infinity : +name.slice(6)); shownScreen = undefined; }
    else if (name.startsWith('up-')) { doShipUpgrade(name.slice(3)); shownScreen = undefined; }
    else if (name === 'leave') sim.leavePort();
  }

  function menuHtml() {
    const m = sim.meta;
    const click = TOUCH ? 'toque' : 'clique';
    return `
      <div class="title">SEA HAULER</div>
      <div class="subtitle">Leve a fragata da Coroa até o porto, com os piratas no seu rastro. Ela navega sozinha: você cuida das velas e dos canhões.</div>
      <div class="howto plate">
        <b>Comprar:</b> ${click} numa arma na barra de baixo e depois numa portinhola aberta.<br>
        <b>Melhorar, vender ou abrir portinhola:</b> ${click} na portinhola.<br>
        <b>Portinholas:</b> cada uma só atira para o seu lado. As bordadas (3 de cada lado) são o forte do navio; 4 começam fechadas.<br>
        <b>Velas${TOUCH ? '' : ' (Z X C)'}:</b> de Pano cheio você deixa os perseguidores para trás, mas quem fica para trás não dá ouro.<br>
        <b>Melhorias${TOUCH ? '' : ' (F G T)'}:</b> Forro de cobre, Velame e Tripulação.${TOUCH ? '' : ' <b>Habilidades:</b> 1 e 2. <b>Pausa:</b> P.'}
      </div><br>
      <button class="big-btn" data-act="start">ZARPAR</button>
      <div class="stats">Viagens: ${m.runsStarted} · Chegadas ao porto: ${m.runsCompleted} · Melhor run: ${m.bestLegs} ${m.bestLegs === 1 ? 'trecho' : 'trechos'}</div>`;
  }

  const TYPE_ICON = { open: '➜', reefs: '▲', cove: '☠', storm: '≋', port: '⚓', boss: 'B' };
  function routeHtml() {
    const layers = sim.route.layers, cols = layers.length + 1;
    const MW = 1160, MH = 430, cx = (c) => 70 + c * ((MW - 140) / (cols - 1));
    const cy = (j, n) => MH / 2 + (j - (n - 1) / 2) * 130;
    const pos = new Map();
    pos.set('A', [cx(0), MH / 2]);
    layers.forEach((layer, l) => layer.forEach((node) => pos.set(node, [cx(l + 1), cy(node.index, layer.length)])));

    const visited = new Set(sim.visited);
    const lines = [];
    const edge = (a, b, cls) => {
      const [x1, y1] = pos.get(a), [x2, y2] = pos.get(b);
      const style = cls === 'done' ? 'stroke:#f2b632;stroke-width:6' : cls === 'open' ? 'stroke:#8ef0aa;stroke-width:4;stroke-dasharray:10 8' : 'stroke:rgba(80,50,20,.35);stroke-width:3;stroke-dasharray:4 6';
      lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="${style}"/>`);
    };
    for (const node of layers[0]) edge('A', node, visited.has(node) ? 'done' : !sim.current ? 'open' : '');
    layers.forEach((layer, l) => {
      if (l === layers.length - 1) return;
      for (const node of layer) for (const j of node.next) {
        const target = layers[l + 1][j];
        const cls = visited.has(node) && visited.has(target) ? 'done' : node === sim.current ? 'open' : '';
        edge(node, target, cls);
      }
    });

    let nodesHtml = `<div class="node plate origin visited" style="left:${cx(0)}px;top:${MH / 2}px"><div class="n">A</div>Origem</div>`;
    layers.forEach((layer) => layer.forEach((node) => {
      const [x, y] = pos.get(node);
      const reach = sim.canChoose(node);
      const cls = ['node', 'plate', `t-${node.type}`, reach ? 'reachable' : 'blocked', visited.has(node) ? 'visited' : '', node === sim.current ? 'current' : '', node.isBoss ? 'boss' : ''].join(' ');
      let body;
      if (node.isBoss) body = '<div class="n">B</div>Destino · Galeão';
      else if (node.type === 'port') body = `<div class="n">${TYPE_ICON.port}</div>Porto<div class="bonus">Reparo · sem combate</div>`;
      else {
        const t = LEG_TYPES[node.type];
        body = `<div class="n">${TYPE_ICON[node.type]}</div>${t.name}<div class="risk">${'●'.repeat(t.risk)}${'○'.repeat(2 - t.risk)}</div><div class="bonus">${t.risk ? `+${Math.round(t.risk * cfg.goldBonusPerRisk * 100)}% ouro` : 'Sem bônus'}</div>`;
      }
      nodesHtml += `<button class="${cls}" data-l="${node.layer}" data-i="${node.index}" style="left:${x}px;top:${y}px" ${reach ? '' : 'disabled'} title="${node.type === 'port' ? 'Repare o casco com ouro' : node.isBoss ? 'Perseguição por trás + Galeão pirata' : LEG_TYPES[node.type].short}">${body}</button>`;
    }));

    return `
      <div class="route-head">ESCOLHA O PRÓXIMO TRECHO</div>
      <div class="route-status">Casco <b>${Math.ceil(sim.ship.hull)}/${sim.maxHull}</b> · Ouro <b>${sim.gold}</b> · Trechos concluídos <b>${sim.legsDone}</b> · ➜ por trás · ▲ pela frente, com rochedos · ☠ de todos os lados · ≋ rajadas</div>
      <div id="route-map" class="chart"><svg width="${MW}" height="${MH}">${lines.join('')}</svg>${nodesHtml}</div>`;
  }
  function bindRoute() {
    modal.querySelectorAll('.node[data-l]').forEach((el) => el.addEventListener('click', () => {
      const node = sim.route.layers[+el.dataset.l][+el.dataset.i];
      if (sim.chooseNode(node)) shownScreen = undefined;
    }));
  }

  // Porto: reparo pago com ouro e as melhorias do navio (Parte 1 §10). Sem combate.
  function portHtml() {
    const missing = Math.ceil(sim.missingHull());
    const step = 50;
    const btn = (amount, act, label) => {
      const real = Math.min(amount, missing, sim.gold * PORT.hullPerGold);
      const dis = real <= 0;
      return `<button class="big-btn ${dis ? 'secondary' : ''}" data-act="${act}" ${dis ? 'disabled' : ''}>${label} <small>(${sim.repairCost(Math.max(0, real))} ouro)</small></button>`;
    };
    const upg = UPGRADES.map((u) => {
      const lvl = sim.ship[u.kind], maxed = lvl >= sim.upgradeMax(u.kind), cost = sim.upgradeCostOf(u.kind);
      return `<button class="big-btn secondary small" data-act="up-${u.kind}" ${maxed || sim.gold < cost ? 'disabled' : ''}>${maxed ? `${u.name} no máximo` : `${u.name} ${lvl + 1} <small>(${cost} ouro)</small>`}</button>`;
    }).join('');
    return `
      <div class="route-head">PORTO</div>
      <div class="result-text">Casco <b>${Math.ceil(sim.ship.hull)}/${sim.maxHull}</b> · Ouro <b>${sim.gold}</b><br>
      Reparo: ${PORT.hullPerGold} de casco por 1 de ouro. Aqui não há piratas.</div>
      <div>${btn(step, `repair${step}`, `Reparar ${step}`)}${btn(Infinity, 'repairAll', 'Reparar tudo')}</div>
      <div>${upg}</div>
      <br><button class="big-btn" data-act="leave">ZARPAR</button>`;
  }

  function resultHtml() {
    const r = sim.result || { win: false, legs: 0 };
    const newly = sim.unlockedWeapons().filter((w) => !runStartShop.includes(w));
    return `
      <div class="result-title ${r.win ? 'win' : 'lose'}">${r.win ? 'VOCÊ CHEGOU AO PORTO!' : 'NAVIO AFUNDADO'}</div>
      <div class="result-text">${r.win ? 'A carga da Coroa chegou inteira.' : `O navio foi a pique: ${r.node}.`}<br>Trechos concluídos nesta run: <b>${r.legs}</b></div>
      ${newly.map((w) => `<div class="unlock">Desbloqueado: ${w.name}</div>`).join('')}
      <br><button class="big-btn" data-act="start">NOVA VIAGEM</button><button class="big-btn secondary" data-act="menu">MENU</button>`;
  }

  function pauseHtml() {
    return `
      <div class="title" style="font-size:90px">PAUSA</div><br>
      <button class="big-btn" data-act="resume">CONTINUAR</button><button class="big-btn secondary" data-act="abandon">ABANDONAR VIAGEM</button>`;
  }

  // ------------------------------------------------------------------ Referências para o PixelLab (#refs)
  // POR QUE: os sprites PixelLab são redesenhos destas formas vetoriais, no
  // mesmo ângulo e tamanho, para encaixarem na lógica sem ajuste à mão.
  // ESTRATÉGIA: desenha cada objeto sozinho numa tela transparente, na escala
  // dos sprites, recorta e escreve no DOM o PNG e o ponto de apoio (âncora).
  // O casco e os três mastreames (um por posição das velas) têm a mesma âncora
  // (o centro do navio), então encaixam sozinhos.
  function exportRefs() {
    const S = LOW, SIZE = 640, AX = 320, AY = 420;
    const big = document.createElement('canvas');
    big.width = SIZE; big.height = SIZE;
    const g = big.getContext('2d');
    const saved = ctx;
    refMode = true;
    const out = {};
    const render = (name, gx, gy, draw) => {
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, SIZE, SIZE);
      ctx = g; camWX = 0; camWY = 0; shakeX = 0; shakeY = 0;
      const p = P(gx, gy, 0);
      g.setTransform(S, 0, 0, S, AX - p[0] * S, AY - p[1] * S);
      draw();
      const data = g.getImageData(0, 0, SIZE, SIZE).data;
      let x0 = SIZE, y0 = SIZE, x1 = 0, y1 = 0;
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        if (data[(y * SIZE + x) * 4 + 3] < 24) continue;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      const pad = 4;
      const w = Math.max(32, Math.ceil((x1 - x0 + 1 + pad * 2) / 4) * 4), h = Math.max(32, Math.ceil((y1 - y0 + 1 + pad * 2) / 4) * 4);
      const cx = Math.round((x0 + x1) / 2 - w / 2), cy = Math.round((y0 + y1) / 2 - h / 2);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(big, cx, cy, w, h, 0, 0, w, h);
      out[name] = { png: c.toDataURL('image/png'), ax: AX - cx, ay: AY - cy, w, h };
    };
    const fake = (kind) => ({ kind, def: window.SEA_DATA.ENEMIES[kind], x: 0, y: 0, hp: window.SEA_DATA.ENEMIES[kind].maxHp, flash: 0, torn: 0, seed: 0, left: 2 });

    const savedTime = time;
    time = 0;
    sim.ship.x = 0;
    render('ship', 0, 0, () => drawShipVector(0, 0, 0, false));
    SAIL_SPRITE.forEach((name, i) => render(name, 0, 0, () => drawRigVector(0, 0, 0, i, false, false)));
    render('schooner', 0, 0, () => drawSchooner(0, 0, 0, false, false));
    render('fireship', 0, 0, () => drawFireship(0, 0, 0, false, false));
    render('sloop', 0, 0, () => drawSloop(0, 0, 0, false, false, 2));
    render('galleon-bow', 0, 0, () => drawGalleonBow(0, 0, 0, false));
    render('galleon-hull', 0, 0, () => drawGalleonHull(0, 0, 0, false));
    render('boarder', 0, 0, () => drawBoarderVector(P(0, 0, 0), fake('boarder')));
    const aim = [-Math.SQRT1_2, -Math.SQRT1_2]; // virada para a câmera (o "south" do PixelLab)
    for (const id of WEAPON_ORDER) {
      render(`turret-${id}`, 0, 0, () => drawTurret(WEAPONS[id], { level: 1, aim, cooldown: 0, firing: false }, { index: 0, facing: 225 }, 0, 0, 0, 1));
    }
    for (let i = 1; i <= 3; i++) render(`rock-${i}`, 0, 0, () => drawRockVector({ x: 0, y: 0, r: 1.5, seed: (i - 0.5) / 3 }));

    ctx = saved; refMode = false; sim.ship.x = 0; time = savedTime;
    const pre = document.createElement('pre');
    pre.id = 'REFS'; pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  if (flags.has('refs')) exportRefs();

  // ------------------------------------------------------------------ Laço principal
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

    if ((flags.has('route') || flags.has('port')) && sim.phase === 'menu' && !sim.route) startRun();   // #route / #port: abre essa tela
    if (flags.has('auto')) {
      if (sim.phase === 'menu') startRun();
      else if (sim.phase === 'result') { autoTimer += dt; if (autoTimer > 4) { autoTimer = 0; startRun(); } }
      else if (overlayHold <= 0 || sim.phase === 'leg') autoPlay(sim);
    }

    if (warpSeconds > 0 && sim.phase === 'leg' && sim.running) {
      for (let i = 0; i < warpSeconds * 60 && sim.running; i++) {
        autoPlay(sim); sim.update(1 / 60); emitContinuous(1 / 60); updateFx(1 / 60);
      }
      warpSeconds = 0;
      cam.gx = sim.ship.x + 3;
      bannerTimer = 0;
    }
    if (!paused) {
      let left = dt;
      while (left > 1e-6) { const step = Math.min(left, 1 / 60); sim.update(step); left -= step; }
      emitContinuous(dt);
      updateFx(dt);
    }
    overlayHold = Math.max(0, overlayHold - dt);
    toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.remove('show');
    bannerTimer -= dt; if (bannerTimer <= 0) $('banner').classList.remove('show');

    // A câmera olha um pouco mais à frente quando o navio corre.
    const target = sim.ship.x + 3 + (sim.ship.speed - cfg.seaSpeed) * 0.4;
    cam.gx += (target - cam.gx) * (1 - Math.exp(-6 * dt));
    shake = Math.max(0, shake - 40 * dt);

    render();
    updateHud();
    syncOverlay();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
