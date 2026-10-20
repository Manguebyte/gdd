// Space Hauler — tela, entrada e HUD do protótipo.
// POR QUE: sim.js tem as regras; aqui fica só o que o jogador vê e faz.
// ESTRATÉGIA: o mundo é desenhado num canvas com a mesma projeção isométrica
// do guia Unity (IsoProjection, Fase 1): 1 metro do plano = losango de 32×16 px.
// Não há chão no espaço: o plano é invisível, e a profundidade vem do fundo de
// estrelas em parallax, das boias da rota e da ordem de desenho. Cada objeto tem
// um desenho vetorial; quando existir sprite PixelLab em Sprites/SpaceHauler/,
// ele é usado no lugar. HUD e telas são HTML por cima do canvas.
(() => {
  'use strict';
  const { CONFIG, PLATING, STATION, TRIP_TYPES, DEFENSES, DEFENSE_ORDER, ABILITIES } = window.SH_DATA;
  const { Sim, autoPlay, levelMult } = window.SH;

  // A altura lógica é fixa (720). A largura acompanha a tela entre 16:9 e
  // ~21:9, para celulares largos não ficarem com faixas pretas dos lados.
  let W = 1280;
  const H = 720;
  // Toque (celular/tablet): áreas de toque maiores, sem hover e textos de toque.
  const TOUCH = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const HW = 16, HH = 8;          // meia largura / meia altura de 1 metro do plano, em px
  const CAM_Y = H * (TOUCH ? 0.48 : 0.56); // no toque a barra de baixo é maior: a nave sobe um pouco
  const DECK_H = 24;              // altura do convés da nave (onde ficam os hardpoints), em px
  const FLY_H = 8;                // altura em que as naves voam sobre o plano, em px
  const ZOOM = 1.25;              // aproximação da câmera (tudo é desenhado em escala 1 e ampliado)

  // Atalhos de desenvolvimento: index.html#short,rich,unlock,boss,auto,station
  const flags = new Set(location.hash.replace('#', '').toLowerCase().split(/[,&+]/).filter(Boolean));
  // #warp30: quando o primeiro trecho começa, simula 30 s de uma vez (com o piloto automático).
  const warpFlag = [...flags].find((f) => /^warp\d+$/.test(f));
  let warpSeconds = warpFlag ? +warpFlag.slice(4) : 0;
  // #type=asteroids: o primeiro trecho da run é desse tipo (para testar cada padrão).
  const typeFlag = [...flags].find((f) => f.startsWith('type='));

  // ------------------------------------------------------------------ Save (MetaProgress)
  const SAVE_KEY = 'spacehauler.meta';
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
    config: flags.has('short') ? { tripLength: 150 } : {},
  });
  const cfg = sim.cfg;

  // ------------------------------------------------------------------ DOM
  const $ = (id) => document.getElementById(id);
  const app = $('app'), canvas = $('view');
  let ctx = canvas.getContext('2d');
  const hud = $('hud'), overlay = $('overlay'), modal = $('modal');
  const shopEl = $('shop'), abilitiesEl = $('abilities'), panel = $('panel');

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
  let runStartShop = [];    // defesas liberadas no começo da run (para avisar desbloqueios)
  let autoTimer = 0;
  let refMode = false;      // exportando referências para o PixelLab (#refs): sem efeitos

  const cam = { gx: 0 };
  let camWX = 0, camWY = 0, shake = 0, shakeX = 0, shakeY = 0;
  const hpScreen = [];
  const muzzle = sim.hardpoints.map(() => 0);
  let particles = [], tracers = [], floaters = [];

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
  function poly(points, fill, stroke = 'rgba(4,6,16,.55)') {
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
    if (flash) return { top: '#ffffff', right: '#e6ecff', rear: '#cfd6ee' };
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
  // Placa plana no topo de algo (asa, painel): um losango no plano, na altura h.
  function plate(points, h, fill, stroke) {
    poly(points.map(([x, y]) => P(x, y, h)), fill, stroke);
  }

  // ------------------------------------------------------------------ Sprites PixelLab
  // POR QUE: a arte final é pixel art do PixelLab (Sprites/SpaceHauler/). Cada
  // sprite é um redesenho da forma vetorial, no mesmo ângulo e tamanho, então
  // basta colar o ponto de apoio (âncora, em px do PNG) no plano.
  // ESTRATÉGIA: 1 px de arte = 1 px da tela lógica, ampliada sem suavização.
  // Sprite que não carregou (ou #vector na URL) cai de volta no desenho vetorial.
  const SPRITE_BASE = '../../Sprites/SpaceHauler/';
  // Nome → { path, ax, ay }. Gerado por Sprites/SpaceHauler/_tools/baixar.py.
  const SPRITES = {};
  for (const [name, sp] of Object.entries(window.SH_SPRITES || {})) SPRITES[name] = Object.assign({}, sp);
  const TURRET_DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
  const SPRITE_PARTS = { cruiser: ['cruiser-bow', 'cruiser-hull'] }; // desenhadas nessa ordem
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
  // Direção da torre: a mais perto, entre as 8 da tela, da direção da mira no plano.
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

  // ------------------------------------------------------------------ Espaço: fundo, planetas, rota
  // Estrelas em 3 camadas de parallax, na tela: as do fundo mal se mexem, as da
  // frente correm mais. É o que dá a sensação de movimento sem chão.
  const STAR_LAYERS = [
    { cell: 46, factor: 0.08, size: 1, alpha: 0.45, density: 0.55 },
    { cell: 70, factor: 0.22, size: 1.5, alpha: 0.7, density: 0.45 },
    { cell: 120, factor: 0.5, size: 2.2, alpha: 0.95, density: 0.35 },
  ];
  function drawSpace() {
    const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, '#070a1c'); g.addColorStop(0.55, '#0e1430'); g.addColorStop(1, '#151a3c');
    ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);

    // Nebulosas: manchas grandes e fixas que deslizam bem devagar.
    const nx = -camWX * 0.04, ny = -camWY * 0.04;
    glow([W * 0.25 + nx, H * 0.3 + ny], 420, '#3a2a7a', 0.35);
    glow([W * 0.85 + nx, H * 0.75 + ny], 360, '#1a4a6a', 0.3);
    glow([W * 0.6 + nx, H * 0.1 + ny], 260, '#6a2a5a', 0.18);

    for (let li = 0; li < STAR_LAYERS.length; li++) {
      const L = STAR_LAYERS[li];
      const ox = -camWX * L.factor, oy = -camWY * L.factor;
      const c0 = Math.floor((-W * 0.2 - ox) / L.cell), c1 = Math.ceil((W * 1.2 - ox) / L.cell);
      const r0 = Math.floor((-H * 0.2 - oy) / L.cell), r1 = Math.ceil((H * 1.2 - oy) / L.cell);
      for (let cx = c0; cx <= c1; cx++) {
        for (let cy = r0; cy <= r1; cy++) {
          if (hash(cx, cy, 31 + li) > L.density) continue;
          const x = cx * L.cell + hash(cx, cy, 41 + li) * L.cell + ox;
          const y = cy * L.cell + hash(cx, cy, 51 + li) * L.cell + oy;
          const tw = 0.6 + 0.4 * Math.sin(time * (1 + hash(cx, cy, 61) * 3) + cx);
          ctx.globalAlpha = L.alpha * tw;
          ctx.fillStyle = hash(cx, cy, 71) < 0.15 ? '#ffd8a8' : hash(cx, cy, 72) < 0.2 ? '#a8d0ff' : '#ffffff';
          ctx.fillRect(Math.round(x), Math.round(y), L.size, L.size);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Um planeta grande, abaixo do plano da rota (h negativo = mais "fundo").
  function drawPlanet(gx, gy, radius, colors) {
    const p = P(gx, gy, -260);
    const g = ctx.createRadialGradient(p[0] - radius * 0.35, p[1] - radius * 0.35, radius * 0.1, p[0], p[1], radius);
    g.addColorStop(0, colors[0]); g.addColorStop(0.6, colors[1]); g.addColorStop(1, colors[2]);
    glow(p, radius * 1.25, colors[1], 0.25);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], radius, 0, Math.PI * 2); ctx.fill();
    // Faixas da atmosfera.
    ctx.save(); ctx.beginPath(); ctx.arc(p[0], p[1], radius, 0, Math.PI * 2); ctx.clip();
    ctx.globalAlpha = 0.18; ctx.strokeStyle = colors[0]; ctx.lineWidth = radius * 0.08;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(p[0], p[1] + i * radius * 0.32, radius * 1.1, radius * 0.12, -0.46, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawPlanets() {
    if (!sim.settings && sim.phase !== 'trip') return;
    // Origem: fica para trás no começo de cada trecho. Destino: aparece no último.
    drawPlanet(-46, -40, 300, ['#9fd8ff', '#3a7ac8', '#0c1a3a']);
    if (sim.settings && sim.settings.hasBoss) drawPlanet(cfg.tripLength + 60, 40, 340, ['#ffd8a0', '#c86a3a', '#2a0c08']);
  }

  // Boias da rota a cada 100 m, nos dois lados: a única referência de "chão" no espaço.
  function pushStaticItems(items, b) {
    const len = cfg.tripLength;
    for (let m = 100; m < len; m += 100) {
      if (m < b.x0 - 10 || m > b.x1 + 10) continue;
      items.push({ key: m + 8, draw: () => drawBuoy(m, 8, null) });
      items.push({ key: m - 8, draw: () => drawBuoy(m, -8, `${cfg.tripLength - m} m`) });
    }
    const boss = sim.settings && sim.settings.hasBoss;
    if (len > b.x0 - 10 && len < b.x1 + 10) items.push({ key: len, draw: () => drawGate(len, boss ? 'B' : 'FIM DO TRECHO', boss ? '#ff9a5a' : '#7ad8ff') });
    if (b.x0 < 0 && b.x1 > -14) items.push({ key: -6, draw: () => drawGate(-6, 'A', '#c8d0e8') });
  }
  function drawBuoy(gx, gy, label) {
    const p = P(gx, gy, 10);
    box(gx, gy, 0.4, 0.4, 14, 4, tones('#5a6280'));
    const on = Math.sin(time * 4 + gx) > 0;
    ellipse(P(gx, gy, 20), 3, 3, on ? '#ffe27a' : '#6a5a2a');
    if (on) glow(P(gx, gy, 20), 14, '#ffd84a', 0.5);
    if (label) {
      ctx.fillStyle = '#c8d4ff'; ctx.font = '700 12px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(label, p[0], p[1] + 16);
    }
  }
  // Portal de salto: um anel em pé, atravessando a rota.
  function drawGate(gx, text, color) {
    const a = P(gx, 9, 6), b = P(gx, -9, 6), c = P(gx, -9, 70), d = P(gx, 9, 70);
    line(a, d, '#3a4260', 6); line(b, c, '#3a4260', 6); line(d, c, '#3a4260', 6);
    line(a, d, color, 2); line(b, c, color, 2); line(d, c, color, 2);
    for (const q of [a, b, c, d]) glow(q, 16, color, 0.6);
    const mx = (d[0] + c[0]) / 2, my = (d[1] + c[1]) / 2;
    ctx.save();
    ctx.translate(mx, my - 12);
    ctx.rotate(Math.atan2(c[1] - d[1], c[0] - d[0]));
    ctx.fillStyle = color; ctx.font = '700 20px "Orbitron", "Barlow Condensed", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function visibleBounds() {
    const corners = [toGround(0, 0), toGround(W, 0), toGround(0, H), toGround(W, H)];
    const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }

  function drawClouds() {
    for (const cl of sim.clouds) {
      const a = Math.min(1, cl.life / 0.6) * 0.8;
      for (let i = 0; i < 14; i++) {
        const gx = cl.x + (hash(i, cl.x | 0, 3) - 0.5) * cl.size * 2;
        const gy = cl.y + (hash(i, cl.x | 0, 4) - 0.5) * cfg.laneHalfWidth * 2;
        const p = P(gx, gy, FLY_H + hash(i, 1, 5) * 16);
        const spin = time * (1 + hash(i, 2, 6) * 3);
        ctx.globalAlpha = a;
        ctx.fillStyle = i % 3 ? '#6a7088' : '#9aa0b8';
        ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(spin);
        ctx.fillRect(-3, -2, 6, 4);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }

  // Arco de alcance do hardpoint (prévia de compra ou defesa selecionada).
  function drawRangePreview() {
    let hp = null, def = null;
    if (ui.pending && ui.hover !== null && !sim.hardpoints[ui.hover].defense) { hp = sim.hardpoints[ui.hover]; def = DEFENSES[ui.pending]; }
    else if (ui.selected !== null && sim.hardpoints[ui.selected].defense) { hp = sim.hardpoints[ui.selected]; def = sim.hardpoints[ui.selected].defense.def; }
    if (!hp) return;
    const [gx, gy] = sim.hardpointGround(hp);
    const pts = [];
    const full = hp.arc >= 360;
    const from = full ? 0 : hp.facing - hp.arc / 2, to = full ? 360 : hp.facing + hp.arc / 2;
    if (!full) pts.push(P(gx, gy, FLY_H));
    for (let a = from; a <= to + 0.01; a += 6) {
      const r = a * Math.PI / 180;
      pts.push(P(gx + Math.cos(r) * def.range, gy + Math.sin(r) * def.range, FLY_H));
    }
    ctx.setLineDash([6, 5]);
    poly(pts, 'rgba(120,220,255,.12)', 'rgba(140,230,255,.8)');
    ctx.setLineDash([]);
  }

  // ------------------------------------------------------------------ Asteroides
  // Rocha irregular: um polígono com o raio variando por vértice, girando devagar.
  function drawAsteroid(a) {
    if (drawSprite(`asteroid-${1 + Math.floor(a.seed * 3)}`, a.x, a.y, FLY_H, false)) return;
    const n = 9, pts = [], top = [];
    const spin = time * a.spin * 0.6;
    for (let i = 0; i < n; i++) {
      const ang = spin + i / n * Math.PI * 2;
      const r = a.r * (0.75 + 0.35 * hash(i, Math.floor(a.seed * 1000), 9));
      pts.push(P(a.x + Math.cos(ang) * r, a.y + Math.sin(ang) * r, FLY_H));
      top.push(P(a.x + Math.cos(ang) * r * 0.75, a.y + Math.sin(ang) * r * 0.75, FLY_H + a.r * 9));
    }
    poly(pts, '#3a3238');
    poly(top, '#6a5a58');
    ellipse(P(a.x - a.r * 0.2, a.y + a.r * 0.15, FLY_H + a.r * 9), a.r * 4, a.r * 2, '#4a3e40');
    ellipse(P(a.x + a.r * 0.25, a.y - a.r * 0.2, FLY_H + a.r * 9), a.r * 2.5, a.r * 1.2, '#857270');
  }

  // ------------------------------------------------------------------ A nave
  function drawShip(bodyOnly = false) {
    const s = sim.ship;
    const gx = s.x, gy = 0;
    const bob = sim.running ? Math.sin(time * 3) * 1.5 : 0;
    const flash = s.flash > 0;
    if (!drawSprite('ship', gx, gy, FLY_H + bob, flash)) drawShipVector(gx, gy, FLY_H + bob, flash);
    if (bodyOnly) return;
    // Brilho dos motores na popa (vale para o sprite e para o vetor).
    if (!flash && sim.running) {
      for (const y of [0.5, -0.5]) glow(P(gx - 4.0, gy + y, FLY_H + bob + 7), 16 + (s.speedMult > 1 ? 10 : 0), s.speedMult > 1 ? '#a8e8ff' : '#5ab8ff', 0.9);
    }
    drawShipTop(bob);
  }

  function drawShipVector(gx, gy, base, flash) {
    // Ordem de desenho: o que está mais longe da câmera (+x, +y) primeiro.
    // Contêineres de carga a bombordo (+y, mais longe).
    for (const x of [-1.6, 0.4]) box(gx + x, gy + 1.35, 1.7, 0.9, 12, base + 2, tones('#d8782a', flash));
    // Casco principal.
    const hull = box(gx, gy, 6.4, 1.8, 14, base, tones('#c8ccd8', flash));
    // Faixa de carga e rebites.
    if (!flash) {
      line(P(hull.x0 + 0.3, hull.y0, base + 7), P(hull.x1 - 0.6, hull.y0, base + 7), '#e8782a', 3);
      for (let i = 0; i < 8; i++) ellipse(P(hull.x0 + 0.5 + i * 0.7, hull.y0, base + 11), 0.8, 0.8, 'rgba(255,255,255,.5)');
    }
    // Cabine na proa.
    const cab = box(gx + 2.6, gy, 1.4, 1.3, 9, hull.top, tones('#a8b0c8', flash));
    poly([P(cab.x1, cab.y0 + 0.1, hull.top + 2), P(cab.x1, cab.y1 - 0.1, hull.top + 2), P(cab.x1, cab.y1 - 0.1, hull.top + 8), P(cab.x1, cab.y0 + 0.1, hull.top + 8)],
      flash ? '#fff' : '#3ad0ff');
    // Nariz.
    poly([P(hull.x1, hull.y0, base), P(hull.x1 + 0.9, gy, base + 5), P(hull.x1, hull.y1, base)], flash ? '#fff' : '#9aa0b4');
    // Contêineres a estibordo (-y, mais perto).
    for (const x of [-1.6, 0.4]) box(gx + x, gy - 1.35, 1.7, 0.9, 12, base + 2, tones('#d8782a', flash));
    // Motores na popa (o brilho é desenhado em drawShip).
    for (const y of [0.5, -0.5]) {
      box(gx - 3.5, gy + y, 0.8, 0.7, 9, base + 3, tones('#5a607a', flash));
    }
  }

  // Hardpoints, defesas e piratas a bordo: de trás para frente.
  function drawShipTop(bob) {
    const order = sim.hardpoints.slice().sort((a, b) => (b.offset[0] + b.offset[1]) - (a.offset[0] + a.offset[1]));
    for (const hp of order) {
      const [sx, sy] = sim.hardpointGround(hp);
      hpScreen[hp.index] = P(sx, sy, DECK_H + bob);
      drawHardpoint(hp, sx, sy, DECK_H + bob);
    }
    for (const e of sim.enemies) if (e.kind === 'pirate' && !e.removed) drawPirate(e, DECK_H + bob);
  }

  function drawHardpoint(hp, gx, gy, h) {
    const d = hp.defense;
    const p = P(gx, gy, h);
    const isHover = ui.hover === hp.index, isSel = ui.selected === hp.index;
    const sabotaged = hp.saboteurs > 0;
    let ring = null;
    if (sabotaged) ring = Math.sin(time * 14) > 0 ? '#ff3b54' : '#7a1a2c';
    else if (isSel) ring = '#ffd84a';
    else if (ui.pending && !d) ring = `rgba(110,240,190,${0.6 + Math.sin(time * 8) * 0.35})`;
    else if (isHover) ring = '#ffffff';
    else if (!d) ring = 'rgba(160,220,255,.4)';
    if (!d) ellipse(p, 9, 4.5, 'rgba(10,14,30,.6)');
    if (ring) {
      ctx.lineWidth = isSel || sabotaged ? 2.5 : 2;
      ellipse(p, 12, 6, null, ring);
    }
    if (!d) {
      if (ui.pending && isHover) drawTurret(DEFENSES[ui.pending], { level: 1, aim: [Math.cos(hp.facing * Math.PI / 180), Math.sin(hp.facing * Math.PI / 180)], cooldown: 0 }, hp, gx, gy, h, 0.5);
      return;
    }
    drawTurret(d.def, d, hp, gx, gy, h, 1);
  }

  function drawTurret(def, d, hp, gx, gy, h, alpha) {
    ctx.globalAlpha = alpha;
    const aim = d.aim || [1, 0];
    const tip = (len, hh) => P(gx + aim[0] * len, gy + aim[1] * len, h + hh);
    ellipse(P(gx, gy, h), 8, 4, '#121628');
    if (drawSprite(turretSprite(def.id, aim), gx, gy, h)) {
      if (def.kind === 'cannon' && muzzle[hp.index] > 0) ellipse(tip(1.3, 5), 4, 3, '#ffe58a');
    } else switch (def.kind) {
      case 'cannon': {
        box(gx, gy, 0.7, 0.7, 6, h, tones('#6a7898'));
        for (const off of [-0.12, 0.12]) {
          const s = P(gx - aim[1] * off, gy + aim[0] * off, h + 5);
          const e = P(gx - aim[1] * off + aim[0] * 1.3, gy + aim[0] * off + aim[1] * 1.3, h + 5);
          line(s, e, '#20263a', 2.5);
        }
        if (muzzle[hp.index] > 0) ellipse(tip(1.5, 5), 5, 4, '#ffe58a');
        break;
      }
      case 'plasma': {
        box(gx, gy, 0.7, 0.7, 5, h, tones('#3a4a6a'));
        line(P(gx, gy, h + 4), tip(1.0, 5), '#26304a', 5);
        ellipse(tip(1.05, 5), 3, 2.5, d.firing ? '#b8fbff' : '#2a8aa8', 'rgba(0,0,0,.5)');
        if (d.firing) glow(tip(1.1, 5), 12, '#5af0ff', 0.8);
        break;
      }
      case 'harpoon': {
        box(gx, gy, 0.8, 0.8, 7, h, tones('#4a5a78'));
        line(P(gx - aim[0] * 0.4, gy - aim[1] * 0.4, h + 6), tip(1.7, 6), '#262e44', 3.5);
        for (const t of [0.5, 0.9, 1.3]) { const c = tip(t, 6); ellipse(c, 2.5, 3, null, '#b06aff'); }
        if (d.cooldown <= 0) ellipse(tip(1.9, 6), 3, 3, '#e0c8ff', 'rgba(0,0,0,.5)');
        break;
      }
      case 'field': {
        box(gx, gy, 0.9, 0.9, 5, h, tones('#5a6080'));
        ellipse(P(gx, gy, h + 11), 5, 5, d.firing ? '#fff6a0' : '#ffd84a', 'rgba(0,0,0,.5)');
        for (let i = 0; i < 3; i++) {
          const a = time * 3 + i * 2.1;
          ellipse(P(gx + Math.cos(a) * 0.45, gy + Math.sin(a) * 0.45, h + 8), 1.6, 1.6, '#ffe27a');
        }
        if (d.firing) {
          for (let i = 0; i < 3; i++) {
            const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 1.4;
            line(P(gx, gy, h + 11), P(gx + Math.cos(a) * r, gy + Math.sin(a) * r, h + 4), '#fff6a0', 1.5);
          }
        }
        break;
      }
    }
    // Nível: pontinhos amarelos.
    for (let i = 1; i < (d.level || 1); i++) {
      const p = P(gx, gy, h + 13 + i * 5);
      poly([[p[0], p[1] - 3], [p[0] + 4, p[1]], [p[0], p[1] + 3], [p[0] - 4, p[1]]], '#f2b632', 'rgba(0,0,0,.6)');
    }
    ctx.globalAlpha = 1;
  }

  // Pirata a bordo: traje espacial vermelho, capacete com visor, uma chave de impacto.
  function drawPirate(e, h) {
    const p = P(e.x, e.y, h);
    if (drawSprite('pirate', e.x, e.y, h, e.flash > 0)) { drawHpBar(p[0], p[1] - 32, e); return; }
    const sway = Math.sin(time * 10 + e.seed) * 2;
    const white = e.flash > 0;
    line([p[0] - 3, p[1]], [p[0] - 2, p[1] - 8], '#2a1a24', 2.5);
    line([p[0] + 3, p[1]], [p[0] + 2, p[1] - 8], '#2a1a24', 2.5);
    ctx.fillStyle = white ? '#fff' : '#a82a3a';
    ctx.fillRect(p[0] - 4, p[1] - 17, 8, 10);
    ellipse([p[0], p[1] - 21], 4.5, 4.5, white ? '#fff' : '#d8dce8', 'rgba(0,0,0,.5)');
    ellipse([p[0] + 1, p[1] - 21], 2.5, 2, '#ffb43a');
    line([p[0] + 4, p[1] - 15], [p[0] + 10 + sway, p[1] - 24], '#8a8aa0', 3);
    drawHpBar(p[0], p[1] - 32, e);
  }

  // ------------------------------------------------------------------ Inimigos
  function enemyTop(e) {
    return { fighter: 24, drone: 26, boarder: 30, pirate: DECK_H + 26, cruiser: 56 }[e.kind];
  }
  // Para onde o inimigo aponta (para a nave), para virar o desenho.
  function facingToShip(e) {
    const dx = sim.ship.x - e.x, dy = -e.y, len = Math.hypot(dx, dy) || 1;
    return [dx / len, dy / len];
  }

  function drawEnemy(e) {
    const flash = e.flash > 0, stunned = e.stun > 0;
    const b = stunned ? 0 : Math.sin(time * 6 + e.seed) * 1.5;
    const { x, y } = e;
    if (hasSprite(e.kind) && !refMode) {
      for (const part of SPRITE_PARTS[e.kind] || [e.kind]) drawSprite(part, x, y, FLY_H + b, flash);
    } else switch (e.kind) {
      case 'fighter': {
        const [fx, fy] = refMode ? [1, 0] : facingToShip(e);
        const sx = -fy, sy = fx; // lado
        const base = FLY_H + 4 + b;
        // Asas em delta.
        plate([[x + fx * 1.0, y + fy * 1.0], [x - fx * 0.8 + sx * 1.1, y - fy * 0.8 + sy * 1.1], [x - fx * 0.5, y - fy * 0.5], [x - fx * 0.8 - sx * 1.1, y - fy * 0.8 - sy * 1.1]],
          base + 3, flash ? '#fff' : '#3a1a24');
        box(x, y, 1.2, 0.5, 5, base, tones('#a82a3a', flash));
        ellipse(P(x + fx * 0.3, y + fy * 0.3, base + 7), 3, 2, flash ? '#fff' : '#ffb43a');
        if (!stunned) glow(P(x - fx * 0.9, y - fy * 0.9, base + 4), 10, '#ff6a4a', 0.8);
        break;
      }
      case 'drone': {
        const base = FLY_H + 6 + b, c = P(x, y, base + 6);
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2 + time * 2;
          line(c, [c[0] + Math.cos(a) * 13, c[1] + Math.sin(a) * 9], '#8a8aa0', 2);
        }
        ellipse(c, 9, 8, flash ? '#fff' : '#4a4a5e', 'rgba(0,0,0,.6)');
        ellipse([c[0] - 2, c[1] - 3], 3, 2, 'rgba(255,255,255,.3)');
        const on = Math.sin(time * 18 + e.seed) > 0;
        ellipse(c, 3.5, 3.5, on ? '#ff3a3a' : '#7a1a1a');
        if (on) glow(c, 16, '#ff3a3a', 0.7);
        break;
      }
      case 'boarder': {
        const [fx, fy] = refMode ? [1, 0] : facingToShip(e);
        const base = FLY_H + 2 + b;
        const body = box(x, y, 2.8, 1.8, 10, base, tones('#5a4a6a', flash));
        // Garras de abordagem na frente.
        for (const s of [-0.6, 0.6]) line(P(x + fx * 1.4 - fy * s, y + fy * 1.4 + fx * s, base + 6), P(x + fx * 2.2 - fy * s * 0.6, y + fy * 2.2 + fx * s * 0.6, base + 4), '#c8c0d8', 3);
        box(x - 0.3, y, 1.4, 1.2, 6, body.top, tones('#3a2a4a', flash));
        for (let i = 0; i < e.left; i++) ellipse(P(x - 0.5 + i * 0.6, y + 0.1, body.top + 9), 3, 3, flash ? '#fff' : '#d8dce8', 'rgba(0,0,0,.5)');
        if (!stunned) glow(P(x - fx * 1.6, y - fy * 1.6, base + 5), 12, '#ff6a4a', 0.7);
        break;
      }
      case 'cruiser': {
        drawCruiserBow(x, y, FLY_H + b, flash);
        drawCruiserHull(x, y, FLY_H + b, flash);
        break;
      }
    }
    if (stunned) {
      const p = P(x, y, enemyTop(e) + 8);
      for (let i = 0; i < 3; i++) {
        const a = time * 6 + i * 2.1;
        ellipse([p[0] + Math.cos(a) * 10, p[1] + Math.sin(a) * 4], 2.5, 2.5, '#d8b8ff', 'rgba(0,0,0,.4)');
      }
    }
    if (e.kind !== 'cruiser') {
      const p = P(x, y, enemyTop(e) + 6);
      drawHpBar(p[0], p[1], e);
    }
  }

  // O cruzador é desenhado em duas peças (proa e casco), porque inteiro ele
  // passa do tamanho máximo de um sprite do PixelLab (256 px).
  function drawCruiserBow(x, y, base, flash) {
    box(x + 3.6, y, 2.2, 2.6, 18, base + 4, tones('#5a1a2a', flash));
    poly([P(x + 4.7, y - 1.3, base + 4), P(x + 6.2, y, base + 12), P(x + 4.7, y + 1.3, base + 4)], flash ? '#fff' : '#8a2a3a');
    ellipse(P(x + 4.2, y, base + 24), 5, 3, flash ? '#fff' : '#ff8a3a');
  }
  function drawCruiserHull(x, y, base, flash) {
    const hull = box(x - 1, y, 7.2, 3.6, 22, base, tones('#3a2030', flash));
    if (!flash) {
      for (let i = 0; i < 5; i++) ellipse(P(hull.x0 + 0.8 + i * 1.4, hull.y0, base + 14), 2, 1.5, Math.sin(time * 5 + i) > 0 ? '#ffb43a' : '#6a3a1a');
      const sk = P(x - 1, hull.y0, base + 8);
      ellipse(sk, 7, 6, '#e8dcc4', 'rgba(0,0,0,.5)');
      ellipse([sk[0] - 2.5, sk[1] - 1], 2, 2, '#1a0e08');
      ellipse([sk[0] + 2.5, sk[1] - 1], 2, 2, '#1a0e08');
    }
    box(x - 1.6, y, 1.6, 1.6, 8, hull.top, tones('#4a3040', flash));
    const [dx, dy] = refMode ? [1, 0] : (() => { const ddx = sim.ship.x - x, ddy = -y, l = Math.hypot(ddx, ddy) || 1; return [ddx / l, ddy / l]; })();
    line(P(x - 1.6, y, hull.top + 5), P(x - 1.6 + dx * 2.4, y + dy * 2.4, hull.top + 5), '#1a1218', 5);
    for (const yy of [1.2, -1.2]) glow(P(hull.x0 - 0.3, y + yy, base + 12), 22, '#ff6a4a', 0.8);
  }

  function drawHpBar(cx, cy, e) {
    if (e.hp >= e.def.maxHp) return;
    const w = 26, f = Math.max(0, e.hp / e.def.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(cx - w / 2 - 1, cy - 1, w + 2, 5);
    ctx.fillStyle = f > 0.5 ? '#6ef0be' : f > 0.25 ? '#f2b632' : '#e0442e';
    ctx.fillRect(cx - w / 2, cy, w * f, 3);
  }

  // ------------------------------------------------------------------ Partículas e efeitos
  function emit(o) {
    if (particles.length > 1400) return;
    particles.push(Object.assign({ vx: 0, vy: 0, vh: 0, grow: 1, drag: 0, layer: 'high', alpha: 1 }, o, { max: o.life }));
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // Explosão no vácuo: sem gravidade, fragmentos voam em linha reta e somem.
  function explosion(gx, gy, h, size) {
    for (let i = 0; i < 18 * size; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(1, 5) * size;
      emit({ gx, gy, h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vh: rnd(-40, 40) * size, life: rnd(0.3, 0.6), size: rnd(3, 6) * size, grow: 1.5, kind: 'fire', drag: 2 });
    }
    for (let i = 0; i < 8 * size; i++) {
      emit({ gx: gx + rnd(-1, 1), gy: gy + rnd(-1, 1), h: h + rnd(-5, 5), vx: rnd(-1, 1), vy: rnd(-1, 1), vh: rnd(-10, 10), life: rnd(0.8, 1.4), size: rnd(4, 7) * size, grow: 2, color: '#3a3448', alpha: 0.5, kind: 'smoke' });
    }
    for (let i = 0; i < 10 * size; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(3, 9);
      emit({ gx, gy, h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vh: rnd(-60, 60), life: rnd(0.6, 1.1), size: rnd(1.5, 3), grow: 0, color: '#8a8aa0', kind: 'debris' });
    }
    emit({ gx, gy, h, life: 0.25, size: 10 * size, grow: 3, color: '#c8f0ff', alpha: 0.8, kind: 'ring' });
  }
  function sparks(gx, gy, h, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(2, 6);
      emit({ gx, gy, h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vh: rnd(-40, 40), life: rnd(0.15, 0.3), size: 1.5, grow: 0, color, kind: 'spark' });
    }
  }
  function puff(gx, gy, h, n, color = '#8a90a8') {
    for (let i = 0; i < n; i++) {
      emit({ gx: gx + rnd(-0.6, 0.6), gy: gy + rnd(-0.6, 0.6), h, vx: rnd(-1.5, 1.5), vy: rnd(-1.5, 1.5), vh: rnd(-10, 20), life: rnd(0.4, 0.8), size: rnd(3, 5), grow: 1.5, color, alpha: 0.6, kind: 'smoke' });
    }
  }
  function floater(gx, gy, h, text, color = '#ffd84a') {
    floaters.push({ gx, gy, h, text, color, life: 1.1, max: 1.1 });
  }

  function hitHeight(e) {
    return { fighter: 14, drone: 18, boarder: 16, pirate: DECK_H + 12, cruiser: 26 }[e.kind];
  }

  sim.on((type, d) => {
    const s = sim.ship;
    switch (type) {
      case 'shot': {
        const [gx, gy] = sim.hardpointGround(d.hardpoint);
        const to = [d.target.x, d.target.y, hitHeight(d.target)];
        if (d.kind === 'cannon') {
          tracers.push({ from: [gx, gy, DECK_H + 5], to, life: 0.06, max: 0.06, color: '#ffe48a', width: 2 });
          muzzle[d.hardpoint.index] = 0.05;
          sparks(to[0], to[1], to[2], 2, '#ffd36b');
        } else {
          tracers.push({ from: [gx, gy, DECK_H + 6], to, life: 0.3, max: 0.3, color: '#d0a8ff', width: 2.5, hook: true });
          sparks(to[0], to[1], to[2], 6, '#e8d8ff');
        }
        break;
      }
      case 'enemyShot': {
        const to = [s.x + rnd(-2.5, 2.5), rnd(-1, 1), rnd(12, 26)];
        tracers.push({ from: [d.e.x, d.e.y, d.e.kind === 'cruiser' ? 34 : 15], to, life: 0.07, max: 0.07, color: '#ff5a7a', width: d.e.kind === 'cruiser' ? 3 : 1.5 });
        sparks(to[0], to[1], to[2], 3, '#ff9ab0');
        break;
      }
      case 'kill': {
        const e = d.e;
        const size = e.kind === 'cruiser' ? 3 : e.kind === 'pirate' ? 0.5 : e.kind === 'fighter' ? 0.8 : 1.2;
        explosion(e.x, e.y, hitHeight(e), size);
        floater(e.x, e.y, hitHeight(e) + 18, `+${d.gain}`);
        if (e.kind === 'cruiser') { shake = 16; banner('CRUZADOR DESTRUÍDO', 'A órbita do destino está livre'); }
        else if (e.kind !== 'pirate') shake = Math.max(shake, 2);
        break;
      }
      case 'explode':
        explosion(d.x, d.y, 16, 2);
        shake = Math.max(shake, 11);
        break;
      case 'asteroidHit':
        explosion(d.a.x, d.a.y, FLY_H + 8, 0.9);
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * Math.PI * 2, sp = rnd(2, 7);
          emit({ gx: d.a.x, gy: d.a.y, h: FLY_H + 10, vx: Math.cos(a) * sp + sim.shipSpeed * 0.3, vy: Math.sin(a) * sp, vh: rnd(-30, 30), life: rnd(0.6, 1.2), size: rnd(2, 4), grow: 0, color: '#6a5a58', kind: 'debris' });
        }
        shake = Math.max(shake, 9);
        toast(sim.ship.plating ? `Asteroide! (Carenagem −${Math.round(sim.collisionReduction * 100)}%)` : 'Asteroide! A Carenagem reduz esse dano');
        break;
      case 'shipHit':
        shake = Math.max(shake, Math.min(7, d.amount / 6));
        break;
      case 'board':
        puff(d.e.x, d.e.y, DECK_H, 6, '#a88aa0');
        toast('Pirata a bordo! A defesa do hardpoint parou');
        break;
      case 'boss':
        banner('CRUZADOR PIRATA!', 'Destrua o cruzador para chegar ao destino');
        break;
      case 'tripStarted':
        cam.gx = s.x + 3;
        particles = []; tracers = []; floaters = [];
        banner(d.settings.hasBoss ? 'RUMO AO DESTINO' : TRIP_TYPES[d.settings.type].name.toUpperCase(),
          d.settings.hasBoss ? 'O último trecho. Algo grande vem aí.' : TRIP_TYPES[d.settings.type].short);
        break;
      case 'tripEnded':
        overlayHold = 1.8;
        ui.pending = null; ui.selected = null;
        if (d.success) banner('TRECHO CONCLUÍDO', sim.phase === 'result' ? 'Você chegou ao destino!' : 'Escolha o próximo caminho');
        else { banner('NAVE DESTRUÍDA', ''); explosion(s.x, 0, 20, 3.5); explosion(s.x - 2, 0, 15, 2); shake = 20; }
        break;
      case 'ability':
        if (d.ab.kind === 'afterburner') toast('PÓS-COMBUSTOR!');
        else { const cl = sim.clouds[sim.clouds.length - 1]; puff(cl.x, 0, FLY_H + 8, 10, '#6a7088'); }
        break;
      case 'plating':
        sparks(s.x, 0, FLY_H + 12, 16, '#c8f0ff');
        floater(s.x, 0, FLY_H + 40, `Carenagem ${s.plating}`, '#9fe8ff');
        break;
      case 'build': {
        const [gx, gy] = sim.hardpointGround(d.hardpoint);
        puff(gx, gy, DECK_H, 3, '#c8d0e0');
        sparks(gx, gy, DECK_H + 6, 6, '#9fe8ff');
        break;
      }
      case 'sell': {
        const [gx, gy] = sim.hardpointGround(d.hardpoint);
        puff(gx, gy, DECK_H, 5, '#c8d0e0');
        floater(gx, gy, DECK_H + 16, `+${d.value}`);
        break;
      }
      case 'phase':
        shownScreen = undefined;
        break;
    }
  });

  // Rastros dos motores, plasma e dano que dependem do estado (todo frame).
  function emitContinuous(dt) {
    if (!sim.running) return;
    const s = sim.ship;
    const chance = (rate) => Math.random() < rate * dt;
    const boost = s.speedMult > 1;
    for (const y of [0.5, -0.5]) {
      if (chance(boost ? 70 : 35)) emit({ gx: s.x - 4.1, gy: y + rnd(-0.1, 0.1), h: FLY_H + 7, vx: -rnd(4, 9), vy: rnd(-0.3, 0.3), vh: 0, life: rnd(0.25, 0.5), size: boost ? 3.5 : 2.5, grow: 0.5, kind: 'exhaust', layer: 'low' });
    }
    if (boost && chance(40)) emit({ gx: s.x - 3.6, gy: rnd(-1.2, 1.2), h: rnd(4, 24), vx: 0, life: 0.25, size: 3, grow: 0, color: '#a8d8ff', alpha: 0.6, kind: 'streak' });
    if (s.hull < sim.maxHull * 0.35) {
      if (chance(14)) emit({ gx: s.x - 1 + rnd(-2, 2), gy: rnd(-1, 1), h: FLY_H + 20, vh: rnd(-10, 10), vx: -2, life: rnd(0.5, 0.8), size: 3, grow: 1.5, kind: 'fire' });
      if (chance(10)) emit({ gx: s.x - 1 + rnd(-2, 2), gy: rnd(-1, 1), h: FLY_H + 22, vh: rnd(-10, 10), vx: -3, life: rnd(1, 1.6), size: 4, grow: 3, color: '#2a2434', alpha: 0.55, kind: 'smoke' });
    }
    for (const hp of sim.hardpoints) {
      const d = hp.defense;
      if (!d || !d.firing || d.def.kind !== 'plasma') continue;
      const [gx, gy] = sim.hardpointGround(hp);
      const n = Math.random() < 0.5 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const spread = rnd(-0.25, 0.25), sp = rnd(8, 12);
        const ax = d.aim[0] - d.aim[1] * spread, ay = d.aim[1] + d.aim[0] * spread;
        emit({ gx: gx + d.aim[0] * 1.1, gy: gy + d.aim[1] * 1.1, h: DECK_H + 5, vx: ax * sp, vy: ay * sp, vh: rnd(-10, 10), life: rnd(0.25, 0.38), size: 3, grow: 2.5, kind: 'plasma' });
      }
    }
    for (const e of sim.enemies) {
      if (e.removed || !e.def.isShip || e.stun > 0) continue;
      if (chance(e.kind === 'cruiser' ? 30 : 8)) emit({ gx: e.x, gy: e.y + rnd(-0.3, 0.3), h: FLY_H + 6, vx: -rnd(2, 5), life: rnd(0.2, 0.4), size: 2.5, grow: 0.5, color: '#ff8a5a', alpha: 0.7, kind: 'smoke', layer: 'low' });
    }
  }

  function updateFx(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.gx += p.vx * dt; p.gy += p.vy * dt; p.h += p.vh * dt;
      if (p.drag) { const f = Math.max(0, 1 - p.drag * dt); p.vx *= f; p.vy *= f; }
    }
    particles = particles.filter((p) => p.life > 0);
    for (const tr of tracers) tr.life -= dt;
    tracers = tracers.filter((tr) => tr.life > 0);
    for (const f of floaters) f.life -= dt;
    floaters = floaters.filter((f) => f.life > 0);
    for (let i = 0; i < muzzle.length; i++) muzzle[i] = Math.max(0, muzzle[i] - dt);
  }

  function drawParticles(layer) {
    for (const p of particles) {
      if (p.layer !== layer) continue;
      const f = p.life / p.max;
      const pos = P(p.gx, p.gy, p.h);
      const r = p.size * (1 + p.grow * (1 - f));
      let color = p.color, alpha = p.alpha * f;
      if (p.kind === 'fire') {
        color = f > 0.66 ? '#fff0a0' : f > 0.33 ? '#ff8a3a' : '#5a2a3a';
        alpha = Math.min(1, f * 1.6);
      } else if (p.kind === 'plasma') {
        color = f > 0.6 ? '#e8ffff' : f > 0.3 ? '#5af0ff' : '#1a5a8a';
        alpha = Math.min(1, f * 1.8);
      } else if (p.kind === 'exhaust') {
        color = f > 0.6 ? '#e8f8ff' : '#4aa8ff';
        alpha = f * 0.9;
      }
      ctx.globalAlpha = Math.max(0, alpha);
      if (p.kind === 'ring') {
        ctx.lineWidth = 3; ellipse(pos, r * 1.6, r * 0.8, null, color);
      } else if (p.kind === 'debris' || p.kind === 'spark') {
        ctx.fillStyle = color; ctx.fillRect(pos[0] - r, pos[1] - r, r * 2, r * 2);
      } else if (p.kind === 'streak') {
        line(pos, [pos[0] - 28, pos[1] + 14], color, 2);
      } else {
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(pos[0], pos[1], r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawTracers() {
    for (const tr of tracers) {
      const a = P(...tr.from), b = P(...tr.to);
      ctx.globalAlpha = Math.min(1, tr.life / tr.max * 1.5);
      line(a, b, tr.color, tr.width);
      if (tr.hook) {
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        poly([b, [b[0] - Math.cos(ang - 0.5) * 8, b[1] - Math.sin(ang - 0.5) * 8], [b[0] - Math.cos(ang + 0.5) * 8, b[1] - Math.sin(ang + 0.5) * 8]], tr.color, null);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawFloaters() {
    ctx.font = '700 22px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    for (const f of floaters) {
      const p = P(f.gx, f.gy, f.h + (1 - f.life / f.max) * 34);
      ctx.globalAlpha = Math.min(1, f.life / f.max * 2);
      ctx.lineWidth = 4; ctx.strokeStyle = '#0a0c1a'; ctx.strokeText(f.text, p[0], p[1]);
      ctx.fillStyle = f.color; ctx.fillText(f.text, p[0], p[1]);
    }
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,10,.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (sim.ship.flash > 0 && sim.running) {
      ctx.fillStyle = `rgba(200,30,60,${sim.ship.flash * 0.9})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ------------------------------------------------------------------ Quadro
  // O mundo é desenhado numa tela de baixa resolução (1 px = 1 px de arte dos
  // sprites) e ampliado sem suavização: fundo, efeitos e sprites ficam na mesma
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
    drawSpace();
    drawPlanets();
    drawRangePreview();
    drawParticles('low');

    const items = [{ key: sim.ship.x, draw: drawShip }];
    for (const e of sim.enemies) if (!e.removed && e.kind !== 'pirate') items.push({ key: e.x + e.y, draw: () => drawEnemy(e) });
    for (const a of sim.asteroids) items.push({ key: a.x + a.y, draw: () => drawAsteroid(a) });
    items.push({ key: -1e9, draw: drawClouds });
    pushStaticItems(items, b);
    items.sort((a, c) => c.key - a.key);
    for (const it of items) it.draw();

    drawParticles('high');
    drawTracers();

    ctx = mainCtx;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(low, 0, 0, lw / ART, H);
    ctx.setTransform(k * ZOOM, 0, 0, k * ZOOM, k * (W / 2) * (1 - ZOOM), k * CAM_Y * (1 - ZOOM));
    drawFloaters();
    ctx.setTransform(k, 0, 0, k, 0, 0);
    drawVignette();
  }

  // ------------------------------------------------------------------ Entrada
  function toLogical(ev) {
    const r = canvas.getBoundingClientRect();
    return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H];
  }
  function pickHardpoint(lx, ly) {
    [lx, ly] = unzoom(lx, ly);
    const radius = TOUCH ? 34 : 22; // dedo é menos preciso que o mouse
    let best = null, bestSqr = radius * radius;
    for (const hp of sim.hardpoints) {
      const p = hpScreen[hp.index];
      if (!p) continue;
      const sqr = (p[0] - lx) ** 2 + (p[1] - ly) ** 2;
      if (sqr < bestSqr) { best = hp.index; bestSqr = sqr; }
    }
    return best;
  }

  canvas.addEventListener('pointermove', (ev) => {
    if (ev.pointerType === 'touch') return; // no toque não existe "passar por cima"
    if (sim.phase !== 'trip') { ui.hover = null; return; }
    const [lx, ly] = toLogical(ev);
    ui.hover = pickHardpoint(lx, ly);
    canvas.style.cursor = ui.hover !== null ? 'pointer' : 'default';
  });
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
  canvas.addEventListener('pointerdown', (ev) => {
    if (sim.phase !== 'trip' || paused) return;
    if (ev.button === 2) { cancelAll(); return; }
    if (ev.button !== 0) return;
    const [lx, ly] = toLogical(ev);
    const index = pickHardpoint(lx, ly);
    ui.hover = ev.pointerType === 'touch' ? null : index;
    if (index === null) { cancelAll(); return; }
    const hp = sim.hardpoints[index];
    if (ui.pending && !hp.defense) {
      const res = sim.buy(index, ui.pending);
      if (res === 'noScrap') toast('Sucata insuficiente');
      if (res === 'ok' && !ev.shiftKey) ui.pending = null;
    } else if (hp.defense) {
      ui.pending = null;
      ui.selected = ui.selected === index ? null : index;
    } else {
      toast('Escolha uma defesa na barra de baixo');
    }
  });

  function cancelAll() { ui.pending = null; ui.selected = null; }

  const BUY_KEYS = ['KeyQ', 'KeyW', 'KeyE', 'KeyR'];
  addEventListener('keydown', (ev) => {
    if (ev.code === 'KeyP' || (ev.code === 'Escape' && paused)) { togglePause(); return; }
    if (sim.phase !== 'trip' || paused) return;
    if (ev.code === 'Escape') cancelAll();
    const ai = ['Digit1', 'Digit2', 'Numpad1', 'Numpad2'].indexOf(ev.code);
    if (ai >= 0) useAbility(ai % 2);
    const bi = BUY_KEYS.indexOf(ev.code);
    if (bi >= 0) selectBuy(DEFENSE_ORDER[bi]);
    if (ev.code === 'KeyC') doPlating();
    if (ev.code === 'KeyU' && ui.selected !== null) doUpgrade();
    if (ev.code === 'KeyV' && ui.selected !== null) doSell();
  });
  addEventListener('blur', () => { if (sim.phase === 'trip' && sim.running && !paused) togglePause(); });
  // No celular, trocar de app ou bloquear a tela também pausa.
  document.addEventListener('visibilitychange', () => { if (document.hidden && sim.phase === 'trip' && sim.running && !paused) togglePause(); });

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
    if (sim.phase !== 'trip' || !sim.running) return;
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
    const def = DEFENSES[id];
    if (!sim.shop.includes(def)) {
      toast(`Libera ao concluir ${def.unlockAtBestTrips} ${def.unlockAtBestTrips === 1 ? 'trecho' : 'trechos'} numa run`);
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
  function drawDefenseIcon(g, kind) {
    g.lineCap = 'round';
    g.fillStyle = '#121628'; g.beginPath(); g.ellipse(28, 38, 18, 4, 0, 0, Math.PI * 2); g.fill();
    if (kind === 'cannon') {
      g.fillStyle = '#6a7898'; g.fillRect(14, 20, 18, 14);
      g.strokeStyle = '#20263a'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(30, 24); g.lineTo(52, 18); g.moveTo(30, 29); g.lineTo(52, 23); g.stroke();
      g.fillStyle = '#ffe58a'; g.beginPath(); g.arc(53, 20, 3, 0, Math.PI * 2); g.fill();
    } else if (kind === 'plasma') {
      g.fillStyle = '#3a4a6a'; g.fillRect(14, 24, 16, 12);
      g.strokeStyle = '#26304a'; g.lineWidth = 6; g.beginPath(); g.moveTo(26, 28); g.lineTo(40, 22); g.stroke();
      g.fillStyle = '#5af0ff'; g.beginPath(); g.moveTo(40, 15); g.quadraticCurveTo(58, 18, 54, 22); g.quadraticCurveTo(58, 28, 40, 29); g.fill();
      g.fillStyle = '#e8ffff'; g.beginPath(); g.ellipse(45, 22, 5, 3, 0, 0, Math.PI * 2); g.fill();
    } else if (kind === 'harpoon') {
      g.fillStyle = '#4a5a78'; g.fillRect(12, 22, 16, 13);
      g.strokeStyle = '#262e44'; g.lineWidth = 5; g.beginPath(); g.moveTo(16, 27); g.lineTo(42, 18); g.stroke();
      g.strokeStyle = '#b06aff'; g.lineWidth = 2;
      for (const x of [26, 32, 38]) { g.beginPath(); g.ellipse(x, 22 - (x - 26) / 3, 3, 5, 0, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = '#e0c8ff'; g.beginPath(); g.arc(46, 16, 4, 0, Math.PI * 2); g.fill();
    } else {
      g.fillStyle = '#5a6080'; g.fillRect(18, 26, 20, 10);
      g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(28, 18, 8, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#fff6a0'; g.lineWidth = 2;
      for (const [x2, y2] of [[10, 10], [46, 8], [48, 26], [8, 28]]) { g.beginPath(); g.moveTo(28, 18); g.lineTo((28 + x2) / 2 + 3, (18 + y2) / 2 - 3); g.lineTo(x2, y2); g.stroke(); }
    }
  }
  function drawAbilityIcon(g, kind) {
    if (kind === 'afterburner') {
      g.fillStyle = '#5a6080'; g.fillRect(8, 14, 16, 14);
      g.fillStyle = '#4aa8ff'; g.beginPath(); g.moveTo(24, 14); g.quadraticCurveTo(46, 21, 24, 28); g.fill();
      g.fillStyle = '#e8f8ff'; g.beginPath(); g.moveTo(24, 17); g.quadraticCurveTo(36, 21, 24, 25); g.fill();
    } else {
      g.fillStyle = '#6a7088';
      for (const [x, y, r] of [[14, 14, 4], [26, 10, 3], [34, 20, 4], [20, 26, 5], [32, 30, 3], [10, 30, 3]]) { g.save(); g.translate(x, y); g.rotate(x); g.fillRect(-r, -r * 0.7, r * 2, r * 1.4); g.restore(); }
    }
  }

  const shopButtons = DEFENSE_ORDER.map((id, i) => {
    const def = DEFENSES[id];
    const btn = document.createElement('button');
    btn.className = 'buy plate';
    btn.innerHTML = `<span class="key">${BUY_KEYS[i].slice(3)}</span><span class="name">${def.name}</span><span class="cost"></span>`;
    // Ícone: o sprite PixelLab da torre (virada para a câmera); se não houver, o desenho vetorial.
    const sp = SPRITES[`turret-${id}-south`];
    if (sp) {
      const img = document.createElement('img');
      img.className = 'icon';
      img.src = `${SPRITE_BASE}${sp.path}.png`;
      img.onerror = () => img.replaceWith(iconCanvas(56, 44, (g) => drawDefenseIcon(g, id)));
      btn.prepend(img);
    } else btn.prepend(iconCanvas(56, 44, (g) => drawDefenseIcon(g, id)));
    btn.addEventListener('click', () => selectBuy(id));
    shopEl.appendChild(btn);
    return { id, def, btn, cost: btn.querySelector('.cost') };
  });

  // Carenagem: botão próprio, ao lado da barra de compra (é da nave, não de um hardpoint).
  const platingBtn = document.createElement('button');
  platingBtn.className = 'buy plate plating';
  platingBtn.innerHTML = '<span class="key">C</span><span class="name">Carenagem</span><span class="cost"></span>';
  platingBtn.prepend(iconCanvas(56, 44, (g) => {
    g.fillStyle = '#121628'; g.beginPath(); g.ellipse(28, 38, 18, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#9aa4c0'; g.beginPath(); g.moveTo(10, 30); g.lineTo(28, 6); g.lineTo(46, 30); g.lineTo(28, 36); g.closePath(); g.fill();
    g.strokeStyle = '#3a4260'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#c8d0e8'; for (const [x, y] of [[20, 26], [36, 26], [28, 16]]) { g.beginPath(); g.arc(x, y, 2, 0, Math.PI * 2); g.fill(); }
  }));
  platingBtn.addEventListener('click', doPlating);
  shopEl.appendChild(platingBtn);
  function doPlating() {
    const res = sim.buyPlating();
    if (res === 'noScrap') toast('Sucata insuficiente');
    else if (res === 'max') toast('Carenagem no nível máximo');
  }

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
    const res = sim.upgrade(ui.selected);
    if (res === 'noScrap') toast('Sucata insuficiente');
  }
  function doSell() {
    sim.sell(ui.selected);
    ui.selected = null;
  }
  $('upgrade-btn').addEventListener('click', doUpgrade);
  $('sell-btn').addEventListener('click', doSell);

  function statsLine(d) {
    const def = d.def, m = levelMult(d), fmt = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
    switch (def.kind) {
      case 'cannon': return `${fmt(def.damage * m / def.fireInterval)} de dano/s · alcance ${fmt(def.range)} m`;
      case 'plasma': return `${fmt(def.damage * m)} de dano/s em cone · alcance ${fmt(def.range)} m`;
      case 'harpoon': return `${fmt(def.damage * m)} de dano a cada ${fmt(def.fireInterval)} s · atordoa ${fmt(def.stunSeconds * m)} s · só naves`;
      case 'field': return `choque de ${fmt(def.damage * m)}/s em quem chega a ${fmt(def.range)} m (inclusive piratas a bordo)`;
    }
    return '';
  }

  let panelSig = '';
  function updateHud() {
    const inTrip = sim.phase === 'trip' || overlayHold > 0;
    hud.classList.toggle('hidden', !inTrip);
    if (!inTrip) return;
    const s = sim.ship;
    $('scrap').textContent = sim.scrap;
    const hpf = s.hull / sim.maxHull;
    $('hp-fill').style.width = `${hpf * 100}%`;
    $('hp-fill').classList.toggle('low', hpf < 0.3);
    $('hp-text').textContent = `CASCO ${Math.ceil(s.hull)} / ${sim.maxHull}${s.plating ? ` · CARENAGEM ${s.plating}` : ''}`;
    $('trip-label').textContent = sim.settings ? sim.settings.label : '';
    const prog = sim.progress;
    $('progress-fill').style.width = `${prog * 100}%`;
    $('progress-ship').style.left = `${prog * 100}%`;
    $('progress-end').textContent = sim.settings && sim.settings.hasBoss ? 'B' : 'FIM';
    const boss = sim.enemies.find((e) => e.kind === 'cruiser' && !e.removed);
    $('boss-bar').classList.toggle('hidden', !boss);
    if (boss) $('boss-fill').style.width = `${boss.hp / boss.def.maxHp * 100}%`;
    if (sim.running && s.x >= cfg.tripLength && sim.blockers > 0 && bannerTimer <= 0) banner('DESTRUA O CRUZADOR', 'Ele bloqueia a chegada ao destino');

    for (const sb of shopButtons) {
      const locked = !sim.shop.includes(sb.def);
      sb.btn.classList.toggle('locked', locked);
      sb.btn.classList.toggle('selected', ui.pending === sb.id);
      sb.btn.classList.toggle('poor', !locked && sim.scrap < sb.def.cost);
      const text = locked ? `Concluir ${sb.def.unlockAtBestTrips} ${sb.def.unlockAtBestTrips === 1 ? 'trecho' : 'trechos'}` : `${sb.def.cost} sucata`;
      if (sb.cost.textContent !== text) sb.cost.textContent = text;
    }
    const maxed = s.plating >= PLATING.maxLevel;
    const ptext = maxed ? 'Nível máximo' : `Nv ${s.plating + 1} · ${sim.platingCost()}`;
    const pcost = platingBtn.querySelector('.cost');
    if (pcost.textContent !== ptext) pcost.textContent = ptext;
    platingBtn.classList.toggle('poor', !maxed && sim.scrap < sim.platingCost());
    platingBtn.classList.toggle('locked', maxed);
    abilityButtons.forEach((ab, i) => {
      const f = sim.cooldown01(i);
      ab.btn.style.setProperty('--cd', f.toFixed(3));
      ab.secs.textContent = f > 0 ? Math.ceil(sim.cooldowns[i]) : '';
      ab.btn.classList.toggle('ready', f <= 0 && sim.running);
    });

    const hp = ui.selected !== null ? sim.hardpoints[ui.selected] : null;
    const d = hp && hp.defense;
    if (hp && !d) ui.selected = null;
    panel.classList.toggle('hidden', !d);
    if (d) {
      const canUp = d.level < d.def.maxLevel, cost = canUp ? sim.upgradeCost(d) : 0;
      const sig = [hp.index, d.def.id, d.level, sim.scrap >= cost, hp.saboteurs > 0, sim.sellValue(d)].join('|');
      if (sig !== panelSig) {
        panelSig = sig;
        $('panel-title').textContent = `${d.def.name} — nível ${d.level}/${d.def.maxLevel}`;
        $('panel-info').innerHTML = `${hp.label}${hp.saboteurs > 0 ? ' · <b style="color:#ff6a8a">SABOTADA</b>' : ''}<br>${statsLine(d)}`;
        $('upgrade-btn').textContent = canUp ? `Melhorar (${cost})` : 'Nível máximo';
        $('upgrade-btn').disabled = !canUp || sim.scrap < cost;
        $('sell-btn').textContent = `Vender (+${sim.sellValue(d)})`;
      }
    } else panelSig = '';
  }

  // ------------------------------------------------------------------ Telas (menu, rota, estação, resultado, pausa)
  function startRun() {
    sim.newRun();
    runStartShop = sim.shop.slice();
    if (flags.has('rich')) sim.scrap = 9999;
    if (typeFlag) {
      const t = typeFlag.slice(5);
      for (const n of sim.route.layers[0]) { n.type = t; n.risk = TRIP_TYPES[t] ? TRIP_TYPES[t].risk : 0; n.label = TRIP_TYPES[t] ? TRIP_TYPES[t].name : n.label; }
    }
    if (flags.has('boss')) {
      const layers = sim.route.layers;
      sim.current = layers[layers.length - 2][0];
      sim.current.next = [0];
      sim.tripsDone = layers.length - 1;
      sim.scrap = Math.max(sim.scrap, 700);
    }
    if (flags.has('station')) { sim.ship.hull = 220; sim.phase = 'station'; sim.current = sim.route.layers[0][0]; }
    ui.pending = null; ui.selected = null; paused = false;
    shownScreen = undefined;
  }

  function screenWanted() {
    if (overlayHold > 0) return null;
    if (paused) return 'pause';
    if (sim.phase === 'trip') return null;
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
    else if (want === 'station') modal.innerHTML = stationHtml();
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
    else if (name === 'stationPlating') { doPlating(); shownScreen = undefined; }
    else if (name === 'leave') sim.leaveStation();
  }

  function menuHtml() {
    const m = sim.meta;
    return `
      <div class="title">SPACE HAULER</div>
      <div class="subtitle">Leve a nave de carga de um planeta ao outro. Ela voa sozinha: você monta as armas.</div>
      <div class="howto plate">${TOUCH ? `
        <b>Comprar:</b> toque numa defesa na barra de baixo e depois num hardpoint vazio da nave.<br>
        <b>Melhorar ou vender:</b> toque numa defesa já montada.<br>
        <b>Hardpoints:</b> cada um só atira para o seu lado (proa, popa, bombordo, estibordo). Monte do lado do ataque.<br>
        <b>Carenagem:</b> protege contra asteroides e drones. <b>Habilidades:</b> botões no canto.` : `
        <b>Comprar:</b> clique numa defesa na barra de baixo e depois num hardpoint vazio da nave.<br>
        <b>Melhorar ou vender:</b> clique numa defesa já montada.<br>
        <b>Hardpoints:</b> cada um só atira para o seu lado (proa, popa, bombordo, estibordo). Monte do lado do ataque.<br>
        <b>Carenagem (C):</b> protege contra asteroides e drones. <b>Habilidades:</b> teclas 1 e 2. <b>Cancelar:</b> botão direito ou Esc. <b>Pausa:</b> P.`}
      </div><br>
      <button class="big-btn" data-act="start">DECOLAR</button>
      <div class="stats">Viagens: ${m.runsStarted} · Chegadas ao destino: ${m.runsCompleted} · Melhor run: ${m.bestTrips} ${m.bestTrips === 1 ? 'trecho' : 'trechos'}</div>`;
  }

  const TYPE_ICON = { open: '➜', asteroids: '◆', pirate: '☠', station: '✚', boss: 'B' };
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
      const style = cls === 'done' ? 'stroke:#f2b632;stroke-width:6' : cls === 'open' ? 'stroke:#6ef0be;stroke-width:4;stroke-dasharray:10 8' : 'stroke:rgba(200,214,255,.22);stroke-width:3';
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
      if (node.isBoss) body = '<div class="n">B</div>Destino · Cruzador';
      else if (node.type === 'station') body = `<div class="n">${TYPE_ICON.station}</div>Estação<div class="bonus">Reparo · sem combate</div>`;
      else {
        const t = TRIP_TYPES[node.type];
        body = `<div class="n">${TYPE_ICON[node.type]}</div>${t.name}<div class="risk">${'●'.repeat(t.risk)}${'○'.repeat(2 - t.risk)}</div><div class="bonus">${t.risk ? `+${Math.round(t.risk * cfg.scrapBonusPerRisk * 100)}% sucata` : 'Sem bônus'}</div>`;
      }
      nodesHtml += `<button class="${cls}" data-l="${node.layer}" data-i="${node.index}" style="left:${x}px;top:${y}px" ${reach ? '' : 'disabled'} title="${node.type === 'station' ? 'Repare o casco com sucata' : node.isBoss ? 'Perseguição por trás + Cruzador pirata' : TRIP_TYPES[node.type].short}">${body}</button>`;
    }));

    return `
      <div class="route-head">ESCOLHA O PRÓXIMO TRECHO</div>
      <div class="route-status">Casco <b>${Math.ceil(sim.ship.hull)}/${sim.maxHull}</b> · Sucata <b>${sim.scrap}</b> · Trechos concluídos <b>${sim.tripsDone}</b> · ➜ por trás · ◆ pela frente, com asteroides · ☠ de todos os lados</div>
      <div id="route-map"><svg width="${MW}" height="${MH}">${lines.join('')}</svg>${nodesHtml}</div>`;
  }
  function bindRoute() {
    modal.querySelectorAll('.node[data-l]').forEach((el) => el.addEventListener('click', () => {
      const node = sim.route.layers[+el.dataset.l][+el.dataset.i];
      if (sim.chooseNode(node)) shownScreen = undefined;
    }));
  }

  // Estação: reparo pago com sucata (Parte 1 §9). Sem combate.
  function stationHtml() {
    const missing = Math.ceil(sim.missingHull());
    const step = 50;
    const btn = (amount, act, label) => {
      const real = Math.min(amount, missing, sim.scrap * STATION.hullPerScrap);
      const dis = real <= 0;
      return `<button class="big-btn ${dis ? 'secondary' : ''}" data-act="${act}" ${dis ? 'disabled' : ''}>${label} <small>(${sim.repairCost(Math.max(0, real))} sucata)</small></button>`;
    };
    const platingMax = sim.ship.plating >= PLATING.maxLevel;
    return `
      <div class="route-head">ESTAÇÃO</div>
      <div class="result-text">Casco <b>${Math.ceil(sim.ship.hull)}/${sim.maxHull}</b> · Sucata <b>${sim.scrap}</b><br>
      Reparo: ${STATION.hullPerScrap} de casco por 1 de sucata. Aqui não há piratas.</div>
      <div>${btn(step, `repair${step}`, `Reparar ${step}`)}${btn(Infinity, 'repairAll', 'Reparar tudo')}</div>
      <div><button class="big-btn secondary" data-act="stationPlating" ${platingMax || sim.scrap < sim.platingCost() ? 'disabled' : ''}>${platingMax ? 'Carenagem no máximo' : `Carenagem nível ${sim.ship.plating + 1} <small>(${sim.platingCost()} sucata)</small>`}</button></div>
      <br><button class="big-btn" data-act="leave">SEGUIR VIAGEM</button>`;
  }

  function resultHtml() {
    const r = sim.result || { win: false, trips: 0 };
    const newly = sim.unlockedDefenses().filter((d) => !runStartShop.includes(d));
    return `
      <div class="result-title ${r.win ? 'win' : 'lose'}">${r.win ? 'VOCÊ CHEGOU AO DESTINO!' : 'NAVE DESTRUÍDA'}</div>
      <div class="result-text">${r.win ? 'A carga chegou inteira.' : `A nave caiu: ${r.node}.`}<br>Trechos concluídos nesta run: <b>${r.trips}</b></div>
      ${newly.map((d) => `<div class="unlock">Desbloqueado: ${d.name}</div>`).join('')}
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
      const p = P(gx, gy, FLY_H);
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
    const fake = (kind, extra = {}) => Object.assign({ kind, def: window.SH_DATA.ENEMIES[kind], x: 0, y: 0, hp: window.SH_DATA.ENEMIES[kind].maxHp, flash: 0, stun: 0, seed: 0, left: 2 }, extra);

    sim.ship.x = 0;
    render('ship', 0, 0, () => drawShipVector(0, 0, FLY_H, false));
    for (const kind of ['fighter', 'drone', 'boarder']) render(kind, 0, 0, () => drawEnemy(fake(kind)));
    render('cruiser-bow', 0, 0, () => drawCruiserBow(0, 0, FLY_H, false));
    render('cruiser-hull', 0, 0, () => drawCruiserHull(0, 0, FLY_H, false));
    render('pirate', 0, 0, () => drawPirate(fake('pirate'), FLY_H));
    const aim = [-Math.SQRT1_2, -Math.SQRT1_2]; // virada para a câmera (o "south" do PixelLab)
    for (const id of DEFENSE_ORDER) {
      render(`turret-${id}`, 0, 0, () => drawTurret(DEFENSES[id], { level: 1, aim, cooldown: 0, firing: false }, { index: 0, facing: 225 }, 0, 0, FLY_H, 1));
    }
    for (let i = 1; i <= 3; i++) render(`asteroid-${i}`, 0, 0, () => drawAsteroid({ x: 0, y: 0, r: 1.5, spin: 0, seed: (i - 0.5) / 3 }));

    ctx = saved; refMode = false; sim.ship.x = 0;
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

    if ((flags.has('route') || flags.has('station')) && sim.phase === 'menu' && !sim.route) startRun();   // #route / #station: abre essa tela
    if (flags.has('auto')) {
      if (sim.phase === 'menu') startRun();
      else if (sim.phase === 'result') { autoTimer += dt; if (autoTimer > 4) { autoTimer = 0; startRun(); } }
      else if (overlayHold <= 0 || sim.phase === 'trip') autoPlay(sim);
    }

    if (warpSeconds > 0 && sim.phase === 'trip' && sim.running) {
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

    const target = sim.ship.x + 3 + (sim.ship.speedMult > 1 ? 2 : 0);
    cam.gx += (target - cam.gx) * (1 - Math.exp(-6 * dt));
    shake = Math.max(0, shake - 40 * dt);

    render();
    updateHud();
    syncOverlay();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
