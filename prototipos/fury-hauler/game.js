// Fury Hauler — tela, entrada e HUD do protótipo.
// POR QUE: sim.js tem as regras; aqui fica só o que o jogador vê e faz.
// ESTRATÉGIA: o mundo é desenhado num canvas com a mesma projeção isométrica
// do guia Unity (IsoProjection, Fase 1): 1 metro de chão = losango de 32×16 px.
// A arte é desenhada por código (caixas isométricas), sem sprites: a arte
// final está Em aberto (Parte 1 §11). HUD e telas são HTML por cima do canvas.
(() => {
  'use strict';
  const { CONFIG, DEFENSES, DEFENSE_ORDER, ABILITIES } = window.FH_DATA;
  const { Sim, autoPlay, levelMult } = window.FH;

  const W = 1280, H = 720;
  const HW = 16, HH = 8;          // meia largura / meia altura de 1 metro de chão, em px
  const CAM_Y = H * 0.56;         // o caminhão fica um pouco abaixo do centro
  const SLOT_H = 27;              // altura do teto do caminhão, em px
  const ZOOM = 1.25;              // aproximação da câmera (tudo é desenhado em escala 1 e ampliado)

  // Atalhos de desenvolvimento: index.html#short,rich,unlock,boss,auto
  const flags = new Set(location.hash.replace('#', '').toLowerCase().split(/[,&+]/).filter(Boolean));
  // #warp30: quando o primeiro trecho começa, simula 30 s de uma vez (com o piloto automático).
  const warpFlag = [...flags].find((f) => /^warp\d+$/.test(f));
  let warpSeconds = warpFlag ? +warpFlag.slice(4) : 0;

  // ------------------------------------------------------------------ Save (MetaProgress)
  const SAVE_KEY = 'furyhauler.meta';
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
  const app = $('app'), canvas = $('view'), ctx = canvas.getContext('2d');
  const hud = $('hud'), overlay = $('overlay'), modal = $('modal');
  const shopEl = $('shop'), abilitiesEl = $('abilities'), panel = $('panel');

  let scale = 1, k = 1;
  function fit() {
    scale = Math.min(innerWidth / W, innerHeight / H);
    const ox = (innerWidth - W * scale) / 2, oy = (innerHeight - H * scale) / 2;
    app.style.transform = `translate(${ox}px, ${oy}px) scale(${scale})`;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * scale * dpr);
    canvas.height = Math.round(H * scale * dpr);
    k = canvas.width / W;
  }
  addEventListener('resize', fit);
  fit();

  // ------------------------------------------------------------------ Estado da tela
  const ui = { pending: null, selected: null, hover: null };
  let paused = false;
  let time = 0;
  let overlayHold = 0;      // segundos até mostrar a tela por cima (depois do fim do trecho)
  let shownScreen = undefined;
  let runStartShop = [];    // defesas liberadas no começo da run (para avisar desbloqueios)
  let autoTimer = 0;

  const cam = { gx: 0 };
  let camWX = 0, camWY = 0, shake = 0, shakeX = 0, shakeY = 0;
  const slotScreen = [];
  const muzzle = sim.slots.map(() => 0);
  let particles = [], tracers = [], floaters = [];

  // ------------------------------------------------------------------ Projeção
  // Chão (metros, altura em px) → tela. Mesma conta do IsoProjection.ToScreen.
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
  function poly(points, fill, stroke = 'rgba(20,10,4,.45)') {
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
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
  }
  // Três tons de uma cor: topo claro, lateral direita média, traseira escura.
  function tones(hex, flash) {
    if (flash) return { top: '#ffffff', right: '#f2e6dc', rear: '#e0d0c4' };
    return { top: shade(hex, 1.15), right: shade(hex, 0.85), rear: shade(hex, 0.62) };
  }
  // Caixa isométrica: L no eixo da estrada, Wd para o lado, altura em px.
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
  function groundRect(x0, x1, y0, y1, fill, stroke = null) {
    poly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], fill, stroke);
  }
  function wheel(gx, gy, r, base = 0) {
    ellipse(P(gx, gy, base + r * 0.6), r, r * 0.75, '#1b1714', 'rgba(0,0,0,.6)');
    ellipse(P(gx, gy, base + r * 0.6), r * 0.4, r * 0.3, '#5b5450');
  }
  function shadow(gx, gy, L, Wd) {
    groundRect(gx - L / 2 - 0.2, gx + L / 2 + 0.4, gy - Wd / 2 - 0.4, gy + Wd / 2 + 0.1, 'rgba(40,20,5,.22)');
  }

  function hash(ix, iy, salt = 0) {
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(salt, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  // ------------------------------------------------------------------ Chão, estrada e cenário
  function visibleBounds() {
    const corners = [toGround(0, 0), toGround(W, 0), toGround(0, H), toGround(W, H)];
    const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }

  function drawGround(b) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#d8b077'); g.addColorStop(1, '#c99a5e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const hw = cfg.roadHalfWidth;
    const cell = 3, deco = [];
    for (let ix = Math.floor(b.x0 / cell) - 1; ix <= Math.ceil(b.x1 / cell) + 1; ix++) {
      for (let iy = Math.floor(b.y0 / cell) - 1; iy <= Math.ceil(b.y1 / cell) + 1; iy++) {
        const gy0 = iy * cell;
        if (Math.abs(gy0 + cell / 2) < hw + 2.5) continue;
        const v = hash(ix, iy);
        if (v > 0.42) continue;
        const gx = ix * cell + hash(ix, iy, 1) * cell, gy = gy0 + hash(ix, iy, 2) * cell;
        if (Math.abs(gy) < hw + 2.2) continue;
        deco.push({ gx, gy, v, r: hash(ix, iy, 3) });
      }
    }
    // Primeiro o que é plano (marcas na areia), depois o que tem altura, de trás para frente.
    for (const d of deco) {
      if (d.v >= 0.22) {
        const p = P(d.gx, d.gy);
        ctx.strokeStyle = d.v < 0.32 ? 'rgba(240,210,160,.55)' : 'rgba(150,105,60,.25)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(p[0], p[1], 18 + d.r * 22, 6 + d.r * 5, -0.46, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      }
    }
    deco.sort((a, c) => (c.gx + c.gy) - (a.gx + a.gy));
    for (const d of deco) {
      if (d.v >= 0.22) continue;
      if (d.v < 0.1) {
        const n = 1 + Math.floor(d.r * 3);
        for (let i = 0; i < n; i++) {
          const s = 0.5 + hash(i, d.gx | 0, 7) * 0.9;
          box(d.gx + i * 0.7, d.gy - i * 0.4, s, s * 0.9, 4 + s * 6, 0, tones(i % 2 ? '#8a6a4a' : '#7a5c40'));
        }
      } else if (d.v < 0.16) {
        const p = P(d.gx, d.gy);
        ctx.strokeStyle = '#6e5a2e'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (i - 2.5) * 0.35;
          ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a) * 9, p[1] + Math.sin(a) * 9 - 2); ctx.stroke();
        }
      } else if (d.v < 0.19) {
        const p = P(d.gx, d.gy);
        ellipse([p[0], p[1] - 3], 5, 4, '#efe6d2', 'rgba(0,0,0,.3)');
        ellipse([p[0] - 2, p[1] - 3], 1.2, 1.2, '#2a1e14');
        ellipse([p[0] + 2, p[1] - 3], 1.2, 1.2, '#2a1e14');
        line([p[0] + 6, p[1]], [p[0] + 14, p[1] + 2], '#efe6d2', 2);
      } else if (d.v < 0.212) {
        ellipse(P(d.gx, d.gy, 3), 8, 5, '#2a2420', 'rgba(0,0,0,.4)');
        ellipse(P(d.gx, d.gy, 3), 3.5, 2.2, '#c49a64');
      } else {
        shadow(d.gx, d.gy, 3.2, 1.8);
        box(d.gx, d.gy, 3.2, 1.7, 7, 0, tones('#7a4a2a'));
        box(d.gx - 0.4, d.gy, 1.3, 1.4, 5, 7, tones('#5a3a24'));
      }
    }
  }

  function drawRoad(b) {
    const hw = cfg.roadHalfWidth, x0 = b.x0 - 4, x1 = b.x1 + 4;
    groundRect(x0, x1, -hw - 1.3, hw + 1.3, '#b68b57');
    groundRect(x0, x1, -hw, hw, '#56483d');

    // Rachaduras e areia por cima do asfalto.
    for (let ix = Math.floor(x0 / 4); ix <= Math.ceil(x1 / 4); ix++) {
      for (let iy = -2; iy <= 1; iy++) {
        const v = hash(ix, iy, 11);
        const gx = ix * 4 + hash(ix, iy, 12) * 4, gy = iy * 3 + hash(ix, iy, 13) * 3;
        if (v < 0.22) {
          const a = P(gx, gy), c = P(gx + 1.2, gy + 0.6), d = P(gx + 2, gy - 0.3);
          ctx.strokeStyle = 'rgba(25,18,12,.55)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
        } else if (v < 0.32) {
          const p = P(gx, gy);
          ctx.fillStyle = 'rgba(200,160,105,.45)';
          ctx.beginPath(); ctx.ellipse(p[0], p[1], 20 + v * 40, 6, -0.46, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    // Faixa central tracejada e linhas de borda gastas.
    for (let ix = Math.floor(x0 / 8); ix <= Math.ceil(x1 / 8); ix++) {
      const gx = ix * 8;
      groundRect(gx, gx + 3.5, -0.1, 0.1, 'rgba(214,170,70,.75)');
      for (const side of [-1, 1]) {
        if (hash(ix, side, 21) < 0.25) continue;
        const y = side * (hw - 0.4);
        groundRect(gx, gx + 8, y - 0.08, y + 0.08, 'rgba(230,220,200,.35)');
      }
    }
  }

  // Itens que entram na ordenação de profundidade junto com veículos.
  function pushStaticItems(items, b) {
    const len = cfg.tripLength;
    for (let m = 100; m < len; m += 100) {
      if (m < b.x0 - 10 || m > b.x1 + 10) continue;
      items.push({ key: m - 7.8, draw: () => drawPost(m) });
    }
    const boss = sim.settings && sim.settings.hasBoss;
    if (len > b.x0 - 10 && len < b.x1 + 10) {
      items.push({ key: len + 7.6, draw: () => drawPole(len, 7.6) });
      items.push({ key: len - 7.6, draw: () => { drawPole(len, -7.6); drawBanner(len, boss ? 'B' : 'FIM DO TRECHO', boss ? '#8c1e0a' : '#a8461c'); } });
    }
    if (b.x0 < 0 && b.x1 > -12) {
      items.push({ key: -6 + 7.6, draw: () => drawPole(-6, 7.6) });
      items.push({ key: -6 - 7.6, draw: () => { drawPole(-6, -7.6); drawBanner(-6, 'A', '#4a4038'); } });
    }
  }
  function drawPost(m) {
    const gx = m, gy = -7.8;
    box(gx, gy, 0.25, 0.25, 22, 0, tones('#5a4632'));
    const p = P(gx, gy, 28);
    ctx.fillStyle = '#e8d6b0'; ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 1.5;
    ctx.fillRect(p[0] - 17, p[1] - 8, 34, 15); ctx.strokeRect(p[0] - 17, p[1] - 8, 34, 15);
    ctx.fillStyle = '#3a2a1c'; ctx.font = '700 12px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${cfg.tripLength - m} m`, p[0], p[1] + 4);
  }
  function drawPole(gx, gy) {
    box(gx, gy, 0.5, 0.5, 70, 0, tones('#4a4038'));
    ellipse(P(gx, gy, 72), 4, 3, '#efe6d2', 'rgba(0,0,0,.4)'); // caveira no topo
  }
  function drawBanner(gx, text, color) {
    const a = P(gx, 7.6, 64), b = P(gx, -7.6, 64), c = P(gx, -7.6, 46), d = P(gx, 7.6, 46);
    poly([a, b, c, d], color, 'rgba(0,0,0,.6)');
    const mx = (a[0] + c[0]) / 2, my = (a[1] + c[1]) / 2;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
    ctx.fillStyle = '#f4e4c4'; ctx.font = '22px "Rubik Dirt", "Barlow Condensed", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(text, 0, 7);
    ctx.restore();
  }

  function drawOils() {
    for (const oil of sim.oils) {
      const a = Math.min(1, oil.life / 0.6) * 0.85;
      const hw = cfg.roadHalfWidth;
      ctx.globalAlpha = a;
      groundRect(oil.x - oil.size, oil.x + oil.size, -hw + 0.3, hw - 0.3, '#14100c');
      const p = P(oil.x - 1, 1.5);
      ctx.fillStyle = 'rgba(120,140,170,.35)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 30, 7, -0.46, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Leque de alcance do slot (prévia de compra ou defesa selecionada).
  function drawRangePreview() {
    let slot = null, def = null;
    if (ui.pending && ui.hover !== null && !sim.slots[ui.hover].defense) { slot = sim.slots[ui.hover]; def = DEFENSES[ui.pending]; }
    else if (ui.selected !== null && sim.slots[ui.selected].defense) { slot = sim.slots[ui.selected]; def = sim.slots[ui.selected].defense.def; }
    if (!slot) return;
    const [gx, gy] = sim.slotGround(slot);
    const pts = [];
    const full = slot.arc >= 360;
    const from = full ? 0 : slot.facing - slot.arc / 2, to = full ? 360 : slot.facing + slot.arc / 2;
    if (!full) pts.push(P(gx, gy));
    for (let a = from; a <= to + 0.01; a += 6) {
      const r = a * Math.PI / 180;
      pts.push(P(gx + Math.cos(r) * def.range, gy + Math.sin(r) * def.range));
    }
    ctx.setLineDash([6, 5]);
    poly(pts, 'rgba(255,226,120,.13)', 'rgba(255,226,120,.75)');
    ctx.setLineDash([]);
  }

  // ------------------------------------------------------------------ Caminhão
  const TRUCK = { cargoX: -0.85, cargoL: 5.5, cabX: 2.9, cabL: 1.8, width: 2.6 };

  function drawTruck() {
    const t = sim.truck;
    const gx = t.x, gy = 0;
    const bob = sim.running ? Math.sin(time * 22) * 0.7 : 0;
    const flash = t.flash > 0;
    const base = 5 + bob;

    shadow(gx - 0.2, gy, 8.6, TRUCK.width);
    for (const x of [-3.0, -1.9, 0.9, 2.9]) wheel(gx + x, gy - 1.25, 5.5);
    for (const x of [-3.0, -1.9]) wheel(gx + x - 0.1, gy + 1.0, 5.5);

    // Aríete com espinhos na frente (mais longe da câmera: desenha antes).
    for (const y of [1.0, 0.35, -0.3, -0.95]) {
      poly([P(gx + 3.8, y - 0.25, base + 4), P(gx + 3.8, y + 0.25, base + 4), P(gx + 4.8, y, base + 8)], flash ? '#fff' : '#b8b2a8');
    }
    // Cabine.
    const cab = box(gx + TRUCK.cabX, gy, TRUCK.cabL, 2.4, 26, base, tones('#4a4b50', flash));
    poly([P(cab.x0 + 0.3, cab.y0, base + 14), P(cab.x1 - 0.2, cab.y0, base + 14), P(cab.x1 - 0.2, cab.y0, base + 23), P(cab.x0 + 0.3, cab.y0, base + 23)],
      flash ? '#fff' : '#1c2a30');
    // Escapamentos.
    for (const y of [0.8, -0.8]) {
      const a = P(gx + 2.3, y, base + 26), b = P(gx + 2.3, y, base + 44);
      line(a, b, flash ? '#fff' : '#c8c4bc', 4);
      line(a, b, 'rgba(0,0,0,.25)', 1);
    }
    // Tanque de carga enferrujado, com faixas e rebites.
    const cargo = box(gx + TRUCK.cargoX, gy, TRUCK.cargoL, TRUCK.width, 22, base, tones('#a8461c', flash));
    if (!flash) {
      for (const h of [7, 15]) line(P(cargo.x0, cargo.y0, base + h), P(cargo.x1, cargo.y0, base + h), 'rgba(40,14,4,.5)', 2);
      for (let i = 0; i < 9; i++) {
        const p = P(cargo.x0 + 0.3 + i * 0.6, cargo.y0, base + 19);
        ellipse(p, 1, 1, 'rgba(255,220,180,.45)');
      }
      // Espinhos na traseira.
      for (const y of [-0.9, 0, 0.9]) {
        poly([P(cargo.x0, y - 0.2, base + 10), P(cargo.x0, y + 0.2, base + 10), P(cargo.x0 - 0.7, y, base + 12)], '#b8b2a8');
      }
    }

    // Slots, defesas e saqueadores: de trás para frente.
    const order = sim.slots.slice().sort((a, b) => (b.offset[0] + b.offset[1]) - (a.offset[0] + a.offset[1]));
    for (const slot of order) {
      const [sx, sy] = sim.slotGround(slot);
      slotScreen[slot.index] = P(sx, sy, SLOT_H + bob);
      drawSlot(slot, sx, sy, SLOT_H + bob);
    }
    for (const e of sim.enemies) if (e.kind === 'raider' && !e.removed) drawRaider(e, SLOT_H + bob);
  }

  function drawSlot(slot, gx, gy, h) {
    const d = slot.defense;
    const p = P(gx, gy, h);
    const isHover = ui.hover === slot.index, isSel = ui.selected === slot.index;
    const sabotaged = slot.saboteurs > 0;
    let ring = null;
    if (sabotaged) ring = Math.sin(time * 14) > 0 ? '#ff3b24' : '#7a1a0c';
    else if (isSel) ring = '#ffd84a';
    else if (ui.pending && !d) ring = `rgba(123,211,107,${0.6 + Math.sin(time * 8) * 0.35})`;
    else if (isHover) ring = '#ffffff';
    else if (!d) ring = 'rgba(255,255,255,.35)';
    if (!d) ellipse(p, 9, 4.5, 'rgba(20,10,4,.35)');
    if (ring) {
      ctx.lineWidth = isSel || sabotaged ? 2.5 : 2;
      ellipse(p, 12, 6, null, ring);
    }
    if (!d) {
      if (ui.pending && isHover) drawTurret(DEFENSES[ui.pending], { level: 1, aim: [Math.cos(slot.facing * Math.PI / 180), Math.sin(slot.facing * Math.PI / 180)], cooldown: 0 }, slot, gx, gy, h, 0.5);
      return;
    }
    drawTurret(d.def, d, slot, gx, gy, h, 1);
  }

  function drawTurret(def, d, slot, gx, gy, h, alpha) {
    ctx.globalAlpha = alpha;
    const aim = d.aim || [1, 0];
    const tip = (len, hh) => P(gx + aim[0] * len, gy + aim[1] * len, h + hh);
    ellipse(P(gx, gy, h), 8, 4, '#1c1612');
    switch (def.kind) {
      case 'mg': {
        box(gx, gy, 0.7, 0.7, 6, h, tones('#55585e'));
        for (const off of [-0.12, 0.12]) {
          const s = P(gx - aim[1] * off, gy + aim[0] * off, h + 5);
          const e = P(gx - aim[1] * off + aim[0] * 1.3, gy + aim[0] * off + aim[1] * 1.3, h + 5);
          line(s, e, '#24262a', 2.5);
        }
        if (muzzle[slot.index] > 0) ellipse(tip(1.5, 5), 5, 4, '#ffe58a');
        break;
      }
      case 'flame': {
        ellipse(P(gx - aim[0] * 0.3, gy - aim[1] * 0.3, h + 6), 5, 6, '#b8321c', 'rgba(0,0,0,.4)');
        box(gx, gy, 0.6, 0.6, 5, h, tones('#5c5a34'));
        line(P(gx, gy, h + 4), tip(1.0, 4), '#3a3020', 4);
        ellipse(tip(1.05, 4), 2.5, 2, d.firing ? '#ffb43a' : '#7a2a10');
        break;
      }
      case 'harpoon': {
        box(gx, gy, 0.8, 0.8, 7, h, tones('#4e6070'));
        line(P(gx - aim[0] * 0.4, gy - aim[1] * 0.4, h + 6), tip(1.7, 6), '#2a3238', 3.5);
        if (d.cooldown <= 0) {
          const a = tip(1.7, 6), b = tip(2.2, 6);
          line(a, b, '#d8dde0', 2);
          ellipse(b, 2.5, 2.5, '#d8dde0');
        }
        break;
      }
      case 'armor': {
        box(gx, gy, 1.0, 1.0, 8, h, tones('#7c7f84'));
        for (let i = 0; i < 4; i++) {
          const a = slot.facing * Math.PI / 180 + (i - 1.5) * 0.5;
          const s = P(gx + Math.cos(a) * 0.4, gy + Math.sin(a) * 0.4, h + 7);
          const e = P(gx + Math.cos(a) * 0.95, gy + Math.sin(a) * 0.95, h + 9);
          line(s, e, d.firing ? '#ffd0a0' : '#d8d4cc', 2.5);
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

  function drawRaider(e, h) {
    const p = P(e.x, e.y, h);
    const sway = Math.sin(time * 10 + e.seed) * 2;
    const white = e.flash > 0;
    line([p[0] - 3, p[1]], [p[0] - 2, p[1] - 8], '#2a1e14', 2.5);
    line([p[0] + 3, p[1]], [p[0] + 2, p[1] - 8], '#2a1e14', 2.5);
    ctx.fillStyle = white ? '#fff' : '#6b4a2e';
    ctx.fillRect(p[0] - 4, p[1] - 17, 8, 10);
    ellipse([p[0], p[1] - 21], 4, 4, white ? '#fff' : '#d8a07a', 'rgba(0,0,0,.5)');
    ctx.fillStyle = '#c21e10'; ctx.fillRect(p[0] - 4, p[1] - 24, 8, 2.5);
    line([p[0] + 4, p[1] - 15], [p[0] + 10 + sway, p[1] - 24], '#8a7a6a', 3);
    drawHpBar(p[0], p[1] - 32, e);
  }

  // ------------------------------------------------------------------ Inimigos
  function enemyTop(e) {
    return { biker: 24, rammer: 22, boarder: 26, raider: SLOT_H + 26, boss: 50 }[e.kind];
  }

  function drawEnemy(e) {
    const flash = e.flash > 0, stunned = e.stun > 0;
    const b = stunned ? 0 : Math.sin(time * 20 + e.seed) * 0.8;
    const { x, y } = e;
    switch (e.kind) {
      case 'biker': {
        shadow(x, y, 1.8, 0.6);
        wheel(x + 0.7, y - 0.1, 4); wheel(x - 0.7, y - 0.1, 4);
        box(x, y, 1.6, 0.5, 5, 4 + b, tones('#3a3634', flash));
        box(x - 0.15, y, 0.45, 0.45, 8, 9 + b, tones('#6b4a2e', flash));
        ellipse(P(x - 0.15, y, 21 + b), 3.5, 3.5, flash ? '#fff' : '#2a2a2e', 'rgba(0,0,0,.5)');
        const dx = sim.truck.x - x, dy = -y, len = Math.hypot(dx, dy) || 1;
        line(P(x, y, 14 + b), P(x + dx / len * 0.8, y + dy / len * 0.8, 15 + b), '#1a1a1a', 2);
        break;
      }
      case 'rammer': {
        shadow(x, y, 3.2, 1.9);
        for (const ox of [-1.0, 1.0]) wheel(x + ox, y - 0.85, 4.5);
        const body = box(x, y, 3.0, 1.8, 8, 4 + b, tones('#c26a1e', flash));
        box(x - 0.6, y, 1.0, 1.4, 6, body.top, tones('#5a3418', flash));
        ellipse(P(x + 0.7, y, body.top + 2), 6, 3.5, flash ? '#fff' : '#9c1a10');
        const top = P(x + 0.7, y, body.top + 10);
        ctx.fillStyle = flash ? '#fff' : '#b8221a'; ctx.fillRect(top[0] - 6, top[1], 12, 8);
        ctx.fillStyle = '#f2c232'; ctx.fillRect(top[0] - 6, top[1] + 3, 12, 2);
        ellipse([top[0], top[1] - 1], 6, 3, flash ? '#fff' : '#d8301e', 'rgba(0,0,0,.4)');
        if (Math.sin(time * 18 + e.seed) > 0) ellipse([top[0] + 2, top[1] - 6], 2.5, 2.5, '#ffe58a');
        break;
      }
      case 'boarder': {
        shadow(x, y, 3.4, 2.1);
        for (const ox of [-1.1, 1.1]) wheel(x + ox, y - 1.0, 5.5);
        const body = box(x, y, 3.2, 2.0, 6, 6 + b, tones('#6a6a2e', flash));
        const top = body.top, cage = top + 14;
        const corners = [[body.x0 + 0.3, body.y0 + 0.2], [body.x1 - 0.5, body.y0 + 0.2], [body.x1 - 0.5, body.y1 - 0.2], [body.x0 + 0.3, body.y1 - 0.2]];
        for (const [cx, cy] of corners) line(P(cx, cy, top), P(cx, cy, cage), '#2a2a24', 2);
        poly(corners.map(([cx, cy]) => P(cx, cy, cage)), null, '#2a2a24');
        for (let i = 0; i < e.left; i++) {
          ellipse(P(x - 0.6 + i * 0.7, y + 0.2, top + 7), 3.5, 3.5, flash ? '#fff' : '#d8a07a', 'rgba(0,0,0,.5)');
          ctx.fillStyle = '#c21e10'; const hp = P(x - 0.6 + i * 0.7, y + 0.2, top + 10); ctx.fillRect(hp[0] - 3.5, hp[1], 7, 2);
        }
        const f0 = P(body.x0 + 0.3, body.y1 - 0.2, cage), f1 = P(body.x0 + 0.3, body.y1 - 0.2, cage + 14);
        line(f0, f1, '#2a2a24', 1.5);
        poly([f1, [f1[0] - 12, f1[1] + 3 + Math.sin(time * 9) * 2], [f1[0], f1[1] + 7]], '#b8221a', null);
        break;
      }
      case 'boss': {
        shadow(x, y, 9.4, 3.8);
        for (const ox of [-3.6, -2.2, 0.4, 2.0, 3.6]) wheel(x + ox, y - 1.7, 7);
        for (const yy of [1.4, 0.5, -0.4, -1.3]) {
          poly([P(x + 4.6, yy - 0.3, 8), P(x + 4.6, yy + 0.3, 8), P(x + 5.8, yy, 12)], flash ? '#fff' : '#a8a296');
        }
        box(x + 3.6, y, 1.9, 3.3, 38, 6 + b, tones('#2e2c2a', flash));
        for (const yy of [1.1, -1.1]) {
          const a = P(x + 2.5, yy, 44), c = P(x + 2.5, yy, 64);
          line(a, c, '#8a8478', 5);
          if (!flash) ellipse([c[0], c[1] - 3], 4, 5, Math.sin(time * 30 + yy) > 0 ? '#ff8a2a' : '#ffd24a');
        }
        const hull = box(x - 1, y, 7.2, 3.6, 30, 6 + b, tones('#3c2a20', flash));
        if (!flash) {
          const sk = P(x - 1, hull.y0, 6 + b + 16);
          ellipse(sk, 9, 8, '#e8dcc4', 'rgba(0,0,0,.5)');
          ellipse([sk[0] - 3.5, sk[1] - 1], 2.5, 2.5, '#1a0e08');
          ellipse([sk[0] + 3.5, sk[1] - 1], 2.5, 2.5, '#1a0e08');
          for (let i = 0; i < 4; i++) line(P(hull.x0 + 0.6 + i * 1.8, hull.y0, 10), P(hull.x0 + 1.4 + i * 1.8, hull.y0, 30), 'rgba(160,60,20,.5)', 3);
        }
        box(x - 1.6, y, 1.6, 1.6, 8, hull.top, tones('#4a4038', flash));
        const dx = sim.truck.x - x, dy = -y, len = Math.hypot(dx, dy) || 1;
        line(P(x - 1.6, y, hull.top + 5), P(x - 1.6 + dx / len * 2.4, y + dy / len * 2.4, hull.top + 5), '#1a1612', 5);
        break;
      }
    }
    if (stunned) {
      const p = P(x, y, enemyTop(e) + 8);
      for (let i = 0; i < 3; i++) {
        const a = time * 6 + i * 2.1;
        ellipse([p[0] + Math.cos(a) * 10, p[1] + Math.sin(a) * 4], 2.5, 2.5, '#fff6a0', 'rgba(0,0,0,.4)');
      }
    }
    if (e.kind !== 'boss') {
      const p = P(x, y, enemyTop(e) + 6);
      drawHpBar(p[0], p[1], e);
    }
  }

  function drawHpBar(cx, cy, e) {
    if (e.hp >= e.def.maxHp) return;
    const w = 26, f = Math.max(0, e.hp / e.def.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(cx - w / 2 - 1, cy - 1, w + 2, 5);
    ctx.fillStyle = f > 0.5 ? '#7bd36b' : f > 0.25 ? '#f2b632' : '#e0442e';
    ctx.fillRect(cx - w / 2, cy, w * f, 3);
  }

  // ------------------------------------------------------------------ Partículas e efeitos
  function emit(o) {
    if (particles.length > 1400) return;
    particles.push(Object.assign({ vx: 0, vy: 0, vh: 0, grow: 1, gravity: 0, drag: 0, layer: 'high', alpha: 1 }, o, { max: o.life }));
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function explosion(gx, gy, h, size) {
    for (let i = 0; i < 18 * size; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(1, 5) * size;
      emit({ gx, gy, h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vh: rnd(10, 70) * size, life: rnd(0.3, 0.6), size: rnd(3, 6) * size, grow: 1.5, kind: 'fire', drag: 2 });
    }
    for (let i = 0; i < 10 * size; i++) {
      emit({ gx: gx + rnd(-1, 1), gy: gy + rnd(-1, 1), h: h + rnd(0, 10), vx: rnd(-1, 1), vy: rnd(-1, 1), vh: rnd(15, 40), life: rnd(0.8, 1.4), size: rnd(4, 7) * size, grow: 2, color: '#2a2420', alpha: 0.55, kind: 'smoke' });
    }
    for (let i = 0; i < 8 * size; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(3, 8);
      emit({ gx, gy, h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vh: rnd(80, 180), gravity: 420, life: rnd(0.5, 0.9), size: rnd(1.5, 3), grow: 0, color: '#3a2a20', kind: 'debris' });
    }
    emit({ gx, gy, h, life: 0.25, size: 10 * size, grow: 3, color: '#fff2c0', alpha: 0.8, kind: 'ring' });
  }
  function sparks(gx, gy, h, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(2, 6);
      emit({ gx, gy, h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vh: rnd(20, 90), gravity: 300, life: rnd(0.15, 0.3), size: 1.5, grow: 0, color, kind: 'spark' });
    }
  }
  function puff(gx, gy, h, n, color = '#d8b888') {
    for (let i = 0; i < n; i++) {
      emit({ gx: gx + rnd(-0.6, 0.6), gy: gy + rnd(-0.6, 0.6), h, vx: rnd(-1.5, 1.5), vy: rnd(-1.5, 1.5), vh: rnd(10, 30), life: rnd(0.4, 0.8), size: rnd(3, 5), grow: 1.5, color, alpha: 0.6, kind: 'smoke' });
    }
  }
  function floater(gx, gy, h, text, color = '#ffd84a') {
    floaters.push({ gx, gy, h, text, color, life: 1.1, max: 1.1 });
  }

  function hitHeight(e) {
    return { biker: 14, rammer: 10, boarder: 12, raider: SLOT_H + 12, boss: 24 }[e.kind];
  }

  sim.on((type, d) => {
    const t = sim.truck;
    switch (type) {
      case 'shot': {
        const [gx, gy] = sim.slotGround(d.slot);
        const to = [d.target.x, d.target.y, hitHeight(d.target)];
        if (d.kind === 'mg') {
          tracers.push({ from: [gx, gy, SLOT_H + 5], to, life: 0.06, max: 0.06, color: '#ffe48a', width: 2 });
          muzzle[d.slot.index] = 0.05;
          sparks(to[0], to[1], to[2], 2, '#ffd36b');
        } else {
          tracers.push({ from: [gx, gy, SLOT_H + 6], to, life: 0.3, max: 0.3, color: '#cfd6dc', width: 2.5, hook: true });
          sparks(to[0], to[1], to[2], 6, '#e8eef2');
        }
        break;
      }
      case 'enemyShot': {
        const to = [t.x + rnd(-2.5, 1.5), rnd(-1, 1), rnd(12, 26)];
        tracers.push({ from: [d.e.x, d.e.y, d.e.kind === 'boss' ? 40 : 15], to, life: 0.07, max: 0.07, color: '#ff7b5a', width: d.e.kind === 'boss' ? 3 : 1.5 });
        sparks(to[0], to[1], to[2], 3, '#ffb070');
        break;
      }
      case 'kill': {
        const e = d.e;
        const size = e.kind === 'boss' ? 3 : e.kind === 'raider' ? 0.5 : e.kind === 'biker' ? 0.8 : 1.2;
        explosion(e.x, e.y, hitHeight(e), size);
        floater(e.x, e.y, hitHeight(e) + 18, `+${d.gain}`);
        if (e.kind === 'boss') { shake = 16; banner('CHEFE DESTRUÍDO', 'O caminho até B está livre'); }
        else if (e.kind !== 'raider') shake = Math.max(shake, 2);
        break;
      }
      case 'explode':
        explosion(d.x, d.y, 10, 2);
        shake = Math.max(shake, 11);
        break;
      case 'truckHit':
        shake = Math.max(shake, Math.min(7, d.amount / 6));
        break;
      case 'board':
        puff(d.e.x, d.e.y, SLOT_H, 6, '#8a6a4a');
        toast('Saqueador a bordo! A defesa do slot parou');
        break;
      case 'boss':
        banner('CHEFE NA ESTRADA!', 'Destrua o caminhão de guerra para chegar a B');
        break;
      case 'tripStarted':
        cam.gx = t.x + 3;
        particles = []; tracers = []; floaters = [];
        banner(d.settings.hasBoss ? 'RUMO A B' : `TRECHO ${sim.current ? sim.current.name : ''}`, d.settings.hasBoss ? 'O último trecho. Algo grande vem aí.' : `Risco ${sim.current ? sim.current.risk : 0}`);
        break;
      case 'tripEnded':
        overlayHold = 1.8;
        ui.pending = null; ui.selected = null;
        if (d.success) banner('TRECHO CONCLUÍDO', sim.phase === 'result' ? 'Você chegou a B!' : 'Escolha o próximo caminho');
        else { banner('CAMINHÃO DESTRUÍDO', ''); explosion(t.x, 0, 20, 3.5); explosion(t.x - 2, 0, 15, 2); shake = 20; }
        break;
      case 'ability':
        if (d.ab.kind === 'nitro') toast('NITRO!');
        else { const oil = sim.oils[sim.oils.length - 1]; puff(oil.x, 0, 4, 10, '#2a2420'); }
        break;
      case 'build': {
        const [gx, gy] = sim.slotGround(d.slot);
        puff(gx, gy, SLOT_H, 3, '#c8c0b0');
        sparks(gx, gy, SLOT_H + 6, 6, '#ffd36b');
        break;
      }
      case 'sell': {
        const [gx, gy] = sim.slotGround(d.slot);
        puff(gx, gy, SLOT_H, 5, '#c8c0b0');
        floater(gx, gy, SLOT_H + 16, `+${d.value}`);
        break;
      }
      case 'phase':
        shownScreen = undefined;
        break;
    }
  });

  // Fumaça, poeira e fogo que dependem do estado (todo frame).
  function emitContinuous(dt) {
    if (!sim.running) return;
    const t = sim.truck;
    const chance = (rate) => Math.random() < rate * dt;
    for (const y of [-1.25, 1.0]) if (chance(22)) emit({ gx: t.x - 3.3, gy: y, h: 3, vx: rnd(-1, 1), vy: rnd(-1.5, 1.5), vh: rnd(6, 20), life: rnd(0.6, 1.1), size: 4, grow: 2.2, color: '#d8b888', alpha: 0.4, kind: 'smoke', layer: 'low' });
    for (const y of [0.8, -0.8]) {
      if (chance(10)) emit({ gx: t.x + 2.3, gy: y, h: 50, vx: rnd(-1, 0), vy: rnd(-0.3, 0.3), vh: rnd(25, 40), life: rnd(0.8, 1.2), size: 2.5, grow: 2.5, color: '#3a3430', alpha: 0.45, kind: 'smoke' });
      if (t.speedMult > 1 && chance(50)) emit({ gx: t.x + 2.3, gy: y, h: 48, vx: t.x * 0 + sim.truckSpeed * 0.7, vh: rnd(10, 30), life: 0.2, size: 4, grow: 0.5, kind: 'nitro' });
    }
    if (t.speedMult > 1 && chance(40)) emit({ gx: t.x - 3.6, gy: rnd(-1.2, 1.2), h: rnd(4, 20), vx: 0, life: 0.25, size: 3, grow: 0, color: '#a8d8ff', alpha: 0.6, kind: 'streak' });
    if (t.hp < cfg.truckMaxHp * 0.35) {
      if (chance(14)) emit({ gx: t.x - 1 + rnd(-2, 2), gy: rnd(-1, 1), h: 30, vh: rnd(30, 50), life: rnd(0.5, 0.8), size: 3, grow: 1.5, kind: 'fire' });
      if (chance(10)) emit({ gx: t.x - 1 + rnd(-2, 2), gy: rnd(-1, 1), h: 34, vh: rnd(30, 50), life: rnd(1, 1.6), size: 4, grow: 3, color: '#1a1614', alpha: 0.55, kind: 'smoke' });
    }
    for (const slot of sim.slots) {
      const d = slot.defense;
      if (!d || !d.firing || d.def.kind !== 'flame') continue;
      const [gx, gy] = sim.slotGround(slot);
      const n = Math.random() < 0.5 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const spread = rnd(-0.25, 0.25), s = rnd(8, 12);
        const ax = d.aim[0] - d.aim[1] * spread, ay = d.aim[1] + d.aim[0] * spread;
        emit({ gx: gx + d.aim[0] * 1.1, gy: gy + d.aim[1] * 1.1, h: SLOT_H + 4, vx: ax * s + sim.truckSpeed, vy: ay * s, vh: rnd(-10, 15), life: rnd(0.25, 0.38), size: 3, grow: 2.5, kind: 'fire' });
      }
    }
    for (const e of sim.enemies) {
      if (e.removed || !e.def.isVehicle) continue;
      const rate = e.kind === 'boss' ? 30 : 9;
      if (chance(rate)) emit({ gx: e.x - 1, gy: e.y + rnd(-0.5, 0.5), h: 2, vx: rnd(-1, 1), vy: rnd(-1, 1), vh: rnd(5, 15), life: rnd(0.5, 0.9), size: 3, grow: 2, color: '#d8b888', alpha: 0.35, kind: 'smoke', layer: 'low' });
    }
  }

  function updateFx(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.gx += p.vx * dt; p.gy += p.vy * dt; p.h += p.vh * dt;
      if (p.gravity) p.vh -= p.gravity * dt;
      if (p.drag) { const f = Math.max(0, 1 - p.drag * dt); p.vx *= f; p.vy *= f; }
      if (p.h < 0) { p.h = 0; p.vh = 0; }
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
        color = f > 0.66 ? '#ffe27a' : f > 0.33 ? '#ff8a2a' : '#5a2a18';
        alpha = Math.min(1, f * 1.6);
      } else if (p.kind === 'nitro') {
        color = f > 0.5 ? '#bfe8ff' : '#4a8cff';
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
      ctx.lineWidth = 4; ctx.strokeStyle = '#2a1408'; ctx.strokeText(f.text, p[0], p[1]);
      ctx.fillStyle = f.color; ctx.fillText(f.text, p[0], p[1]);
    }
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,25,5,.45)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (sim.truck.flash > 0 && sim.running) {
      ctx.fillStyle = `rgba(200,30,10,${sim.truck.flash * 0.9})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ------------------------------------------------------------------ Quadro
  function render() {
    ctx.setTransform(k * ZOOM, 0, 0, k * ZOOM, k * (W / 2) * (1 - ZOOM), k * CAM_Y * (1 - ZOOM));
    camWX = cam.gx * HW; camWY = -cam.gx * HH;
    shakeX = (Math.random() - 0.5) * shake; shakeY = (Math.random() - 0.5) * shake;

    const b = visibleBounds();
    drawGround(b);
    drawRoad(b);
    drawOils();
    drawRangePreview();
    drawParticles('low');

    const items = [{ key: sim.truck.x, draw: drawTruck }];
    for (const e of sim.enemies) if (!e.removed && e.kind !== 'raider') items.push({ key: e.x + e.y, draw: () => drawEnemy(e) });
    pushStaticItems(items, b);
    items.sort((a, c) => c.key - a.key);
    for (const it of items) it.draw();

    drawParticles('high');
    drawTracers();
    drawFloaters();
    ctx.setTransform(k, 0, 0, k, 0, 0);
    drawVignette();
  }

  // ------------------------------------------------------------------ Entrada
  function toLogical(ev) {
    const r = canvas.getBoundingClientRect();
    return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H];
  }
  function pickSlot(lx, ly) {
    [lx, ly] = unzoom(lx, ly);
    let best = null, bestSqr = 22 * 22;
    for (const slot of sim.slots) {
      const p = slotScreen[slot.index];
      if (!p) continue;
      const sqr = (p[0] - lx) ** 2 + (p[1] - ly) ** 2;
      if (sqr < bestSqr) { best = slot.index; bestSqr = sqr; }
    }
    return best;
  }

  canvas.addEventListener('pointermove', (ev) => {
    if (sim.phase !== 'trip') { ui.hover = null; return; }
    const [lx, ly] = toLogical(ev);
    ui.hover = pickSlot(lx, ly);
    canvas.style.cursor = ui.hover !== null ? 'pointer' : 'default';
  });
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
  canvas.addEventListener('pointerdown', (ev) => {
    if (sim.phase !== 'trip' || paused) return;
    if (ev.button === 2) { cancelAll(); return; }
    if (ev.button !== 0) return;
    const [lx, ly] = toLogical(ev);
    const index = pickSlot(lx, ly);
    ui.hover = index;
    if (index === null) { cancelAll(); return; }
    const slot = sim.slots[index];
    if (ui.pending && !slot.defense) {
      const res = sim.buy(index, ui.pending);
      if (res === 'noScrap') toast('Sucata insuficiente');
      if (res === 'ok' && !ev.shiftKey) ui.pending = null;
    } else if (slot.defense) {
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
    if (ev.code === 'KeyU' && ui.selected !== null) doUpgrade();
    if (ev.code === 'KeyV' && ui.selected !== null) doSell();
  });
  addEventListener('blur', () => { if (sim.phase === 'trip' && sim.running && !paused) togglePause(); });

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
    g.fillStyle = '#1c1612'; g.beginPath(); g.ellipse(28, 38, 18, 4, 0, 0, Math.PI * 2); g.fill();
    if (kind === 'mg') {
      g.fillStyle = '#55585e'; g.fillRect(14, 20, 18, 14);
      g.strokeStyle = '#24262a'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(30, 24); g.lineTo(52, 18); g.moveTo(30, 29); g.lineTo(52, 23); g.stroke();
      g.fillStyle = '#ffe58a'; g.beginPath(); g.arc(53, 20, 3, 0, Math.PI * 2); g.fill();
    } else if (kind === 'flame') {
      g.fillStyle = '#b8321c'; g.beginPath(); g.ellipse(16, 24, 7, 11, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5c5a34'; g.fillRect(20, 24, 12, 10);
      g.strokeStyle = '#3a3020'; g.lineWidth = 5; g.beginPath(); g.moveTo(28, 27); g.lineTo(40, 22); g.stroke();
      g.fillStyle = '#ff8a2a'; g.beginPath(); g.moveTo(40, 16); g.quadraticCurveTo(58, 18, 54, 22); g.quadraticCurveTo(58, 28, 40, 28); g.fill();
      g.fillStyle = '#ffe27a'; g.beginPath(); g.ellipse(45, 22, 5, 3, 0, 0, Math.PI * 2); g.fill();
    } else if (kind === 'harpoon') {
      g.fillStyle = '#4e6070'; g.fillRect(12, 22, 16, 13);
      g.strokeStyle = '#2a3238'; g.lineWidth = 5; g.beginPath(); g.moveTo(16, 27); g.lineTo(42, 18); g.stroke();
      g.strokeStyle = '#d8dde0'; g.lineWidth = 2; g.beginPath(); g.moveTo(42, 18); g.lineTo(52, 14); g.stroke();
      g.fillStyle = '#d8dde0'; g.beginPath(); g.moveTo(55, 13); g.lineTo(47, 12); g.lineTo(50, 19); g.fill();
    } else {
      g.fillStyle = '#7c7f84'; g.fillRect(14, 14, 28, 22);
      g.strokeStyle = '#3a3c40'; g.lineWidth = 2; g.strokeRect(14, 14, 28, 22);
      g.fillStyle = '#c8c4bc'; for (const [x, y] of [[18, 18], [38, 18], [18, 32], [38, 32]]) { g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#d8d4cc';
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(16 + i * 7, 14); g.lineTo(19.5 + i * 7, 5); g.lineTo(23 + i * 7, 14); g.fill(); }
    }
  }
  function drawAbilityIcon(g, kind) {
    if (kind === 'nitro') {
      g.fillStyle = '#3a6ad8'; g.fillRect(16, 10, 14, 26); g.fillStyle = '#c8c4bc'; g.fillRect(19, 5, 8, 6);
      g.fillStyle = '#ff8a2a'; g.beginPath(); g.moveTo(32, 30); g.quadraticCurveTo(46, 22, 40, 12); g.quadraticCurveTo(36, 22, 32, 18); g.fill();
      g.fillStyle = '#bfe8ff'; g.beginPath(); g.moveTo(33, 30); g.quadraticCurveTo(41, 25, 38, 19); g.quadraticCurveTo(35, 25, 33, 24); g.fill();
    } else {
      g.fillStyle = '#14100c'; g.beginPath(); g.ellipse(24, 34, 18, 5, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(24, 6); g.quadraticCurveTo(36, 22, 24, 28); g.quadraticCurveTo(12, 22, 24, 6); g.fill();
      g.fillStyle = 'rgba(140,160,190,.6)'; g.beginPath(); g.ellipse(20, 20, 2.5, 4, -0.4, 0, Math.PI * 2); g.fill();
    }
  }

  const shopButtons = DEFENSE_ORDER.map((id, i) => {
    const def = DEFENSES[id];
    const btn = document.createElement('button');
    btn.className = 'buy plate';
    btn.innerHTML = `<span class="key">${BUY_KEYS[i].slice(3)}</span><span class="name">${def.name}</span><span class="cost"></span>`;
    btn.prepend(iconCanvas(56, 44, (g) => drawDefenseIcon(g, id)));
    btn.addEventListener('click', () => selectBuy(id));
    shopEl.appendChild(btn);
    return { id, def, btn, cost: btn.querySelector('.cost') };
  });

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
      case 'mg': return `${fmt(def.damage * m / def.fireInterval)} de dano/s · alcance ${fmt(def.range)} m`;
      case 'flame': return `${fmt(def.damage * m)} de dano/s em cone · alcance ${fmt(def.range)} m`;
      case 'harpoon': return `${fmt(def.damage * m)} de dano a cada ${fmt(def.fireInterval)} s · atordoa ${fmt(def.stunSeconds * m)} s · só veículos`;
      case 'armor': return `-${Math.round(def.damageReduction * m * 100)}% de dano no caminhão · espinhos ${fmt(def.damage * m)}/s`;
    }
    return '';
  }

  let panelSig = '';
  function updateHud() {
    const inTrip = sim.phase === 'trip' || overlayHold > 0;
    hud.classList.toggle('hidden', !inTrip);
    if (!inTrip) return;
    const t = sim.truck;
    $('scrap').textContent = sim.scrap;
    const hpf = t.hp / cfg.truckMaxHp;
    $('hp-fill').style.width = `${hpf * 100}%`;
    $('hp-fill').classList.toggle('low', hpf < 0.3);
    $('hp-text').textContent = `CAMINHÃO ${Math.ceil(t.hp)} / ${cfg.truckMaxHp}`;
    $('trip-label').textContent = sim.settings ? sim.settings.label : '';
    const prog = sim.progress;
    $('progress-fill').style.width = `${prog * 100}%`;
    $('progress-truck').style.left = `${prog * 100}%`;
    $('progress-end').textContent = sim.settings && sim.settings.hasBoss ? 'B' : 'FIM';
    const boss = sim.enemies.find((e) => e.kind === 'boss' && !e.removed);
    $('boss-bar').classList.toggle('hidden', !boss);
    if (boss) $('boss-fill').style.width = `${boss.hp / boss.def.maxHp * 100}%`;
    if (sim.running && t.x >= cfg.tripLength && sim.blockers > 0 && bannerTimer <= 0) banner('DESTRUA O CHEFE', 'Ele bloqueia a chegada a B');

    for (const sb of shopButtons) {
      const locked = !sim.shop.includes(sb.def);
      sb.btn.classList.toggle('locked', locked);
      sb.btn.classList.toggle('selected', ui.pending === sb.id);
      sb.btn.classList.toggle('poor', !locked && sim.scrap < sb.def.cost);
      const text = locked ? `Concluir ${sb.def.unlockAtBestTrips} ${sb.def.unlockAtBestTrips === 1 ? 'trecho' : 'trechos'}` : `${sb.def.cost} sucata`;
      if (sb.cost.textContent !== text) sb.cost.textContent = text;
    }
    abilityButtons.forEach((ab, i) => {
      const f = sim.cooldown01(i);
      ab.btn.style.setProperty('--cd', f.toFixed(3));
      ab.secs.textContent = f > 0 ? Math.ceil(sim.cooldowns[i]) : '';
      ab.btn.classList.toggle('ready', f <= 0 && sim.running);
    });

    const slot = ui.selected !== null ? sim.slots[ui.selected] : null;
    const d = slot && slot.defense;
    if (slot && !d) ui.selected = null;
    panel.classList.toggle('hidden', !d);
    if (d) {
      const canUp = d.level < d.def.maxLevel, cost = canUp ? sim.upgradeCost(d) : 0;
      const sig = [slot.index, d.def.id, d.level, sim.scrap >= cost, slot.saboteurs > 0, sim.sellValue(d)].join('|');
      if (sig !== panelSig) {
        panelSig = sig;
        $('panel-title').textContent = `${d.def.name} — nível ${d.level}/${d.def.maxLevel}`;
        $('panel-info').innerHTML = `${slot.label}${slot.saboteurs > 0 ? ' · <b style="color:#ff7a52">SABOTADA</b>' : ''}<br>${statsLine(d)}`;
        $('upgrade-btn').textContent = canUp ? `Melhorar (${cost})` : 'Nível máximo';
        $('upgrade-btn').disabled = !canUp || sim.scrap < cost;
        $('sell-btn').textContent = `Vender (+${sim.sellValue(d)})`;
      }
    } else panelSig = '';
  }

  // ------------------------------------------------------------------ Telas (menu, rota, resultado, pausa)
  function startRun() {
    sim.newRun();
    runStartShop = sim.shop.slice();
    if (flags.has('rich')) sim.scrap = 9999;
    if (flags.has('boss')) {
      const layers = sim.route.layers;
      sim.current = layers[layers.length - 2][0];
      sim.current.next = [0];
      sim.tripsDone = layers.length - 1;
      sim.scrap = Math.max(sim.scrap, 700);
    }
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
    else if (want === 'result') modal.innerHTML = resultHtml();
    else if (want === 'pause') modal.innerHTML = pauseHtml();
    modal.querySelectorAll('[data-act]').forEach((el) => el.addEventListener('click', () => act(el.dataset.act)));
  }

  function act(name) {
    if (name === 'start') startRun();
    else if (name === 'menu') { sim.phase = 'menu'; shownScreen = undefined; }
    else if (name === 'resume') { paused = false; shownScreen = undefined; }
    else if (name === 'abandon') { paused = false; sim.abandon(); }
  }

  function menuHtml() {
    const m = sim.meta;
    return `
      <div class="title">FURY HAULER</div>
      <div class="subtitle">Leve o caminhão de A até B. Ele dirige sozinho: você monta as armas.</div>
      <div class="howto plate">
        <b>Comprar:</b> clique numa defesa na barra de baixo e depois num slot vazio do caminhão.<br>
        <b>Melhorar ou vender:</b> clique numa defesa já montada.<br>
        <b>Slots:</b> cada um atira para um lado. O teto atira para todos.<br>
        <b>Habilidades:</b> teclas 1 e 2. <b>Cancelar:</b> botão direito ou Esc. <b>Pausa:</b> P.
      </div><br>
      <button class="big-btn" data-act="start">PARTIR</button>
      <div class="stats">Viagens: ${m.runsStarted} · Chegadas em B: ${m.runsCompleted} · Melhor run: ${m.bestTrips} ${m.bestTrips === 1 ? 'trecho' : 'trechos'}</div>`;
  }

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
      const style = cls === 'done' ? 'stroke:#f2b632;stroke-width:6' : cls === 'open' ? 'stroke:#7bd36b;stroke-width:4;stroke-dasharray:10 8' : 'stroke:rgba(244,228,196,.22);stroke-width:3';
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

    let nodesHtml = `<div class="node plate origin visited" style="left:${cx(0)}px;top:${MH / 2}px"><div class="n">A</div>Partida</div>`;
    layers.forEach((layer) => layer.forEach((node) => {
      const [x, y] = pos.get(node);
      const reach = sim.canChoose(node);
      const cls = ['node', 'plate', reach ? 'reachable' : 'blocked', visited.has(node) ? 'visited' : '', node === sim.current ? 'current' : '', node.isBoss ? 'boss' : ''].join(' ');
      const body = node.isBoss
        ? '<div class="n">B</div>Chefe'
        : `<div class="n">${node.name}</div><div class="risk">${'●'.repeat(node.risk)}${'○'.repeat(cfg.maxRisk - node.risk)}</div><div class="bonus">${node.risk ? `+${Math.round(node.risk * cfg.scrapBonusPerRisk * 100)}% sucata` : 'Sem bônus'}</div>`;
      nodesHtml += `<button class="${cls}" data-l="${node.layer}" data-i="${node.index}" style="left:${x}px;top:${y}px" ${reach ? '' : 'disabled'}>${body}</button>`;
    }));

    return `
      <div class="route-head">ESCOLHA O PRÓXIMO TRECHO</div>
      <div class="route-status">Vida <b>${Math.ceil(sim.truck.hp)}/${cfg.truckMaxHp}</b> · Sucata <b>${sim.scrap}</b> · Trechos concluídos <b>${sim.tripsDone}</b> · Risco maior = mais inimigos e mais sucata</div>
      <div id="route-map"><svg width="${MW}" height="${MH}">${lines.join('')}</svg>${nodesHtml}</div>`;
  }
  function bindRoute() {
    modal.querySelectorAll('.node[data-l]').forEach((el) => el.addEventListener('click', () => {
      const node = sim.route.layers[+el.dataset.l][+el.dataset.i];
      if (sim.chooseNode(node)) shownScreen = undefined;
    }));
  }

  function resultHtml() {
    const r = sim.result || { win: false, trips: 0 };
    const newly = sim.unlockedDefenses().filter((d) => !runStartShop.includes(d));
    return `
      <div class="result-title ${r.win ? 'win' : 'lose'}">${r.win ? 'VOCÊ CHEGOU A B!' : 'CAMINHÃO DESTRUÍDO'}</div>
      <div class="result-text">${r.win ? 'A carga chegou inteira.' : `O caminhão caiu no trecho ${r.node}.`}<br>Trechos concluídos nesta run: <b>${r.trips}</b></div>
      ${newly.map((d) => `<div class="unlock">Desbloqueado: ${d.name}</div>`).join('')}
      <br><button class="big-btn" data-act="start">NOVA VIAGEM</button><button class="big-btn secondary" data-act="menu">MENU</button>`;
  }

  function pauseHtml() {
    return `
      <div class="title" style="font-size:90px">PAUSA</div><br>
      <button class="big-btn" data-act="resume">CONTINUAR</button><button class="big-btn secondary" data-act="abandon">ABANDONAR VIAGEM</button>`;
  }

  // ------------------------------------------------------------------ Laço principal
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

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
      cam.gx = sim.truck.x + 3;
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

    const target = sim.truck.x + 3 + (sim.truck.speedMult > 1 ? 2 : 0);
    cam.gx += (target - cam.gx) * (1 - Math.exp(-6 * dt));
    shake = Math.max(0, shake - 40 * dt);

    render();
    updateHud();
    syncOverlay();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
